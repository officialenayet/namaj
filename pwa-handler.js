// PWA Handler
let deferredPrompt;
let installButton;

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// Install App Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show install button
  showInstallButton();
});

// Show install button
function showInstallButton() {
  // Create install button if it doesn't exist
  if (!installButton) {
    installButton = document.createElement('button');
    installButton.innerHTML = '📱 হোম স্ক্রিনে যোগ করুন';
    installButton.className = 'install-btn';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      font-family: 'Noto Sans Bengali', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      z-index: 1000;
      transition: all 0.3s ease;
      animation: slideInUp 0.5s ease-out;
    `;
    
    installButton.addEventListener('click', installApp);
    document.body.appendChild(installButton);
    
    // Add hover effect
    installButton.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    });
    
    installButton.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
    });
  }
  
  installButton.style.display = 'block';
}

// Install app function
function installApp() {
  if (deferredPrompt) {
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
        hideInstallButton();
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      deferredPrompt = null;
    });
  }
}

// Hide install button
function hideInstallButton() {
  if (installButton) {
    installButton.style.display = 'none';
  }
}

// Check if app is already installed
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  hideInstallButton();
});

// Check if running as PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Add PWA specific styles and behaviors
document.addEventListener('DOMContentLoaded', function() {
  if (isPWA()) {
    // Add PWA class to body
    document.body.classList.add('pwa-mode');
    
    // Hide install button if already installed
    hideInstallButton();
    
    // Add status bar padding for iOS
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      document.body.style.paddingTop = '20px';
    }
  }
  
  // Add offline indicator
  addOfflineIndicator();
});

// Offline indicator
function addOfflineIndicator() {
  const offlineIndicator = document.createElement('div');
  offlineIndicator.id = 'offline-indicator';
  offlineIndicator.innerHTML = '📶 অফলাইন মোড';
  offlineIndicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #e74c3c;
    color: white;
    text-align: center;
    padding: 8px;
    font-family: 'Noto Sans Bengali', sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
    display: none;
  `;
  
  document.body.appendChild(offlineIndicator);
  
  // Online/Offline event listeners
  window.addEventListener('online', function() {
    offlineIndicator.style.display = 'none';
    offlineIndicator.style.transform = 'translateY(-100%)';
  });
  
  window.addEventListener('offline', function() {
    offlineIndicator.style.display = 'block';
    offlineIndicator.style.transform = 'translateY(0)';
  });
}

// Background sync for offline data
function syncOfflineData() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(function(registration) {
      return registration.sync.register('background-sync');
    }).catch(function(err) {
      console.log('Background sync registration failed:', err);
    });
  }
}

// Export functions for use in other scripts
window.PWAHandler = {
  installApp,
  hideInstallButton,
  showInstallButton,
  isPWA,
  syncOfflineData
};

