// DIABIA — Dashboard professionnel sans emojis
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { calculateRescueCarbs, RESCUE_FOODS } from '../lib/rescue';
import { registerServiceWorker, requestNotificationPermission } from '../lib/notifications';
import { getGlycemiaHistory, addGlycemiaEntry, getLatestReport } from '../lib/storage';
import { initializeRatios, getRatioForTime, updateRatio, calculateIOB } from '../lib/ratios';

const METRICS = [
  { key: 'avg_glucose', label: 'Glycémie moyenne', unit: ' mg/dL', good: (v) => v <= 154, warn: (v) => v <= 183 },
  { key: 'gmi', label: 'GMI', unit: '%', good: (v) => v <= 7, warn: (v) => v <= 8 },
  { key: 'time_in_range', label: 'Temps cible', unit: '%', good: (v) => v >= 70, warn: (v) => v >= 50 },
  { key: 'sensor_wear', label: 'Port capteur', unit: '%', good: (v) => v >= 70, warn: (v) => v >= 50 },
];

function MetricCard({ label, value, unit, good, warn }) {
  const color = value == null ? '#4b5563' : good(value) ? '#22c55e' : warn(value) ? '#f59e0b' : '#ef4444';
  return (
    <div className="glass-card" style={{ padding: '16px 14px', flex: 1, minWidth: 0 }}>
      <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ color: value == null ? '#374151' : color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
        {value ?? '—'}
        <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280', marginLeft: 3 }}>{value != null ? unit : ''}</span>
      </p>
      <div style={{ marginTop: 8, height: 3, background: '#1a1f2e', borderRadius: 2 }}>
        {value != null && (
          <div style={{
            height: '100%', borderRadius: 2, background: color,
            width: unit === '%' ? `${Math.min(value, 100)}%` : `${Math.min((value / 300) * 100, 100)}%`,
            transition: 'width 0.6s ease',
          }} />
        )}
      </div>
    </div>
  );
}

function GlycemiaColor(v) {
  if (v == null) return '#94a3b8';
  if (v < 70) return '#ef4444';
  if (v <= 180) return '#22c55e';
  if (v <= 250) return '#f59e0b';
  return '#ef4444';
}

function GlycemiaLabel(v) {
  if (v == null) return '';
  if (v < 70) return 'Hypoglycémie';
  if (v <= 180) return 'Cible atteinte';
  if (v <= 250) return 'Hyperglycémie modérée';
  return 'Hyperglycémie sévère';
}

