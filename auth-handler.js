// Authentication Handler for Main App
document.addEventListener("DOMContentLoaded", function() {
    // Wait for Firebase to load
    setTimeout(() => {
        if (window.firebaseAuth) {
            setupMainAppAuthHandlers();
            // Check if user is authenticated
            if (!window.firebaseAuth.isAuthenticated()) {
                // Redirect to login page
                window.location.href = 'login.html';
            } else {
                // Show main app and update UI
                document.getElementById('mainApp').style.display = 'block';
                window.firebaseAuth.updateUI(window.firebaseAuth.getCurrentUser());
            }
        }
    }, 1000);
});

function setupMainAppAuthHandlers() {
    const logoutBtn = document.getElementById('logoutBtn');
    const contactBtn = document.getElementById('contactBtn');
    const userEmail = document.getElementById('userEmail');

    // Update user email display
    if (userEmail && window.firebaseAuth && window.firebaseAuth.getCurrentUser()) {
        userEmail.textContent = window.firebaseAuth.getCurrentUser().email;
    }

    // Logout button handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const result = await window.firebaseAuth.signOut();
            if (result.success) {
                // Redirect to login page
                window.location.href = 'login.html';
            } else {
                showError(result.error);
            }
        });
    }

    // Contact button handler
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            window.open('https://bio.link/officialenayet', '_blank');
        });
    }
}

// Show error message
function showError(message) {
    // Create error message element if it doesn't exist
    let errorElement = document.getElementById('mainAppError');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'mainAppError';
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

