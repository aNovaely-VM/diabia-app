// lib/sport.js - Gestion de l'activité physique
export const ACTIVITIES = [
  { id: 'light', name: 'Léger', label: 'Légère (Marche)', factor: 0.8, emoji: '🚶' },
  { id: 'moderate', name: 'Modéré', label: 'Modérée (Jogging, Vélo)', factor: 0.6, emoji: '🏃' },
  { id: 'intense', name: 'Intense', label: 'Intense (Foot, Muscu)', factor: 0.4, emoji: '⚽' }
];

export function adjustBolusForSport(baseBolus, intensityId) {
  const activity = ACTIVITIES.find(a => a.id === intensityId);
  if (!activity) return baseBolus;
  
  // On réduit le bolus de 20% à 60% selon l'intensité
  return Math.max(0, Math.round(baseBolus * activity.factor * 100) / 100);
}
