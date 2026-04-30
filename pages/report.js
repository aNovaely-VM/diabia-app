// DIABIA — Page analyse rapport Medtronic PDF
import { useState, useRef } from 'react';
import Layout from '../components/Layout';

const PRIORITY_COLOR = { haute: '#ef4444', moyenne: '#f59e0b', faible: '#22c55e' };
const STATUS_COLOR = { bon: '#22c55e', moyen: '#f59e0b', critique: '#ef4444' };

function StatRow({ label, value, unit, good, warn }) {
  if (value == null) return null;
  const color = good && warn ? (good(value) ? '#22c55e' : warn(value) ? '#f59e0b' : '#ef4444') : '#94a3b8';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1f2e' }}>
      <p style={{ color: '#64748b', fontSize: 14 }}>{label}</p>
      <p style={{ color, fontSize: 14, fontWeight: 600 }}>{value}{unit}</p>
    </div>
  );
}

export default function Report() {
  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);

    // Lecture du PDF côté client avec pdf.js (CDN)
    setLoadingStep('Lecture du PDF…');
    setLoading(true);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      // Extraction texte via API
      const base64 = btoa(String.fromCharCode(...uint8.slice(0, Math.min(uint8.length, 500000))));
      await analyzeReport(base64, f.name);
    } catch (err) {
      setError('Erreur lecture PDF : ' + err.message);
      setLoading(false);
    }
  };

  const analyzeReport = async (base64OrText, filename) => {
    setLoadingStep('Extraction du texte…');
    try {
      // On envoie le base64 à une route qui extrait le texte puis l'analyse
      const res = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: base64OrText, filename }),
      });
      setLoadingStep('Analyse par l\'IA…');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      // Sauvegarder pour le dashboard
      localStorage.setItem('diabia_last_report', JSON.stringify(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const TABS = [
    { key: 'summary', label: 'Résumé' },
    { key: 'recommendations', label: 'Conseils' },
    { key: 'patterns', label: 'Tendances' },
  ];

  return (
    <Layout title="Rapport">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Analyse de rapport</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Importez votre rapport PDF Medtronic CareLink.</p>
        </div>

        {/* Upload PDF */}
        {!result && !loading && (
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: `1.5px dashed ${file ? '#3b82f6' : '#1e293b'}`,
              borderRadius: 16, cursor: 'pointer', background: '#0f1117',
              padding: 32, textAlign: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="22" height="22" fill="none" stroke="#475569" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15, marginBottom: 5 }}>
              {file ? file.name : 'Importer un rapport PDF'}
            </p>
            <p style={{ color: '#475569', fontSize: 13 }}>Rapport Medtronic CareLink (.pdf)</p>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} style={{ display: 'none' }} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="fade-up" style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #1a1f2e', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>{loadingStep || 'Traitement en cours…'}</p>
            <p style={{ color: '#374151', fontSize: 12, marginTop: 6 }}>Cela peut prendre 10 à 30 secondes</p>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14 }}>
            <p style={{ color: '#f87171', fontSize: 14, marginBottom: 8 }}>{error}</p>
            <button onClick={() => { setError(null); setFile(null); }} style={{ background: 'none', border: '1px solid #374151', borderRadius: 8, color: '#94a3b8', fontSize: 13, padding: '7px 14px', cursor: 'pointer' }}>Réessayer</button>
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Header résultat */}
            <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ color: '#475569', fontSize: 12, marginBottom: 4 }}>Période analysée</p>
                  <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>{result.period}</p>
                </div>
                <span style={{
                  background: `${STATUS_COLOR[result.status]}15`,
                  color: STATUS_COLOR[result.status],
                  border: `1px solid ${STATUS_COLOR[result.status]}30`,
                  borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {result.status}
                </span>
              </div>
              {result.next_steps && (
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, borderTop: '1px solid #1a1f2e', paddingTop: 10 }}>{result.next_steps}</p>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: 4, gap: 2 }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  flex: 1, padding: '9px 8px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600,
                  background: activeTab === tab.key ? '#1e293b' : 'transparent',
                  color: activeTab === tab.key ? '#e2e8f0' : '#4b5563',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Résumé */}
            {activeTab === 'summary' && result.summary && (
              <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '16px' }}>
                <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Statistiques du mois</p>
                <StatRow label="Glycémie moyenne" value={result.summary.avg_glucose} unit=" mg/dL" good={v=>v<=154} warn={v=>v<=183} />
                <StatRow label="GMI" value={result.summary.gmi} unit="%" good={v=>v<=7} warn={v=>v<=8} />
                <StatRow label="Temps dans la cible (70-180)" value={result.summary.time_in_range} unit="%" good={v=>v>=70} warn={v=>v>=50} />
                <StatRow label="Temps au-dessus 180" value={result.summary.time_above} unit="%" good={v=>v<=25} warn={v=>v<=50} />
                <StatRow label="Temps en-dessous 70" value={result.summary.time_below} unit="%" good={v=>v<=4} warn={v=>v<=10} />
                <StatRow label="Port du capteur" value={result.summary.sensor_wear} unit="%" good={v=>v>=70} warn={v=>v>=50} />
                <StatRow label="Coefficient de variation" value={result.summary.cv} unit="%" good={v=>v<=36} warn={v=>v<=40} />
                <StatRow label="Insuline quotidienne totale" value={result.summary.total_daily_insulin} unit=" U" />
                <StatRow label="Part basale" value={result.summary.basal_ratio} unit="%" />
                <StatRow label="Glucides quotidiens moyens" value={result.summary.avg_daily_carbs} unit="g" />
                {result.key_findings?.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1a1f2e' }}>
                    <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Observations clés</p>
                    {result.key_findings.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 6 }} />
                        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.5 }}>{f}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Conseils */}
            {activeTab === 'recommendations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.recommendations?.map((rec, i) => (
                  <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{rec.category}</span>
                      <span style={{ background: `${PRIORITY_COLOR[rec.priority]}15`, color: PRIORITY_COLOR[rec.priority], fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>
                        {rec.priority}
                      </span>
                    </div>
                    <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, marginBottom: rec.current_value || rec.suggested_value ? 10 : 0 }}>{rec.explanation}</p>
                    {(rec.current_value || rec.suggested_value) && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {rec.current_value && <span style={{ background: '#1a1f2e', color: '#6b7280', fontSize: 12, padding: '4px 10px', borderRadius: 8 }}>Actuel : {rec.current_value}</span>}
                        {rec.suggested_value && <span style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: 12, padding: '4px 10px', borderRadius: 8 }}>Suggéré : {rec.suggested_value}</span>}
                      </div>
                    )}
                  </div>
                ))}
                {result.positive_points?.length > 0 && (
                  <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14, padding: '14px' }}>
                    <p style={{ color: '#4ade80', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Points positifs</p>
                    {result.positive_points.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: 7 }} />
                        <p style={{ color: '#86efac', fontSize: 14, lineHeight: 1.5 }}>{p}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Tendances */}
            {activeTab === 'patterns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.hyperglycemia_patterns?.length > 0 && (
                  <>
                    <p style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tendances hyperglycémiques</p>
                    {result.hyperglycemia_patterns.map((p, i) => (
                      <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600 }}>{p.time_slot}</p>
                          <span style={{ color: '#f87171', fontSize: 13 }}>{p.occurrences} fois</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{p.probable_cause}</p>
                      </div>
                    ))}
                  </>
                )}
                {result.sensor_analysis && (
                  <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: '14px' }}>
                    <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Utilisation du capteur</p>
                    <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.5, marginBottom: 6 }}>{result.sensor_analysis.comment}</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{result.sensor_analysis.impact}</p>
                  </div>
                )}
                {result.smartguard_analysis && (
                  <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 14, padding: '14px' }}>
                    <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Analyse SmartGuard</p>
                    <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.5 }}>{result.smartguard_analysis.comment}</p>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => { setResult(null); setFile(null); }} style={{ background: '#0f1117', border: '1px solid #1a1f2e', color: '#64748b', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              Analyser un nouveau rapport
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
