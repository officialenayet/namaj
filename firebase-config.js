// Firebase configuration and authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKUbgrtt8_MBf-BgyFYXIxobq1T6BLx1g",
  authDomain: "namaj-tracker.firebaseapp.com",
  projectId: "namaj-tracker",
  storageBucket: "namaj-tracker.firebasestorage.app",
  messagingSenderId: "891937826124",
  appId: "1:891937826124:web:bb923b7d7d297cc5fcdbe9",
  measurementId: "G-WERQHHSKJ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Firebase Authentication Class
class FirebaseAuth {
    constructor() {
        this.auth = auth;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Listen for authentication state changes
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            this.updateUI(user);
        });
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Create new user account
    async signUp(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Sign out
    async signOut() {
        try {
            await signOut(this.auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Get user-friendly error messages in Bengali
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'এই ইমেইল দিয়ে কোন অ্যাকাউন্ট পাওয়া যায়নি।',
            'auth/wrong-password': 'ভুল পাসওয়ার্ড দেওয়া হয়েছে।',
            'auth/email-already-in-use': 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে।',
            'auth/weak-password': 'পাসওয়ার্ড খুবই দুর্বল। কমপক্ষে ৬ অক্ষর হতে হবে।',
            'auth/invalid-email': 'ইমেইল ঠিকানা সঠিক নয়।',
            'auth/too-many-requests': 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
            'auth/network-request-failed': 'ইন্টারনেট সংযোগ সমস্যা। আবার চেষ্টা করুন।'
        };
        return errorMessages[errorCode] || 'একটি অজানা সমস্যা হয়েছে। আবার চেষ্টা করুন।';
    }

    // Update UI based on authentication state
    updateUI(user) {
        const loginPanel = document.getElementById('loginPanel');
        const mainApp = document.getElementById('mainApp');
        const userInfo = document.getElementById('userInfo');
        const userEmail = document.getElementById('userEmail');

        // Add loading state to prevent flashing
        if (!loginPanel || !mainApp) {
            setTimeout(() => this.updateUI(user), 100);
            return;
        }

        if (user) {
            // User is signed in
            loginPanel.style.display = 'none';
            mainApp.style.display = 'block';
            if (userEmail) {
                userEmail.textContent = user.email;
            }
            
            // Ensure we're on the main page, not calendar view
            const calendarSection = document.querySelector('.calendar-section');
            if (calendarSection) {
                calendarSection.style.display = 'none';
            }
            
            // Show main prayer tracker
            const prayerTracker = document.querySelector('.prayer-tracker');
            const statsSection = document.querySelector('.stats-section');
            if (prayerTracker) prayerTracker.style.display = 'block';
            if (statsSection) statsSection.style.display = 'block';
            
        } else {
            // User is signed out
            loginPanel.style.display = 'block';
            mainApp.style.display = 'none';
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Initialize Firebase Auth
const firebaseAuth = new FirebaseAuth();

// Create global firebase object for compatibility
window.firebase = {
    auth: () => auth,
    app: app
};

// Export for use in other files
window.firebaseAuth = firebaseAuth;

