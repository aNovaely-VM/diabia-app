// DIABIA — Dashboard avec saisie glycémie
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

const METRICS = [
  { key: 'avg_glucose', label: 'Glycémie moy.', unit: 'mg/dL', good: (v) => v <= 154, warn: (v) => v <= 183 },
  { key: 'gmi', label: 'GMI', unit: '%', good: (v) => v <= 7, warn: (v) => v <= 8 },
  { key: 'time_in_range', label: 'Temps cible', unit: '%', good: (v) => v >= 70, warn: (v) => v >= 50 },
  { key: 'sensor_wear', label: 'Port capteur', unit: '%', good: (v) => v >= 70, warn: (v) => v >= 50 },
];

function MetricCard({ label, value, unit, good, warn }) {
  const color = value == null ? '#4b5563' : good(value) ? '#22c55e' : warn(value) ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: '16px 14px', flex: 1, minWidth: 0 }}>
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
  if (v <= 180) return 'Dans la cible';
  if (v <= 250) return 'Hyperglycémie modérée';
  return 'Hyperglycémie sévère';
}

export default function Dashboard() {
  const [lastReport, setLastReport] = useState(null);
  const [glycemiaInput, setGlycemiaInput] = useState('');
  const [glycemiaHistory, setGlycemiaHistory] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const report = JSON.parse(localStorage.getItem('diabia_last_report') || 'null');
    setLastReport(report);
    const history = JSON.parse(localStorage.getItem('diabia_glycemia_history') || '[]');
    setGlycemiaHistory(history);
    // Pré-remplir avec la dernière glycémie si < 30min
    if (history.length > 0) {
      const last = history[history.length - 1];
      const age = (Date.now() - last.ts) / 60000;
      if (age < 30) setGlycemiaInput(String(last.value));
    }
  }, []);

  const saveGlycemia = () => {
    const val = parseInt(glycemiaInput);
    if (isNaN(val) || val < 30 || val > 600) return;

    const entry = { value: val, ts: Date.now() };
    const newHistory = [...glycemiaHistory, entry].slice(-50); // garde 50 dernières
    setGlycemiaHistory(newHistory);
    localStorage.setItem('diabia_glycemia_history', JSON.stringify(newHistory));
    // Expose pour la page glucides
    localStorage.setItem('diabia_current_glycemia', JSON.stringify(entry));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentGlycemia = glycemiaHistory.length > 0 ? glycemiaHistory[glycemiaHistory.length - 1] : null;
  const currentVal = currentGlycemia?.value ?? null;
  const currentAge = currentGlycemia ? Math.round((Date.now() - currentGlycemia.ts) / 60000) : null;
  const isStale = currentAge != null && currentAge > 60;

  const s = lastReport?.summary;

  return (
    <Layout title="Tableau de bord">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ paddingTop: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px', marginBottom: 4 }}>Tableau de bord</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {lastReport ? `Dernière analyse — ${lastReport.period}` : 'Aucune analyse disponible'}
          </p>
        </div>

        {/* ═══ SECTION GLYCÉMIE ═══ */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '16px' }}>
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            Ma glycémie actuelle
          </p>

          {/* Glycémie courante */}
          {currentVal != null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px',
              background: `${GlycemiaColor(currentVal)}12`,
              border: `1px solid ${GlycemiaColor(currentVal)}30`,
              borderRadius: 12, marginBottom: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${GlycemiaColor(currentVal)}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 20 }}>
                  {currentVal < 70 ? '⚠️' : currentVal <= 180 ? '✓' : '↑'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: GlycemiaColor(currentVal), fontSize: 26, fontWeight: 800, lineHeight: 1, marginBottom: 2 }}>
                  {currentVal} <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>mg/dL</span>
                </p>
                <p style={{ color: GlycemiaColor(currentVal), fontSize: 12, opacity: 0.8 }}>
                  {GlycemiaLabel(currentVal)}
                  {currentAge != null && (
                    <span style={{ color: isStale ? '#ef4444' : '#64748b', marginLeft: 8 }}>
                      — il y a {currentAge < 60 ? `${currentAge} min` : `${Math.floor(currentAge / 60)}h${currentAge % 60 > 0 ? currentAge % 60 + 'min' : ''}`}
                      {isStale && ' (ancienne)'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Input nouvelle glycémie */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 12,
              padding: '4px 14px',
            }}>
              <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Ex : 142"
                value={glycemiaInput}
                onChange={(e) => { setGlycemiaInput(e.target.value); setSaved(false); }}
                onKeyDown={(e) => e.key === 'Enter' && saveGlycemia()}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#e2e8f0', fontSize: 18, fontWeight: 600,
                  padding: '10px 0', outline: 'none',
                }}
              />
              <span style={{ color: '#64748b', fontSize: 13, flexShrink: 0 }}>mg/dL</span>
            </div>
            <button
              onClick={saveGlycemia}
              style={{
                background: saved ? '#22c55e' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '14px 18px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {saved ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {saved ? 'Enregistré' : 'Sauver'}
            </button>
          </div>

          {/* Alerte glycémie basse */}
          {currentVal != null && currentVal < 70 && (
            <div style={{
              marginTop: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <p style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>
                ⚠️ Hypoglycémie — Ne pas faire de bolus. Resucrez-vous.
              </p>
            </div>
          )}

          {/* Lien vers glucides si glycémie ok */}
          {currentVal != null && currentVal >= 70 && (
            <div style={{ marginTop: 10 }}>
              <Link href="/carbs" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: '#60a5fa', fontSize: 13, fontWeight: 500, textDecoration: 'none',
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Calculer une dose pour ce repas →
              </Link>
            </div>
          )}
        </div>

        {/* Historique glycémies récentes */}
        {glycemiaHistory.length > 1 && (
          <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: '14px' }}>
            <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Historique récent
            </p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {[...glycemiaHistory].reverse().slice(0, 8).map((entry, i) => {
                const age = Math.round((Date.now() - entry.ts) / 60000);
                const ageLabel = age < 60 ? `${age}min` : age < 1440 ? `${Math.floor(age / 60)}h` : `${Math.floor(age / 1440)}j`;
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

        {/* Status badge rapport */}
        {lastReport && (
          <div style={{
            background: lastReport.status === 'bon' ? 'rgba(34,197,94,0.08)' : lastReport.status === 'moyen' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${lastReport.status === 'bon' ? 'rgba(34,197,94,0.2)' : lastReport.status === 'moyen' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 12, padding: '12px 14px',
          }}>
            <p style={{ color: lastReport.status === 'bon' ? '#4ade80' : lastReport.status === 'moyen' ? '#fbbf24' : '#f87171', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Contrôle glycémique — {lastReport.status?.toUpperCase()}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{lastReport.next_steps}</p>
          </div>
        )}

        {/* Métriques CareLink */}
        <div>
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Indicateurs clés</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {METRICS.map(m => (
              <MetricCard key={m.key} label={m.label} value={s?.[m.key] ?? null} unit={m.unit} good={m.good} warn={m.warn} />
            ))}
          </div>
        </div>

        {/* Recommandations prioritaires */}
        {lastReport?.recommendations?.filter(r => r.priority === 'haute').length > 0 && (
          <div>
            <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Actions prioritaires</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lastReport.recommendations.filter(r => r.priority === 'haute').slice(0, 3).map((rec, i) => (
                <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{rec.category}</p>
                    <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.5 }}>{rec.explanation}</p>
                    {rec.suggested_value && (
                      <p style={{ color: '#60a5fa', fontSize: 12, marginTop: 4 }}>Suggestion : {rec.suggested_value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div>
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Actions rapides</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/carbs" style={{
              background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14,
              padding: '16px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#60a5fa" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Estimer les glucides</p>
                <p style={{ color: '#4b5563', fontSize: 13 }}>Prendre en photo un repas</p>
              </div>
              <svg width="16" height="16" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link href="/report" style={{
              background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14,
              padding: '16px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#34d399" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Analyser un rapport</p>
                <p style={{ color: '#4b5563', fontSize: 13 }}>Importer un PDF Medtronic</p>
              </div>
              <svg width="16" height="16" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>

        {!lastReport && (
          <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6 }}>
              Commencez par analyser votre rapport Medtronic pour voir vos indicateurs ici.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}