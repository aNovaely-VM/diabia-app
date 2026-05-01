// DIABIA — Page glucides avec algorithme adaptatif de dose d'insuline
import { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { FOOD_CATEGORIES, searchFoods, getFoodsByCategory, calculateCarbs, calculateBolus } from '../data/foods-database';

// ═══════════════════════════════════════════════════════════════════════════
// ALGORITHME ADAPTATIF
// ═══════════════════════════════════════════════════════════════════════════

// Créneaux pompe (issus du PDF CareLink)
const TIME_SLOTS = [
  { id: 'slot0', label: 'Nuit',        range: [0,  6],  defaultRatio: 4.5 },
  { id: 'slot1', label: 'Matin',       range: [6,  12], defaultRatio: 3.0 },
  { id: 'slot2', label: 'Déjeuner',    range: [12, 14], defaultRatio: 3.0 },
  { id: 'slot3', label: 'Après-midi',  range: [14, 18], defaultRatio: 4.5 },
  { id: 'slot4', label: 'Soir',        range: [18, 24], defaultRatio: 3.5 },
];

const SENSITIVITY = 25;   // mg/dL/U — issu du PDF
const TARGET_BG   = 100;  // mg/dL — objectif SmartGuard
const RATIO_MIN   = 3.0;  // g/U
const RATIO_MAX   = 6.0;  // g/U
const MIN_MEALS_TO_ADAPT = 5; // repas minimum par créneau avant d'adapter
const LEARN_RATE  = 0.12; // 12% de dérive max par repas (conservateur)

function getSlot(date = new Date()) {
  const h = date.getHours();
  return TIME_SLOTS.find(s => h >= s.range[0] && h < s.range[1]) || TIME_SLOTS[4];
}

function clampRatio(r) {
  return Math.min(RATIO_MAX, Math.max(RATIO_MIN, r));
}

function roundToInsulinIncrement(dose) {
  // Incrément pompe : 0.025U
  return Math.round(dose / 0.025) * 0.025;
}

// Charge les ratios appris depuis localStorage
function loadAdaptiveRatios() {
  try {
    return JSON.parse(localStorage.getItem('diabia_adaptive_ratios') || 'null') ?? {};
  } catch { return {}; }
}

// Charge l'historique des repas
function loadMealHistory() {
  try {
    return JSON.parse(localStorage.getItem('diabia_meal_history') || '[]');
  } catch { return []; }
}

// Sauvegarde ratios
function saveAdaptiveRatios(ratios) {
  localStorage.setItem('diabia_adaptive_ratios', JSON.stringify(ratios));
}

// Sauvegarde historique repas
function saveMealHistory(history) {
  // Garde 200 repas max
  const trimmed = history.slice(-200);
  localStorage.setItem('diabia_meal_history', JSON.stringify(trimmed));
}

// Récupère le ratio effectif pour un créneau (appris ou défaut)
function getEffectiveRatio(slotId, adaptiveRatios) {
  const slot = TIME_SLOTS.find(s => s.id === slotId);
  const learned = adaptiveRatios[slotId];
  if (!learned || learned.count < MIN_MEALS_TO_ADAPT) {
    return { ratio: slot.defaultRatio, confidence: 0, count: learned?.count ?? 0 };
  }
  return {
    ratio: clampRatio(learned.ratio),
    confidence: Math.min(100, Math.round((learned.count / 20) * 100)),
    count: learned.count,
  };
}

// Calcule la dose suggérée
function computeDose(carbs, glycemia, slotId, adaptiveRatios) {
  const { ratio, confidence, count } = getEffectiveRatio(slotId, adaptiveRatios);

  const doseMeal       = carbs / ratio;
  const correction     = (glycemia - TARGET_BG) / SENSITIVITY;
  const doseTotal      = doseMeal + correction;
  const doseFinal      = roundToInsulinIncrement(Math.max(0, doseTotal));

  return {
    ratio,
    confidence,
    count,
    doseMeal:   roundToInsulinIncrement(Math.max(0, doseMeal)),
    correction: roundToInsulinIncrement(correction),
    doseTotal:  doseFinal,
  };
}

// Apprend d'un repas terminé (glycémie post-repas connue)
function learnFromMeal(meal, postGlycemia, adaptiveRatios) {
  // dose_idéale = dose_prise + (glycémie_post - target) / sensibilité
  const correctionNeeded = (postGlycemia - TARGET_BG) / SENSITIVITY;
  const idealDose = meal.doseTaken - correctionNeeded;

  if (idealDose <= 0 || meal.carbs <= 0) return adaptiveRatios; // données incohérentes

  // dose correction déjà incluse dans doseTaken → on isole la part repas
  const mealCorrectionApplied = (meal.glycemiaBefore - TARGET_BG) / SENSITIVITY;
  const idealMealDose = idealDose - mealCorrectionApplied;

  if (idealMealDose <= 0) return adaptiveRatios;

  const effectiveRatio = clampRatio(meal.carbs / idealMealDose);

  const current = adaptiveRatios[meal.slotId] ?? {
    ratio: TIME_SLOTS.find(s => s.id === meal.slotId)?.defaultRatio ?? 3.5,
    count: 0,
  };

  // Moyenne mobile pondérée exponentielle
  const newRatio = clampRatio(current.ratio + LEARN_RATE * (effectiveRatio - current.ratio));

  return {
    ...adaptiveRatios,
    [meal.slotId]: {
      ratio: Math.round(newRatio * 1000) / 1000,
      count: current.count + 1,
      lastUpdate: Date.now(),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS UI
// ═══════════════════════════════════════════════════════════════════════════

const GI_COLOR = { faible: '#22c55e', moyen: '#f59e0b', 'élevé': '#ef4444' };
const GI_LABEL = { faible: 'IG bas', moyen: 'IG moyen', 'élevé': 'IG haut' };

function MealItem({ item, onUpdate, onRemove }) {
  const [weight, setWeight] = useState(item.weight.toString());
  const handleWeightChange = (e) => {
    const val = e.target.value;
    setWeight(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) onUpdate(item.id, num);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.food.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>{item.food.carbs}g/100{item.food.unit}</span>
          <span style={{ color: GI_COLOR[item.food.gi], fontSize: 11, fontWeight: 500 }}>{GI_LABEL[item.food.gi]}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="number" inputMode="decimal" value={weight} onChange={handleWeightChange}
          style={{ width: 60, background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 8, color: '#e2e8f0', fontSize: 14, padding: '6px 8px', textAlign: 'center' }} />
        <span style={{ color: '#64748b', fontSize: 13 }}>{item.food.unit}</span>
      </div>
      <div style={{ textAlign: 'right', minWidth: 50 }}>
        <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>{calculateCarbs(item.food, item.weight)}g</p>
      </div>
      <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: '#64748b' }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function SearchResult({ food, onAdd }) {
  return (
    <button onClick={() => onAdd(food)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{food.name}</p>
        <p style={{ color: '#64748b', fontSize: 12 }}>{food.carbs}g glucides / 100{food.unit}</p>
      </div>
      <span style={{ background: `${GI_COLOR[food.gi]}18`, color: GI_COLOR[food.gi], fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>{GI_LABEL[food.gi]}</span>
      <svg width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function CategorySection({ category, onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const foods = getFoodsByCategory(category.id);
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: isOpen ? '12px 12px 0 0' : 12, cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 20 }}>{category.icon}</span>
        <span style={{ flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{category.label}</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>{foods.length} aliments</span>
        <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div style={{ background: '#0a0c10', border: '1px solid #1a1f2e', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '8px', maxHeight: 300, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {foods.map(food => (
              <button key={food.id} onClick={() => onAdd(food)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
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

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function Carbs() {
  const [view, setView] = useState('meal');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mealItems, setMealItems] = useState([]);

  // Glycémie
  const [glycemia, setGlycemia] = useState('');
  const [glycemiaSource, setGlycemiaSource] = useState(''); // 'dashboard' | 'manual'

  // Algorithme adaptatif
  const [adaptiveRatios, setAdaptiveRatios] = useState({});
  const [mealHistory, setMealHistory] = useState([]);
  const [pendingMealId, setPendingMealId] = useState(null); // repas en attente de feedback

  // Feedback post-repas
  const [showPostMealModal, setShowPostMealModal] = useState(false);
  const [postGlycemiaInput, setPostGlycemiaInput] = useState('');
  const [doseTakenInput, setDoseTakenInput] = useState('');
  const [feedbackDone, setFeedbackDone] = useState(false);

  const searchInputRef = useRef();
  const currentSlot = getSlot();

  // Chargement initial
  useEffect(() => {
    setAdaptiveRatios(loadAdaptiveRatios());
    setMealHistory(loadMealHistory());

    // Récupère glycémie du dashboard si < 45min
    const stored = JSON.parse(localStorage.getItem('diabia_current_glycemia') || 'null');
    if (stored) {
      const age = (Date.now() - stored.ts) / 60000;
      if (age < 45) {
        setGlycemia(String(stored.value));
        setGlycemiaSource('dashboard');
      }
    }

    // Vérifie si un repas est en attente de feedback
    const pending = JSON.parse(localStorage.getItem('diabia_pending_meal') || 'null');
    if (pending) {
      const age = (Date.now() - pending.ts) / 60000;
      if (age >= 90 && age <= 240) { // entre 1h30 et 4h après
        setPendingMealId(pending.id);
        setShowPostMealModal(true);
      } else if (age > 240) {
        // Trop vieux, on efface
        localStorage.removeItem('diabia_pending_meal');
      }
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) setSearchResults(searchFoods(searchQuery));
    else setSearchResults([]);
  }, [searchQuery]);

  useEffect(() => {
    if (view === 'search' && searchInputRef.current) searchInputRef.current.focus();
  }, [view]);

  const addToMeal = useCallback((food) => {
    setMealItems(prev => {
      const existing = prev.find(item => item.food.id === food.id);
      if (existing) return prev.map(item => item.food.id === food.id ? { ...item, weight: item.weight + food.defaultPortion } : item);
      return [...prev, { id: `${food.id}-${Date.now()}`, food, weight: food.defaultPortion }];
    });
    setView('meal');
    setSearchQuery('');
  }, []);

  const updateItemWeight = useCallback((itemId, newWeight) => {
    setMealItems(prev => prev.map(item => item.id === itemId ? { ...item, weight: newWeight } : item));
  }, []);

  const removeItem = useCallback((itemId) => {
    setMealItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const resetMeal = () => { setMealItems([]); setSearchQuery(''); setView('meal'); };

  // Totaux
  const totalCarbs = mealItems.reduce((sum, item) => sum + calculateCarbs(item.food, item.weight), 0);
  const totalCarbsRounded = Math.round(totalCarbs * 10) / 10;

  const getOverallGI = () => {
    if (mealItems.length === 0 || totalCarbs === 0) return null;
    const giValues = { faible: 0, moyen: 1, 'élevé': 2 };
    const weightedSum = mealItems.reduce((sum, item) => sum + giValues[item.food.gi] * calculateCarbs(item.food, item.weight), 0);
    const avg = weightedSum / totalCarbs;
    if (avg < 0.5) return 'faible';
    if (avg < 1.5) return 'moyen';
    return 'élevé';
  };
  const overallGI = getOverallGI();

  // Calcul dose adaptative
  const glycemiaVal = parseInt(glycemia);
  const hasValidGlycemia = !isNaN(glycemiaVal) && glycemiaVal >= 30 && glycemiaVal <= 600;
  const doseCalc = (totalCarbs > 0 && hasValidGlycemia)
    ? computeDose(totalCarbs, glycemiaVal, currentSlot.id, adaptiveRatios)
    : null;

  // Alerte glycémie dangereuse
  const isHypo = hasValidGlycemia && glycemiaVal < 70;
  const isVeryHigh = hasValidGlycemia && glycemiaVal > 350;

  // Enregistre le repas et ouvre la boucle de feedback
  const handleConfirmMeal = () => {
    if (!doseCalc || isHypo) return;
    const mealEntry = {
      id: `meal-${Date.now()}`,
      ts: Date.now(),
      slotId: currentSlot.id,
      carbs: totalCarbs,
      glycemiaBefore: glycemiaVal,
      doseSuggested: doseCalc.doseTotal,
      doseTaken: doseCalc.doseTotal, // sera mis à jour dans le feedback
      items: mealItems.map(i => ({ name: i.food.name, weight: i.weight, carbs: calculateCarbs(i.food, i.weight) })),
    };
    const newHistory = [...mealHistory, mealEntry];
    setMealHistory(newHistory);
    saveMealHistory(newHistory);
    localStorage.setItem('diabia_pending_meal', JSON.stringify({ id: mealEntry.id, ts: mealEntry.ts }));
    setPendingMealId(mealEntry.id);
    setDoseTakenInput(String(doseCalc.doseTotal));
    // Popup de confirmation
    alert(`✓ Repas enregistré !\n\nDans ~2h, l'app vous demandera votre glycémie post-repas pour améliorer les prochaines suggestions.\n\nDose suggérée : ${doseCalc.doseTotal}U\nN'oubliez pas de valider avec votre diabétologue.`);
    resetMeal();
  };

  // Feedback post-repas → apprentissage
  const handlePostMealFeedback = () => {
    const postBg = parseInt(postGlycemiaInput);
    const doseTaken = parseFloat(doseTakenInput);
    if (isNaN(postBg) || postBg < 30 || postBg > 600) return;
    if (isNaN(doseTaken) || doseTaken <= 0) return;

    // Retrouve le repas
    const meal = mealHistory.find(m => m.id === pendingMealId);
    if (!meal) { setShowPostMealModal(false); return; }

    // Met à jour la dose réellement prise
    const mealWithActualDose = { ...meal, doseTaken };

    // Apprentissage
    const newRatios = learnFromMeal(mealWithActualDose, postBg, adaptiveRatios);
    setAdaptiveRatios(newRatios);
    saveAdaptiveRatios(newRatios);

    // Met à jour l'historique
    const newHistory = mealHistory.map(m => m.id === pendingMealId ? { ...m, doseTaken, postGlycemia: postBg, learned: true } : m);
    setMealHistory(newHistory);
    saveMealHistory(newHistory);

    localStorage.removeItem('diabia_pending_meal');
    setShowPostMealModal(false);
    setFeedbackDone(true);
    setTimeout(() => setFeedbackDone(false), 3000);
  };

  // Stats ratios par créneau
  const slotStats = TIME_SLOTS.map(s => ({
    ...s,
    ...getEffectiveRatio(s.id, adaptiveRatios),
    mealsCount: mealHistory.filter(m => m.slotId === s.id).length,
  }));

  return (
    <Layout title="Glucides">
      {/* ── Modal feedback post-repas ── */}
      {showPostMealModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'flex-end', zIndex: 1000, padding: '0 16px 24px',
        }}>
          <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, margin: '0 auto' }}>
            <p style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              Retour post-repas
            </p>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Environ 2h après votre repas — entrez votre glycémie actuelle et la dose réellement injectée. Cela permet d'affiner les prochaines suggestions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Glycémie post-repas (mg/dL)</p>
                <input
                  type="number" inputMode="numeric" placeholder="Ex : 145"
                  value={postGlycemiaInput}
                  onChange={e => setPostGlycemiaInput(e.target.value)}
                  style={{ width: '100%', background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 10, color: '#e2e8f0', fontSize: 18, fontWeight: 600, padding: '12px 14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Dose réellement injectée (U)</p>
                <input
                  type="number" inputMode="decimal" step="0.025"
                  value={doseTakenInput}
                  onChange={e => setDoseTakenInput(e.target.value)}
                  style={{ width: '100%', background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 10, color: '#e2e8f0', fontSize: 18, fontWeight: 600, padding: '12px 14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { localStorage.removeItem('diabia_pending_meal'); setShowPostMealModal(false); }}
                style={{ flex: 1, background: '#1a1f2e', border: '1px solid #2d3748', color: '#64748b', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Ignorer
              </button>
              <button
                onClick={handlePostMealFeedback}
                style={{ flex: 2, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Enregistrer et apprendre
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Compteur de glucides</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Créneau actuel : <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{currentSlot.label}</span>
            {' · '}Ratio appris : <span style={{ color: '#60a5fa', fontWeight: 600 }}>
              {getEffectiveRatio(currentSlot.id, adaptiveRatios).ratio.toFixed(1)} g/U
            </span>
          </p>
        </div>

        {/* Feedback confirmé */}
        {feedbackDone && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ color: '#4ade80', fontSize: 14, fontWeight: 600 }}>✓ Apprentissage effectué — le ratio du créneau {currentSlot.label} a été mis à jour.</p>
          </div>
        )}

        {/* ── SECTION GLYCÉMIE ── */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: '14px' }}>
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Glycémie avant repas
            {glycemiaSource === 'dashboard' && (
              <span style={{ color: '#22c55e', fontSize: 11, marginLeft: 8, fontWeight: 500 }}>• Importée du tableau de bord</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              background: '#1a1f2e', border: `1px solid ${isHypo ? '#ef4444' : isVeryHigh ? '#f59e0b' : '#2d3748'}`,
              borderRadius: 12, padding: '4px 14px',
            }}>
              <input
                type="number" inputMode="numeric" placeholder="mg/dL"
                value={glycemia}
                onChange={e => { setGlycemia(e.target.value); setGlycemiaSource('manual'); }}
                style={{ flex: 1, background: 'transparent', border: 'none', color: isHypo ? '#ef4444' : isVeryHigh ? '#f59e0b' : '#e2e8f0', fontSize: 20, fontWeight: 700, padding: '10px 0', outline: 'none' }}
              />
              <span style={{ color: '#64748b', fontSize: 13, flexShrink: 0 }}>mg/dL</span>
            </div>
          </div>

          {isHypo && (
            <div style={{ marginTop: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: '#f87171', fontSize: 13, fontWeight: 700 }}>⚠️ Hypoglycémie — Ne pas calculer de bolus. Resucrez-vous d'abord.</p>
            </div>
          )}
          {isVeryHigh && (
            <div style={{ marginTop: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600 }}>⚠️ Glycémie très élevée — Consultez votre protocole ou votre diabétologue avant d'injecter.</p>
            </div>
          )}
        </div>

        {/* Navigation tabs */}
        <div style={{ display: 'flex', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: 4, gap: 2 }}>
          {[
            { key: 'meal', label: `Mon repas${mealItems.length > 0 ? ` (${mealItems.length})` : ''}` },
            { key: 'search', label: 'Rechercher' },
            { key: 'categories', label: 'Parcourir' },
            { key: 'history', label: 'Historique' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key)} style={{
              flex: 1, padding: '10px 4px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 600,
              background: view === tab.key ? '#1e293b' : 'transparent',
              color: view === tab.key ? '#e2e8f0' : '#4b5563', cursor: 'pointer',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ══ Vue: Mon repas ══ */}
        {view === 'meal' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Total glucides */}
            <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Glucides totaux</p>
              <p style={{ fontSize: 56, fontWeight: 800, color: '#f1f5f9', lineHeight: 1, marginBottom: 8 }}>
                {totalCarbsRounded}<span style={{ fontSize: 22, fontWeight: 500, color: '#64748b' }}>g</span>
              </p>
              {overallGI && (
                <span style={{ background: `${GI_COLOR[overallGI]}18`, color: GI_COLOR[overallGI], border: `1px solid ${GI_COLOR[overallGI]}30`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>
                  Index glycémique {overallGI}
                </span>
              )}
            </div>

            {/* ── DOSE ADAPTATIVE ── */}
            {totalCarbs > 0 && hasValidGlycemia && !isHypo && (
              <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Dose suggérée
                  </p>
                  {/* Indicateur de confiance */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, height: 4, background: '#1a1f2e', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: doseCalc.confidence > 70 ? '#22c55e' : doseCalc.confidence > 30 ? '#f59e0b' : '#64748b', width: `${doseCalc.confidence}%`, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ color: '#64748b', fontSize: 11 }}>
                      {doseCalc.confidence === 0 ? 'Ratio initial' : `Confiance ${doseCalc.confidence}%`}
                    </span>
                  </div>
                </div>

                {/* Dose principale */}
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 14, padding: '18px', textAlign: 'center', marginBottom: 12 }}>
                  <p style={{ color: '#93c5fd', fontSize: 13, marginBottom: 6 }}>Dose totale recommandée</p>
                  <p style={{ color: '#e2e8f0', fontSize: 52, fontWeight: 800, lineHeight: 1 }}>
                    {doseCalc.doseTotal}
                    <span style={{ fontSize: 20, fontWeight: 500, color: '#60a5fa', marginLeft: 4 }}>U</span>
                  </p>
                  <p style={{ color: '#475569', fontSize: 12, marginTop: 6 }}>
                    Ratio {currentSlot.label} · {doseCalc.ratio.toFixed(1)} g/U
                    {doseCalc.count >= MIN_MEALS_TO_ADAPT && ` · appris sur ${doseCalc.count} repas`}
                  </p>
                </div>

                {/* Détail du calcul */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#1a1f2e', borderRadius: 8 }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Dose repas ({totalCarbsRounded}g ÷ {doseCalc.ratio.toFixed(1)})</span>
                    <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>+{doseCalc.doseMeal}U</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#1a1f2e', borderRadius: 8 }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>
                      Correction ({glycemiaVal} → {TARGET_BG} mg/dL ÷ {SENSITIVITY})
                    </span>
                    <span style={{ color: doseCalc.correction > 0 ? '#f59e0b' : '#22c55e', fontSize: 13, fontWeight: 600 }}>
                      {doseCalc.correction > 0 ? '+' : ''}{doseCalc.correction}U
                    </span>
                  </div>
                </div>

                {/* Bouton confirmer */}
                <button
                  onClick={handleConfirmMeal}
                  style={{
                    marginTop: 14, width: '100%',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white', border: 'none', borderRadius: 12,
                    padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Confirmer ce repas et enregistrer
                </button>

                {/* Avertissement médical */}
                <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10 }}>
                  <p style={{ color: '#6b7280', fontSize: 11, lineHeight: 1.5 }}>
                    ⚕️ <strong style={{ color: '#9ca3af' }}>Suggestion indicative uniquement.</strong> Validez toujours avec votre diabétologue. L'algorithme apprend de vos données mais ne remplace pas une prescription médicale.
                  </p>
                </div>
              </div>
            )}

            {/* Prompt glycémie manquante */}
            {totalCarbs > 0 && !hasValidGlycemia && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '14px', textAlign: 'center' }}>
                <p style={{ color: '#fbbf24', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Entrez votre glycémie</p>
                <p style={{ color: '#78716c', fontSize: 13 }}>Une glycémie valide est nécessaire pour calculer la dose (dose repas + correction).</p>
              </div>
            )}

            {/* Liste aliments */}
            {mealItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aliments ({mealItems.length})</p>
                {mealItems.map(item => (
                  <MealItem key={item.id} item={item} onUpdate={updateItemWeight} onRemove={removeItem} />
                ))}
                <button onClick={resetMeal} style={{ background: '#0f1117', border: '1px solid #1a1f2e', color: '#64748b', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}>
                  Nouveau repas
                </button>
              </div>
            ) : (
              <div style={{ background: '#0f1117', border: '1.5px dashed #1e293b', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15, marginBottom: 5 }}>Aucun aliment</p>
                <p style={{ color: '#475569', fontSize: 13 }}>Recherchez ou parcourez les aliments pour les ajouter</p>
              </div>
            )}

            <button onClick={() => setView('search')} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ajouter un aliment
            </button>
          </div>
        )}

        {/* ══ Vue: Recherche ══ */}
        {view === 'search' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '4px 12px' }}>
              <svg width="20" height="20" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input ref={searchInputRef} type="text" placeholder="Rechercher un aliment..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: 15, padding: '12px 0', outline: 'none' }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#64748b' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
            </div>
            {searchQuery.length >= 2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.length > 0 ? (
                  <>{/*  */}<p style={{ color: '#64748b', fontSize: 12 }}>{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}</p>
                    {searchResults.map(food => <SearchResult key={food.id} food={food} onAdd={addToMeal} />)}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p style={{ color: '#64748b', fontSize: 14 }}>Aucun aliment trouvé pour "{searchQuery}"</p>
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

        {/* ══ Vue: Catégories ══ */}
        {view === 'categories' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Parcourir par catégorie</p>
            {FOOD_CATEGORIES.map(category => <CategorySection key={category.id} category={category} onAdd={addToMeal} />)}
          </div>
        )}

        {/* ══ Vue: Historique + ratios appris ══ */}
        {view === 'history' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Ratios par créneau */}
            <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: '14px' }}>
              <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Ratios appris par créneau</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slotStats.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#1a1f2e', borderRadius: 10, border: s.id === currentSlot.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>
                        {s.label}
                        <span style={{ color: '#475569', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>{s.range[0]}h–{s.range[1]}h</span>
                        {s.id === currentSlot.id && <span style={{ color: '#60a5fa', fontSize: 11, marginLeft: 6 }}>• actuel</span>}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ flex: 1, height: 3, background: '#0f1117', borderRadius: 2 }}>
                          <div style={{ height: '100%', borderRadius: 2, background: s.confidence > 70 ? '#22c55e' : s.confidence > 30 ? '#f59e0b' : '#475569', width: `${s.confidence}%` }} />
                        </div>
                        <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>
                          {s.count < MIN_MEALS_TO_ADAPT ? `${s.count}/${MIN_MEALS_TO_ADAPT} repas` : `${s.confidence}% confiance`}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#60a5fa', fontSize: 18, fontWeight: 700 }}>{s.ratio.toFixed(1)}</p>
                      <p style={{ color: '#475569', fontSize: 11 }}>g/U</p>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ color: '#374151', fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
                Ratios clampés entre {RATIO_MIN} et {RATIO_MAX} g/U. Adaptation active après {MIN_MEALS_TO_ADAPT} repas par créneau.
              </p>
            </div>

            {/* Derniers repas */}
            {mealHistory.length > 0 ? (
              <div>
                <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Derniers repas</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...mealHistory].reverse().slice(0, 10).map((meal, i) => {
                    const age = Math.round((Date.now() - meal.ts) / 60000);
                    const ageLabel = age < 60 ? `il y a ${age}min` : age < 1440 ? `il y a ${Math.floor(age / 60)}h` : `il y a ${Math.floor(age / 1440)}j`;
                    const slot = TIME_SLOTS.find(s => s.id === meal.slotId);
                    return (
                      <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div>
                            <span style={{ color: '#64748b', fontSize: 12 }}>{slot?.label} · </span>
                            <span style={{ color: '#475569', fontSize: 12 }}>{ageLabel}</span>
                          </div>
                          {meal.learned && <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>✓ Appris</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div><p style={{ color: '#64748b', fontSize: 11 }}>Glucides</p><p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700 }}>{Math.round(meal.carbs)}g</p></div>
                          <div><p style={{ color: '#64748b', fontSize: 11 }}>Glyc. avant</p><p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700 }}>{meal.glycemiaBefore}</p></div>
                          <div><p style={{ color: '#64748b', fontSize: 11 }}>Dose</p><p style={{ color: '#60a5fa', fontSize: 15, fontWeight: 700 }}>{meal.doseTaken}U</p></div>
                          {meal.postGlycemia && <div><p style={{ color: '#64748b', fontSize: 11 }}>Glyc. après</p><p style={{ color: meal.postGlycemia <= 180 ? '#22c55e' : '#f59e0b', fontSize: 15, fontWeight: 700 }}>{meal.postGlycemia}</p></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: 24, textAlign: 'center' }}>
                <p style={{ color: '#475569', fontSize: 14 }}>Aucun repas enregistré</p>
                <p style={{ color: '#374151', fontSize: 12, marginTop: 4 }}>Ajoutez des aliments et confirmez un repas pour commencer l'apprentissage.</p>
              </div>
            )}
          </div>
        )}

        {/* Info source */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
          <p style={{ color: '#475569', fontSize: 11, lineHeight: 1.5 }}>
            Valeurs nutritionnelles issues de la base CIQUAL (ANSES France). Les glucides sont indiqués pour 100g ou 100ml.
          </p>
        </div>
      </div>
    </Layout>
  );
}