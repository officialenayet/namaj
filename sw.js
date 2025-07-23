const CACHE_NAME = 'namaz-tracker-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/enhanced-style.css',
  '/script.js',
  '/auth-handler.js',
  '/calendar-handler.js',
  '/pwa-handler.js',
  '/firebase-config.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js'
];

// Install event
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, { cache: 'reload' });
        }));
      })
      .catch(function(error) {
        console.log('Cache addAll failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event with improved caching strategy
self.addEventListener('fetch', function(event) {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('googleapis.com') &&
      !event.request.url.includes('gstatic.com') &&
      !event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version if available
        if (response) {
          // For HTML files, try to fetch fresh version in background
          if (event.request.destination === 'document') {
            fetch(event.request).then(function(fetchResponse) {
              if (fetchResponse && fetchResponse.status === 200) {
                caches.open(CACHE_NAME).then(function(cache) {
                  cache.put(event.request, fetchResponse.clone());
                });
              }
            }).catch(function() {
              // Network failed, use cached version
            });
          }
          return response;
        }

        // Not in cache, fetch from network
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function() {
          // Network failed and not in cache
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Background sync for offline data saving
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return new Promise((resolve) => {
    console.log('Background sync triggered - syncing prayer data');
    
    // Get all clients (open tabs/windows)
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC',
          message: 'Syncing offline data...'
        });
      });
    });
    
    resolve();
  });
}

// Push notification support
self.addEventListener('push', function(event) {
  let notificationData = {
    title: 'নামাজ ট্র্যাকার',
    body: 'নামাজের সময় হয়েছে!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png'
  };

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'অ্যাপ খুলুন',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'বন্ধ করুন',
        icon: '/icon-96x96.png'
      }
    ],
    requireInteraction: true,
    tag: 'prayer-reminder'
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(function(clientList) {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === self.location.origin + '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // If not open, open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Message handler for communication with main app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'prayer-reminder') {
    event.waitUntil(sendPrayerReminder());
  }
});

function sendPrayerReminder() {
  // Check current time and send prayer reminders
  const now = new Date();
  const hour = now.getHours();
  
  let prayerTime = '';
  if (hour >= 5 && hour < 6) prayerTime = 'ফজর';
  else if (hour >= 12 && hour < 13) prayerTime = 'জোহর';
  else if (hour >= 16 && hour < 17) prayerTime = 'আসর';
  else if (hour >= 18 && hour < 19) prayerTime = 'মাগরিব';
  else if (hour >= 20 && hour < 21) prayerTime = 'এশা';
  
  if (prayerTime) {
    return self.registration.showNotification('নামাজের সময়', {
      body: `${prayerTime} নামাজের সময় হয়েছে`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'prayer-time-' + prayerTime
    });
  }
  
  return Promise.resolve();
}

