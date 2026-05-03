// Base de données alimentaire CIQUAL (ANSES France) — valeurs pour 100g
// Source : Table de composition nutritionnelle CIQUAL 2024
// https://ciqual.anses.fr/

export const FOOD_CATEGORIES = [
  { id: 'fruits', name: 'Fruits', emoji: '🍎' },
  { id: 'legumes', name: 'Légumes', emoji: '🥕' },
  { id: 'feculents', name: 'Féculents', emoji: '🍞' },
  { id: 'cereales', name: 'Céréales & Petit-déj', emoji: '🥣' },
  { id: 'produits-laitiers', name: 'Produits laitiers', emoji: '🥛' },
  { id: 'viandes', name: 'Viandes & Poissons', emoji: '🍖' },
  { id: 'boissons', name: 'Boissons', emoji: '🥤' },
  { id: 'sucres', name: 'Sucres & Desserts', emoji: '🍰' },
  { id: 'sauces', name: 'Sauces & Condiments', emoji: '🍯' },
  { id: 'plats', name: 'Plats préparés', emoji: '🍝' },
  { id: 'fast-food', name: 'Fast-food', emoji: '🍔' },
  { id: 'snacks', name: 'Snacks & Apéritifs', emoji: '🍿' },
];

// Valeurs pour 100g — carbs = glucides totaux, fiber = fibres, gi = index glycémique
export const FOODS_DATABASE = [
  // === FRUITS ===
  { id: 'pomme', name: 'Pomme', category: 'fruits', carbs: 11.4, fiber: 2.4, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['pommes'] },
  { id: 'banane', name: 'Banane', category: 'fruits', carbs: 20.5, fiber: 1.9, gi: 'moyen', unit: 'g', defaultPortion: 120, aliases: ['bananes'] },
  { id: 'orange', name: 'Orange', category: 'fruits', carbs: 8.3, fiber: 2.0, gi: 'faible', unit: 'g', defaultPortion: 180, aliases: ['oranges'] },
  { id: 'raisin', name: 'Raisin', category: 'fruits', carbs: 16.1, fiber: 0.9, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['raisins'] },
  { id: 'fraise', name: 'Fraises', category: 'fruits', carbs: 5.7, fiber: 1.8, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['fraise'] },
  { id: 'cerise', name: 'Cerises', category: 'fruits', carbs: 14.2, fiber: 1.6, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['cerise'] },
  { id: 'peche', name: 'Pêche', category: 'fruits', carbs: 9.0, fiber: 1.5, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['peches', 'pêche', 'pêches'] },
  { id: 'poire', name: 'Poire', category: 'fruits', carbs: 11.0, fiber: 2.4, gi: 'faible', unit: 'g', defaultPortion: 180, aliases: ['poires'] },
  { id: 'kiwi', name: 'Kiwi', category: 'fruits', carbs: 10.6, fiber: 2.1, gi: 'faible', unit: 'g', defaultPortion: 75, aliases: ['kiwis'] },
  { id: 'mangue', name: 'Mangue', category: 'fruits', carbs: 14.1, fiber: 1.8, gi: 'moyen', unit: 'g', defaultPortion: 150, aliases: ['mangues'] },
  { id: 'ananas', name: 'Ananas', category: 'fruits', carbs: 11.5, fiber: 1.4, gi: 'moyen', unit: 'g', defaultPortion: 150, aliases: [] },
  { id: 'melon', name: 'Melon', category: 'fruits', carbs: 6.5, fiber: 0.9, gi: 'moyen', unit: 'g', defaultPortion: 200, aliases: ['melons'] },
  { id: 'pasteque', name: 'Pastèque', category: 'fruits', carbs: 7.1, fiber: 0.4, gi: 'élevé', unit: 'g', defaultPortion: 250, aliases: ['pasteques', 'pastèque', 'pastèques'] },
  { id: 'abricot', name: 'Abricot', category: 'fruits', carbs: 9.0, fiber: 1.7, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['abricots'] },
  { id: 'prune', name: 'Prune', category: 'fruits', carbs: 10.0, fiber: 1.5, gi: 'faible', unit: 'g', defaultPortion: 80, aliases: ['prunes'] },
  { id: 'clementine', name: 'Clémentine', category: 'fruits', carbs: 9.2, fiber: 1.3, gi: 'faible', unit: 'g', defaultPortion: 70, aliases: ['clementines', 'clémentine', 'clémentines', 'mandarine', 'mandarines'] },
  { id: 'pamplemousse', name: 'Pamplemousse', category: 'fruits', carbs: 7.4, fiber: 1.1, gi: 'faible', unit: 'g', defaultPortion: 250, aliases: ['pamplemousses'] },
  { id: 'myrtille', name: 'Myrtilles', category: 'fruits', carbs: 9.6, fiber: 2.4, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['myrtille', 'blueberry'] },
  { id: 'framboise', name: 'Framboises', category: 'fruits', carbs: 5.4, fiber: 6.5, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['framboise'] },
  { id: 'litchi', name: 'Litchi', category: 'fruits', carbs: 15.2, fiber: 1.3, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['litchis', 'lychee'] },
  { id: 'grenade', name: 'Grenade', category: 'fruits', carbs: 14.3, fiber: 4.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['grenades'] },
  { id: 'figue', name: 'Figue fraîche', category: 'fruits', carbs: 12.9, fiber: 2.9, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['figues'] },
  { id: 'avocat', name: 'Avocat', category: 'fruits', carbs: 1.8, fiber: 5.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['avocats'] },
  { id: 'compote-pomme', name: 'Compote de pommes (sans sucre)', category: 'fruits', carbs: 12.0, fiber: 1.2, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['compote pomme', 'compote'] },
  { id: 'compote-pomme-sucree', name: 'Compote de pommes sucrée', category: 'fruits', carbs: 19.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: [] },
  { id: 'fruit-seche-datte', name: 'Dattes séchées', category: 'fruits', carbs: 64.0, fiber: 8.0, gi: 'élevé', unit: 'g', defaultPortion: 30, aliases: ['dattes', 'datte'] },
  { id: 'fruit-seche-abricot', name: 'Abricots secs', category: 'fruits', carbs: 53.0, fiber: 8.0, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['abricot sec', 'abricots secs'] },
  { id: 'fruit-seche-raisin', name: 'Raisins secs', category: 'fruits', carbs: 66.0, fiber: 3.7, gi: 'moyen', unit: 'g', defaultPortion: 30, aliases: ['raisin sec', 'raisins secs'] },
  { id: 'fruit-seche-pruneau', name: 'Pruneaux', category: 'fruits', carbs: 52.0, fiber: 7.0, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['pruneau'] },

  // === LÉGUMES ===
  { id: 'carotte', name: 'Carotte', category: 'legumes', carbs: 6.6, fiber: 2.7, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['carottes'] },
  { id: 'carotte-cuite', name: 'Carotte cuite', category: 'legumes', carbs: 6.0, fiber: 2.5, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['carottes cuites'] },
  { id: 'tomate', name: 'Tomate', category: 'legumes', carbs: 2.6, fiber: 1.2, gi: 'faible', unit: 'g', defaultPortion: 120, aliases: ['tomates'] },
  { id: 'concombre', name: 'Concombre', category: 'legumes', carbs: 1.8, fiber: 0.5, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['concombres'] },
  { id: 'salade', name: 'Salade verte', category: 'legumes', carbs: 1.4, fiber: 1.5, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['laitue', 'salades'] },
  { id: 'haricot-vert', name: 'Haricots verts', category: 'legumes', carbs: 4.2, fiber: 3.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['haricots verts', 'haricot vert'] },
  { id: 'courgette', name: 'Courgette', category: 'legumes', carbs: 1.8, fiber: 1.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['courgettes'] },
  { id: 'aubergine', name: 'Aubergine', category: 'legumes', carbs: 3.5, fiber: 3.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['aubergines'] },
  { id: 'poivron', name: 'Poivron', category: 'legumes', carbs: 4.2, fiber: 1.7, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['poivrons'] },
  { id: 'brocoli', name: 'Brocoli', category: 'legumes', carbs: 4.0, fiber: 3.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['brocolis'] },
  { id: 'chou-fleur', name: 'Chou-fleur', category: 'legumes', carbs: 2.7, fiber: 2.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['choux-fleur', 'chou fleur'] },
  { id: 'epinard', name: 'Épinards', category: 'legumes', carbs: 1.4, fiber: 2.2, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['épinard', 'épinards', 'epinards'] },
  { id: 'champignon', name: 'Champignons', category: 'legumes', carbs: 0.5, fiber: 1.0, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['champignon', 'champignons de paris'] },
  { id: 'oignon', name: 'Oignon', category: 'legumes', carbs: 7.0, fiber: 1.7, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['oignons'] },
  { id: 'ail', name: 'Ail', category: 'legumes', carbs: 21.2, fiber: 2.1, gi: 'faible', unit: 'g', defaultPortion: 5, aliases: [] },
  { id: 'poireau', name: 'Poireau', category: 'legumes', carbs: 6.3, fiber: 2.9, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['poireaux'] },
  { id: 'celeri', name: 'Céleri branche', category: 'legumes', carbs: 1.5, fiber: 1.6, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['céleri', 'celeri branche'] },
  { id: 'radis', name: 'Radis', category: 'legumes', carbs: 2.0, fiber: 1.6, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: [] },
  { id: 'endive', name: 'Endive', category: 'legumes', carbs: 2.4, fiber: 1.1, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['endives', 'chicon'] },
  { id: 'chou', name: 'Chou blanc', category: 'legumes', carbs: 4.0, fiber: 2.5, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['choux', 'chou vert'] },
  { id: 'betterave', name: 'Betterave cuite', category: 'legumes', carbs: 8.0, fiber: 2.0, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['betteraves', 'betterave rouge'] },
  { id: 'artichaut', name: 'Artichaut', category: 'legumes', carbs: 7.0, fiber: 5.4, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['artichauts'] },
  { id: 'asperge', name: 'Asperges', category: 'legumes', carbs: 2.0, fiber: 1.5, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['asperge'] },
  { id: 'fenouil', name: 'Fenouil', category: 'legumes', carbs: 3.0, fiber: 3.1, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['fenouils'] },
  { id: 'mais', name: 'Maïs en grains', category: 'legumes', carbs: 16.3, fiber: 2.7, gi: 'moyen', unit: 'g', defaultPortion: 80, aliases: ['maïs', 'mais grain', 'maïs en conserve'] },
  { id: 'petit-pois', name: 'Petits pois', category: 'legumes', carbs: 10.0, fiber: 5.0, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['petit pois', 'pois'] },
  { id: 'ratatouille', name: 'Ratatouille', category: 'legumes', carbs: 5.0, fiber: 2.0, gi: 'faible', unit: 'g', defaultPortion: 200, aliases: [] },

  // === FÉCULENTS ===
  { id: 'pomme-de-terre', name: 'Pomme de terre cuite vapeur', category: 'feculents', carbs: 17.0, fiber: 1.8, gi: 'moyen', unit: 'g', defaultPortion: 200, aliases: ['pommes de terre', 'patate', 'patates', 'pdt'] },
  { id: 'pomme-de-terre-puree', name: 'Purée de pommes de terre', category: 'feculents', carbs: 14.0, fiber: 1.4, gi: 'élevé', unit: 'g', defaultPortion: 200, aliases: ['purée', 'puree', 'puree pomme de terre'] },
  { id: 'pomme-de-terre-frite', name: 'Frites', category: 'feculents', carbs: 33.0, fiber: 3.0, gi: 'élevé', unit: 'g', defaultPortion: 150, aliases: ['frite', 'frites maison'] },
  { id: 'patate-douce', name: 'Patate douce cuite', category: 'feculents', carbs: 17.0, fiber: 3.0, gi: 'faible', unit: 'g', defaultPortion: 200, aliases: ['patates douces'] },
  { id: 'riz-blanc', name: 'Riz blanc cuit', category: 'feculents', carbs: 28.0, fiber: 0.4, gi: 'élevé', unit: 'g', defaultPortion: 180, aliases: ['riz', 'riz cuit'] },
  { id: 'riz-basmati', name: 'Riz basmati cuit', category: 'feculents', carbs: 25.0, fiber: 0.6, gi: 'moyen', unit: 'g', defaultPortion: 180, aliases: ['basmati'] },
  { id: 'riz-complet', name: 'Riz complet cuit', category: 'feculents', carbs: 23.0, fiber: 1.8, gi: 'faible', unit: 'g', defaultPortion: 180, aliases: ['riz brun'] },
  { id: 'pates', name: 'Pâtes cuites', category: 'feculents', carbs: 26.0, fiber: 1.4, gi: 'moyen', unit: 'g', defaultPortion: 200, aliases: ['pâtes', 'spaghetti', 'tagliatelles', 'penne', 'fusilli', 'pasta'] },
  { id: 'pates-completes', name: 'Pâtes complètes cuites', category: 'feculents', carbs: 23.0, fiber: 3.5, gi: 'faible', unit: 'g', defaultPortion: 200, aliases: ['pâtes complètes'] },
  { id: 'semoule', name: 'Semoule cuite', category: 'feculents', carbs: 24.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 180, aliases: ['couscous cuit', 'semoule couscous'] },
  { id: 'quinoa', name: 'Quinoa cuit', category: 'feculents', carbs: 18.5, fiber: 2.8, gi: 'faible', unit: 'g', defaultPortion: 180, aliases: [] },
  { id: 'boulgour', name: 'Boulgour cuit', category: 'feculents', carbs: 18.6, fiber: 4.5, gi: 'faible', unit: 'g', defaultPortion: 180, aliases: ['boulghour'] },
  { id: 'lentilles', name: 'Lentilles cuites', category: 'feculents', carbs: 17.0, fiber: 4.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['lentille', 'lentilles vertes'] },
  { id: 'lentilles-corail', name: 'Lentilles corail cuites', category: 'feculents', carbs: 18.0, fiber: 3.5, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: [] },
  { id: 'pois-chiches', name: 'Pois chiches cuits', category: 'feculents', carbs: 18.0, fiber: 5.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['pois chiche'] },
  { id: 'haricots-blancs', name: 'Haricots blancs cuits', category: 'feculents', carbs: 17.0, fiber: 7.0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['haricot blanc', 'mogettes', 'flageolets'] },
  { id: 'haricots-rouges', name: 'Haricots rouges cuits', category: 'feculents', carbs: 17.8, fiber: 6.4, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['haricot rouge'] },
  { id: 'pain-blanc', name: 'Pain blanc (baguette)', category: 'feculents', carbs: 52.0, fiber: 2.7, gi: 'élevé', unit: 'g', defaultPortion: 60, aliases: ['baguette', 'pain', 'pain de mie'] },
  { id: 'pain-complet', name: 'Pain complet', category: 'feculents', carbs: 43.0, fiber: 6.0, gi: 'moyen', unit: 'g', defaultPortion: 60, aliases: ['pain aux cereales'] },
  { id: 'pain-seigle', name: 'Pain de seigle', category: 'feculents', carbs: 45.0, fiber: 5.8, gi: 'faible', unit: 'g', defaultPortion: 60, aliases: [] },
  { id: 'brioche', name: 'Brioche', category: 'feculents', carbs: 48.0, fiber: 1.8, gi: 'élevé', unit: 'g', defaultPortion: 50, aliases: ['brioches'] },
  { id: 'croissant', name: 'Croissant', category: 'feculents', carbs: 42.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 60, aliases: ['croissants'] },
  { id: 'pain-chocolat', name: 'Pain au chocolat', category: 'feculents', carbs: 45.0, fiber: 2.5, gi: 'élevé', unit: 'g', defaultPortion: 70, aliases: ['chocolatine', 'pain chocolat'] },
  { id: 'wrap', name: 'Wrap / Tortilla', category: 'feculents', carbs: 47.0, fiber: 2.3, gi: 'moyen', unit: 'g', defaultPortion: 60, aliases: ['tortilla', 'wraps', 'galette de blé'] },
  { id: 'pain-burger', name: 'Pain à burger', category: 'feculents', carbs: 46.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 60, aliases: ['bun', 'pain hamburger'] },
  { id: 'gnocchi', name: 'Gnocchi', category: 'feculents', carbs: 33.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 200, aliases: ['gnocchis'] },
  { id: 'polenta', name: 'Polenta cuite', category: 'feculents', carbs: 13.0, fiber: 1.0, gi: 'élevé', unit: 'g', defaultPortion: 200, aliases: [] },

  // === CÉRÉALES & PETIT-DÉJEUNER ===
  { id: 'flocons-avoine', name: 'Flocons d\'avoine', category: 'cereales', carbs: 58.7, fiber: 10.6, gi: 'faible', unit: 'g', defaultPortion: 40, aliases: ['avoine', 'porridge sec', 'oatmeal'] },
  { id: 'porridge', name: 'Porridge (avoine cuit)', category: 'cereales', carbs: 12.0, fiber: 1.7, gi: 'faible', unit: 'g', defaultPortion: 250, aliases: ['gruau'] },
  { id: 'muesli', name: 'Muesli', category: 'cereales', carbs: 60.0, fiber: 7.0, gi: 'moyen', unit: 'g', defaultPortion: 50, aliases: ['müesli'] },
  { id: 'granola', name: 'Granola', category: 'cereales', carbs: 65.0, fiber: 5.0, gi: 'moyen', unit: 'g', defaultPortion: 50, aliases: [] },
  { id: 'cereales-petit-dej', name: 'Céréales petit-déjeuner sucrées', category: 'cereales', carbs: 82.0, fiber: 3.0, gi: 'élevé', unit: 'g', defaultPortion: 40, aliases: ['cereales', 'corn flakes', 'chocapic', 'special k'] },
  { id: 'cereales-miel-pops', name: 'Céréales Miel Pops', category: 'cereales', carbs: 84.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 30, aliases: ['miel pops'] },
  { id: 'all-bran', name: 'All-Bran / Son', category: 'cereales', carbs: 48.0, fiber: 27.0, gi: 'faible', unit: 'g', defaultPortion: 40, aliases: ['son de blé', 'all bran'] },
  { id: 'biscotte', name: 'Biscotte', category: 'cereales', carbs: 72.0, fiber: 4.0, gi: 'élevé', unit: 'g', defaultPortion: 10, aliases: ['biscottes'] },
  { id: 'galette-riz', name: 'Galette de riz soufflé', category: 'cereales', carbs: 80.0, fiber: 2.5, gi: 'élevé', unit: 'g', defaultPortion: 10, aliases: ['galettes de riz', 'rice cake'] },
  { id: 'pancake', name: 'Pancake', category: 'cereales', carbs: 35.0, fiber: 1.0, gi: 'élevé', unit: 'g', defaultPortion: 50, aliases: ['pancakes', 'crêpe américaine'] },
  { id: 'crepe', name: 'Crêpe nature', category: 'cereales', carbs: 28.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 50, aliases: ['crêpes', 'crepes'] },
  { id: 'gaufre', name: 'Gaufre', category: 'cereales', carbs: 42.0, fiber: 1.2, gi: 'élevé', unit: 'g', defaultPortion: 60, aliases: ['gaufres'] },

  // === PRODUITS LAITIERS ===
  { id: 'lait-entier', name: 'Lait entier', category: 'produits-laitiers', carbs: 4.8, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 200, aliases: ['lait'] },
  { id: 'lait-demi-ecreme', name: 'Lait demi-écrémé', category: 'produits-laitiers', carbs: 4.9, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'lait-ecreme', name: 'Lait écrémé', category: 'produits-laitiers', carbs: 5.0, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'yaourt-nature', name: 'Yaourt nature', category: 'produits-laitiers', carbs: 4.5, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 125, aliases: ['yogourt', 'yaourt', 'yaourt brassé'] },
  { id: 'yaourt-sucre', name: 'Yaourt aux fruits / sucré', category: 'produits-laitiers', carbs: 14.0, fiber: 0, gi: 'moyen', unit: 'g', defaultPortion: 125, aliases: ['yaourt fruit', 'yaourt fraise'] },
  { id: 'yaourt-grec', name: 'Yaourt grec nature', category: 'produits-laitiers', carbs: 3.5, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['yaourt à la grecque'] },
  { id: 'fromage-blanc', name: 'Fromage blanc nature', category: 'produits-laitiers', carbs: 3.5, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['fromage blanc 0%', 'fromage blanc 20%'] },
  { id: 'petit-suisse', name: 'Petit suisse', category: 'produits-laitiers', carbs: 4.0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 60, aliases: ['petits suisses'] },
  { id: 'skyr', name: 'Skyr', category: 'produits-laitiers', carbs: 4.0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: [] },
  { id: 'creme-dessert', name: 'Crème dessert (Danette)', category: 'produits-laitiers', carbs: 20.0, fiber: 0.2, gi: 'moyen', unit: 'g', defaultPortion: 125, aliases: ['danette', 'creme au chocolat'] },
  { id: 'mousse-chocolat', name: 'Mousse au chocolat', category: 'produits-laitiers', carbs: 25.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 70, aliases: [] },
  { id: 'flan', name: 'Flan', category: 'produits-laitiers', carbs: 22.0, fiber: 0, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['flan caramel'] },
  { id: 'ile-flottante', name: 'Île flottante', category: 'produits-laitiers', carbs: 20.0, fiber: 0, gi: 'moyen', unit: 'g', defaultPortion: 150, aliases: [] },
  { id: 'riz-au-lait', name: 'Riz au lait', category: 'produits-laitiers', carbs: 22.0, fiber: 0.2, gi: 'moyen', unit: 'g', defaultPortion: 150, aliases: [] },
  { id: 'fromage', name: 'Fromage (moyenne)', category: 'produits-laitiers', carbs: 1.5, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['emmental', 'gruyere', 'comte', 'cheddar', 'camembert', 'brie'] },
  { id: 'mozzarella', name: 'Mozzarella', category: 'produits-laitiers', carbs: 1.0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 125, aliases: ['mozza'] },
  { id: 'chevre', name: 'Fromage de chèvre', category: 'produits-laitiers', carbs: 1.0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['buche de chevre', 'chevre frais'] },
  { id: 'creme-fraiche', name: 'Crème fraîche', category: 'produits-laitiers', carbs: 2.5, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['creme'] },
  { id: 'beurre', name: 'Beurre', category: 'produits-laitiers', carbs: 0.1, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 10, aliases: [] },
  { id: 'lait-amande', name: 'Lait d\'amande (non sucré)', category: 'produits-laitiers', carbs: 0.3, fiber: 0.4, gi: 'faible', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'lait-avoine', name: 'Lait d\'avoine', category: 'produits-laitiers', carbs: 6.5, fiber: 0.8, gi: 'moyen', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'lait-soja', name: 'Lait de soja', category: 'produits-laitiers', carbs: 1.8, fiber: 0.6, gi: 'faible', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'lait-coco', name: 'Lait de coco', category: 'produits-laitiers', carbs: 2.8, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 100, aliases: [] },

  // === VIANDES & POISSONS (peu de glucides) ===
  { id: 'poulet', name: 'Poulet / Dinde', category: 'viandes', carbs: 0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['dinde', 'escalope', 'blanc de poulet', 'cuisse de poulet'] },
  { id: 'boeuf', name: 'Bœuf', category: 'viandes', carbs: 0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['steak', 'entrecote', 'bavette', 'viande hachee'] },
  { id: 'porc', name: 'Porc', category: 'viandes', carbs: 0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['cote de porc', 'roti de porc', 'filet mignon'] },
  { id: 'agneau', name: 'Agneau', category: 'viandes', carbs: 0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['cote d\'agneau', 'gigot'] },
  { id: 'jambon', name: 'Jambon blanc', category: 'viandes', carbs: 1.0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['jambon cuit'] },
  { id: 'saucisse', name: 'Saucisse / Chipolata', category: 'viandes', carbs: 2.0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['chipolata', 'merguez', 'saucisses'] },
  { id: 'lardons', name: 'Lardons', category: 'viandes', carbs: 0.5, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['lardon', 'bacon'] },
  { id: 'poisson-blanc', name: 'Poisson blanc (cabillaud, colin)', category: 'viandes', carbs: 0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['cabillaud', 'colin', 'lieu', 'merlu', 'sole', 'dorade'] },
  { id: 'saumon', name: 'Saumon', category: 'viandes', carbs: 0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['pave de saumon', 'saumon fume'] },
  { id: 'thon', name: 'Thon', category: 'viandes', carbs: 0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 150, aliases: ['thon en boite', 'thon frais'] },
  { id: 'crevette', name: 'Crevettes', category: 'viandes', carbs: 0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['crevette', 'gambas'] },
  { id: 'oeuf', name: 'Œuf', category: 'viandes', carbs: 0.7, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 60, aliases: ['oeufs', 'œufs', 'oeuf dur', 'oeuf au plat', 'omelette'] },
  { id: 'surimi', name: 'Surimi', category: 'viandes', carbs: 6.0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['bâtonnet de crabe'] },
  { id: 'nuggets', name: 'Nuggets de poulet', category: 'viandes', carbs: 15.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['nugget', 'chicken nuggets'] },
  { id: 'cordon-bleu', name: 'Cordon bleu', category: 'viandes', carbs: 12.0, fiber: 0.5, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['cordons bleus'] },
  { id: 'poisson-pane', name: 'Poisson pané', category: 'viandes', carbs: 15.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['fish stick', 'poisson panné'] },

  // === BOISSONS ===
  { id: 'jus-orange', name: 'Jus d\'orange', category: 'boissons', carbs: 10.4, fiber: 0.2, gi: 'moyen', unit: 'ml', defaultPortion: 200, aliases: ['jus d orange', 'orange juice'] },
  { id: 'jus-pomme', name: 'Jus de pomme', category: 'boissons', carbs: 11.0, fiber: 0.2, gi: 'moyen', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'jus-raisin', name: 'Jus de raisin', category: 'boissons', carbs: 15.0, fiber: 0.1, gi: 'élevé', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'jus-ananas', name: 'Jus d\'ananas', category: 'boissons', carbs: 12.0, fiber: 0.2, gi: 'moyen', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'smoothie', name: 'Smoothie fruits', category: 'boissons', carbs: 14.0, fiber: 1.0, gi: 'moyen', unit: 'ml', defaultPortion: 250, aliases: ['smoothie banane'] },
  { id: 'coca-cola', name: 'Coca-Cola / Soda', category: 'boissons', carbs: 10.6, fiber: 0, gi: 'élevé', unit: 'ml', defaultPortion: 330, aliases: ['coca', 'pepsi', 'soda', 'fanta', 'sprite', 'orangina', 'limonade'] },
  { id: 'coca-zero', name: 'Coca-Cola Zero / Light', category: 'boissons', carbs: 0, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 330, aliases: ['coca zero', 'coca light', 'pepsi max', 'soda light'] },
  { id: 'ice-tea', name: 'Ice Tea', category: 'boissons', carbs: 8.0, fiber: 0, gi: 'moyen', unit: 'ml', defaultPortion: 330, aliases: ['the glace', 'nestea', 'lipton'] },
  { id: 'sirop', name: 'Sirop dilué (1 dose)', category: 'boissons', carbs: 8.0, fiber: 0, gi: 'élevé', unit: 'ml', defaultPortion: 250, aliases: ['sirop grenadine', 'sirop menthe'] },
  { id: 'boisson-energisante', name: 'Boisson énergisante', category: 'boissons', carbs: 11.0, fiber: 0, gi: 'élevé', unit: 'ml', defaultPortion: 250, aliases: ['red bull', 'monster', 'energy drink'] },
  { id: 'biere', name: 'Bière', category: 'boissons', carbs: 3.5, fiber: 0, gi: 'moyen', unit: 'ml', defaultPortion: 330, aliases: ['biere blonde'] },
  { id: 'vin-rouge', name: 'Vin rouge', category: 'boissons', carbs: 2.5, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 150, aliases: ['vin'] },
  { id: 'vin-blanc', name: 'Vin blanc sec', category: 'boissons', carbs: 2.0, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 150, aliases: [] },
  { id: 'cidre', name: 'Cidre', category: 'boissons', carbs: 4.0, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 250, aliases: [] },
  { id: 'champagne', name: 'Champagne', category: 'boissons', carbs: 1.5, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 150, aliases: ['mousseux', 'prosecco'] },
  { id: 'cafe', name: 'Café (sans sucre)', category: 'boissons', carbs: 0, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 100, aliases: ['expresso', 'espresso'] },
  { id: 'the', name: 'Thé (sans sucre)', category: 'boissons', carbs: 0, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 200, aliases: ['thé', 'the vert', 'thé vert'] },
  { id: 'chocolat-chaud', name: 'Chocolat chaud', category: 'boissons', carbs: 12.0, fiber: 0.5, gi: 'moyen', unit: 'ml', defaultPortion: 200, aliases: ['cacao chaud', 'lait chocolaté'] },

  // === SUCRES & DESSERTS ===
  { id: 'sucre', name: 'Sucre en poudre', category: 'sucres', carbs: 100, fiber: 0, gi: 'élevé', unit: 'g', defaultPortion: 5, aliases: ['sucre blanc', 'saccharose'] },
  { id: 'miel', name: 'Miel', category: 'sucres', carbs: 82.0, fiber: 0, gi: 'moyen', unit: 'g', defaultPortion: 15, aliases: [] },
  { id: 'confiture', name: 'Confiture', category: 'sucres', carbs: 60.0, fiber: 0.5, gi: 'élevé', unit: 'g', defaultPortion: 20, aliases: ['confiture fraise', 'marmelade'] },
  { id: 'nutella', name: 'Nutella / Pâte à tartiner', category: 'sucres', carbs: 57.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 20, aliases: ['pate a tartiner', 'pâte à tartiner'] },
  { id: 'chocolat-noir', name: 'Chocolat noir 70%', category: 'sucres', carbs: 33.0, fiber: 8.0, gi: 'faible', unit: 'g', defaultPortion: 20, aliases: ['chocolat', 'carre de chocolat'] },
  { id: 'chocolat-lait', name: 'Chocolat au lait', category: 'sucres', carbs: 52.0, fiber: 1.5, gi: 'moyen', unit: 'g', defaultPortion: 20, aliases: ['chocolat kinder'] },
  { id: 'chocolat-blanc', name: 'Chocolat blanc', category: 'sucres', carbs: 59.0, fiber: 0, gi: 'élevé', unit: 'g', defaultPortion: 20, aliases: [] },
  { id: 'biscuit-sec', name: 'Biscuit sec (Petit Beurre)', category: 'sucres', carbs: 75.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 10, aliases: ['petit beurre', 'biscuit', 'galette'] },
  { id: 'biscuit-chocolat', name: 'Biscuit chocolat (Prince)', category: 'sucres', carbs: 68.0, fiber: 2.5, gi: 'élevé', unit: 'g', defaultPortion: 25, aliases: ['prince', 'pepito', 'granola'] },
  { id: 'madeleines', name: 'Madeleine', category: 'sucres', carbs: 52.0, fiber: 1.0, gi: 'élevé', unit: 'g', defaultPortion: 25, aliases: ['madeleine'] },
  { id: 'brownie', name: 'Brownie', category: 'sucres', carbs: 50.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 60, aliases: ['brownies'] },
  { id: 'cookie', name: 'Cookie', category: 'sucres', carbs: 60.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 30, aliases: ['cookies'] },
  { id: 'muffin', name: 'Muffin', category: 'sucres', carbs: 48.0, fiber: 1.0, gi: 'élevé', unit: 'g', defaultPortion: 75, aliases: ['muffins'] },
  { id: 'donut', name: 'Donut', category: 'sucres', carbs: 45.0, fiber: 1.0, gi: 'élevé', unit: 'g', defaultPortion: 60, aliases: ['donuts', 'beignet'] },
  { id: 'eclair', name: 'Éclair au chocolat', category: 'sucres', carbs: 30.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 80, aliases: ['eclair'] },
  { id: 'croissant-amandes', name: 'Croissant aux amandes', category: 'sucres', carbs: 40.0, fiber: 2.5, gi: 'élevé', unit: 'g', defaultPortion: 100, aliases: [] },
  { id: 'tarte-fruits', name: 'Tarte aux fruits', category: 'sucres', carbs: 35.0, fiber: 1.5, gi: 'moyen', unit: 'g', defaultPortion: 120, aliases: ['tarte pomme', 'tarte fraise', 'tarte aux pommes'] },
  { id: 'gateau-chocolat', name: 'Gâteau au chocolat', category: 'sucres', carbs: 45.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 100, aliases: ['fondant chocolat', 'moelleux chocolat'] },
  { id: 'tiramisu', name: 'Tiramisu', category: 'sucres', carbs: 30.0, fiber: 0.3, gi: 'moyen', unit: 'g', defaultPortion: 120, aliases: [] },
  { id: 'creme-brulee', name: 'Crème brûlée', category: 'sucres', carbs: 25.0, fiber: 0, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: [] },
  { id: 'profiterole', name: 'Profiteroles', category: 'sucres', carbs: 35.0, fiber: 0.5, gi: 'élevé', unit: 'g', defaultPortion: 120, aliases: ['profiterole'] },
  { id: 'glace', name: 'Glace (1 boule)', category: 'sucres', carbs: 24.0, fiber: 0.2, gi: 'moyen', unit: 'g', defaultPortion: 60, aliases: ['crème glacée', 'boule de glace'] },
  { id: 'sorbet', name: 'Sorbet (1 boule)', category: 'sucres', carbs: 26.0, fiber: 0.3, gi: 'moyen', unit: 'g', defaultPortion: 60, aliases: ['boule de sorbet'] },
  { id: 'macaron', name: 'Macaron', category: 'sucres', carbs: 60.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 15, aliases: ['macarons'] },
  { id: 'bonbon', name: 'Bonbons', category: 'sucres', carbs: 90.0, fiber: 0, gi: 'élevé', unit: 'g', defaultPortion: 20, aliases: ['bonbon', 'haribo', 'dragibus'] },
  { id: 'sucette', name: 'Sucette', category: 'sucres', carbs: 98.0, fiber: 0, gi: 'élevé', unit: 'g', defaultPortion: 10, aliases: ['sucettes', 'chupa chups'] },
  { id: 'chewing-gum', name: 'Chewing-gum (sucré)', category: 'sucres', carbs: 65.0, fiber: 0, gi: 'moyen', unit: 'g', defaultPortion: 3, aliases: [] },
  { id: 'barre-chocolatee', name: 'Barre chocolatée (Mars, Snickers)', category: 'sucres', carbs: 65.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 50, aliases: ['mars', 'snickers', 'twix', 'bounty', 'kitkat', 'kinder bueno'] },

  // === SAUCES & CONDIMENTS ===
  { id: 'ketchup', name: 'Ketchup', category: 'sauces', carbs: 24.0, fiber: 0.3, gi: 'moyen', unit: 'g', defaultPortion: 15, aliases: [] },
  { id: 'mayonnaise', name: 'Mayonnaise', category: 'sauces', carbs: 2.0, fiber: 0, gi: 'faible', unit: 'g', defaultPortion: 15, aliases: ['mayo'] },
  { id: 'moutarde', name: 'Moutarde', category: 'sauces', carbs: 5.0, fiber: 3.0, gi: 'faible', unit: 'g', defaultPortion: 10, aliases: [] },
  { id: 'sauce-soja', name: 'Sauce soja', category: 'sauces', carbs: 5.0, fiber: 0.4, gi: 'faible', unit: 'ml', defaultPortion: 15, aliases: [] },
  { id: 'sauce-tomate', name: 'Sauce tomate / Coulis', category: 'sauces', carbs: 7.0, fiber: 1.5, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['coulis de tomate', 'passata'] },
  { id: 'pesto', name: 'Pesto', category: 'sauces', carbs: 4.0, fiber: 1.0, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['pesto vert', 'pesto rosso'] },
  { id: 'vinaigrette', name: 'Vinaigrette', category: 'sauces', carbs: 3.0, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 20, aliases: ['sauce salade'] },
  { id: 'huile-olive', name: 'Huile d\'olive', category: 'sauces', carbs: 0, fiber: 0, gi: 'faible', unit: 'ml', defaultPortion: 15, aliases: ['huile'] },
  { id: 'sauce-barbecue', name: 'Sauce barbecue', category: 'sauces', carbs: 30.0, fiber: 0.5, gi: 'moyen', unit: 'g', defaultPortion: 20, aliases: ['sauce bbq'] },
  { id: 'sauce-burger', name: 'Sauce burger', category: 'sauces', carbs: 15.0, fiber: 0, gi: 'moyen', unit: 'g', defaultPortion: 20, aliases: ['sauce bigmac', 'sauce special'] },
  { id: 'sauce-aigre-douce', name: 'Sauce aigre-douce', category: 'sauces', carbs: 40.0, fiber: 0.3, gi: 'élevé', unit: 'g', defaultPortion: 30, aliases: ['sweet chili'] },
  { id: 'houmous', name: 'Houmous', category: 'sauces', carbs: 14.0, fiber: 6.0, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['hummus'] },
  { id: 'guacamole', name: 'Guacamole', category: 'sauces', carbs: 5.0, fiber: 4.0, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: [] },
  { id: 'tzatziki', name: 'Tzatziki', category: 'sauces', carbs: 3.5, fiber: 0.5, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: [] },

  // === PLATS PRÉPARÉS ===
  { id: 'pizza-margherita', name: 'Pizza Margherita', category: 'plats', carbs: 28.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 200, aliases: ['pizza fromage'] },
  { id: 'pizza-4-fromages', name: 'Pizza 4 fromages', category: 'plats', carbs: 26.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 200, aliases: ['pizza quatre fromages'] },
  { id: 'pizza-pepperoni', name: 'Pizza Pepperoni', category: 'plats', carbs: 27.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 200, aliases: ['pizza chorizo'] },
  { id: 'lasagne', name: 'Lasagnes', category: 'plats', carbs: 14.0, fiber: 1.5, gi: 'moyen', unit: 'g', defaultPortion: 300, aliases: ['lasagne bolognaise'] },
  { id: 'hachis-parmentier', name: 'Hachis parmentier', category: 'plats', carbs: 12.0, fiber: 1.5, gi: 'moyen', unit: 'g', defaultPortion: 300, aliases: [] },
  { id: 'gratin-dauphinois', name: 'Gratin dauphinois', category: 'plats', carbs: 12.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 200, aliases: [] },
  { id: 'quiche-lorraine', name: 'Quiche lorraine', category: 'plats', carbs: 18.0, fiber: 0.8, gi: 'moyen', unit: 'g', defaultPortion: 150, aliases: ['quiche'] },
  { id: 'croque-monsieur', name: 'Croque-monsieur', category: 'plats', carbs: 22.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 150, aliases: ['croque monsieur'] },
  { id: 'sandwich-jambon', name: 'Sandwich jambon-beurre', category: 'plats', carbs: 28.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 180, aliases: ['jambon beurre'] },
  { id: 'sandwich-poulet', name: 'Sandwich club poulet', category: 'plats', carbs: 25.0, fiber: 2.0, gi: 'moyen', unit: 'g', defaultPortion: 200, aliases: ['club sandwich'] },
  { id: 'pates-bolognaise', name: 'Pâtes bolognaise', category: 'plats', carbs: 18.0, fiber: 1.8, gi: 'moyen', unit: 'g', defaultPortion: 350, aliases: ['spaghetti bolognaise', 'bolo'] },
  { id: 'pates-carbonara', name: 'Pâtes carbonara', category: 'plats', carbs: 20.0, fiber: 1.2, gi: 'moyen', unit: 'g', defaultPortion: 350, aliases: ['spaghetti carbonara', 'carbo'] },
  { id: 'pates-pesto', name: 'Pâtes au pesto', category: 'plats', carbs: 22.0, fiber: 1.5, gi: 'moyen', unit: 'g', defaultPortion: 350, aliases: [] },
  { id: 'risotto', name: 'Risotto', category: 'plats', carbs: 22.0, fiber: 0.8, gi: 'élevé', unit: 'g', defaultPortion: 300, aliases: [] },
  { id: 'couscous', name: 'Couscous complet (semoule + légumes + viande)', category: 'plats', carbs: 15.0, fiber: 2.0, gi: 'moyen', unit: 'g', defaultPortion: 400, aliases: ['couscous royal'] },
  { id: 'tajine', name: 'Tajine', category: 'plats', carbs: 12.0, fiber: 2.0, gi: 'moyen', unit: 'g', defaultPortion: 350, aliases: [] },
  { id: 'blanquette-veau', name: 'Blanquette de veau', category: 'plats', carbs: 6.0, fiber: 1.0, gi: 'faible', unit: 'g', defaultPortion: 300, aliases: [] },
  { id: 'boeuf-bourguignon', name: 'Bœuf bourguignon', category: 'plats', carbs: 5.0, fiber: 1.5, gi: 'faible', unit: 'g', defaultPortion: 300, aliases: [] },
  { id: 'pot-au-feu', name: 'Pot-au-feu', category: 'plats', carbs: 8.0, fiber: 2.0, gi: 'faible', unit: 'g', defaultPortion: 400, aliases: [] },
  { id: 'paella', name: 'Paella', category: 'plats', carbs: 18.0, fiber: 1.5, gi: 'moyen', unit: 'g', defaultPortion: 350, aliases: [] },
  { id: 'sushi-maki', name: 'Sushi / Maki (6 pièces)', category: 'plats', carbs: 30.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 150, aliases: ['sushi', 'maki', 'california roll'] },
  { id: 'bo-bun', name: 'Bo bun', category: 'plats', carbs: 28.0, fiber: 2.5, gi: 'faible', unit: 'g', defaultPortion: 400, aliases: ['bobun'] },
  { id: 'pad-thai', name: 'Pad thaï', category: 'plats', carbs: 22.0, fiber: 2.0, gi: 'moyen', unit: 'g', defaultPortion: 350, aliases: [] },
  { id: 'riz-cantonais', name: 'Riz cantonais', category: 'plats', carbs: 22.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 300, aliases: ['riz sauté'] },
  { id: 'nems', name: 'Nems (4 pièces)', category: 'plats', carbs: 25.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 120, aliases: ['nem', 'rouleaux de printemps frits'] },
  { id: 'rouleau-printemps', name: 'Rouleaux de printemps (2 pièces)', category: 'plats', carbs: 12.0, fiber: 1.0, gi: 'faible', unit: 'g', defaultPortion: 100, aliases: ['rouleau printemps'] },
  { id: 'raviolis', name: 'Raviolis', category: 'plats', carbs: 25.0, fiber: 1.5, gi: 'moyen', unit: 'g', defaultPortion: 250, aliases: ['ravioli', 'raviolis chinois', 'gyoza'] },
  { id: 'soupe-miso', name: 'Soupe miso', category: 'plats', carbs: 3.5, fiber: 0.8, gi: 'faible', unit: 'ml', defaultPortion: 200, aliases: [] },
  { id: 'soupe-legumes', name: 'Soupe de légumes', category: 'plats', carbs: 6.0, fiber: 1.5, gi: 'faible', unit: 'ml', defaultPortion: 300, aliases: ['velouté', 'potage'] },
  { id: 'chili-con-carne', name: 'Chili con carne', category: 'plats', carbs: 10.0, fiber: 4.0, gi: 'faible', unit: 'g', defaultPortion: 300, aliases: ['chili'] },
  { id: 'curry-poulet', name: 'Curry de poulet', category: 'plats', carbs: 8.0, fiber: 2.0, gi: 'faible', unit: 'g', defaultPortion: 300, aliases: ['poulet curry'] },
  { id: 'moussaka', name: 'Moussaka', category: 'plats', carbs: 10.0, fiber: 2.0, gi: 'moyen', unit: 'g', defaultPortion: 300, aliases: [] },

  // === FAST-FOOD ===
  { id: 'burger-classique', name: 'Burger classique', category: 'fast-food', carbs: 28.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 200, aliases: ['hamburger', 'cheeseburger'] },
  { id: 'big-mac', name: 'Big Mac', category: 'fast-food', carbs: 42.0, fiber: 3.0, gi: 'élevé', unit: 'g', defaultPortion: 215, aliases: ['bigmac'] },
  { id: 'mcchicken', name: 'McChicken', category: 'fast-food', carbs: 40.0, fiber: 2.5, gi: 'élevé', unit: 'g', defaultPortion: 180, aliases: ['mc chicken'] },
  { id: 'whopper', name: 'Whopper', category: 'fast-food', carbs: 49.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 290, aliases: [] },
  { id: 'double-cheese', name: 'Double Cheeseburger', category: 'fast-food', carbs: 32.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 170, aliases: ['double cheese'] },
  { id: 'frites-mcdo', name: 'Frites McDonald\'s (moyenne)', category: 'fast-food', carbs: 42.0, fiber: 4.0, gi: 'élevé', unit: 'g', defaultPortion: 117, aliases: ['frites medium', 'frites mcdo'] },
  { id: 'frites-grande', name: 'Frites (grande portion)', category: 'fast-food', carbs: 42.0, fiber: 4.0, gi: 'élevé', unit: 'g', defaultPortion: 150, aliases: ['large fries'] },
  { id: 'mcflurry', name: 'McFlurry', category: 'fast-food', carbs: 45.0, fiber: 0.5, gi: 'élevé', unit: 'g', defaultPortion: 150, aliases: ['mc flurry'] },
  { id: 'sundae', name: 'Sundae', category: 'fast-food', carbs: 36.0, fiber: 0.3, gi: 'élevé', unit: 'g', defaultPortion: 100, aliases: [] },
  { id: 'kebab', name: 'Kebab', category: 'fast-food', carbs: 35.0, fiber: 2.5, gi: 'élevé', unit: 'g', defaultPortion: 350, aliases: ['doner', 'döner', 'grec'] },
  { id: 'tacos-francais', name: 'Tacos français', category: 'fast-food', carbs: 30.0, fiber: 2.0, gi: 'élevé', unit: 'g', defaultPortion: 400, aliases: ['tacos'] },
  { id: 'hot-dog', name: 'Hot-dog', category: 'fast-food', carbs: 25.0, fiber: 1.0, gi: 'élevé', unit: 'g', defaultPortion: 150, aliases: ['hotdog'] },
  { id: 'panini', name: 'Panini', category: 'fast-food', carbs: 30.0, fiber: 1.5, gi: 'moyen', unit: 'g', defaultPortion: 200, aliases: [] },
  { id: 'poulet-frit', name: 'Poulet frit (bucket)', category: 'fast-food', carbs: 12.0, fiber: 0.5, gi: 'moyen', unit: 'g', defaultPortion: 150, aliases: ['kfc', 'poulet pane'] },
  { id: 'wrap-poulet', name: 'Wrap poulet', category: 'fast-food', carbs: 26.0, fiber: 2.0, gi: 'moyen', unit: 'g', defaultPortion: 200, aliases: ['mcwrap'] },
  { id: 'tenders', name: 'Chicken Tenders', category: 'fast-food', carbs: 18.0, fiber: 1.0, gi: 'moyen', unit: 'g', defaultPortion: 130, aliases: ['chicken tenders', 'tenders poulet'] },
  { id: 'onion-rings', name: 'Onion rings', category: 'fast-food', carbs: 28.0, fiber: 1.5, gi: 'élevé', unit: 'g', defaultPortion: 100, aliases: ['rondelles oignon'] },
  { id: 'potatoes', name: 'Potatoes', category: 'fast-food', carbs: 25.0, fiber: 2.5, gi: 'moyen', unit: 'g', defaultPortion: 100, aliases: ['country potatoes'] },

  // === SNACKS & APÉRITIFS ===
  { id: 'chips', name: 'Chips', category: 'snacks', carbs: 50.0, fiber: 4.0, gi: 'élevé', unit: 'g', defaultPortion: 30, aliases: ['chips nature', 'lays', 'pringles'] },
  { id: 'chips-tortilla', name: 'Chips tortilla', category: 'snacks', carbs: 58.0, fiber: 4.5, gi: 'moyen', unit: 'g', defaultPortion: 30, aliases: ['tortilla chips', 'doritos', 'nachos'] },
  { id: 'cacahuetes', name: 'Cacahuètes', category: 'snacks', carbs: 12.0, fiber: 8.5, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['cacahuète', 'arachides', 'cacahouetes'] },
  { id: 'amandes', name: 'Amandes', category: 'snacks', carbs: 10.0, fiber: 12.2, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['amande'] },
  { id: 'noix', name: 'Noix', category: 'snacks', carbs: 7.0, fiber: 6.7, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['noix de grenoble'] },
  { id: 'noix-cajou', name: 'Noix de cajou', category: 'snacks', carbs: 26.0, fiber: 3.3, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['cajou'] },
  { id: 'pistaches', name: 'Pistaches', category: 'snacks', carbs: 17.0, fiber: 10.3, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['pistache'] },
  { id: 'noisettes', name: 'Noisettes', category: 'snacks', carbs: 11.0, fiber: 9.7, gi: 'faible', unit: 'g', defaultPortion: 30, aliases: ['noisette'] },
  { id: 'melange-aperitif', name: 'Mélange apéritif', category: 'snacks', carbs: 35.0, fiber: 4.0, gi: 'moyen', unit: 'g', defaultPortion: 40, aliases: ['mix aperitif', 'apericube'] },
  { id: 'bretzels', name: 'Bretzels', category: 'snacks', carbs: 70.0, fiber: 3.0, gi: 'élevé', unit: 'g', defaultPortion: 30, aliases: ['bretzel', 'sticks'] },
  { id: 'pop-corn', name: 'Pop-corn nature', category: 'snacks', carbs: 60.0, fiber: 13.0, gi: 'moyen', unit: 'g', defaultPortion: 30, aliases: ['popcorn'] },
  { id: 'pop-corn-sucre', name: 'Pop-corn sucré/caramel', category: 'snacks', carbs: 75.0, fiber: 5.0, gi: 'élevé', unit: 'g', defaultPortion: 40, aliases: [] },
  { id: 'crackers', name: 'Crackers', category: 'snacks', carbs: 65.0, fiber: 2.5, gi: 'élevé', unit: 'g', defaultPortion: 30, aliases: ['tuc', 'cracker'] },
  { id: 'gressins', name: 'Gressins', category: 'snacks', carbs: 68.0, fiber: 3.0, gi: 'élevé', unit: 'g', defaultPortion: 20, aliases: ['gressin'] },
  { id: 'barre-cereales', name: 'Barre de céréales', category: 'snacks', carbs: 65.0, fiber: 3.5, gi: 'moyen', unit: 'g', defaultPortion: 25, aliases: ['barre cereale', 'grany'] },
  { id: 'barre-proteinee', name: 'Barre protéinée', category: 'snacks', carbs: 25.0, fiber: 5.0, gi: 'faible', unit: 'g', defaultPortion: 50, aliases: ['protein bar'] },

  // === RESUCRAGE D'URGENCE ===
  { id: 'sucre-morceau', name: 'Sucre en morceau', category: 'sucres', carbs: 100, fiber: 0, gi: 'élevé', unit: 'g', defaultPortion: 5, aliases: ['morceau de sucre', 'sucre rapide'] },
  { id: 'jus-pomme-brick', name: 'Jus de pomme (brique 20cl)', category: 'boissons', carbs: 11.0, fiber: 0, gi: 'moyen', unit: 'ml', defaultPortion: 200, aliases: ['brique jus', 'petit jus'] },
  { id: 'glucose-tabs', name: 'Tablettes de glucose (Dextro)', category: 'sucres', carbs: 96.0, fiber: 0, gi: 'élevé', unit: 'g', defaultPortion: 6, aliases: ['dextro', 'dextrose', 'glucose', 'resucrage'] },
];

