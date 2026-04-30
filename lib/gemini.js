// DIABIA — Client Gemini centralisé
import { createLogger } from './logger';

const log = createLogger('GeminiClient');

export async function callGemini({ prompt, imageBase64, mimeType, temperature = 0.2 }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    log.error('GEMINI_API_KEY manquante dans les variables d\'environnement');
    throw new Error('Clé Gemini non configurée');
  }

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const parts = [];
  if (imageBase64) {
    log.debug('Ajout image dans la requête', { mimeType, size: `${Math.round(imageBase64.length * 0.75 / 1024)}KB` });
    parts.push({ inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: { temperature, maxOutputTokens: 2048 },
  };

  log.info(`Appel Gemini (${model})`, { promptLength: prompt.length, hasImage: !!imageBase64 });
  const t0 = Date.now();

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const elapsed = Date.now() - t0;
  log.info(`Réponse Gemini reçue`, { status: res.status, duration: `${elapsed}ms` });

  if (!res.ok) {
    const errText = await res.text();
    log.error('Erreur API Gemini', { status: res.status, body: errText });
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    log.error('Réponse Gemini vide ou inattendue', data);
    throw new Error("Pas de contenu dans la réponse Gemini");
  }

  log.debug('Contenu brut Gemini', content.substring(0, 200) + (content.length > 200 ? '...' : ''));
  return content;
}

export function extractJSON(text) {
  const log = createLogger('JSONExtractor');
  log.debug('Extraction JSON depuis texte', { length: text.length });
  
  // Essai 1 : JSON direct
  try {
    const parsed = JSON.parse(text.trim());
    log.debug('JSON parsé directement');
    return parsed;
  } catch {}

  // Essai 2 : extraction par regex
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      log.debug('JSON extrait par regex');
      return parsed;
    } catch (e) {
      log.warn('Regex match trouvé mais JSON invalide', e.message);
    }
  }

  log.error('Impossible d\'extraire un JSON valide', text.substring(0, 300));
  throw new Error('Format de réponse invalide (pas de JSON trouvé)');
}
