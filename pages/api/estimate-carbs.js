// DIABIA — API /estimate-carbs : photo repas → glucides via Gemini Vision
import { createLogger } from '../../lib/logger';
import { callGemini, extractJSON } from '../../lib/gemini';

const log = createLogger('API:estimate-carbs');
export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

export default async function handler(req, res) {
  log.separator();
  log.group('POST /api/estimate-carbs');
  log.info('Requête reçue', { method: req.method, contentType: req.headers['content-type'] });

  if (req.method !== 'POST') {
    log.warn('Méthode non autorisée', req.method);
    log.groupEnd();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image_base64, mime_type } = req.body;
  log.debug('Payload reçu', {
    hasImage: !!image_base64,
    imageSize: image_base64 ? `${Math.round(image_base64.length * 0.75 / 1024)}KB` : 'N/A',
    mimeType: mime_type,
  });

  if (!image_base64) {
    log.error('Image manquante dans le body');
    log.groupEnd();
    return res.status(400).json({ error: 'Image manquante' });
  }

  try {
    const prompt = `Tu es un expert en nutrition clinique et en diabétologie. Analyse cette photo de repas avec précision.

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour :
{
  "total_carbs": <entier, grammes totaux de glucides>,
  "margin": <entier, marge d'erreur en grammes>,
  "glycemic_index": "<faible|moyen|élevé>",
  "foods": [
    {
      "name": "<aliment en français>",
      "quantity": "<quantité estimée>",
      "carbs": <entier>,
      "glycemic_index": "<faible|moyen|élevé>"
    }
  ],
  "bolus_suggestion": {
    "dose_3_5": <dose pour ratio 3.5g/U, arrondi 0.5>,
    "dose_4_5": <dose pour ratio 4.5g/U, arrondi 0.5>,
    "dose_3_0": <dose pour ratio 3.0g/U, arrondi 0.5>
  },
  "absorption_speed": "<rapide|modérée|lente>",
  "advice": "<conseil pratique court pour diabétique type 1 sous pompe à insuline>"
}`;

    log.info('Envoi image à Gemini pour analyse nutritionnelle');
    const rawContent = await callGemini({ prompt, imageBase64: image_base64, mimeType: mime_type });
    const result = extractJSON(rawContent);

    log.info('Analyse nutritionnelle réussie', {
      totalCarbs: result.total_carbs,
      foodsCount: result.foods?.length,
      glycemicIndex: result.glycemic_index,
      absorptionSpeed: result.absorption_speed,
    });

    log.groupEnd();
    return res.status(200).json(result);

  } catch (err) {
    log.error('Erreur lors de l\'analyse', { message: err.message, stack: err.stack });
    log.groupEnd();
    return res.status(500).json({ error: err.message });
  }
}
