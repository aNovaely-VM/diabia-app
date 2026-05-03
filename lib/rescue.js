// lib/rescue.js - Assistant de resucrage intelligent
export function calculateRescueCarbs(currentGlycemia, targetGlycemia = 100, sensitivity = 25) {
  if (currentGlycemia >= 70) return 0;
  
  // Règle des 15g par défaut ou calculée
  // On estime que 1g de glucides remonte la glycémie de (sensibilité / ratio_moyen)
  // Mais une règle empirique sûre : (Cible - Actuelle) / (Sensibilité / 10)
  // Ex: (100 - 50) / (25 / 10) = 50 / 2.5 = 20g
  
  const deficit = targetGlycemia - currentGlycemia;
  const carbsNeeded = deficit / (sensitivity / 10);
  
  return Math.round(carbsNeeded);
}

export const RESCUE_FOODS = [
  { name: 'Sucre (morceau)', carbsPerUnit: 5, unit: 'morceau' },
  { name: 'Jus de pomme', carbsPerUnit: 11, unit: '100ml' },
  { name: 'Dextrose', carbsPerUnit: 3, unit: 'tablette' }
];
