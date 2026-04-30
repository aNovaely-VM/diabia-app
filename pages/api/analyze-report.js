// pages/api/analyze-report.js — fix stack overflow PDF + modèle Gemini
import { createLogger } from '../../lib/logger';
import { callGemini, extractJSON } from '../../lib/gemini';

const log = createLogger('API:analyze-report');
export const config = { api: { bodyParser: { sizeLimit: '25mb' } } };

function extractTextFromPDFBuffer(buffer) {
  const log = createLogger('PDFExtractor');
  log.debug('Extraction texte du PDF', { bufferSize: buffer.length });

  try {
    // IMPORTANT : convertir le buffer par chunks pour éviter le stack overflow
    const CHUNK = 8192;
    let str = '';
    for (let i = 0; i < buffer.length; i += CHUNK) {
      str += Buffer.from(buffer.slice(i, i + CHUNK)).toString('latin1');
    }

    log.debug('Buffer converti en string', { stringLength: str.length });

    let text = '';

    // Extraire les blocs texte PDF (BT...ET)
    const btRegex = /BT([\s\S]*?)ET/g;
    let match;
    let blockCount = 0;
    while ((match = btRegex.exec(str)) !== null) {
      blockCount++;
      const block = match[1];
      const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      let sm;
      while ((sm = strRegex.exec(block)) !== null) {
        const decoded = sm[1]
          .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\');
        text += decoded + ' ';
      }
    }
    log.debug('Blocs BT/ET extraits', { blockCount, textLength: text.length });

    // Extraire aussi les chaînes entre crochets [(...)(...)...]
    const arrayRegex = /\[((?:\([^)]*\)\s*)+)\]/g;
    while ((match = arrayRegex.exec(str)) !== null) {
      const inner = match[1];
      const strRegex2 = /\(([^)]*)\)/g;
      let sm2;
      while ((sm2 = strRegex2.exec(inner)) !== null) {
        text += sm2[1] + ' ';
      }
    }

    // Fallback si trop peu de texte
    if (text.trim().length < 200) {
      log.warn('Extraction BT/ET insuffisante, fallback sur regex générique', { textLength: text.length });
      const readable = [];
      const regex = /[\x20-\x7E]{5,}/g;
      let m;
      while ((m = regex.exec(str)) !== null) {
        readable.push(m[0]);
      }
      text = readable.filter(s => /[a-zA-Z]{2,}/.test(s)).join(' ');
      log.debug('Fallback regex', { chunksFound: readable.length, textLength: text.length });
    }

    // Nettoyage
    text = text.replace(/\s+/g, ' ').trim();
    log.info('Texte extrait avec succès', {
      charCount: text.length,
      wordCount: text.split(/\s+/).length,
      preview: text.substring(0, 200),
    });

    return text;
  } catch (err) {
    log.error('Erreur extraction PDF', { message: err.message, stack: err.stack });
    return '';
  }
}

