import React, { useState, useRef } from 'react';

export default function CarbEstimator() {
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
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await fetch('/api/estimate-carbs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64, mime_type: image.type }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResult(data);
        setLoading(false);
      };
      reader.readAsDataURL(image);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-xl">🩺</div>
          <div>
            <h1 className="text-2xl font-bold text-white">DIABIA</h1>
            <p className="text-gray-400 text-sm">Estimation des glucides</p>
          </div>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-gray-600 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors mb-4"
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Repas" className="w-full rounded-xl object-cover max-h-64" />
          ) : (
            <div className="py-8">
              <div className="text-5xl mb-3">📸</div>
              <p className="text-gray-300 font-medium">Prends en photo ton repas</p>
              <p className="text-gray-500 text-sm mt-1">ou clique pour choisir une image</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />
        </div>

        {imageUrl && (
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors mb-6"
          >
            {loading ? '⏳ Analyse en cours...' : '🔍 Analyser les glucides'}
          </button>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-500 rounded-xl p-4 mb-4 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {result && (
          <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
            {/* Total */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-1">Glucides estimés</p>
              <p className="text-4xl font-bold text-blue-400">{result.total_carbs}g</p>
              <p className="text-gray-500 text-xs mt-1">± {result.margin}g</p>
            </div>

            {/* Bolus suggestion */}
            {result.bolus_suggestion && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 font-semibold text-sm mb-1">💉 Bolus suggéré</p>
                <p className="text-white font-bold text-xl">{result.bolus_suggestion.dose}U</p>
                <p className="text-gray-400 text-xs">Basé sur ton ratio actuel de {result.bolus_suggestion.ratio}g/U</p>
              </div>
            )}

            {/* Détail aliments */}
            <div>
              <p className="text-gray-400 text-sm font-medium mb-2">Détail par aliment</p>
              <div className="space-y-2">
                {result.foods.map((food, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-white text-sm font-medium">{food.name}</p>
                      <p className="text-gray-500 text-xs">{food.quantity}</p>
                    </div>
                    <p className="text-blue-300 font-semibold">{food.carbs}g</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseil */}
            {result.advice && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-400 text-sm font-semibold mb-1">💡 Conseil DIABIA</p>
                <p className="text-gray-300 text-sm">{result.advice}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
