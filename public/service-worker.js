// public/service-worker.js - Service Worker pour DIABIA
// Gère les notifications push et la synchronisation en arrière-plan

const CACHE_NAME = 'diabia-v1.2.4';
const NOTIFICATION_DELAY = 2 * 60 * 60 * 1000; // 2 heures en ms

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  self.skipWaiting(); // Activation immédiate
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation');
  event.waitUntil(clients.claim());
});

// Écoute des messages depuis le client (pour programmer les notifications)
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(data);
  } else if (type === 'CANCEL_NOTIFICATION') {
    cancelScheduledNotification(data.mealId);
  }
});

// Fonction pour programmer une notification
async function scheduleNotification(mealData) {
  const { mealId, mealName, totalCarbs, bolusGiven, timestamp } = mealData;
  
  // Calcul du délai avant notification
  const now = Date.now();
  const mealTime = timestamp || now;
  const delayMs = NOTIFICATION_DELAY;
  const notificationTime = mealTime + delayMs;
  const timeUntilNotification = notificationTime - now;

  if (timeUntilNotification > 0) {
    // Stockage du rappel programmé
    const scheduledNotifications = await getScheduledNotifications();
    scheduledNotifications[mealId] = {
      mealId,
      mealName,
      totalCarbs,
      bolusGiven,
      scheduledTime: notificationTime,
    };
    await saveScheduledNotifications(scheduledNotifications);

    console.log(`[SW] Notification programmée pour ${new Date(notificationTime).toLocaleTimeString()}`);

    // Utilisation d'une alarme (si disponible) ou fallback avec setTimeout
    // Note: setTimeout ne fonctionne que si le SW reste actif, mais on peut utiliser une approche hybride
    setTimeout(() => {
      self.registration.showNotification('📊 Bilan de votre repas', {
        body: `${mealName} • ${totalCarbs}g glucides • ${bolusGiven}U injectée\n\nQuelle était votre glycémie 2h après ?`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `meal-${mealId}`,
        requireInteraction: true, // L'utilisateur doit interagir
        actions: [
          { action: 'open', title: 'Répondre' },
          { action: 'dismiss', title: 'Plus tard' },
        ],
        data: { mealId, mealName },
      });
    }, timeUntilNotification);
  }
}

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  const { mealId } = notification.data;

  event.notification.close();

  if (action === 'open' || !action) {
    // Ouvre l'app et navigue vers le dashboard
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Cherche un client existant
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvre une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow('/?fromNotification=true&mealId=' + mealId);
        }
      })
    );
  } else if (action === 'dismiss') {
    cancelScheduledNotification(mealId);
  }
});

// Helpers pour la persistance des notifications programmées
async function getScheduledNotifications() {
  const db = await openDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(['scheduledNotifications'], 'readonly');
    const store = transaction.objectStore('scheduledNotifications');
    const request = store.getAll();
    request.onsuccess = () => {
      const result = {};
      request.result.forEach((item) => {
        result[item.mealId] = item;
      });
      resolve(result);
    };
  });
}

async function saveScheduledNotifications(notifications) {
  const db = await openDB();
  const transaction = db.transaction(['scheduledNotifications'], 'readwrite');
  const store = transaction.objectStore('scheduledNotifications');
  
  for (const [mealId, data] of Object.entries(notifications)) {
    store.put({ ...data, mealId });
  }
}

async function cancelScheduledNotification(mealId) {
  const db = await openDB();
  const transaction = db.transaction(['scheduledNotifications'], 'readwrite');
  const store = transaction.objectStore('scheduledNotifications');
  store.delete(mealId);
}

// IndexedDB pour la persistance
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('diabia-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('scheduledNotifications')) {
        db.createObjectStore('scheduledNotifications', { keyPath: 'mealId' });
      }
    };
  });
}
