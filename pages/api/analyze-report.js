// pages/api/analyze-report.js
// Parser 100% local — aucune IA, aucune API externe, pure regex sur le texte CareLink (MiniMed 780G)

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { pdf_text } = req.body;
  if (!pdf_text || pdf_text.trim().length < 50)
    return res.status(400).json({ error: 'Texte PDF manquant.' });

  try {
    const result = parseCareLink(pdf_text);
    return res.status(200).json(result);
  } catch (e) {
    console.error('[diabia/parse]', e);
    return res.status(500).json({ error: 'Erreur parsing : ' + e.message });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pf = (s) => {
  const v = parseFloat(String(s ?? '').replace(',', '.'));
  return isNaN(v) ? null : v;
};
const pi = (s) => {
  const v = parseInt(String(s ?? ''));
  return isNaN(v) ? null : v;
};

// ─── Parser principal ─────────────────────────────────────────────────────────

function parseCareLink(raw) {
  // Normalise : collapse whitespace (PDF.js fragmente souvent)
  const t = raw.replace(/\s+/g, ' ');

  // ── Période ──────────────────────────────────────────────────────────────
  const periodM = t.match(
    /(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*(\d{2}\/\d{2}\/\d{4})\s*\((\d+)\s*Jours?\)/i
  );
  const period = periodM
    ? `${periodM[1]} – ${periodM[2]} (${periodM[3]} jours)`
    : '30 jours';

  // ── GMI ──────────────────────────────────────────────────────────────────
  // "GMI³ 9,1%"
  const gmi = pf(
    t.match(/GMI[³\u00b3\s]*(\d+[,.]\d+)\s*%/i)?.[1] ??
    t.match(/GMI[³\u00b3\s]*(\d+)\s*%/i)?.[1]
  );

  // ── Glucose capteur moyen ─────────────────────────────────────────────────
  // "Gluc. capt. moyen ± ET 243 ± 86 mg/dL"
  const avg_glucose = pi(
    t.match(/Gluc\.?\s*capt\.?\s*moy[^0-9]{0,20}(\d{2,3})\s/i)?.[1]
  );

  // ── Coefficient de variation ──────────────────────────────────────────────
  // "Coeffic. de variation (%) 35,6%"
  const cv = pf(
    t.match(/variation[^%]{0,5}%[^0-9]{0,5}(\d+[,.]\d+)/i)?.[1]
  );

  // ── Port du capteur ───────────────────────────────────────────────────────
  // "Port du capteur (par semaine) 44% (3j 01h)"
  const sensor_wear = pf(
    t.match(/Port\s*du\s*capteur\s*\([^)]+\)\s*(\d+)\s*%/i)?.[1]
  );

  // ── SmartGuard % ──────────────────────────────────────────────────────────
  // "SmartGuard (par semaine) 43% (3j 00h)"
  const smartguard_pct = pf(
    t.match(/SmartGuard\s*\(par\s*semaine\)\s*(\d+)/i)?.[1]
  );

  // ── Mode manuel % ─────────────────────────────────────────────────────────
  // "Mode manuel (par semaine) 56% (3j 22h)"
  const mode_manuel_pct = pf(
    t.match(/Mode\s*manuel\s*\([^)]+\)\s*(\d+)/i)?.[1]
  );

  // ── Dose quotidienne totale ───────────────────────────────────────────────
  // "Dose quotidienne totale (par jour) 76,1 unités"
  const total_daily_insulin = pf(
    t.match(/Dose\s*quotidienne\s*totale[^0-9]{0,20}(\d+[,.]\d+)/i)?.[1]
  );

  // ── Ratio basal (%) ───────────────────────────────────────────────────────
  // "41,9U (55%)" — première occurrence (= période A)
  const basal_ratio = pi(
    t.match(/\d+[,.]\d+U\s*\((\d+)\s*%\)/)?.[1]
  );

  // ── Glucides quotidiens ───────────────────────────────────────────────────
  // "Glucides saisis/repas (par jour) 61 ± 40 g"
  const avg_daily_carbs = pi(
    t.match(/Glucides?[^0-9]{0,60}(\d+)\s*[±+\d]/i)?.[1]
  );

  // ── Glycémie lecteur (fingerstick) ────────────────────────────────────────
  // "Gly. moyenne 344 ± 45 mg/dL"
  const glyc_lecteur = pi(
    t.match(/Gly\.?\s*moyenne\s*(\d{2,3})\s/i)?.[1]
  );

  // ── Admin max SmartGuard ──────────────────────────────────────────────────
  // "Admin. max. SmartGuard • • • • 4 0" (première valeur = période A)
  const adminMaxCount =
    pi(t.match(/Admin\.?\s*max\.?\s*SmartGuard[^0-9]{0,15}(\d+)/i)?.[1]) ?? 0;

  // ── Durée dans la cible (TIR) ─────────────────────────────────────────────
  // 3 pourcentages consécutifs dont la somme ≈ 100
  // Ordre barre CareLink (haut→bas) : >180 | 70-180 | <70
  let time_above = null, time_in_range = null, time_below = null;

  const tirSection =
    t.match(/Dur[eé]e\s*dans\s*la\s*cible([\s\S]{0,400})/i)?.[1] ?? '';
  const tirPcts = [...tirSection.matchAll(/(\d+[,.]\d*|\d+)\s*%/g)]
    .map((m) => pf(m[1]))
    .filter((v) => v !== null && v > 0 && v <= 100);

  for (let i = 0; i + 2 < tirPcts.length; i++) {
    const [a, b, c] = [tirPcts[i], tirPcts[i + 1], tirPcts[i + 2]];
    if (a + b + c >= 96 && a + b + c <= 104) {
      time_above = a;
      time_in_range = b;
      time_below = c;
      break;
    }
  }

  // Fallback : cherche dans tout le texte
  if (time_in_range === null) {
    const allPct = [...t.matchAll(/(\d+[,.]\d*|\d+)\s*%/g)]
      .map((m) => pf(m[1]))
      .filter((v) => v !== null && v > 0 && v <= 100);
    for (let i = 0; i + 2 < allPct.length; i++) {
      const [a, b, c] = [allPct[i], allPct[i + 1], allPct[i + 2]];
      if (a + b + c >= 97 && a + b + c <= 103) {
        time_above = a;
        time_in_range = b;
        time_below = c;
        break;
      }
    }
  }

  // ── Tendances hyperglycémiques ────────────────────────────────────────────
  const hyperPatterns = [];
  const hyperM = t.match(
    /Tendances?\s*hyperglycémiques?\s*\((\d+)\)([\s\S]{0,600})/i
  );
  if (hyperM) {
    const slots = [
      ...hyperM[2].matchAll(
        /(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})[^(]{0,30}\((\d+)\s*occurrence/gi
      ),
    ];
    for (const m of slots) {
      hyperPatterns.push({
        time_slot: m[1].trim(),
        occurrences: pi(m[2]),
        probable_cause: inferCause(m[1].trim()),
      });
    }
  }

  // ── Tendances hypoglycémiques (count) ─────────────────────────────────────
  const hypo_count =
    pi(t.match(/Tendances?\s*hypoglycémiques?\s*\((\d+)\)/i)?.[1]) ?? 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYSE CLINIQUE — seuils consensus international TIR
  // ═══════════════════════════════════════════════════════════════════════════

  let score = 0;
  if (gmi != null) {
    if (gmi > 8) score += 3;
    else if (gmi > 7) score += 1;
  }
  if (time_in_range != null) {
    if (time_in_range < 50) score += 3;
    else if (time_in_range < 70) score += 1;
  }
  if (time_below != null) {
    if (time_below > 10) score += 3;
    else if (time_below > 4) score += 2;
  }
  if (time_above != null && time_above > 50) score += 2;
  if (avg_glucose != null && avg_glucose > 183) score += 1;
  if (sensor_wear != null && sensor_wear < 50) score += 2;
  if (adminMaxCount > 2) score += 1;

  const status = score >= 6 ? 'critique' : score >= 2 ? 'moyen' : 'bon';

  // ── Key findings ──────────────────────────────────────────────────────────
  const key_findings = [];

  if (gmi != null)
    key_findings.push(
      `GMI de ${gmi}% (cible < 7%). ` +
        (gmi > 8
          ? 'Niveau critique — HbA1c estimé très élevé.'
          : 'Amélioration nécessaire.')
    );

  if (time_in_range != null)
    key_findings.push(
      `Temps dans la cible 70–180 mg/dL : ${time_in_range}% (recommandation ≥ 70%).`
    );

  if (time_below != null && time_below > 4)
    key_findings.push(
      `Hypoglycémies : ${time_below}% du temps sous 70 mg/dL (cible < 4%). ` +
        'Point prioritaire à discuter avec votre diabétologue.'
    );

  if (sensor_wear != null && sensor_wear < 70)
    key_findings.push(
      `Port du capteur : ${sensor_wear}% (recommandé ≥ 70%). ` +
        'SmartGuard ne fonctionne pas sans capteur actif.'
    );

  if (adminMaxCount > 0)
    key_findings.push(
      `SmartGuard a atteint son plafond d'insuline ${adminMaxCount} fois — ` +
        'signe que le débit basal manuel est probablement sous-dosé.'
    );

  // ── Recommandations ───────────────────────────────────────────────────────
  const recommendations = [];

  if (sensor_wear != null && sensor_wear < 70)
    recommendations.push({
      category: 'Capteur',
      priority: sensor_wear < 50 ? 'haute' : 'moyenne',
      explanation:
        `Le capteur n'était actif que ${sensor_wear}% du temps. ` +
        "Sans capteur, SmartGuard est désactivé et le contrôle se dégrade. " +
        "Vérifiez l'adhésion (colle/patch), variez les zones de pose, anticipez les changements.",
      current_value: `${sensor_wear}%`,
      suggested_value: '≥ 70% par semaine',
    });

  if (adminMaxCount > 0)
    recommendations.push({
      category: 'Débits basaux',
      priority: 'haute',
      explanation:
        `SmartGuard a atteint son plafond ${adminMaxCount} fois. ` +
        "L'algorithme essaie de corriger mais est limité. " +
        'Demandez à votre équipe soignante de revoir les débits basaux programmés.',
      current_value: `${adminMaxCount} dépassement(s)`,
      suggested_value: '0 dépassement idéalement',
    });

  if (gmi != null && gmi > 7)
    recommendations.push({
      category: 'Équilibrage glycémique',
      priority: gmi > 8 ? 'haute' : 'moyenne',
      explanation:
        `GMI de ${gmi}% — au-dessus de la cible de 7%. ` +
        "Un ajustement du débit basal et/ou de la sensibilité à l'insuline est à envisager.",
      current_value: `GMI ${gmi}%`,
      suggested_value: '< 7%',
    });

  if (time_above != null && time_above > 25)
    recommendations.push({
      category: 'Hyperglycémies post-repas',
      priority: time_above > 50 ? 'haute' : 'moyenne',
      explanation:
        `${time_above}% du temps au-dessus de 180 mg/dL. ` +
        "Vérifiez vos ratios glucides/insuline et saisissez les glucides AVANT le repas " +
        "pour que SmartGuard puisse anticiper.",
      current_value: `${time_above}%`,
      suggested_value: '< 25%',
    });

  if (time_below != null && time_below > 4)
    recommendations.push({
      category: 'Hypoglycémies',
      priority: time_below > 10 ? 'haute' : 'moyenne',
      explanation:
        `${time_below}% du temps sous 70 mg/dL. ` +
        'Identifiez les horaires (nuit, activité physique, post-repas tardif). ' +
        'Votre débit basal de 3h00–6h30 (1,70 puis 1,10 U/h) mérite une réévaluation.',
      current_value: `${time_below}%`,
      suggested_value: '< 4%',
    });

  if (cv != null && cv > 36)
    recommendations.push({
      category: 'Variabilité glycémique',
      priority: 'moyenne',
      explanation:
        `Coefficient de variation de ${cv}% (cible ≤ 36%). ` +
        'Glycémie instable — privilégiez des glucides à faible index glycémique ' +
        'et évitez les longues périodes sans manger.',
      current_value: `CV ${cv}%`,
      suggested_value: '≤ 36%',
    });

  // ── Points positifs ───────────────────────────────────────────────────────
  const positive_points = [];
  if (hypo_count === 0)
    positive_points.push(
      'Aucune tendance hypoglycémique systématique détectée — bonne vigilance.'
    );
  if (cv != null && cv <= 36)
    positive_points.push(`CV de ${cv}% — dans la cible (≤ 36%).`);
  if (sensor_wear != null && sensor_wear >= 70)
    positive_points.push(
      `Excellent port du capteur (${sensor_wear}%) — SmartGuard peut optimiser efficacement.`
    );
  if (time_in_range != null && time_in_range >= 70)
    positive_points.push(`Temps dans la cible de ${time_in_range}% — objectif atteint !`);
  if (time_below != null && time_below <= 4)
    positive_points.push(`Temps sous 70 mg/dL de ${time_below}% — dans la cible (< 4%).`);
  if (positive_points.length === 0)
    positive_points.push(
      'Chaque journée avec SmartGuard actif et capteur porté est un pas dans la bonne direction.'
    );

  // ── Next steps ────────────────────────────────────────────────────────────
  const next_steps =
    status === 'critique'
      ? "Plusieurs indicateurs sont significativement hors cibles. " +
        "Contactez votre diabétologue rapidement — n'attendez pas le prochain rendez-vous."
      : status === 'moyen'
      ? 'Des ajustements ciblés peuvent améliorer votre équilibre. ' +
        'Discutez de ces tendances lors de votre prochaine consultation.'
      : 'Continuez ainsi ! Vos résultats sont globalement dans les objectifs.';

  // ── Analyses détaillées ───────────────────────────────────────────────────
  const sensor_analysis = {
    comment:
      sensor_wear != null
        ? `Capteur actif ${sensor_wear}% du temps. ` +
          (sensor_wear < 50
            ? 'Port très insuffisant — plus de la moitié du temps sans surveillance continue.'
            : sensor_wear < 70
            ? "Port insuffisant pour maximiser l'efficacité de SmartGuard."
            : 'Port satisfaisant.')
        : 'Données de port du capteur non trouvées dans le PDF.',
    impact:
      sensor_wear != null && sensor_wear < 70
        ? "Sans capteur actif, SmartGuard bascule en mode manuel et ne peut plus ajuster le basal ni délivrer de bolus automatiques."
        : 'Le port régulier du capteur est indispensable au bon fonctionnement de SmartGuard.',
  };

  const smartguard_analysis = {
    comment:
      smartguard_pct != null
        ? `SmartGuard actif ${smartguard_pct}% du temps (mode manuel : ${mode_manuel_pct ?? '?'}%). ` +
          (smartguard_pct < 50
            ? "L'algorithme n'a pas pu optimiser suffisamment, principalement à cause du faible port du capteur."
            : smartguard_pct >= 70
            ? "L'algorithme a pu travailler correctement sur la période."
            : "Utilisation partielle — augmenter le port du capteur améliorera ce ratio.")
        : 'Données SmartGuard non trouvées dans le PDF.',
  };

  return {
    period,
    status,
    next_steps,
    summary: {
      avg_glucose,
      gmi,
      time_in_range,
      time_above,
      time_below,
      sensor_wear,
      cv,
      total_daily_insulin,
      basal_ratio,
      avg_daily_carbs,
    },
    key_findings,
    recommendations,
    positive_points,
    hyperglycemia_patterns: hyperPatterns,
    sensor_analysis,
    smartguard_analysis,
    // Debug — retire en prod
    _debug: {
      glyc_lecteur,
      adminMaxCount,
      hypo_count,
      smartguard_pct,
      mode_manuel_pct,
    },
  };
}

// ─── Inférence de cause par créneau horaire ───────────────────────────────────

function inferCause(timeSlot) {
  const h = parseInt(timeSlot.split(':')[0], 10);
  if (h >= 3 && h < 7)
    return "Effet aube probable (résistance à l'insuline en fin de nuit). Vérifiez le débit basal 3h–7h.";
  if (h >= 7 && h < 10)
    return 'Hyperglycémie matinale — bolus petit-déjeuner insuffisant ou prise trop tardive.';
  if (h >= 10 && h < 12)
    return 'Pic de fin de matinée — collation non couverte ou ratio déjeuner à revoir.';
  if (h >= 12 && h < 14)
    return 'Pic post-déjeuner — ratio glucides/insuline du midi à réévaluer.';
  if (h >= 14 && h < 18)
    return 'Hyperglycémie post-déjeuner tardive ou activité physique non anticipée.';
  if (h >= 18 && h < 22)
    return 'Pic post-dîner — ratio glucides/insuline du soir à vérifier.';
  return 'Hyperglycémie nocturne — débit basal de nuit à réévaluer.';
}