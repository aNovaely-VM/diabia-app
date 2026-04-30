// pages/api/analyze-report.js — Analyse de rapport CareLink avec règles médicales ATTD/ADA
// Sans appel à une IA externe — 100% logique locale basée sur les guidelines officielles

import { createLogger } from '../../lib/logger';

const log = createLogger('API:analyze-report');
export const config = { 
  api: { 
    bodyParser: { sizeLimit: '50mb' },
    responseLimit: false,
  } 
};

// ============================================================================
// GUIDELINES MÉDICALES - ATTD 2022 / ADA 2024
// ============================================================================

const TARGETS = {
  // Temps dans la cible (TIR) - Objectif: ≥70%
  tir: { excellent: 80, good: 70, acceptable: 50 },
  // Temps au-dessus (TAR) - Objectif: <25%
  tar: { excellent: 15, good: 25, warning: 50 },
  // Temps en dessous (TBR) - Objectif: <4% (<70mg/dL)
  tbr: { excellent: 2, good: 4, warning: 10 },
  // Temps en hypoglycémie sévère (<54mg/dL) - Objectif: <1%
  tbrSevere: { excellent: 0.5, good: 1, warning: 2 },
  // Glycémie moyenne - Objectif: ≤154 mg/dL (équivalent GMI 7%)
  avgGlucose: { excellent: 140, good: 154, acceptable: 183 },
  // GMI - Objectif: ≤7%
  gmi: { excellent: 6.5, good: 7.0, acceptable: 8.0 },
  // Coefficient de variation (CV) - Objectif: ≤36%
  cv: { excellent: 33, good: 36, warning: 40 },
  // Port du capteur - Objectif: ≥70%
  sensorWear: { excellent: 90, good: 70, warning: 50 },
  // SmartGuard actif - Objectif: >90%
  smartguard: { excellent: 95, good: 90, warning: 70 },
};

// ============================================================================
// EXTRACTION TEXTE PDF
// ============================================================================

function extractTextFromPDFBuffer(buffer) {
  const logLocal = createLogger('PDFExtractor');
  logLocal.debug('Extraction texte du PDF', { bufferSize: buffer.length });

  try {
    const CHUNK = 8192;
    let str = '';
    for (let i = 0; i < buffer.length; i += CHUNK) {
      str += Buffer.from(buffer.slice(i, i + CHUNK)).toString('latin1');
    }

    let text = '';

    // Extraire les blocs texte PDF (BT...ET)
    const btRegex = /BT([\s\S]*?)ET/g;
    let match;
    while ((match = btRegex.exec(str)) !== null) {
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

    // Extraire aussi les chaînes entre crochets
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
      const readable = [];
      const regex = /[\x20-\x7E]{5,}/g;
      let m;
      while ((m = regex.exec(str)) !== null) {
        readable.push(m[0]);
      }
      text = readable.filter(s => /[a-zA-Z]{2,}/.test(s)).join(' ');
    }

    text = text.replace(/\s+/g, ' ').trim();
    logLocal.info('Texte extrait', { charCount: text.length });

    return text;
  } catch (err) {
    logLocal.error('Erreur extraction PDF', { message: err.message });
    return '';
  }
}

// ============================================================================
// EXTRACTION DES MÉTRIQUES DU TEXTE
// ============================================================================

