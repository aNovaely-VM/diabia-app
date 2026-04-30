import { useState, useRef } from 'react';
import Head from 'next/head';

const S = {
  page: { minHeight: '100vh', minHeight: '100dvh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 40px' },
  inner: { width: '100%', maxWidth: 480, padding: '0 16px' },

  // Header
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 24px', position: 'sticky', top: 0, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(12px)', zIndex: 10, width: '100%', maxWidth: 480 },
  logo: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'white' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 1 },

  // Upload
  uploadZone: (hasImage) => ({
    border: `2px dashed ${hasImage ? '#3b82f6' : '#374151'}`,
    borderRadius: 20,
    padding: hasImage ? 6 : 48,
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: 12,
    background: '#111827',
    transition: 'border-color 0.2s',
    minHeight: hasImage ? 'auto' : 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
  }),
  uploadImg: { width: '100%', borderRadius: 16, maxHeight: 300, objectFit: 'cover' },
  uploadIcon: { fontSize: 56, marginBottom: 14 },
  uploadText: { color: '#e5e7eb', fontWeight: 600, fontSize: 16, marginBottom: 6 },
  uploadSub: { color: '#6b7280', fontSize: 13 },

  // Bouton principal
  btn: (disabled) => ({
    width: '100%',
    background: disabled ? '#1e3a5f' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    padding: '16px 0',
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 14,
    opacity: disabled ? 0.7 : 1,
    transition: 'opacity 0.2s',
    WebkitTapHighlightColor: 'transparent',
    letterSpacing: '0.3px',
  }),

  // Reset
  btnReset: { width: '100%', background: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 600, marginTop: 8, WebkitTapHighlightColor: 'transparent' },

  // Error
  error: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 14, padding: '14px 16px', marginBottom: 14, color: '#fca5a5', fontSize: 14, lineHeight: 1.5 },

  // Cards résultats
  cardTotal: { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 18, padding: '22px 16px', textAlign: 'center', marginBottom: 10 },
  cardTotalLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 8 },
  cardTotalValue: { color: '#60a5fa', fontSize: 52, fontWeight: 800, lineHeight: 1, marginBottom: 4 },
  cardTotalMargin: { color: '#6b7280', fontSize: 12 },

  cardBolus: { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 18, padding: '16px', marginBottom: 10 },
  cardBolusTitle: { color: '#86efac', fontWeight: 700, fontSize: 13, marginBottom: 8 },
  cardBolusValue: { color: 'white', fontSize: 30, fontWeight: 800, marginBottom: 4 },
  cardBolusNote: { color: '#6b7280', fontSize: 12, lineHeight: 1.4 },

  cardFoods: { background: '#111827', borderRadius: 18, padding: 16, marginBottom: 10 },
  cardFoodsTitle: { color: '#9ca3af', fontSize: 13, fontWeight: 600, marginBottom: 10 },
  foodItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', borderRadius: 12, padding: '11px 14px', marginBottom: 7 },
  foodName: { color: 'white', fontSize: 14, fontWeight: 500, marginBottom: 2 },
  foodQty: { color: '#6b7280', fontSize: 12 },
  foodCarbs: { color: '#93c5fd', fontWeight: 700, fontSize: 17 },

  cardAdvice: { background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 18, padding: '16px', marginBottom: 10 },
  cardAdviceTitle: { color: '#fbbf24', fontWeight: 700, fontSize: 13, marginBottom: 8 },
  cardAdviceText: { color: '#d1d5db', fontSize: 14, lineHeight: 1.6 },

  // Loading
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 16 },
  loadingSpinner: { width: 48, height: 48, border: '4px solid #1f2937', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#9ca3af', fontSize: 15 },
};

