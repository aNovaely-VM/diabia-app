// DIABIA — Page estimation glucides par photo
import { useState, useRef } from 'react';
import Layout from '../components/Layout';

const GI_COLOR = { faible: '#22c55e', moyen: '#f59e0b', élevé: '#ef4444' };
const SPEED_LABEL = { rapide: 'Absorption rapide', modérée: 'Absorption modérée', lente: 'Absorption lente' };

export default function Carbs() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customRatio, setCustomRatio] = useState('');
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const res = await fetch('/api/estimate-carbs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64, mime_type: image.type }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResult(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(image);
  };

  const reset = () => {
    setImage(null);
    setImageUrl(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const ratio = parseFloat(customRatio) || 3.5;
  const customDose = result ? Math.round((result.total_carbs / ratio) * 2) / 2 : null;

  return (
    <Layout title="Glucides">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Estimation glucides</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Photographiez votre repas pour obtenir une estimation précise.</p>
        </div>

        {/* Upload */}
        {!result && !loading && (
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: `1.5px dashed ${imageUrl ? '#3b82f6' : '#1e293b'}`,
              borderRadius: 16, cursor: 'pointer',
              background: '#0f1117', overflow: 'hidden',
              minHeight: imageUrl ? 'auto' : 180,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {imageUrl
              ? <img src={imageUrl} alt="Repas" style={{ width: '100%', maxHeight: 280, objectFit: 'cover' }} />
              : (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <svg width="22" height="22" fill="none" stroke="#475569" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15, marginBottom: 5 }}>Ajouter une photo</p>
                  <p style={{ color: '#475569', fontSize: 13 }}>Appareil photo ou galerie</p>
                </div>
              )
            }
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: 'none' }} />
          </div>
        )}

        {/* Ratio personnalisé */}
        {imageUrl && !result && !loading && (
          <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ color: '#94a3b8', fontSize: 13, flex: 1 }}>Votre ratio glucides (g/U)</p>
            <input
              type="number"
              placeholder="3.5"
              value={customRatio}
              onChange={(e) => setCustomRatio(e.target.value)}
              style={{
                width: 70, background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 8,
                color: '#e2e8f0', fontSize: 15, padding: '6px 10px', textAlign: 'center',
              }}
            />
          </div>
        )}

        {imageUrl && !result && !loading && (
          <button onClick={analyze} style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white', border: 'none', borderRadius: 14,
            padding: '15px', fontSize: 15, fontWeight: 600,
            WebkitTapHighlightColor: 'transparent',
          }}>
            Analyser le repas
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="fade-up" style={{ textAlign: 'center', padding: '30px 0' }}>
            {imageUrl && <img src={imageUrl} alt="" style={{ width: '100%', borderRadius: 14, maxHeight: 200, objectFit: 'cover', opacity: 0.5, marginBottom: 24 }} />}
            <div style={{ width: 40, height: 40, border: '3px solid #1a1f2e', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Analyse en cours…</p>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px' }}>
            <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>
            <button onClick={reset} style={{ marginTop: 10, background: 'none', border: '1px solid #374151', borderRadius: 8, color: '#94a3b8', fontSize: 13, padding: '7px 14px' }}>Réessayer</button>
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {imageUrl && <img src={imageUrl} alt="" style={{ width: '100%', borderRadius: 14, maxHeight: 220, objectFit: 'cover' }} />}

            {/* Total */}
            <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Glucides estimés</p>
              <p style={{ fontSize: 56, fontWeight: 800, color: '#f1f5f9', lineHeight: 1, marginBottom: 4 }}>
                {result.total_carbs}<span style={{ fontSize: 22, fontWeight: 500, color: '#64748b' }}>g</span>
              </p>
              <p style={{ color: '#475569', fontSize: 13 }}>± {result.margin}g</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                {result.glycemic_index && (
                  <span style={{ background: `${GI_COLOR[result.glycemic_index]}18`, color: GI_COLOR[result.glycemic_index], border: `1px solid ${GI_COLOR[result.glycemic_index]}30`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                    IG {result.glycemic_index}
                  </span>
                )}
                {result.absorption_speed && (
                  <span style={{ background: '#1a1f2e', color: '#94a3b8', borderRadius: 20, padding: '4px 12px', fontSize: 12 }}>
                    {SPEED_LABEL[result.absorption_speed]}
                  </span>
                )}
              </div>
            </div>

            {/* Bolus */}
            {result.bolus_suggestion && (
              <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '16px' }}>
                <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Bolus repas suggéré</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: customRatio ? 8 : 0 }}>
                  {[['3.0', result.bolus_suggestion.dose_3_0], ['3.5', result.bolus_suggestion.dose_3_5], ['4.5', result.bolus_suggestion.dose_4_5]].map(([r, d]) => (
                    <div key={r} style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                      <p style={{ color: '#475569', fontSize: 11, marginBottom: 4 }}>Ratio {r}</p>
                      <p style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>{d}<span style={{ fontSize: 12, color: '#6b7280' }}>U</span></p>
                    </div>
                  ))}
                </div>
                {customRatio && customDose && (
                  <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 12px', textAlign: 'center', marginTop: 8 }}>
                    <p style={{ color: '#93c5fd', fontSize: 12, marginBottom: 3 }}>Votre ratio ({ratio} g/U)</p>
                    <p style={{ color: '#60a5fa', fontSize: 24, fontWeight: 800 }}>{customDose}<span style={{ fontSize: 14, fontWeight: 400 }}>U</span></p>
                  </div>
                )}
                <p style={{ color: '#374151', fontSize: 11, marginTop: 10 }}>Ces suggestions sont indicatives. Adaptez selon votre glycémie actuelle.</p>
              </div>
            )}

            {/* Détail */}
            <div style={{ background: '#0f1117', border: '1px solid #1a1f2e', borderRadius: 16, padding: '16px' }}>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Détail par aliment</p>
              {result.foods?.map((food, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < result.foods.length - 1 ? '1px solid #1a1f2e' : 'none' }}>
                  <div>
                    <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{food.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ color: '#4b5563', fontSize: 12 }}>{food.quantity}</p>
                      {food.glycemic_index && <span style={{ color: GI_COLOR[food.glycemic_index], fontSize: 11 }}>IG {food.glycemic_index}</span>}
                    </div>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 17, fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>{food.carbs}g</span>
                </div>
              ))}
            </div>

            {/* Conseil */}
            {result.advice && (
              <div style={{ background: '#0f1117', border: '1px solid #1e293b', borderRadius: 14, padding: '14px' }}>
                <p style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Conseil clinique</p>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{result.advice}</p>
              </div>
            )}

            <button onClick={reset} style={{ background: '#0f1117', border: '1px solid #1a1f2e', color: '#64748b', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 500 }}>
              Nouvelle analyse
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