function extractMetrics(text) {
  const metrics = {};
  const textLower = text.toLowerCase();

  // Patterns pour extraire les valeurs
  const patterns = {
    // Glycémie moyenne
    avgGlucose: [
      /glyc[ée]mie\s*(?:capteur\s*)?moyenne[:\s]*(\d+)\s*(?:mg|mg\/dl)/i,
      /average\s*(?:sensor\s*)?glucose[:\s]*(\d+)\s*(?:mg|mg\/dl)/i,
      /glucose\s*moyen[:\s]*(\d+)/i,
      /(\d{2,3})\s*mg\/dl\s*(?:moyenne|average)/i,
      /sensor\s*glucose\s*average[:\s]*(\d+)/i,
    ],
    // GMI
    gmi: [
      /gmi[:\s]*(\d+[.,]\d+)\s*%/i,
      /glucose\s*management\s*indicator[:\s]*(\d+[.,]\d+)/i,
      /indicateur\s*de\s*gestion\s*du\s*glucose[:\s]*(\d+[.,]\d+)/i,
    ],
    // Temps dans la cible (TIR 70-180)
    timeInRange: [
      /(?:temps\s*dans\s*la\s*cible|time\s*in\s*range|tir)[:\s]*(\d+)\s*%/i,
      /70\s*[-–]\s*180\s*(?:mg\/dl)?[:\s]*(\d+)\s*%/i,
      /in\s*range[:\s]*(\d+)\s*%/i,
      /(\d+)\s*%\s*(?:dans|in)\s*(?:la\s*)?(?:cible|range|target)/i,
    ],
    // Temps au-dessus (TAR >180)
    timeAbove: [
      /(?:temps?\s*)?(?:au[- ]?dessus|above)[:\s]*(\d+)\s*%/i,
      /(?:>|&gt;)\s*180[:\s]*(\d+)\s*%/i,
      /high[:\s]*(\d+)\s*%/i,
      /hyperglycemia[:\s]*(\d+)\s*%/i,
    ],
    // Temps en-dessous (TBR <70)
    timeBelow: [
      /(?:temps?\s*)?(?:en[- ]?dessous|below)[:\s]*(\d+)\s*%/i,
      /(?:<|&lt;)\s*70[:\s]*(\d+)\s*%/i,
      /low[:\s]*(\d+)\s*%/i,
      /hypoglycemia[:\s]*(\d+)\s*%/i,
    ],
    // Port du capteur
    sensorWear: [
      /(?:port|wear|utilisation)\s*(?:du\s*)?(?:capteur|sensor)[:\s]*(\d+)\s*%/i,
      /sensor\s*(?:usage|wear)[:\s]*(\d+)\s*%/i,
      /capteur\s*actif[:\s]*(\d+)\s*%/i,
    ],
    // Coefficient de variation
    cv: [
      /(?:cv|coefficient\s*(?:de\s*)?variation)[:\s]*(\d+[.,]?\d*)\s*%/i,
      /variabilit[ée][:\s]*(\d+[.,]?\d*)\s*%/i,
    ],
    // Insuline totale quotidienne
    totalDailyInsulin: [
      /(?:insuline\s*totale|total\s*daily\s*insulin|tdi)[:\s]*(\d+[.,]?\d*)\s*(?:u|unit)/i,
      /dose\s*totale[:\s]*(\d+[.,]?\d*)\s*u/i,
      /(\d+[.,]?\d*)\s*u(?:nit)?s?\s*(?:par\s*jour|\/jour|\/day|daily)/i,
    ],
    // Ratio basal
    basalRatio: [
      /(?:basal|basale)[:\s]*(\d+)\s*%/i,
      /basal\s*(?:ratio|%)[:\s]*(\d+)/i,
    ],
    // SmartGuard / Auto mode
    smartguardActive: [
      /(?:smartguard|smart\s*guard|auto\s*mode)[:\s]*(\d+)\s*%/i,
      /mode\s*auto(?:matique)?[:\s]*(\d+)\s*%/i,
    ],
    // Glucides moyens par jour
    avgDailyCarbs: [
      /glucides?\s*(?:moyens?|quotidiens?|daily)[:\s]*(\d+)\s*g/i,
      /carbs?\s*(?:average|daily)[:\s]*(\d+)\s*g/i,
    ],
    // Période du rapport
    period: [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*[-–à]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /p[ée]riode[:\s]*(.+?(?:\d{4}|jours?))/i,
      /(\d+)\s*jours?/i,
    ],
  };

  // Extraire chaque métrique
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match) {
        if (key === 'period') {
          metrics[key] = match[0].trim();
        } else {
          const value = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(value)) {
            metrics[key] = value;
            break;
          }
        }
      }
    }
  }

  // Fallback pour la période
  if (!metrics.period) {
    metrics.period = '30 derniers jours';
  }

  log.debug('Métriques extraites', metrics);
  return metrics;
}

// ============================================================================
// GÉNÉRATION DES ANALYSES ET RECOMMANDATIONS
// ============================================================================

