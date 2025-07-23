// Login Page Handler
document.addEventListener("DOMContentLoaded", function() {
    // Wait for Firebase to load
    setTimeout(() => {
        if (window.firebaseAuth) {
            setupLoginHandlers();
            // Check if user is already logged in
            if (window.firebaseAuth.isAuthenticated()) {
                // Redirect to main app
                window.location.href = 'index.html';
            }
        }
    }, 1000);
});

function setupLoginHandlers() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authError = document.getElementById('authError');
    const authLoading = document.getElementById('authLoading');

    // Login form handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Validate email format
        if (!isValidEmail(email)) {
            showError('সঠিক ইমেইল ঠিকানা দিন।');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।');
            return;
        }

        showLoading(true);
        clearError();

        const result = await window.firebaseAuth.signIn(email, password);
        
        showLoading(false);
        
        if (result.success) {
            // Redirect to main app
            window.location.href = 'index.html';
        } else {
            showError(result.error);
        }
    });

    // Signup form handler
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate email format
        if (!isValidEmail(email)) {
            showError('সঠিক ইমেইল ঠিকানা দিন।');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।');
            return;
        }

        if (password !== confirmPassword) {
            showError('পাসওয়ার্ড মিলছে না।');
            return;
        }

        showLoading(true);
        clearError();

        const result = await window.firebaseAuth.signUp(email, password);
        
        showLoading(false);
        
        if (result.success) {
            // Redirect to main app
            window.location.href = 'index.html';
        } else {
            showError(result.error);
        }
    });
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show/hide login and signup forms
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    
    clearError();
}

function showSignupForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    
    clearError();
}

// Show loading state
function showLoading(show) {
    const authLoading = document.getElementById('authLoading');
    const authBtns = document.querySelectorAll('.auth-btn');
    
    if (show) {
        authLoading.style.display = 'flex';
        authBtns.forEach(btn => btn.disabled = true);
    } else {
        authLoading.style.display = 'none';
        authBtns.forEach(btn => btn.disabled = false);
    }
}

// Show error message
function showError(message) {
    const authError = document.getElementById('authError');
    authError.textContent = message;
    authError.style.display = 'block';
}

// Clear error message
function clearError() {
    const authError = document.getElementById('authError');
    authError.style.display = 'none';
    authError.textContent = '';
}

