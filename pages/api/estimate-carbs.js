// DIABIA — API Route Next.js → Gemini Vision

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image_base64, mime_type } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'Image manquante' });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'Clé Gemini non configurée' });

  const prompt = `Tu es un expert en nutrition et en diabétologie. Analyse cette photo de repas et fournis une estimation précise des glucides.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte, sans markdown, sans texte avant ou après :
{
  "total_carbs": <nombre entier en grammes>,
  "margin": <marge d'erreur en grammes>,
  "foods": [
    { "name": "<aliment en français>", "quantity": "<quantité estimée>", "carbs": <glucides entier> }
  ],
  "bolus_suggestion": { "dose": <unités arrondi 0.5, ratio 3.5g/U>, "ratio": 3.5 },
  "advice": "<conseil court pour diabétique type 1>"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mime_type || 'image/jpeg', data: image_base64 } },
              { text: prompt }
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Erreur Gemini: ${err}` });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return res.status(500).json({ error: "Pas de réponse de l'IA" });

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Format invalide', raw: content });

    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
