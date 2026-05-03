// lib/barcode.js - Intégration OpenFoodFacts
export async function fetchProductByBarcode(barcode) {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 'success' && data.product) {
      const p = data.product;
      return {
        name: p.product_name_fr || p.product_name || 'Produit inconnu',
        carbs: p.nutriments['carbohydrates_100g'] || 0,
        fiber: p.nutriments['fiber_100g'] || 0,
        gi: 'moyen', // OFF ne donne pas le GI, on met moyen par défaut
        unit: 'g',
        brand: p.brands || ''
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur scanner:', error);
    return null;
  }
}