export default function Dashboard() {
  const [lastReport, setLastReport] = useState(null);
  const [glycemiaInput, setGlycemiaInput] = useState('');
  const [glycemiaHistory, setGlycemiaHistory] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showRescue, setShowRescue] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratios, setRatios] = useState(null);
  const [editingRatio, setEditingRatio] = useState(null);
  const [lastMeal, setLastMeal] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Enregistrement du Service Worker
        const swReg = await registerServiceWorker();
        if (swReg) {
          const hasPermission = await requestNotificationPermission();
          setNotificationsEnabled(hasPermission);
        }

        // Chargement de l'historique
        const history = await getGlycemiaHistory(50);
        setGlycemiaHistory(history);

        // Chargement du dernier rapport
        const report = await getLatestReport();
        if (report) {
          setLastReport(report);
        } else {
          const localReport = JSON.parse(localStorage.getItem('diabia_last_report') || 'null');
          setLastReport(localReport);
        }

        // Chargement du dernier repas
        const lastMealData = JSON.parse(localStorage.getItem('diabia_last_meal') || 'null');
        setLastMeal(lastMealData);

        // Initialisation des ratios
        const initialRatios = await initializeRatios();
        setRatios(initialRatios);

        // Pré-remplir avec la dernière glycémie
        if (history.length > 0) {
          const last = history[history.length - 1];
          const age = (Date.now() - last.timestamp) / 60000;
          if (age < 30) setGlycemiaInput(String(last.value));
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur initialisation:', error);
        setLoading(false);
      }
    };

    init();
  }, []);

  const saveGlycemia = async () => {
    const val = parseInt(glycemiaInput);
    if (isNaN(val) || val < 30 || val > 600) return;

    try {
      await addGlycemiaEntry(val);

      const entry = { value: val, timestamp: Date.now() };
      const newHistory = [...glycemiaHistory, entry];
      setGlycemiaHistory(newHistory);

      localStorage.setItem('diabia_glycemia_history', JSON.stringify(newHistory.slice(-50)));
      localStorage.setItem('diabia_current_glycemia', JSON.stringify(entry));

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Erreur sauvegarde glycémie:', error);
    }
  };

  const handleRatioUpdate = async (slotId, field, value) => {
    try {
      const updated = await updateRatio(slotId, { [field]: parseFloat(value) || value });
      setRatios({ ...ratios, [slotId]: updated });
      setEditingRatio(null);
    } catch (error) {
      console.error('Erreur mise à jour ratio:', error);
    }
  };

  const currentGlycemia = glycemiaHistory.length > 0 ? glycemiaHistory[glycemiaHistory.length - 1] : null;
  const currentVal = currentGlycemia?.value ?? null;
  const currentAge = currentGlycemia ? Math.round((Date.now() - currentGlycemia.timestamp) / 60000) : null;
  const isStale = currentAge != null && currentAge > 60;

  const rescueCarbs = currentVal ? calculateRescueCarbs(currentVal) : 0;

  if (loading) {
    return (
      <Layout title="Tableau de bord">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tableau de bord">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ paddingTop: 10 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-1px', marginBottom: 4 }}>DIABIA</h1>
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>
            {lastReport ? `Dernière analyse — ${lastReport.period}` : 'Prêt pour votre analyse'}
          </p>
        </div>

        {/* Badge Notifications */}
        {!notificationsEnabled && (
          <div className="glass-card" style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#60a5fa', fontSize: 13, fontWeight: 600 }}>Notifications désactivées</span>
            <button onClick={() => requestNotificationPermission().then(setNotificationsEnabled)} style={{ background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>
              Activer
            </button>
          </div>
        )}

        {/* ═══ SECTION GLYCÉMIE ═══ */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
            Statut Glycémique Actuel
          </p>

          {currentVal != null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px',
              background: `${GlycemiaColor(currentVal)}10`,
              border: `1px solid ${GlycemiaColor(currentVal)}25`,
              borderRadius: 16, marginBottom: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '16px',
                background: `${GlycemiaColor(currentVal)}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 20, fontWeight: 700,
                color: GlycemiaColor(currentVal),
              }}>
                {currentVal}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: GlycemiaColor(currentVal), fontSize: 32, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
                  {currentVal} <span style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>mg/dL</span>
                </p>
                <p style={{ color: GlycemiaColor(currentVal), fontSize: 13, fontWeight: 600 }}>
                  {GlycemiaLabel(currentVal)}
                  {currentAge != null && (
                    <span style={{ color: isStale ? '#ef4444' : '#64748b', marginLeft: 8, fontWeight: 400 }}>
                      • il y a {currentAge < 60 ? `${currentAge}m` : `${Math.floor(currentAge / 60)}h`}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Input nouvelle glycémie */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 12,
              background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 14,
              padding: '4px 16px',
            }}>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Saisir glycémie..."
                value={glycemiaInput}
                onChange={(e) => { setGlycemiaInput(e.target.value); setSaved(false); }}
                onKeyDown={(e) => e.key === 'Enter' && saveGlycemia()}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#e2e8f0', fontSize: 18, fontWeight: 700,
                  padding: '12px 0', outline: 'none',
                }}
              />
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>mg/dL</span>
            </div>
            <button
              onClick={saveGlycemia}
              className="btn-primary"
              style={{
                background: saved ? '#22c55e' : undefined,
                padding: '0 24px',
              }}
            >
              {saved ? 'OK' : 'Sauver'}
            </button>
          </div>

          {/* Assistant de Resucrage */}
          {currentVal != null && currentVal < 70 && (
            <div style={{
              marginTop: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 14, padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#f87171', fontSize: 14, fontWeight: 700 }}>
                  Hypoglycémie détectée — Besoin de {rescueCarbs}g de glucides
                </p>
                <button 
                  onClick={() => setShowRescue(!showRescue)}
                  style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 12, fontWeight: 600, textDecoration: 'underline' }}
                >
                  {showRescue ? 'Fermer' : 'Voir options'}
                </button>
              </div>
              {showRescue && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {RESCUE_FOODS.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                      <span>{f.name}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{Math.ceil(rescueCarbs / f.carbsPerUnit)} {f.unit}s</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ RATIOS ADAPTATIFS ═══ */}
        {ratios && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
              Ratios Insuline/Glucides
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(ratios).map(([slotId, slot]) => (
                <div key={slotId} style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>{slot.name}</p>
                    <p style={{ color: '#64748b', fontSize: 12 }}>{slot.startTime} - {slot.endTime}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#64748b', fontSize: 11, fontWeight: 500 }}>Ratio</p>
                      <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>1:{slot.ratio}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#64748b', fontSize: 11, fontWeight: 500 }}>Sensibilité</p>
                      <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>{slot.sensitivity}</p>
                    </div>
                    <button
                      onClick={() => setEditingRatio(editingRatio === slotId ? null : slotId)}
                      style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                    >
                      {editingRatio === slotId ? 'Fermer' : 'Modifier'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Édition du ratio */}
            {editingRatio && (
              <div style={{ marginTop: 16, background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '16px' }}>
                <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Modifier {ratios[editingRatio].name}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Ratio (1:X)</label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue={ratios[editingRatio].ratio}
                      onChange={(e) => handleRatioUpdate(editingRatio, 'ratio', e.target.value)}
                      style={{ width: '100%', background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 8, padding: '8px', color: '#f1f5f9', marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Sensibilité (mg/dL par U)</label>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={ratios[editingRatio].sensitivity}
                      onChange={(e) => handleRatioUpdate(editingRatio, 'sensitivity', e.target.value)}
                      style={{ width: '100%', background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 8, padding: '8px', color: '#f1f5f9', marginTop: 4 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dernier repas enregistré */}
        {lastMeal && (
          <div className="glass-card" style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <p style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Dernier Repas Enregistré</p>
            <p style={{ color: '#22c55e', fontSize: 14, fontWeight: 600 }}>{lastMeal.name}</p>
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              {lastMeal.carbs}g glucides • {lastMeal.bolus}U injectée
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Link href="/carbs" className="glass-card" style={{ padding: '16px', textAlign: 'center', textDecoration: 'none' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Calculer Repas</span>
          </Link>
          <Link href="/report" className="glass-card" style={{ padding: '16px', textAlign: 'center', textDecoration: 'none' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Analyse Rapport</span>
          </Link>
        </div>

        {/* Metrics Grid */}
        {lastReport && lastReport.summary && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {METRICS.map((m) => {
              const value = lastReport.summary[m.key];
              return (
                <MetricCard 
                  key={m.key} 
                  label={m.label} 
                  value={value} 
                  unit={m.unit} 
                  good={m.good} 
                  warn={m.warn} 
                />
              );
            })}
          </div>
        )}

        {/* Détails supplémentaires du rapport */}
        {lastReport && lastReport.summary && (
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Détails du rapport</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lastReport.summary.total_daily_insulin && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #1a1f2e' }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Insuline quotidienne totale</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{lastReport.summary.total_daily_insulin} U</span>
                </div>
              )}
              {lastReport.summary.basal_ratio && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #1a1f2e' }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Part basale</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{lastReport.summary.basal_ratio}%</span>
                </div>
              )}
              {lastReport.summary.avg_daily_carbs && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Glucides quotidiens moyens</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{lastReport.summary.avg_daily_carbs}g</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historique récent */}
        {glycemiaHistory.length > 1 && (
          <div className="glass-card" style={{ padding: '16px' }}>
            <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Historique Glycémies</p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {[...glycemiaHistory].reverse().slice(0, 10).map((entry, i) => {
                const age = Math.round((Date.now() - entry.timestamp) / 60000);
                const ageLabel = age < 60 ? `${age}m` : age < 1440 ? `${Math.floor(age / 60)}h` : `${Math.floor(age / 1440)}j`;
                return (
                  <div key={i} style={{
                    flexShrink: 0, background: '#1a1f2e', borderRadius: 10,
                    padding: '8px 12px', textAlign: 'center', minWidth: 56,
                  }}>
                    <p style={{ color: GlycemiaColor(entry.value), fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                      {entry.value}
                    </p>
                    <p style={{ color: '#475569', fontSize: 10, marginTop: 3 }}>{ageLabel}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer-mention">
          <p>réalisé avec &lt;3, par <strong>ARDEVOL-CARRAT Matthias</strong></p>
          <div className="version-badge">v1.2.5</div>
        </footer>

      </div>
    </Layout>
  );
}
