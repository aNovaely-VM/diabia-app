// DIABIA — Dashboard
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
        {value != null && <div style={{ height: '100%', borderRadius: 2, background: color, width: unit === '%' ? `${Math.min(value, 100)}%` : `${Math.min((value / 300) * 100, 100)}%`, transition: 'width 0.6s ease' }} />}
      </div>
    </div>
  );
}

export default function Dashboard() {
  // En production : charger depuis localStorage ou API
  const lastReport = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('diabia_last_report') || 'null') : null;
  const s = lastReport?.summary;

  return (
    <Layout title="Tableau de bord">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Welcome */}
        <div style={{ paddingTop: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px', marginBottom: 4 }}>Tableau de bord</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {lastReport ? `Dernière analyse — ${lastReport.period}` : 'Aucune analyse disponible'}
          </p>
        </div>

        {/* Status badge */}
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

        {/* Métriques */}
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
              padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
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
              padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
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
