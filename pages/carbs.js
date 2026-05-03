// DIABIA — Calculateur de repas professionnel
import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { FOOD_CATEGORIES, searchFoods, getFoodsByCategory, calculateCarbs } from '../data/foods-database';
import { ACTIVITIES, adjustBolusForSport } from '../lib/sport';
import { schedulePostMealNotification } from '../lib/notifications';
import { addMealEntry } from '../lib/storage';
import { getRatioForTime, calculateBolus } from '../lib/ratios';

export default function Carbs() {
  const [view, setView] = useState('meal');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mealItems, setMealItems] = useState([]);
  const [glycemia, setGlycemia] = useState('');
  const [sportIntensity, setSportIntensity] = useState('none');
  const [mealName, setMealName] = useState('');
  const [currentRatio, setCurrentRatio] = useState(null);
  const [categoryView, setCategoryView] = useState(null);

  // Chargement du ratio actuel au montage
  useEffect(() => {
    const loadRatio = async () => {
      const ratio = await getRatioForTime();
      setCurrentRatio(ratio);
    };
    loadRatio();
  }, []);

  // Calculs
  const totalCarbs = mealItems.reduce((sum, item) => sum + calculateCarbs(item.food, item.weight), 0);
  const ratio = currentRatio?.ratio || 3.5;
  const sensitivity = currentRatio?.sensitivity || 25;
  
  const baseBolus = totalCarbs / ratio;
  const correction = glycemia ? (parseInt(glycemia) - 100) / sensitivity : 0;
  const totalBolus = Math.max(0, baseBolus + correction);
  const adjustedBolus = sportIntensity !== 'none' ? adjustBolusForSport(totalBolus, sportIntensity) : totalBolus;

  const addToMeal = (food) => {
    const newItem = { id: Date.now(), food, weight: food.defaultPortion || 100 };
    setMealItems([...mealItems, newItem]);
  };

  const updateMealItemWeight = (id, newWeight) => {
    setMealItems(mealItems.map(item => 
      item.id === id ? { ...item, weight: Math.max(1, newWeight) } : item
    ));
  };

  const confirmMeal = async () => {
    if (totalCarbs === 0) return;

    try {
      const mealData = {
        name: mealName || 'Repas sans nom',
        carbs: totalCarbs,
        bolus: adjustedBolus,
        glycemia,
        sport: sportIntensity,
        foods: mealItems.map(i => ({ name: i.food.name, carbs: calculateCarbs(i.food, i.weight), weight: i.weight })),
        ratio,
        sensitivity,
      };

      await addMealEntry(mealData);
      localStorage.setItem('diabia_last_meal', JSON.stringify(mealData));

      await schedulePostMealNotification({
        id: Date.now(),
        name: mealData.name,
        carbs: totalCarbs,
        bolus: adjustedBolus,
      });

      setMealItems([]);
      setMealName('');
      setGlycemia('');
      setSportIntensity('none');
      setView('meal');

      alert('Repas enregistré. Notification programmée dans 2h.');
    } catch (error) {
      console.error('Erreur sauvegarde repas:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Layout title="Calculateur de repas">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Vue Navigation */}
        <div style={{ display: 'flex', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: 4, gap: 4 }}>
          {['meal', 'search', 'categories'].map(v => (
            <button key={v} onClick={() => { setView(v); setCategoryView(null); }} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
              background: view === v ? '#1e293b' : 'transparent',
              color: view === v ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
            }}>
              {v === 'meal' ? 'Repas' : v === 'search' ? 'Recherche' : 'Catégories'}
            </button>
          ))}
        </div>

        {view === 'meal' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Nom du repas */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <label style={{ color: '#64748b', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Nom du repas</label>
              <input 
                type="text" 
                placeholder="Ex: Petit-déjeuner, Déjeuner..." 
                value={mealName}
                onChange={e => setMealName(e.target.value)}
                style={{ width: '100%', background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 10, padding: '10px', color: '#f1f5f9', fontSize: 14 }}
              />
            </div>

            {/* Résumé Dose */}
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Dose Totale Calculée</p>
              <p style={{ fontSize: 64, fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>
                {adjustedBolus.toFixed(2)}<span style={{ fontSize: 24, color: '#3b82f6', marginLeft: 4 }}>U</span>
              </p>
              <p style={{ color: '#475569', fontSize: 13, marginTop: 12 }}>
                {totalCarbs.toFixed(1)}g glucides • Ratio 1:{ratio} • Sensibilité {sensitivity}
              </p>
              {correction !== 0 && (
                <p style={{ color: correction > 0 ? '#f59e0b' : '#22c55e', fontSize: 12, marginTop: 8 }}>
                  Correction glycémique : {correction > 0 ? '+' : ''}{correction.toFixed(2)}U
                </p>
              )}
            </div>

            {/* Glycémie actuelle */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <label style={{ color: '#64748b', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Glycémie actuelle (optionnel)</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="number" 
                  placeholder="mg/dL" 
                  value={glycemia}
                  onChange={e => setGlycemia(e.target.value)}
                  style={{ flex: 1, background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 10, padding: '10px', color: '#f1f5f9' }}
                />
              </div>
            </div>

            {/* Module Sport */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <label style={{ color: '#64748b', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 12 }}>Activité physique prévue</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                <button onClick={() => setSportIntensity('none')} style={{ padding: '10px', borderRadius: 10, border: '1px solid #1a1f2e', background: sportIntensity === 'none' ? '#1e293b' : 'transparent', color: '#f1f5f9', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Aucune</button>
                {ACTIVITIES && ACTIVITIES.map(a => {
                  if (!a) return null;
                  return (
                    <button 
                      key={a.id} 
                      onClick={() => setSportIntensity(a.id)} 
                      style={{ 
                        padding: '10px', 
                        borderRadius: 10, 
                        border: '1px solid #1a1f2e', 
                        background: sportIntensity === a.id ? '#1e293b' : 'transparent', 
                        color: '#f1f5f9', 
                        fontSize: 12, 
                        cursor: 'pointer', 
                        fontWeight: 600
                      }}
                    >
                      {a.emoji} {a.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Liste Aliments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mealItems.length > 0 && (
                <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Aliments du repas</p>
              )}
              {mealItems.map(item => (
                <div key={item.id} className="glass-card" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>{item.food.name}</p>
                    <button onClick={() => setMealItems(mealItems.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a1f2e', borderRadius: 8, padding: '4px 8px' }}>
                      <input 
                        type="number" 
                        value={item.weight}
                        onChange={e => updateMealItemWeight(item.id, parseInt(e.target.value))}
                        style={{ width: 50, background: 'transparent', border: 'none', color: '#f1f5f9', fontWeight: 600, outline: 'none' }}
                      />
                      <span style={{ color: '#64748b', fontSize: 12 }}>g</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 12 }}>
                      {calculateCarbs(item.food, item.weight).toFixed(1)}g glucides
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton Confirmer */}
            {totalCarbs > 0 && (
              <button onClick={confirmMeal} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                Confirmer ce repas
              </button>
            )}
          </div>
        )}

        {view === 'search' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input 
              type="text" 
              placeholder="Rechercher un aliment..." 
              value={searchQuery} 
              onChange={e => {
                setSearchQuery(e.target.value);
                setSearchResults(searchFoods(e.target.value));
              }}
              style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '14px', color: '#f1f5f9', fontSize: 14 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.slice(0, 20).map(food => (
                <button key={food.id} onClick={() => { addToMeal(food); setSearchQuery(''); setSearchResults([]); }} style={{ textAlign: 'left', padding: '12px', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 10, color: '#f1f5f9', cursor: 'pointer', fontWeight: 500 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{food.name}</span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{food.carbs}g/100g</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'categories' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!categoryView ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {FOOD_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryView(cat.id)}
                    style={{
                      padding: '16px',
                      background: '#0f1117',
                      border: '1px solid #1a1f2e',
                      borderRadius: 12,
                      color: '#f1f5f9',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setCategoryView(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 12,
                    textAlign: 'left',
                  }}
                >
                  Retour aux catégories
                </button>
                <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                  {FOOD_CATEGORIES.find(c => c.id === categoryView)?.emoji} {FOOD_CATEGORIES.find(c => c.id === categoryView)?.name}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {getFoodsByCategory(categoryView).map(food => (
                    <button
                      key={food.id}
                      onClick={() => { addToMeal(food); setCategoryView(null); }}
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        background: '#0f1117',
                        border: '1px solid #1a1f2e',
                        borderRadius: 10,
                        color: '#f1f5f9',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{food.name}</span>
                        <span style={{ color: '#64748b', fontSize: 12 }}>{food.carbs}g/100g</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
