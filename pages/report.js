// pages/report.js
// Conversion de page.tsx (v0) → Pages Router + CSS-in-JS
// Dépendance requise : npm install recharts

import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';

// ─── Constantes de style ──────────────────────────────────────────────────────

const C = {
  card:        { background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14 },
  cardPad:     { background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: 16 },
  section:     { display: 'flex', flexDirection: 'column', gap: 12 },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  grid4:       { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  label:       { color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' },
  row:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1a1f2e' },
};

const STATUS_COLOR  = { bon: '#22c55e', moyen: '#f59e0b', critique: '#ef4444' };
const PRIORITY_COLOR = { haute: '#ef4444', moyenne: '#f59e0b', faible: '#22c55e' };

function statusColor(v, goodFn, warnFn) {
  if (v == null) return '#94a3b8';
  if (goodFn && goodFn(v)) return '#22c55e';
  if (warnFn && warnFn(v)) return '#f59e0b';
  return '#ef4444';
}

// ─── Composants réutilisables ─────────────────────────────────────────────────

function StatCard({ label, value, unit, good, warn, target, subtitle }) {
  if (value == null) return null;
  const color = statusColor(value, good, warn);
  return (
    <div style={{ ...C.cardPad }}>
      <p style={{ ...C.label, marginBottom: 8 }}>{label}</p>
      <p style={{ color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280', marginLeft: 4 }}>{unit}</span>}
      </p>
      {target && <p style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>Cible : {target}</p>}
      {subtitle && <p style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{subtitle}</p>}
    </div>
  );
}

function TrendArrow({ direction }) {
  const c = direction === 'amélioration' ? '#22c55e' : direction === 'dégradation' ? '#ef4444' : '#64748b';
  const sym = direction === 'amélioration' ? '↑' : direction === 'dégradation' ? '↓' : '—';
  return <span style={{ color: c, fontWeight: 700 }}>{sym}</span>;
}

function SectionTitle({ children }) {
  return <p style={{ ...C.label, marginBottom: 10 }}>{children}</p>;
}

function TIRBar({ above, inRange, below }) {
  const total = (above ?? 0) + (inRange ?? 0) + (below ?? 0);
  if (total === 0) return null;
  return (
    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
      {above > 0   && <div style={{ flex: above,   background: '#f59e0b' }} title={`>${180}: ${above}%`} />}
      {inRange > 0 && <div style={{ flex: inRange, background: '#22c55e' }} title={`70-180: ${inRange}%`} />}
      {below > 0   && <div style={{ flex: below,   background: '#ef4444' }} title={`<70: ${below}%`} />}
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{
      background: `${color ?? '#3b82f6'}18`, color: color ?? '#3b82f6',
      border: `1px solid ${color ?? '#3b82f6'}30`,
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
    }}>
      {children}
    </span>
  );
}

// ─── Graphiques ───────────────────────────────────────────────────────────────

function TIRChart({ summary }) {
  const data = [];
  if (summary.time_above != null) data.push({ name: '>180', value: summary.time_above, fill: '#f59e0b' });
  if (summary.time_in_range != null) data.push({ name: '70-180', value: summary.time_in_range, fill: '#22c55e' });
  if (summary.time_below != null) data.push({ name: '<70', value: summary.time_below, fill: '#ef4444' });
  if (data.length === 0) return null;
  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} stroke="#475569" fontSize={11} />
          <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} width={50} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function InsDistChart({ basal_ratio, bolus_ratio }) {
  if (basal_ratio == null || bolus_ratio == null) return null;
  const data = [
    { name: 'Basal', value: basal_ratio, fill: '#3b82f6' },
    { name: 'Bolus', value: bolus_ratio, fill: '#8b5cf6' },
  ];
  return (
    <div style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value"
            label={({ name, value }) => `${name} ${value}%`} labelLine={false} fontSize={11}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BasalChart({ profile }) {
  if (!profile || profile.length === 0) return null;
  return (
    <div style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={profile} margin={{ left: 0, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
          <XAxis dataKey="time" stroke="#475569" fontSize={10} />
          <YAxis stroke="#475569" fontSize={10} unit=" U/h" />
          <Area type="stepAfter" dataKey="rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SGExitsChart({ exits }) {
  const data = [
    { name: 'Pas de capteur', value: exits.no_sensor_value, fill: '#f59e0b' },
    { name: 'Fin vie capteur', value: exits.sensor_end_of_life, fill: '#ef4444' },
    { name: 'Arrêt temp. prol.', value: exits.extended_temp_stop, fill: '#8b5cf6' },
    { name: 'Désactivé user', value: exits.user_disabled, fill: '#6366f1' },
    { name: 'Admin max', value: exits.admin_max, fill: '#dc2626' },
    { name: 'Init SmartGuard', value: exits.sensor_init, fill: '#14b8a6' },
  ].filter(d => d.value > 0);

  if (data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#22c55e' }}>
      ✓ Aucune sortie SmartGuard
    </div>
  );

  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
          <XAxis type="number" stroke="#475569" fontSize={11} />
          <YAxis type="category" dataKey="name" stroke="#475569" fontSize={10} width={110} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'summary',         label: 'Résumé' },
  { key: 'glucose',         label: 'Glucose' },
  { key: 'insulin',         label: 'Insuline' },
  { key: 'smartguard',      label: 'SmartGuard' },
  { key: 'recommendations', label: 'Conseils' },
  { key: 'settings',        label: 'Réglages' },
];

export default function Report() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [pdfjsLib, setPdfjsLib] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem('diabia_last_report');
    if (saved) { try { setResult(JSON.parse(saved)); } catch {} }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';
        setPdfjsLib(pdfjs);
      } catch {}
    };
    load();
  }, []);

  const extractTextFromPDF = async (arrayBuffer) => {
    if (!pdfjsLib) throw new Error('PDF.js non chargé');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      setLoadingStep(`Lecture page ${i}/${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str ?? '').join(' ') + '\n';
    }
    return fullText;
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setResult(null); setError(null);
    setLoading(true); setLoadingStep('Lecture du fichier...');
    try {
      const arrayBuffer = await f.arrayBuffer();
      setLoadingStep('Extraction du texte...');
      const pdfText = await extractTextFromPDF(arrayBuffer);
      if (pdfText.trim().length < 100) throw new Error("Impossible d'extraire le texte. Fichier peut-être scanné.");
      setLoadingStep('Analyse en cours...');
      const res = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_text: pdfText, filename: f.name }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(JSON.parse(t)?.error || `Erreur serveur (${res.status})`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      localStorage.setItem('diabia_last_report', JSON.stringify(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); setLoadingStep('');
    }
  };

  const clearReport = () => {
    localStorage.removeItem('diabia_last_report');
    setResult(null); setFile(null);
  };

  const s = result?.summary;

  return (
    <Layout title="Rapport">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Analyse CareLink</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Importez votre rapport PDF Medtronic CareLink.</p>
          </div>
          {result && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setResult(null); setFile(null); fileRef.current?.click(); }}
                style={{ background: '#1a1f2e', border: '1px solid #2d3748', color: '#94a3b8', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500 }}>
                Nouveau
              </button>
              <button onClick={clearReport}
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500 }}>
                Effacer
              </button>
            </div>
          )}
        </div>

        {/* Upload */}
        {!result && !loading && (
          <div onClick={() => fileRef.current?.click()} style={{
            border: `1.5px dashed ${file ? '#3b82f6' : '#1e293b'}`, borderRadius: 16,
            cursor: 'pointer', background: '#0f1117', padding: 32, textAlign: 'center',
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="22" height="22" fill="none" stroke="#475569" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{file ? file.name : 'Importer un rapport PDF'}</p>
            <p style={{ color: '#475569', fontSize: 13 }}>Rapport Medtronic CareLink (.pdf) — toutes tailles</p>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} style={{ display: 'none' }} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #1a1f2e', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>{loadingStep}</p>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14 }}>
            <p style={{ color: '#f87171', fontSize: 14, marginBottom: 8 }}>{error}</p>
            <button onClick={() => { setError(null); setFile(null); }} style={{ background: 'none', border: '1px solid #374151', borderRadius: 8, color: '#94a3b8', fontSize: 13, padding: '7px 14px' }}>Réessayer</button>
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Bandeau persistance */}
            {!file && (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '8px 14px' }}>
                <p style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>✓ Données persistantes — dernier rapport chargé</p>
              </div>
            )}

            {/* Header card */}
            <div style={{ ...C.cardPad }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  {result.patient_name && <p style={{ color: '#475569', fontSize: 12, marginBottom: 4 }}>{result.patient_name}</p>}
                  <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>{result.period}</p>
                  {result.pump_model && (
                    <p style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
                      {result.pump_model}{result.serial_number ? ` (${result.serial_number})` : ''}
                    </p>
                  )}
                </div>
                <span style={{
                  background: `${STATUS_COLOR[result.status] ?? '#94a3b8'}15`,
                  color: STATUS_COLOR[result.status] ?? '#94a3b8',
                  border: `1px solid ${STATUS_COLOR[result.status] ?? '#94a3b8'}30`,
                  borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                }}>
                  {result.status}
                </span>
              </div>
              {result.next_steps && (
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, borderTop: '1px solid #1a1f2e', paddingTop: 10 }}>{result.next_steps}</p>
              )}
              {/* TIR quick bar */}
              {s?.time_in_range != null && (
                <div style={{ marginTop: 12 }}>
                  <TIRBar above={s.time_above} inRange={s.time_in_range} below={s.time_below} />
                  <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                    {s.time_above != null && <span style={{ color: '#f59e0b', fontSize: 12 }}>{s.time_above}% &gt;180</span>}
                    {s.time_in_range != null && <span style={{ color: '#22c55e', fontSize: 12 }}>{s.time_in_range}% cible</span>}
                    {s.time_below != null && <span style={{ color: '#ef4444', fontSize: 12 }}>{s.time_below}% &lt;70</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs navigation */}
            <div style={{ display: 'flex', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: 4, gap: 2, flexWrap: 'wrap' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  flex: 1, minWidth: 70, padding: '9px 6px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 600,
                  background: activeTab === tab.key ? '#1e293b' : 'transparent',
                  color: activeTab === tab.key ? '#e2e8f0' : '#4b5563', cursor: 'pointer',
                }}>{tab.label}</button>
              ))}
            </div>

            {/* ═══ ONGLET : Résumé ═══ */}
            {activeTab === 'summary' && (
              <div style={C.section}>
                <div style={C.grid2}>
                  <StatCard label="Temps dans cible" value={s?.time_in_range} unit="%" good={v=>v>=70} warn={v=>v>=50} target="≥ 70%" />
                  <StatCard label="GMI" value={s?.gmi} unit="%" good={v=>v<=7} warn={v=>v<=8} target="< 7%" />
                  <StatCard label="Glucose moyen" value={s?.avg_glucose} unit="mg/dL" good={v=>v<=154} warn={v=>v<=183} subtitle={s?.glucose_sd ? `± ${s.glucose_sd} mg/dL` : null} />
                  <StatCard label="CV" value={s?.cv} unit="%" good={v=>v<=36} warn={v=>v<=40} target="≤ 36%" />
                </div>

                {/* TIR chart */}
                {s && (s.time_above != null || s.time_in_range != null) && (
                  <div style={C.cardPad}>
                    <SectionTitle>Durée dans les plages</SectionTitle>
                    <TIRChart summary={s} />
                  </div>
                )}

                {/* Key findings */}
                {result.key_findings?.length > 0 && (
                  <div style={C.cardPad}>
                    <SectionTitle>Observations clés</SectionTitle>
                    {result.key_findings.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 6 }} />
                        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{f}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comparaison périodes */}
                {result.period_comparison && (
                  <div style={C.cardPad}>
                    <SectionTitle>Évolution entre les périodes</SectionTitle>
                    <div style={C.grid2}>
                      <div style={{ background: '#1a1f2e', borderRadius: 10, padding: 12 }}>
                        <p style={{ ...C.label, marginBottom: 4 }}>Période A (récente)</p>
                        <p style={{ color: '#e2e8f0', fontSize: 13 }}>{result.period_comparison.periodA.start} — {result.period_comparison.periodA.end}</p>
                      </div>
                      <div style={{ background: '#1a1f2e', borderRadius: 10, padding: 12 }}>
                        <p style={{ ...C.label, marginBottom: 4 }}>Période B (précédente)</p>
                        <p style={{ color: '#e2e8f0', fontSize: 13 }}>{result.period_comparison.periodB.start} — {result.period_comparison.periodB.end}</p>
                      </div>
                    </div>
                    <div style={{ ...C.grid4, marginTop: 12 }}>
                      {Object.entries(result.period_comparison.trends ?? {}).map(([key, trend]) => (
                        <div key={key} style={{ textAlign: 'center', background: '#1a1f2e', borderRadius: 10, padding: 10 }}>
                          <p style={{ ...C.label, marginBottom: 4 }}>{key === 'gmi' ? 'GMI' : key === 'sensor_wear' ? 'Capteur' : key === 'smartguard' ? 'SmartGuard' : key === 'cv' ? 'CV' : key}</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <TrendArrow direction={trend.direction} />
                            <span style={{ color: trend.direction === 'amélioration' ? '#22c55e' : trend.direction === 'dégradation' ? '#ef4444' : '#64748b', fontWeight: 700, fontSize: 14 }}>
                              {trend.change > 0 ? '+' : ''}{trend.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ONGLET : Glucose ═══ */}
            {activeTab === 'glucose' && (
              <div style={C.section}>
                <div style={C.grid2}>
                  <StatCard label="Temps > 180" value={s?.time_above} unit="%" good={v=>v<=25} warn={v=>v<=50} target="< 25%" />
                  <StatCard label="Temps < 70" value={s?.time_below} unit="%" good={v=>v<=4} warn={v=>v<=10} target="< 4%" />
                  <StatCard label="Port capteur" value={s?.sensor_wear} unit="%" good={v=>v>=70} warn={v=>v>=50} target="≥ 70%" />
                  <StatCard label="Alertes hypo/j" value={result.glucose_alerts?.low_per_day?.toFixed(1)} />
                </div>

                {/* Tendances */}
                {(result.hyperglycemia_patterns?.length > 0 || result.hypoglycemia_patterns?.length > 0) && (
                  <div style={C.grid2}>
                    {result.hyperglycemia_patterns?.length > 0 && (
                      <div style={C.cardPad}>
                        <SectionTitle>Hyperglycémies ({result.hyper_count})</SectionTitle>
                        {result.hyperglycemia_patterns.map((p, i) => (
                          <div key={i} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: 13 }}>{p.time_slot}</span>
                              {p.occurrences && <Badge color="#f59e0b">{p.occurrences}×</Badge>}
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.4 }}>{p.probable_cause}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.hypoglycemia_patterns?.length > 0 && (
                      <div style={C.cardPad}>
                        <SectionTitle>Hypoglycémies ({result.hypo_count})</SectionTitle>
                        {result.hypoglycemia_patterns.map((p, i) => (
                          <div key={i} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ color: '#f87171', fontWeight: 600, fontSize: 13 }}>{p.time_slot}</span>
                              {p.occurrences && <Badge color="#ef4444">{p.occurrences}×</Badge>}
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.4 }}>{p.probable_cause}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={C.cardPad}>
                  <SectionTitle>Analyse du capteur</SectionTitle>
                  <p style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{result.sensor_analysis?.comment}</p>
                  <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{result.sensor_analysis?.impact}</p>
                </div>
              </div>
            )}

            {/* ═══ ONGLET : Insuline ═══ */}
            {activeTab === 'insulin' && (
              <div style={C.section}>
                <div style={C.grid2}>
                  <StatCard label="Dose totale / jour" value={s?.total_daily_insulin?.toFixed(1)} unit="U/j" />
                  <StatCard label="Basal" value={s?.basal_amount?.toFixed(1)} unit="U/j" subtitle={s?.basal_ratio ? `${s.basal_ratio}%` : null} />
                  <StatCard label="Bolus" value={s?.bolus_amount?.toFixed(1)} unit="U/j" subtitle={s?.bolus_ratio ? `${s.bolus_ratio}%` : null} />
                  <StatCard label="Correction auto" value={s?.auto_correction?.toFixed(1)} unit="U/j" subtitle={s?.auto_correction_pct ? `${s.auto_correction_pct}%` : null} />
                </div>

                <div style={C.grid2}>
                  <div style={C.cardPad}>
                    <SectionTitle>Distribution insuline</SectionTitle>
                    <InsDistChart basal_ratio={s?.basal_ratio} bolus_ratio={s?.bolus_ratio} />
                  </div>
                  <div style={C.cardPad}>
                    <SectionTitle>Résumé des repas</SectionTitle>
                    <div style={C.grid2}>
                      <StatCard label="Glucides/j" value={s?.avg_daily_carbs} unit="g" subtitle={s?.carbs_sd ? `± ${s.carbs_sd}g` : null} />
                      <StatCard label="Repas/j" value={s?.meals_per_day?.toFixed(1)} />
                    </div>
                    {['breakfast', 'lunch', 'dinner', 'overnight'].map(key => {
                      const m = result.meal_summary?.[key];
                      const labels = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', dinner: 'Dîner', overnight: 'Nuit' };
                      if (!m) return null;
                      return (
                        <div key={key} style={{ background: '#1a1f2e', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                          <p style={{ ...C.label, marginBottom: 4 }}>{labels[key]}</p>
                          <p style={{ color: '#e2e8f0', fontSize: 13 }}>{m.avg_carbs}g · {m.avg_insulin}U</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {result.basal_profile?.length > 0 && (
                  <div style={C.cardPad}>
                    <SectionTitle>Profil basal programmé</SectionTitle>
                    <BasalChart profile={result.basal_profile} />
                  </div>
                )}
              </div>
            )}

            {/* ═══ ONGLET : SmartGuard ═══ */}
            {activeTab === 'smartguard' && (
              <div style={C.section}>
                <div style={C.grid2}>
                  <StatCard label="SmartGuard actif" value={s?.smartguard_pct} unit="%" good={v=>v>=70} warn={v=>v>=50} />
                  <StatCard label="Mode manuel" value={s?.mode_manuel_pct} unit="%" good={v=>v<=30} warn={v=>v<=50} />
                  <StatCard label="Objectif SmartGuard" value={result.pump_settings?.smartguard_target} unit="mg/dL" />
                  <StatCard label="Admin max atteint" value={result.smartguard_exits?.admin_max} unit="fois" good={v=>v===0} warn={()=>false} />
                </div>

                <div style={C.cardPad}>
                  <SectionTitle>Sorties SmartGuard</SectionTitle>
                  {result.smartguard_exits && <SGExitsChart exits={result.smartguard_exits} />}
                </div>

                <div style={C.cardPad}>
                  <SectionTitle>Analyse SmartGuard</SectionTitle>
                  <p style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.6 }}>{result.smartguard_analysis?.comment}</p>
                </div>
              </div>
            )}

            {/* ═══ ONGLET : Conseils ═══ */}
            {activeTab === 'recommendations' && (
              <div style={C.section}>
                {result.recommendations?.map((rec, i) => (
                  <div key={i} style={{ ...C.cardPad, borderLeft: `3px solid ${PRIORITY_COLOR[rec.priority] ?? '#64748b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ ...C.label }}>{rec.category}</span>
                      <Badge color={PRIORITY_COLOR[rec.priority]}>{rec.priority}</Badge>
                    </div>
                    <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, marginBottom: rec.current_value || rec.suggested_value ? 10 : 0 }}>{rec.explanation}</p>
                    {(rec.current_value || rec.suggested_value) && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {rec.current_value && <span style={{ background: '#1a1f2e', color: '#6b7280', fontSize: 12, padding: '4px 10px', borderRadius: 8 }}>Actuel : {rec.current_value}</span>}
                        {rec.suggested_value && <span style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: 12, padding: '4px 10px', borderRadius: 8 }}>Cible : {rec.suggested_value}</span>}
                      </div>
                    )}
                  </div>
                ))}

                {result.positive_points?.length > 0 && (
                  <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14, padding: 16 }}>
                    <p style={{ color: '#4ade80', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Points positifs</p>
                    {result.positive_points.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: 6 }} />
                        <p style={{ color: '#86efac', fontSize: 13, lineHeight: 1.5 }}>{p}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ ONGLET : Réglages ═══ */}
            {activeTab === 'settings' && (
              <div style={C.section}>
                <div style={C.grid2}>
                  {/* Réglages pompe */}
                  <div style={C.cardPad}>
                    <SectionTitle>Réglages pompe</SectionTitle>
                    {[
                      ['SmartGuard', result.pump_settings?.smartguard_enabled ? '✓ Activé' : '✗ Désactivé'],
                      ['Correction auto', result.pump_settings?.auto_correction_enabled ? '✓ Activé' : '✗ Désactivé'],
                      ['Bolus max', result.pump_settings?.max_bolus ? `${result.pump_settings.max_bolus} U` : null],
                      ['Débit basal max', result.pump_settings?.max_basal_rate ? `${result.pump_settings.max_basal_rate} U/h` : null],
                      ['Durée insuline active', result.pump_settings?.insulin_duration],
                      ['Incrément bolus', result.pump_settings?.bolus_increment ? `${result.pump_settings.bolus_increment} U` : null],
                      ['Basal 24h programmé', result.pump_settings?.programmed_24h_basal ? `${result.pump_settings.programmed_24h_basal} U` : null],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label} style={C.row}>
                        <span style={{ color: '#64748b', fontSize: 13 }}>{label}</span>
                        <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Seuils alertes */}
                  <div style={C.cardPad}>
                    <SectionTitle>Seuils d'alerte</SectionTitle>
                    {[
                      ['Seuil hypo', `${result.alert_settings?.hypo_threshold ?? 70} mg/dL`, '#f87171'],
                      ['Seuil hyper', `${result.alert_settings?.hyper_threshold ?? 200} mg/dL`, '#fbbf24'],
                      ['Hypo urgente', `${result.alert_settings?.urgent_low ?? 55} mg/dL`, '#ef4444'],
                      ['Rappel hyper', result.alert_settings?.hyper_reminder_enabled ? '✓ Activé' : '✗ Désactivé', null],
                      ['Rappel hypo', result.alert_settings?.hypo_reminder_enabled ? '✓ Activé' : '✗ Désactivé', null],
                    ].map(([label, value, color]) => (
                      <div key={label} style={C.row}>
                        <span style={{ color: '#64748b', fontSize: 13 }}>{label}</span>
                        <span style={{ color: color ?? '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ratios glucides/insuline */}
                {result.carb_ratios?.length > 0 && (
                  <div style={C.cardPad}>
                    <SectionTitle>Ratios glucides/insuline</SectionTitle>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {result.carb_ratios.map((r, i) => (
                        <div key={i} style={{ background: '#1a1f2e', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
                          <p style={{ color: '#475569', fontSize: 11, marginBottom: 4 }}>{r.time}</p>
                          <p style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>{r.ratio} g/U</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sensibilité insuline */}
                {result.insulin_sensitivity?.length > 0 && (
                  <div style={C.cardPad}>
                    <SectionTitle>Sensibilité à l'insuline</SectionTitle>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {result.insulin_sensitivity.map((s, i) => (
                        <div key={i} style={{ background: '#1a1f2e', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 80 }}>
                          <p style={{ color: '#475569', fontSize: 11, marginBottom: 4 }}>{s.time}</p>
                          <p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700 }}>{s.factor} mg/dL/U</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Utilisation */}
                <div style={C.cardPad}>
                  <SectionTitle>Utilisation</SectionTitle>
                  <div style={C.grid2}>
                    {result.usage?.bg_readings_per_day && <StatCard label="Glycémies/j" value={result.usage.bg_readings_per_day.toFixed(1)} />}
                    {result.usage?.bolus_with_meal_per_day && <StatCard label="Bolus repas/j" value={result.usage.bolus_with_meal_per_day.toFixed(1)} />}
                    {result.usage?.cannula_primes && <StatCard label="Purges canule" value={result.usage.cannula_primes} />}
                    {result.usage?.tubing_primes && <StatCard label="Purges tubulure" value={result.usage.tubing_primes} />}
                  </div>
                  {result.catheter_replacement && (
                    <div style={{ marginTop: 10, background: '#1a1f2e', borderRadius: 8, padding: '10px 12px' }}>
                      <p style={{ color: '#64748b', fontSize: 13 }}>
                        Cathéter : <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{result.catheter_replacement.catheter_days}j</span>
                        {result.catheter_replacement.reservoir_days && <> · Réservoir : <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{result.catheter_replacement.reservoir_days}j</span></>}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Avertissement médical */}
            <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: '#6b7280', fontSize: 11, lineHeight: 1.5 }}>
                ⚕️ Analyse indicative — ajustements de débit basal et sensibilité à valider avec votre diabétologue.
              </p>
            </div>

            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} style={{ display: 'none' }} />
          </div>
        )}
      </div>
    </Layout>
  );
}