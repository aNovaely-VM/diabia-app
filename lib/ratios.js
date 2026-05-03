// lib/ratios.js - Gestion persistante des ratios insuline/glucides

import { saveAdaptiveRatios, getAdaptiveRatios } from './storage';

// Ratios par défaut (petit-déj, déj, goûter, dîner)
export const DEFAULT_RATIOS = {
  breakfast: { name: 'Petit-déjeuner', ratio: 3.5, sensitivity: 25, startTime: '06:00', endTime: '10:00' },
  lunch: { name: 'Déjeuner', ratio: 3.5, sensitivity: 25, startTime: '11:30', endTime: '14:00' },
  snack: { name: 'Goûter', ratio: 3.5, sensitivity: 25, startTime: '15:00', endTime: '17:00' },
  dinner: { name: 'Dîner', ratio: 3.5, sensitivity: 25, startTime: '18:30', endTime: '21:00' },
};

export async function initializeRatios() {
  try {
    const saved = await getAdaptiveRatios();
    if (Object.keys(saved).length === 0) {
      // Première utilisation : initialiser avec les valeurs par défaut
      await saveAdaptiveRatios(DEFAULT_RATIOS);
      return DEFAULT_RATIOS;
    }
    return saved;
  } catch (error) {
    console.error('Erreur initialisation ratios:', error);
    return DEFAULT_RATIOS;
  }
}

export async function updateRatio(slotId, updates) {
  try {
    const current = await getAdaptiveRatios();
    const updated = {
      ...current,
      [slotId]: { ...current[slotId], ...updates },
    };
    await saveAdaptiveRatios(updated);
    return updated[slotId];
  } catch (error) {
    console.error('Erreur mise à jour ratio:', error);
    throw error;
  }
}

export async function getRatioForTime(timestamp = Date.now()) {
  try {
    const ratios = await getAdaptiveRatios();
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    // Cherche le ratio correspondant à l'heure actuelle
    for (const [slotId, slot] of Object.entries(ratios)) {
      if (currentTime >= slot.startTime && currentTime <= slot.endTime) {
        return { slotId, ...slot };
      }
    }

    // Fallback : retourne le ratio du déjeuner
    return { slotId: 'lunch', ...ratios.lunch };
  } catch (error) {
    console.error('Erreur récupération ratio:', error);
    return { slotId: 'lunch', ...DEFAULT_RATIOS.lunch };
  }
}

export function calculateBolus(carbs, ratio, currentGlycemia = null, targetGlycemia = 100, sensitivity = 25) {
  const baseBolus = carbs / ratio;
  
  if (currentGlycemia === null) {
    return baseBolus;
  }

  const correction = (currentGlycemia - targetGlycemia) / sensitivity;
  return Math.max(0, baseBolus + correction);
}

export function calculateIOB(previousBolus, timeSinceInjection, duration = 4) {
  // Calcul simplifié de l'insuline active (IOB)
  // Suppose une courbe d'action linéaire sur `duration` heures
  const hours = timeSinceInjection / 3600000;
  
  if (hours >= duration) {
    return 0; // Insuline complètement absorbée
  }

  const remaining = (duration - hours) / duration;
  return previousBolus * remaining;
}