// Helper: Recherche floue dans la base
export function searchFoods(query) {
  if (!query || query.trim().length < 2) return [];
  
  const normalizedQuery = query.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprime accents
    .trim();
  
  const terms = normalizedQuery.split(/\s+/);
  
  return FOODS_DATABASE
    .map(food => {
      const normalizedName = food.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      const normalizedAliases = food.aliases.map(a => 
        a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      );
      
      let score = 0;
      
      // Correspondance exacte du nom
      if (normalizedName === normalizedQuery) score += 100;
      // Le nom commence par la requête
      else if (normalizedName.startsWith(normalizedQuery)) score += 80;
      // Le nom contient tous les termes
      else if (terms.every(t => normalizedName.includes(t))) score += 60;
      // Le nom contient la requête
      else if (normalizedName.includes(normalizedQuery)) score += 50;
      
      // Bonus pour aliases
      for (const alias of normalizedAliases) {
        if (alias === normalizedQuery) score += 90;
        else if (alias.startsWith(normalizedQuery)) score += 70;
        else if (terms.every(t => alias.includes(t))) score += 55;
        else if (alias.includes(normalizedQuery)) score += 40;
      }
      
      return { ...food, score };
    })
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}

// Helper: Obtenir les aliments par catégorie
export function getFoodsByCategory(categoryId) {
  return FOODS_DATABASE.filter(f => f.category === categoryId);
}

// Helper: Calculer les glucides pour un poids donné
export function calculateCarbs(food, weightInGrams) {
  const carbs = (food.carbs * weightInGrams) / 100;
  return Math.round(carbs * 10) / 10; // Arrondi à 0.1g
}

// Helper: Calculer le bolus suggéré
export function calculateBolus(totalCarbs, ratio) {
  const dose = totalCarbs / ratio;
  return Math.round(dose * 2) / 2; // Arrondi à 0.5U
}