function analyzeMetrics(metrics) {
  const findings = [];
  const recommendations = [];
  const positivePoints = [];
  const hyperglycemiaPatterns = [];
  let status = 'bon';
  let problemCount = 0;

  // ----- TEMPS DANS LA CIBLE (TIR) -----
  if (metrics.timeInRange !== undefined) {
    const tir = metrics.timeInRange;
    if (tir >= TARGETS.tir.excellent) {
      positivePoints.push(`Excellent temps dans la cible à ${tir}% (objectif ≥70%)`);
    } else if (tir >= TARGETS.tir.good) {
      positivePoints.push(`Temps dans la cible conforme aux objectifs (${tir}%)`);
    } else if (tir >= TARGETS.tir.acceptable) {
      findings.push(`Temps dans la cible de ${tir}%, inférieur à l'objectif de 70%`);
      recommendations.push({
        category: 'Temps dans la cible',
        priority: 'haute',
        current_value: `${tir}%`,
        suggested_value: '≥70%',
        explanation: 'Le temps dans la cible (70-180 mg/dL) est sous l\'objectif ATTD. Cela peut être amélioré en ajustant les ratios glucides, les débits de base ou les objectifs SmartGuard.',
      });
      problemCount++;
    } else {
      findings.push(`Temps dans la cible critique à ${tir}%`);
      recommendations.push({
        category: 'Temps dans la cible',
        priority: 'haute',
        current_value: `${tir}%`,
        suggested_value: '≥70%',
        explanation: 'Le TIR est significativement sous l\'objectif. Une consultation avec votre équipe soignante est recommandée pour revoir l\'ensemble des paramètres.',
      });
      problemCount += 2;
    }
  }

  // ----- TEMPS AU-DESSUS (TAR) -----
  if (metrics.timeAbove !== undefined) {
    const tar = metrics.timeAbove;
    if (tar <= TARGETS.tar.excellent) {
      positivePoints.push(`Temps en hyperglycémie bien contrôlé (${tar}%)`);
    } else if (tar <= TARGETS.tar.good) {
      // OK, pas de commentaire
    } else {
      findings.push(`${tar}% du temps au-dessus de 180 mg/dL`);
      
      // Identifier les patterns possibles
      const patternSuggestions = [
        { time_slot: 'Post-prandial', occurrences: null, probable_cause: 'Ratio insuline/glucides potentiellement trop élevé ou comptage imprécis des glucides' },
        { time_slot: 'Nuit / Aube', occurrences: null, probable_cause: 'Phénomène de l\'aube ou débit de base nocturne insuffisant' },
      ];
      hyperglycemiaPatterns.push(...patternSuggestions);

      recommendations.push({
        category: 'Hyperglycémies',
        priority: tar > TARGETS.tar.warning ? 'haute' : 'moyenne',
        current_value: `${tar}%`,
        suggested_value: '<25%',
        explanation: tar > TARGETS.tar.warning 
          ? 'Temps en hyperglycémie très élevé. Revoyez vos ratios et vérifiez le comptage des glucides. Consultez votre équipe soignante.'
          : 'Réduire les hyperglycémies en ajustant potentiellement le ratio glucides ou l\'objectif SmartGuard.',
      });
      problemCount++;
    }
  }

  // ----- TEMPS EN-DESSOUS (TBR) -----
  if (metrics.timeBelow !== undefined) {
    const tbr = metrics.timeBelow;
    if (tbr <= TARGETS.tbr.excellent) {
      positivePoints.push(`Très peu d'hypoglycémies (${tbr}%)`);
    } else if (tbr <= TARGETS.tbr.good) {
      // OK
    } else {
      findings.push(`${tbr}% du temps en hypoglycémie (<70 mg/dL)`);
      recommendations.push({
        category: 'Hypoglycémies',
        priority: tbr > TARGETS.tbr.warning ? 'haute' : 'moyenne',
        current_value: `${tbr}%`,
        suggested_value: '<4%',
        explanation: 'Trop de temps en hypoglycémie. Cela peut nécessiter de réduire les doses de bolus, ajuster les débits de base ou revoir l\'objectif SmartGuard à la hausse.',
      });
      problemCount += tbr > TARGETS.tbr.warning ? 2 : 1;
    }
  }

  // ----- GMI -----
  if (metrics.gmi !== undefined) {
    const gmi = metrics.gmi;
    if (gmi <= TARGETS.gmi.excellent) {
      positivePoints.push(`GMI excellent à ${gmi}% (équivalent HbA1c estimé)`);
    } else if (gmi <= TARGETS.gmi.good) {
      positivePoints.push(`GMI dans l'objectif à ${gmi}%`);
    } else if (gmi <= TARGETS.gmi.acceptable) {
      findings.push(`GMI de ${gmi}%, légèrement au-dessus de l'objectif de 7%`);
      recommendations.push({
        category: 'GMI',
        priority: 'moyenne',
        current_value: `${gmi}%`,
        suggested_value: '≤7%',
        explanation: 'Le GMI reflète votre glycémie moyenne sur la période. Un GMI élevé indique une exposition prolongée à des glycémies hautes.',
      });
    } else {
      findings.push(`GMI élevé à ${gmi}%`);
      problemCount++;
    }
  }

  // ----- GLYCÉMIE MOYENNE -----
  if (metrics.avgGlucose !== undefined) {
    const avg = metrics.avgGlucose;
    if (avg <= TARGETS.avgGlucose.excellent) {
      positivePoints.push(`Glycémie moyenne excellente à ${avg} mg/dL`);
    } else if (avg > TARGETS.avgGlucose.acceptable) {
      findings.push(`Glycémie moyenne élevée à ${avg} mg/dL (objectif ≤154 mg/dL)`);
    }
  }

  // ----- COEFFICIENT DE VARIATION -----
  if (metrics.cv !== undefined) {
    const cv = metrics.cv;
    if (cv <= TARGETS.cv.excellent) {
      positivePoints.push(`Excellente stabilité glycémique (CV ${cv}%)`);
    } else if (cv <= TARGETS.cv.good) {
      positivePoints.push(`Bonne stabilité glycémique (CV ${cv}%)`);
    } else {
      findings.push(`Variabilité glycémique élevée (CV ${cv}%)`);
      recommendations.push({
        category: 'Variabilité',
        priority: cv > TARGETS.cv.warning ? 'haute' : 'moyenne',
        current_value: `${cv}%`,
        suggested_value: '≤36%',
        explanation: 'Une variabilité glycémique élevée indique des fluctuations importantes. Cela peut être lié au comptage des glucides, au timing des bolus ou à l\'activité physique.',
      });
      problemCount++;
    }
  }

  // ----- PORT DU CAPTEUR -----
  if (metrics.sensorWear !== undefined) {
    const wear = metrics.sensorWear;
    if (wear >= TARGETS.sensorWear.excellent) {
      positivePoints.push(`Excellent port du capteur à ${wear}%`);
    } else if (wear < TARGETS.sensorWear.good) {
      findings.push(`Port du capteur insuffisant (${wear}%)`);
      recommendations.push({
        category: 'Capteur',
        priority: wear < TARGETS.sensorWear.warning ? 'haute' : 'moyenne',
        current_value: `${wear}%`,
        suggested_value: '≥70%',
        explanation: 'Un port du capteur insuffisant limite l\'efficacité du système SmartGuard et réduit la fiabilité des statistiques. Essayez de garder le capteur actif au maximum.',
      });
      problemCount++;
    }
  }

  // ----- SMARTGUARD -----
  if (metrics.smartguardActive !== undefined) {
    const sg = metrics.smartguardActive;
    if (sg >= TARGETS.smartguard.excellent) {
      positivePoints.push(`Mode SmartGuard utilisé à ${sg}%`);
    } else if (sg < TARGETS.smartguard.good) {
      findings.push(`Utilisation du SmartGuard limitée (${sg}%)`);
      recommendations.push({
        category: 'SmartGuard',
        priority: 'moyenne',
        current_value: `${sg}%`,
        suggested_value: '>90%',
        explanation: 'Le mode SmartGuard automatise la gestion de l\'insuline basale. Une utilisation plus régulière peut améliorer le temps dans la cible.',
      });
    }
  }

  // ----- DÉTERMINER LE STATUT GLOBAL -----
  if (problemCount >= 3) {
    status = 'critique';
  } else if (problemCount >= 1) {
    status = 'moyen';
  } else {
    status = 'bon';
  }

  // ----- GÉNÉRER LE MESSAGE DE SYNTHÈSE -----
  let nextSteps = '';
  if (status === 'bon') {
    nextSteps = 'Continuez ainsi ! Vos résultats sont dans les objectifs recommandés. Maintenez vos bonnes habitudes et consultez votre équipe soignante lors de vos rendez-vous réguliers.';
  } else if (status === 'moyen') {
    const priorities = recommendations.filter(r => r.priority === 'haute').map(r => r.category);
    if (priorities.length > 0) {
      nextSteps = `Points à améliorer en priorité : ${priorities.join(', ')}. Discutez-en avec votre équipe soignante pour ajuster vos paramètres.`;
    } else {
      nextSteps = 'Quelques points peuvent être améliorés. Revoyez les recommandations ci-dessous et discutez-en lors de votre prochain rendez-vous.';
    }
  } else {
    nextSteps = 'Plusieurs paramètres sont hors objectifs. Une consultation rapprochée avec votre diabétologue est recommandée pour revoir l\'ensemble de vos réglages.';
  }

  return {
    status,
    findings,
    recommendations,
    positivePoints,
    hyperglycemiaPatterns: hyperglycemiaPatterns.length > 0 ? hyperglycemiaPatterns : undefined,
    nextSteps,
  };
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

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

  if (textContent.trim().length < 50) {
    log.warn('Texte extrait insuffisant', { textLength: textContent.length });
    log.groupEnd();
    return res.status(400).json({ 
      error: 'Impossible d\'extraire suffisamment de texte du PDF. Assurez-vous qu\'il s\'agit d\'un rapport CareLink valide.' 
    });
  }

  log.info('Texte prêt pour l\'analyse', {
    charCount: textContent.length,
    wordCount: textContent.split(/\s+/).length,
  });

  try {
    // Extraire les métriques du texte
    const metrics = extractMetrics(textContent);
    log.info('Métriques extraites', metrics);

    // Analyser les métriques selon les guidelines
    const analysis = analyzeMetrics(metrics);
    log.info('Analyse complétée', { status: analysis.status });

    // Construire la réponse
    const result = {
      period: metrics.period || '30 derniers jours',
      summary: {
        avg_glucose: metrics.avgGlucose || null,
        gmi: metrics.gmi || null,
        time_in_range: metrics.timeInRange || null,
        time_above: metrics.timeAbove || null,
        time_below: metrics.timeBelow || null,
        sensor_wear: metrics.sensorWear || null,
        cv: metrics.cv || null,
        total_daily_insulin: metrics.totalDailyInsulin || null,
        basal_ratio: metrics.basalRatio || null,
        avg_daily_carbs: metrics.avgDailyCarbs || null,
        smartguard_active: metrics.smartguardActive || null,
      },
      status: analysis.status,
      key_findings: analysis.findings.slice(0, 5),
      hyperglycemia_patterns: analysis.hyperglycemiaPatterns,
      recommendations: analysis.recommendations,
      sensor_analysis: metrics.sensorWear !== undefined ? {
        wear_rate: metrics.sensorWear,
        comment: metrics.sensorWear >= 90 
          ? 'Excellent taux de port du capteur, permettant une gestion optimale par SmartGuard.'
          : metrics.sensorWear >= 70
            ? 'Bon taux de port du capteur. Essayez de maintenir ce niveau.'
            : 'Le taux de port du capteur pourrait être amélioré pour une meilleure efficacité du système.',
        impact: metrics.sensorWear < 70 
          ? 'Un port insuffisant limite les données disponibles et peut réduire l\'efficacité de la boucle fermée.'
          : 'Le capteur fournit suffisamment de données pour un fonctionnement optimal.',
      } : undefined,
      smartguard_analysis: metrics.smartguardActive !== undefined ? {
        active_rate: metrics.smartguardActive,
        comment: metrics.smartguardActive >= 90
          ? 'Excellente utilisation du mode automatique SmartGuard.'
          : metrics.smartguardActive >= 70
            ? 'Bonne utilisation du SmartGuard, quelques sorties du mode auto détectées.'
            : 'L\'utilisation du mode SmartGuard pourrait être améliorée.',
      } : undefined,
      positive_points: analysis.positivePoints.slice(0, 4),
      next_steps: analysis.nextSteps,
    };

    log.info('Rapport analysé avec succès (sans IA)', {
      period: result.period,
      status: result.status,
      avgGlucose: result.summary?.avg_glucose,
      gmi: result.summary?.gmi,
      tir: result.summary?.time_in_range,
      recommendationsCount: result.recommendations?.length,
      positivePointsCount: result.positive_points?.length,
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
