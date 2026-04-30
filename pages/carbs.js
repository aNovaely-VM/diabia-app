// DIABIA — Page compteur de glucides (style Gluci-Chek amélioré)
import { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { FOOD_CATEGORIES, searchFoods, getFoodsByCategory, calculateCarbs, calculateBolus } from '../data/foods-database';

const GI_COLOR = { faible: '#22c55e', moyen: '#f59e0b', 'élevé': '#ef4444' };
const GI_LABEL = { faible: 'IG bas', moyen: 'IG moyen', 'élevé': 'IG haut' };

// Composant pour un aliment ajouté au repas
function MealItem({ item, onUpdate, onRemove }) {
  const [weight, setWeight] = useState(item.weight.toString());

  const handleWeightChange = (e) => {
    const val = e.target.value;
    setWeight(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onUpdate(item.id, num);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: '#0f1117',
      border: '1px solid #1a1f2e',
      borderRadius: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.food.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>{item.food.carbs}g/100{item.food.unit}</span>
          <span style={{
            color: GI_COLOR[item.food.gi],
            fontSize: 11,
            fontWeight: 500,
          }}>
            {GI_LABEL[item.food.gi]}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={handleWeightChange}
          style={{
            width: 60,
            background: '#1a1f2e',
            border: '1px solid #2d3748',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 14,
            padding: '6px 8px',
            textAlign: 'center',
          }}
        />
        <span style={{ color: '#64748b', fontSize: 13 }}>{item.food.unit}</span>
      </div>
      <div style={{ textAlign: 'right', minWidth: 50 }}>
        <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>
          {calculateCarbs(item.food, item.weight)}g
        </p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        style={{
          background: 'none',
          border: 'none',
          padding: 6,
          cursor: 'pointer',
          color: '#64748b',
        }}
        aria-label="Supprimer"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

// Composant résultat de recherche
function SearchResult({ food, onAdd }) {
  return (
    <button
      onClick={() => onAdd(food)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 14px',
        background: '#0f1117',
        border: '1px solid #1a1f2e',
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{food.name}</p>
        <p style={{ color: '#64748b', fontSize: 12 }}>
          {food.carbs}g glucides / 100{food.unit}
        </p>
      </div>
      <span style={{
        background: `${GI_COLOR[food.gi]}18`,
        color: GI_COLOR[food.gi],
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 20,
      }}>
        {GI_LABEL[food.gi]}
      </span>
      <svg width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// Composant pour afficher une catégorie d'aliments
function CategorySection({ category, onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const foods = getFoodsByCategory(category.id);

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '12px 14px',
          background: '#0f1117',
          border: '1px solid #1a1f2e',
          borderRadius: isOpen ? '12px 12px 0 0' : 12,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>{category.icon}</span>
        <span style={{ flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{category.label}</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>{foods.length} aliments</span>
        <svg
          width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div style={{
          background: '#0a0c10',
          border: '1px solid #1a1f2e',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '8px',
          maxHeight: 300,
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {foods.map(food => (
              <button
                key={food.id}
                onClick={() => onAdd(food)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#0f1117',
                  border: '1px solid #1a1f2e',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <p style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 2 }}>{food.name}</p>
                  <p style={{ color: '#64748b', fontSize: 11 }}>{food.carbs}g/100{food.unit}</p>
                </div>
                <svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Carbs() {
  const [view, setView] = useState('meal'); // 'meal' | 'search' | 'categories'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mealItems, setMealItems] = useState([]);
  const [customRatio, setCustomRatio] = useState('');
  const searchInputRef = useRef();

  // Recherche avec debounce
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchFoods(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Focus sur l'input de recherche quand on passe en mode recherche
  useEffect(() => {
    if (view === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [view]);

  // Ajouter un aliment au repas
  const addToMeal = useCallback((food) => {
    setMealItems(prev => {
      // Vérifier si l'aliment est déjà dans le repas
      const existing = prev.find(item => item.food.id === food.id);
      if (existing) {
        return prev.map(item =>
          item.food.id === food.id
            ? { ...item, weight: item.weight + food.defaultPortion }
            : item
        );
      }
      return [...prev, {
        id: `${food.id}-${Date.now()}`,
        food,
        weight: food.defaultPortion,
      }];
    });
    setView('meal');
    setSearchQuery('');
  }, []);

  // Mettre à jour le poids d'un aliment
  const updateItemWeight = useCallback((itemId, newWeight) => {
    setMealItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, weight: newWeight } : item
      )
    );
  }, []);

  // Supprimer un aliment du repas
  const removeItem = useCallback((itemId) => {
    setMealItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Réinitialiser le repas
  const resetMeal = () => {
    setMealItems([]);
    setSearchQuery('');
    setView('meal');
  };

  // Calculs totaux
  const totalCarbs = mealItems.reduce((sum, item) => sum + calculateCarbs(item.food, item.weight), 0);
  const totalCarbsRounded = Math.round(totalCarbs * 10) / 10;
  
  // Déterminer l'IG global (moyenne pondérée)
  const getOverallGI = () => {
    if (mealItems.length === 0) return null;
    const giValues = { faible: 0, moyen: 1, 'élevé': 2 };
    const weightedSum = mealItems.reduce((sum, item) => {
      const carbs = calculateCarbs(item.food, item.weight);
      return sum + (giValues[item.food.gi] * carbs);
    }, 0);
    const avgGI = weightedSum / totalCarbs;
    if (avgGI < 0.5) return 'faible';
    if (avgGI < 1.5) return 'moyen';
    return 'élevé';
  };

  const overallGI = getOverallGI();
  const ratio = parseFloat(customRatio) || 3.5;

  return (
    <Layout title="Glucides">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Compteur de glucides</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Ajoutez vos aliments pour calculer les glucides de votre repas.</p>
        </div>

        {/* Navigation tabs */}
        <div style={{ display: 'flex', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: 4, gap: 2 }}>
          <button
            onClick={() => setView('meal')}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600,
              background: view === 'meal' ? '#1e293b' : 'transparent',
              color: view === 'meal' ? '#e2e8f0' : '#4b5563',
              cursor: 'pointer',
            }}
          >
            Mon repas {mealItems.length > 0 && `(${mealItems.length})`}
          </button>
          <button
            onClick={() => setView('search')}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600,
              background: view === 'search' ? '#1e293b' : 'transparent',
              color: view === 'search' ? '#e2e8f0' : '#4b5563',
              cursor: 'pointer',
            }}
          >
            Rechercher
          </button>
          <button
            onClick={() => setView('categories')}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600,
              background: view === 'categories' ? '#1e293b' : 'transparent',
              color: view === 'categories' ? '#e2e8f0' : '#4b5563',
              cursor: 'pointer',
            }}
          >
            Parcourir
          </button>
        </div>

        {/* Vue: Mon repas */}
        {view === 'meal' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Total glucides */}
            <div style={{
              background: '#0f1117',
              border: '1px solid #1a1f2e',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Glucides totaux
              </p>
              <p style={{ fontSize: 56, fontWeight: 800, color: '#f1f5f9', lineHeight: 1, marginBottom: 8 }}>
                {totalCarbsRounded}<span style={{ fontSize: 22, fontWeight: 500, color: '#64748b' }}>g</span>
              </p>
              {overallGI && (
                <span style={{
                  background: `${GI_COLOR[overallGI]}18`,
                  color: GI_COLOR[overallGI],
                  border: `1px solid ${GI_COLOR[overallGI]}30`,
                  borderRadius: 20,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  Index glycémique {overallGI}
                </span>
              )}
            </div>

            {/* Bolus suggéré */}
            {totalCarbs > 0 && (
              <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '16px' }}>
                <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Bolus suggéré</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    ['3.0', calculateBolus(totalCarbs, 3.0)],
                    ['3.5', calculateBolus(totalCarbs, 3.5)],
                    ['4.5', calculateBolus(totalCarbs, 4.5)],
                  ].map(([r, dose]) => (
                    <div key={r} style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                      <p style={{ color: '#475569', fontSize: 11, marginBottom: 4 }}>Ratio {r}</p>
                      <p style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>{dose}<span style={{ fontSize: 12, color: '#6b7280' }}>U</span></p>
                    </div>
                  ))}
                </div>
                {/* Ratio personnalisé */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
                  <p style={{ color: '#93c5fd', fontSize: 13, flex: 1 }}>Votre ratio</p>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="3.5"
                    value={customRatio}
                    onChange={(e) => setCustomRatio(e.target.value)}
                    style={{
                      width: 60,
                      background: '#1a1f2e',
                      border: '1px solid #2d3748',
                      borderRadius: 8,
                      color: '#e2e8f0',
                      fontSize: 14,
                      padding: '6px 8px',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ color: '#64748b', fontSize: 13 }}>g/U</span>
                  <span style={{ color: '#60a5fa', fontSize: 20, fontWeight: 800, minWidth: 50, textAlign: 'right' }}>
                    {calculateBolus(totalCarbs, ratio)}U
                  </span>
                </div>
                <p style={{ color: '#374151', fontSize: 11, marginTop: 10 }}>Ces suggestions sont indicatives. Adaptez selon votre glycémie actuelle.</p>
              </div>
            )}

            {/* Liste des aliments */}
            {mealItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Aliments ({mealItems.length})
                </p>
                {mealItems.map(item => (
                  <MealItem
                    key={item.id}
                    item={item}
                    onUpdate={updateItemWeight}
                    onRemove={removeItem}
                  />
                ))}
                <button
                  onClick={resetMeal}
                  style={{
                    background: '#0f1117',
                    border: '1px solid #1a1f2e',
                    color: '#64748b',
                    borderRadius: 12,
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  Nouveau repas
                </button>
              </div>
            ) : (
              <div style={{
                background: '#0f1117',
                border: '1.5px dashed #1e293b',
                borderRadius: 16,
                padding: 32,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: '#1a1f2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15, marginBottom: 5 }}>Aucun aliment</p>
                <p style={{ color: '#475569', fontSize: 13 }}>Recherchez ou parcourez les aliments pour les ajouter</p>
              </div>
            )}

            {/* Bouton ajouter aliment */}
            <button
              onClick={() => setView('search')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '15px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ajouter un aliment
            </button>
          </div>
        )}

        {/* Vue: Recherche */}
        {view === 'search' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Barre de recherche */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#0f1117',
              border: '1px solid #1a1f2e',
              borderRadius: 12,
              padding: '4px 12px',
            }}>
              <svg width="20" height="20" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher un aliment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#e2e8f0',
                  fontSize: 15,
                  padding: '12px 0',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#64748b' }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Résultats de recherche */}
            {searchQuery.length >= 2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.length > 0 ? (
                  <>
                    <p style={{ color: '#64748b', fontSize: 12 }}>{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}</p>
                    {searchResults.map(food => (
                      <SearchResult key={food.id} food={food} onAdd={addToMeal} />
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p style={{ color: '#64748b', fontSize: 14 }}>Aucun aliment trouvé pour "{searchQuery}"</p>
                    <p style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>Essayez un autre terme de recherche</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: '#64748b', fontSize: 14 }}>Tapez au moins 2 caractères pour rechercher</p>
              </div>
            )}
          </div>
        )}

        {/* Vue: Catégories */}
        {view === 'categories' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Parcourir par catégorie
            </p>
            {FOOD_CATEGORIES.map(category => (
              <CategorySection key={category.id} category={category} onAdd={addToMeal} />
            ))}
          </div>
        )}

        {/* Info source */}
        <div style={{
          background: '#0f1117',
          border: '1px solid #1a1f2e',
          borderRadius: 12,
          padding: '12px 14px',
          marginTop: 8,
        }}>
          <p style={{ color: '#475569', fontSize: 11, lineHeight: 1.5 }}>
            Valeurs nutritionnelles issues de la base CIQUAL (ANSES France). Les glucides sont indiqués pour 100g ou 100ml. 
            Ajustez les quantités selon votre portion réelle.
          </p>
        </div>
      </div>
    </Layout>
  );
}
