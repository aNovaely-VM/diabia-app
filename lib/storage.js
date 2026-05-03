// lib/storage.js - Gestion persistante de l'historique avec IndexedDB + localStorage fallback

const DB_NAME = 'diabia-db';
const DB_VERSION = 1;

// Initialisation de la base de données
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store pour l'historique des glycémies
      if (!db.objectStoreNames.contains('glycemiaHistory')) {
        const glycemiaStore = db.createObjectStore('glycemiaHistory', { keyPath: 'id', autoIncrement: true });
        glycemiaStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store pour l'historique des repas
      if (!db.objectStoreNames.contains('mealHistory')) {
        const mealStore = db.createObjectStore('mealHistory', { keyPath: 'id', autoIncrement: true });
        mealStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store pour les rapports analysés
      if (!db.objectStoreNames.contains('reports')) {
        const reportStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
        reportStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store pour les ratios adaptatifs
      if (!db.objectStoreNames.contains('adaptiveRatios')) {
        db.createObjectStore('adaptiveRatios', { keyPath: 'slotId' });
      }
    };
  });
}

// ═══ GLYCÉMIE ═══
export async function addGlycemiaEntry(value) {
  const db = await initDB();
  const entry = { value, timestamp: Date.now() };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['glycemiaHistory'], 'readwrite');
    const store = transaction.objectStore('glycemiaHistory');
    const request = store.add(entry);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getGlycemiaHistory(limit = 100) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['glycemiaHistory'], 'readonly');
    const store = transaction.objectStore('glycemiaHistory');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev'); // Ordre décroissant

    const results = [];
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results.reverse()); // Retour à l'ordre croissant
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ═══ REPAS ═══
export async function addMealEntry(mealData) {
  const db = await initDB();
  const entry = {
    ...mealData,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['mealHistory'], 'readwrite');
    const store = transaction.objectStore('mealHistory');
    const request = store.add(entry);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getMealHistory(limit = 50) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['mealHistory'], 'readonly');
    const store = transaction.objectStore('mealHistory');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');

    const results = [];
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results.reverse());
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ═══ RAPPORTS ═══
export async function saveReport(reportData) {
  const db = await initDB();
  const entry = {
    ...reportData,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    const request = store.add(entry);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getLatestReport() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readonly');
    const store = transaction.objectStore('reports');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      resolve(cursor ? cursor.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

// ═══ RATIOS ADAPTATIFS ═══
export async function saveAdaptiveRatios(ratios) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['adaptiveRatios'], 'readwrite');
    const store = transaction.objectStore('adaptiveRatios');

    for (const [slotId, data] of Object.entries(ratios)) {
      store.put({ slotId, ...data });
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAdaptiveRatios() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['adaptiveRatios'], 'readonly');
    const store = transaction.objectStore('adaptiveRatios');
    const request = store.getAll();

    request.onsuccess = () => {
      const result = {};
      request.result.forEach((item) => {
        const { slotId, ...data } = item;
        result[slotId] = data;
      });
      resolve(result);
    };
    request.onerror = () => reject(request.error);
  });
}

// ═══ FALLBACK LOCALSTORAGE ═══
export function migrateFromLocalStorage() {
  try {
    const glycemiaHistory = JSON.parse(localStorage.getItem('diabia_glycemia_history') || '[]');
    const mealHistory = JSON.parse(localStorage.getItem('diabia_meal_history') || '[]');
    const adaptiveRatios = JSON.parse(localStorage.getItem('diabia_adaptive_ratios') || '{}');

    return { glycemiaHistory, mealHistory, adaptiveRatios };
  } catch (e) {
    console.error('Erreur migration localStorage:', e);
    return { glycemiaHistory: [], mealHistory: [], adaptiveRatios: {} };
  }
}
