// lib/notifications.js - Gestion des notifications push côté client

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers non supportés');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    console.log('[Notifications] Service Worker enregistré:', registration);
    return registration;
  } catch (error) {
    console.error('[Notifications] Erreur SW:', error);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications non supportées');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function schedulePostMealNotification(mealData) {
  const swRegistration = await navigator.serviceWorker.ready;
  
  if (!swRegistration) {
    console.error('Service Worker non disponible');
    return;
  }

  // Envoie un message au Service Worker pour programmer la notification
  swRegistration.active.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    data: {
      mealId: mealData.id,
      mealName: mealData.name,
      totalCarbs: mealData.carbs,
      bolusGiven: mealData.bolus,
      timestamp: Date.now(),
    },
  });

  console.log('[Notifications] Notification programmée pour:', mealData.name);
}

export async function cancelNotification(mealId) {
  const swRegistration = await navigator.serviceWorker.ready;
  
  if (swRegistration) {
    swRegistration.active.postMessage({
      type: 'CANCEL_NOTIFICATION',
      data: { mealId },
    });
  }
}

// Écoute les messages du Service Worker (notamment les clics sur notifications)
export function setupNotificationListener(callback) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NOTIFICATION_CLICKED') {
        callback(event.data.mealId);
      }
    });
  }
}