export default async function handler(req, res) {
  log.separator();
  log.group('POST /api/analyze-report');
  log.info('Requête reçue', { method: req.method });

  if (req.method !== 'POST') {
    log.warn('Méthode non autorisée', req.method);
    log.groupEnd();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdf_base64, pdf_text, filename } = req.body;
  log.debug('Payload reçu', {
    hasPdfBase64: !!pdf_base64,
    hasPdfText: !!pdf_text,
    filename,
    base64Size: pdf_base64 ? `${Math.round(pdf_base64.length * 0.75 / 1024)}KB` : 'N/A',
  });

  let textContent = '';

  if (pdf_text && pdf_text.trim().length > 50) {
    log.info('Utilisation du texte PDF fourni directement');
    textContent = pdf_text;
  } else if (pdf_base64) {
    log.info('Décodage et extraction texte depuis base64 PDF');
    try {
      const buffer = Buffer.from(pdf_base64, 'base64');
      log.debug('Buffer PDF décodé', { sizeKB: Math.round(buffer.length / 1024) });
      textContent = extractTextFromPDFBuffer(buffer);
    } catch (err) {
      log.error('Erreur décodage base64', { message: err.message });
      log.groupEnd();
      return res.status(400).json({ error: 'PDF invalide ou corrompu : ' + err.message });
    }
  } else {
    log.error('Aucun contenu PDF fourni');
    log.groupEnd();
    return res.status(400).json({ error: 'Contenu PDF manquant' });
  }

  if (textContent.trim().length < 100) {
    log.warn('Texte extrait insuffisant', { textLength: textContent.length });
    // On continue quand même — Gemini peut parfois inférer depuis peu de texte
  }

  log.info('Texte prêt pour l\'analyse', {
    charCount: textContent.length,
    wordCount: textContent.split(/\s+/).length,
  });

  try {
    const prompt = `Tu es un médecin diabétologue expert en pompes à insuline Medtronic MiniMed 780G et capteurs Guardian 4. Tu analyses des rapports CareLink.

Voici le contenu extrait d'un rapport Medtronic CareLink d'un patient diabétique de type 1 :

---
${textContent.substring(0, 7000)}
---

Analyse ce rapport en profondeur. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour :
{
  "period": "<période du rapport>",
  "summary": {
    "avg_glucose": <glycémie capteur moyenne mg/dL ou null>,
    "gmi": <GMI % ou null>,
    "time_in_range": <% temps 70-180 ou null>,
    "time_above": <% >180 ou null>,
    "time_below": <% <70 ou null>,
    "sensor_wear": <% port capteur ou null>,
    "cv": <coefficient variation % ou null>,
    "total_daily_insulin": <dose totale U/jour ou null>,
    "basal_ratio": <% basal ou null>,
    "bolus_ratio": <% bolus ou null>,
    "avg_daily_carbs": <glucides moy. g/jour ou null>,
    "smartguard_active": <% SmartGuard actif ou null>
  },
  "status": "<bon|moyen|critique>",
  "key_findings": ["<3 observations cliniques en langage simple>"],
  "hyperglycemia_patterns": [
    { "time_slot": "<créneau>", "occurrences": <nb>, "probable_cause": "<cause probable>" }
  ],
  "recommendations": [
    {
      "category": "<Basal|Ratio glucides|Objectif SmartGuard|Capteur|Bolus|Comportement>",
      "priority": "<haute|moyenne|faible>",
      "current_value": "<valeur actuelle ou null>",
      "suggested_value": "<suggestion concrète ou null>",
      "explanation": "<explication en 1-2 phrases simples>"
    }
  ],
  "sensor_analysis": {
    "wear_rate": <% ou null>,
    "comment": "<analyse du port du capteur>",
    "impact": "<impact sur le contrôle>"
  },
  "smartguard_analysis": {
    "active_rate": <% ou null>,
    "exits_count": <nb sorties ou null>,
    "comment": "<analyse SmartGuard>"
  },
  "positive_points": ["<2-3 points positifs>"],
  "next_steps": "<message encourageant avec 2-3 priorités claires>"
}`;

    log.info('Envoi du texte à Gemini pour analyse médicale', { textLength: textContent.length });
    const t0 = Date.now();
    const rawContent = await callGemini({ prompt, temperature: 0.1 });
    log.info('Analyse Gemini terminée', { duration: `${Date.now() - t0}ms`, responseLength: rawContent.length });

    const result = extractJSON(rawContent);

    log.info('Rapport analysé avec succès', {
      period: result.period,
      status: result.status,
      avgGlucose: result.summary?.avg_glucose,
      gmi: result.summary?.gmi,
      sensorWear: result.summary?.sensor_wear,
      recommendationsCount: result.recommendations?.length,
      patternsCount: result.hyperglycemia_patterns?.length,
    });

    log.separator();
    log.groupEnd();
    return res.status(200).json(result);

  } catch (err) {
    log.error('Erreur analyse rapport', { message: err.message, stack: err.stack });
    log.groupEnd();
    return res.status(500).json({ error: err.message });
  }
}