export default function Home() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  return (
    <>
      <Head>
        <title>DIABIA — Estimation glucides</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Prends en photo ton repas et obtiens une estimation précise des glucides" />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .fade-in { animation: fadeIn 0.3s ease; }
        `}</style>
      </Head>

      <div style={S.page}>
        {/* Header sticky */}
        <div style={S.header}>
          <div style={S.logo}>🩺</div>
          <div>
            <div style={S.title}>DIABIA</div>
            <div style={S.subtitle}>Estimation des glucides par IA</div>
          </div>
        </div>

        <div style={S.inner}>
          {/* Zone upload — masquée si résultat */}
          {!result && !loading && (
            <>
              <div style={S.uploadZone(!!imageUrl)} onClick={() => fileRef.current.click()}>
                {imageUrl ? (
                  <img src={imageUrl} alt="Repas" style={S.uploadImg} />
                ) : (
                  <>
                    <div style={S.uploadIcon}>📸</div>
                    <p style={S.uploadText}>Photo de ton repas</p>
                    <p style={S.uploadSub}>Appuie pour ouvrir l'appareil photo</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: 'none' }} />
              </div>

              {imageUrl && (
                <button onClick={analyze} style={S.btn(false)}>
                  🔍 Analyser les glucides
                </button>
              )}

              {!imageUrl && (
                <button onClick={() => fileRef.current.click()} style={S.btn(false)}>
                  📸 Prendre une photo
                </button>
              )}
            </>
          )}

          {/* Loading */}
          {loading && (
            <div style={S.loadingWrap} className="fade-in">
              {imageUrl && <img src={imageUrl} alt="Repas" style={{ ...S.uploadImg, marginBottom: 20, opacity: 0.6 }} />}
              <div style={S.loadingSpinner} />
              <p style={S.loadingText}>Gemini analyse ton repas…</p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div style={S.error} className="fade-in">
              ⚠️ {error}
              <button onClick={reset} style={{ ...S.btnReset, marginTop: 10 }}>Réessayer</button>
            </div>
          )}

          {/* Résultats */}
          {result && (
            <div className="fade-in">
              {imageUrl && <img src={imageUrl} alt="Repas" style={{ ...S.uploadImg, marginBottom: 12 }} />}

              {/* Total glucides */}
              <div style={S.cardTotal}>
                <p style={S.cardTotalLabel}>Glucides estimés</p>
                <p style={S.cardTotalValue}>{result.total_carbs}<span style={{ fontSize: 24, fontWeight: 600 }}>g</span></p>
                <p style={S.cardTotalMargin}>± {result.margin}g d'incertitude</p>
              </div>

              {/* Bolus suggéré */}
              {result.bolus_suggestion && (
                <div style={S.cardBolus}>
                  <p style={S.cardBolusTitle}>💉 Bolus repas suggéré</p>
                  <p style={S.cardBolusValue}>{result.bolus_suggestion.dose} <span style={{ fontSize: 16, fontWeight: 400, color: '#86efac' }}>unités</span></p>
                  <p style={S.cardBolusNote}>Basé sur un ratio de {result.bolus_suggestion.ratio} g/U — adapte à ton ratio personnel</p>
                </div>
              )}

              {/* Détail aliments */}
              {result.foods?.length > 0 && (
                <div style={S.cardFoods}>
                  <p style={S.cardFoodsTitle}>🍽️ Détail par aliment</p>
                  {result.foods.map((food, i) => (
                    <div key={i} style={{ ...S.foodItem, marginBottom: i < result.foods.length - 1 ? 7 : 0 }}>
                      <div>
                        <p style={S.foodName}>{food.name}</p>
                        <p style={S.foodQty}>{food.quantity}</p>
                      </div>
                      <span style={S.foodCarbs}>{food.carbs}g</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Conseil DIABIA */}
              {result.advice && (
                <div style={S.cardAdvice}>
                  <p style={S.cardAdviceTitle}>💡 Conseil DIABIA</p>
                  <p style={S.cardAdviceText}>{result.advice}</p>
                </div>
              )}

              <button onClick={reset} style={S.btnReset}>📸 Analyser un autre repas</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
