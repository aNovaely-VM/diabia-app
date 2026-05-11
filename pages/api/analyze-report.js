// app/api/analyze-report/route.js
// Parser 100% local — extraction exhaustive du rapport CareLink (MiniMed 780G)
// Inclut : stats, réglages pompe, bolus, repas, événements, données journalières, comparaison périodes

export default async function handler(req, res) {
  // On vérifie que c'est bien du POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { pdf_text } = req.body; // Dans Pages, le body est déjà parsé

  if (!pdf_text || pdf_text.trim().length < 50) {
    return res.status(400).json({ error: 'Texte PDF manquant.' });
  }

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

// Extrait toutes les correspondances d'un pattern
const extractAll = (text, pattern) => {
  const matches = [];
  let m;
  const regex = new RegExp(pattern, 'gi');
  while ((m = regex.exec(text)) !== null) {
    matches.push(m);
  }
  return matches;
};

// ─── Parser principal ─────────────────────────────────────────────────────────

function parseCareLink(raw) {
  // Normalise : collapse whitespace (PDF.js fragmente souvent)
  const t = raw.replace(/\s+/g, ' ');

  // ══════════════════════════════════════════════════════════════════════════
  // INFORMATIONS PATIENT & APPAREIL
  // ══════════════════════════════════════════════════════════════════════════
  
  // Nom du patient
  const patientMatch = t.match(/([A-Za-zÀ-ÿ\-]+),\s*([A-Za-zÀ-ÿ\-]+)/);
  const patientName = patientMatch ? `${patientMatch[2]} ${patientMatch[1]}` : null;
  
  // Modèle de pompe et numéro de série
  const deviceMatch = t.match(/MiniMed\s*(\d+G)[^(]*\(([\w-]+)\)/i);
  const pumpModel = deviceMatch ? `MiniMed ${deviceMatch[1]}` : 'MiniMed 780G';
  const serialNumber = deviceMatch ? deviceMatch[2] : null;
  
  // Date de création du rapport
  const createdMatch = t.match(/Cr[ée]+\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  const reportCreatedDate = createdMatch ? createdMatch[1] : null;

  // ══════════════════════════════════════════════════════════════════════════
  // PÉRIODES A & B (comparaison)
  // ══════════════════════════════════════════════════════════════════════════
  
  const periodMatches = [...t.matchAll(/(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*(\d{2}\/\d{2}\/\d{4})\s*\((\d+)\s*Jours?\)/gi)];
  
  let periodA = null, periodB = null;
  if (periodMatches.length >= 2) {
    periodB = { start: periodMatches[0][1], end: periodMatches[0][2], days: pi(periodMatches[0][3]) };
    periodA = { start: periodMatches[1][1], end: periodMatches[1][2], days: pi(periodMatches[1][3]) };
  } else if (periodMatches.length === 1) {
    periodA = { start: periodMatches[0][1], end: periodMatches[0][2], days: pi(periodMatches[0][3]) };
  }
  
  const period = periodA 
    ? `${periodA.start} – ${periodA.end} (${periodA.days} jours)`
    : '14 jours';

  // ══════════════════════════════════════════════════════════════════════════
  // STATISTIQUES GLYCÉMIQUES (Période A = plus récente)
  // ══════════════════════════════════════════════════════════════════════════
  
  // GMI (Glucose Management Indicator)
  const gmiMatches = [...t.matchAll(/GMI[³\u00b3]?\s*(\d+[,.]\d+|\d+|--)\s*%?/gi)];
  const gmi = gmiMatches.length > 0 ? pf(gmiMatches[gmiMatches.length - 1][1]) : null;
  const gmiPeriodB = gmiMatches.length > 1 ? pf(gmiMatches[0][1]) : null;

  // Glucose capteur moyen ± ET
  const glucoseMatches = [...t.matchAll(/(\d{2,3})\s*[±]\s*(\d{2,3})\s*mg\/dL/gi)];
  let avg_glucose = null, glucose_sd = null, avg_glucose_B = null, glucose_sd_B = null;
  if (glucoseMatches.length >= 2) {
    // La dernière paire est généralement la période A
    avg_glucose = pi(glucoseMatches[glucoseMatches.length - 1][1]);
    glucose_sd = pi(glucoseMatches[glucoseMatches.length - 1][2]);
    avg_glucose_B = pi(glucoseMatches[0][1]);
    glucose_sd_B = pi(glucoseMatches[0][2]);
  } else if (glucoseMatches.length === 1) {
    avg_glucose = pi(glucoseMatches[0][1]);
    glucose_sd = pi(glucoseMatches[0][2]);
  }

  // Coefficient de variation
  const cvMatches = [...t.matchAll(/variation\s*\(%?\)?\s*(\d+[,.]\d+|\d+)\s*%?/gi)];
  const cv = cvMatches.length > 0 ? pf(cvMatches[cvMatches.length - 1][1]) : null;
  const cv_B = cvMatches.length > 1 ? pf(cvMatches[0][1]) : null;

  // Port du capteur
  const sensorWearMatches = [...t.matchAll(/Port\s*du\s*capteur[^)]*\)\s*(\d+)\s*%/gi)];
  const sensor_wear = sensorWearMatches.length > 0 ? pf(sensorWearMatches[sensorWearMatches.length - 1][1]) : null;
  const sensor_wear_B = sensorWearMatches.length > 1 ? pf(sensorWearMatches[0][1]) : null;

  // SmartGuard %
  const sgMatches = [...t.matchAll(/SmartGuard\s*\(par\s*semaine\)\s*(\d+)\s*%/gi)];
  const smartguard_pct = sgMatches.length > 0 ? pf(sgMatches[sgMatches.length - 1][1]) : null;
  const smartguard_pct_B = sgMatches.length > 1 ? pf(sgMatches[0][1]) : null;

  // Mode manuel %
  const manualMatches = [...t.matchAll(/Mode\s*manuel\s*\([^)]+\)\s*(\d+)\s*%/gi)];
  const mode_manuel_pct = manualMatches.length > 0 ? pf(manualMatches[manualMatches.length - 1][1]) : null;
  const mode_manuel_pct_B = manualMatches.length > 1 ? pf(manualMatches[0][1]) : null;

  // ══════════════════════════════════════════════════════════════════════════
  // INSULINE
  // ══════════════════════════════════════════════════════════════════════════
  
  // Dose quotidienne totale
  const dailyInsulinMatches = [...t.matchAll(/Dose\s*quotidienne\s*totale[^0-9]{0,20}(\d+[,.]\d+)\s*unit/gi)];
  const total_daily_insulin = dailyInsulinMatches.length > 0 ? pf(dailyInsulinMatches[dailyInsulinMatches.length - 1][1]) : null;
  const total_daily_insulin_B = dailyInsulinMatches.length > 1 ? pf(dailyInsulinMatches[0][1]) : null;

  // Quantité basale & Auto basal
  const basalMatches = [...t.matchAll(/Quantit[eé]\s*basal[e]?\/Auto\s*basal[^0-9]{0,15}(\d+[,.]\d+)U\s*\((\d+)%\)/gi)];
  let basal_amount = null, basal_ratio = null, basal_amount_B = null, basal_ratio_B = null;
  if (basalMatches.length >= 2) {
    basal_amount = pf(basalMatches[basalMatches.length - 1][1]);
    basal_ratio = pi(basalMatches[basalMatches.length - 1][2]);
    basal_amount_B = pf(basalMatches[0][1]);
    basal_ratio_B = pi(basalMatches[0][2]);
  } else if (basalMatches.length === 1) {
    basal_amount = pf(basalMatches[0][1]);
    basal_ratio = pi(basalMatches[0][2]);
  }

  // Quantité de bolus
  const bolusAmountMatches = [...t.matchAll(/Quantit[eé]\s*de\s*bolus[^0-9]{0,15}(\d+[,.]\d+)U\s*\((\d+)%\)/gi)];
  let bolus_amount = null, bolus_ratio = null, bolus_amount_B = null, bolus_ratio_B = null;
  if (bolusAmountMatches.length >= 2) {
    bolus_amount = pf(bolusAmountMatches[bolusAmountMatches.length - 1][1]);
    bolus_ratio = pi(bolusAmountMatches[bolusAmountMatches.length - 1][2]);
    bolus_amount_B = pf(bolusAmountMatches[0][1]);
    bolus_ratio_B = pi(bolusAmountMatches[0][2]);
  } else if (bolusAmountMatches.length === 1) {
    bolus_amount = pf(bolusAmountMatches[0][1]);
    bolus_ratio = pi(bolusAmountMatches[0][2]);
  }

  // Dose bolus correction auto
  const autoCorrMatches = [...t.matchAll(/Dose\s*bolus\s*corr\.?\s*auto[^0-9]{0,15}(\d+[,.]\d+)U\s*\((\d+)%\)/gi)];
  let auto_correction = null, auto_correction_pct = null;
  if (autoCorrMatches.length > 0) {
    auto_correction = pf(autoCorrMatches[autoCorrMatches.length - 1][1]);
    auto_correction_pct = pi(autoCorrMatches[autoCorrMatches.length - 1][2]);
  }

  // Glucides quotidiens
  const carbsMatches = [...t.matchAll(/Glucides?\s*saisis[^0-9]{0,30}(\d+)\s*[±]\s*(\d+)\s*g\s*\/\s*(\d+[,.]\d+)/gi)];
  let avg_daily_carbs = null, carbs_sd = null, meals_per_day = null;
  if (carbsMatches.length > 0) {
    avg_daily_carbs = pi(carbsMatches[carbsMatches.length - 1][1]);
    carbs_sd = pi(carbsMatches[carbsMatches.length - 1][2]);
    meals_per_day = pf(carbsMatches[carbsMatches.length - 1][3]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DURÉE DANS LA CIBLE (TIR)
  // ══════════════════════════════════════════════════════════════════════════
  
  let time_above = null, time_in_range = null, time_below = null;
  let time_very_high = null, time_very_low = null;

  // Chercher les pourcentages dans la section "Durée dans la cible"
  const tirSection = t.match(/Dur[eé]e\s*dans\s*la\s*cible([\s\S]{0,800})/i)?.[1] ?? '';
  const tirPcts = [...tirSection.matchAll(/(\d+)\s*%/g)]
    .map((m) => pi(m[1]))
    .filter((v) => v !== null && v >= 0 && v <= 100);

  // Les pourcentages typiques dans CareLink sont : très haut, haut, cible, bas, très bas
  // Ou simplement : haut, cible, bas
  for (let i = 0; i + 2 < tirPcts.length; i++) {
    const [a, b, c] = [tirPcts[i], tirPcts[i + 1], tirPcts[i + 2]];
    if (a + b + c >= 96 && a + b + c <= 104) {
      time_above = a;
      time_in_range = b;
      time_below = c;
      break;
    }
  }

  // Chercher les 5 catégories si disponibles
  const fiveCatMatch = t.match(/(\d+)\s*%[^%]*(\d+)\s*%[^%]*(\d+)\s*%[^%]*(\d+)\s*%[^%]*(\d+)\s*%/);
  if (fiveCatMatch) {
    const cats = [pi(fiveCatMatch[1]), pi(fiveCatMatch[2]), pi(fiveCatMatch[3]), pi(fiveCatMatch[4]), pi(fiveCatMatch[5])];
    const sum = cats.reduce((a,b) => a+b, 0);
    if (sum >= 96 && sum <= 104) {
      time_very_high = cats[0];
      time_above = cats[1];
      time_in_range = cats[2];
      time_below = cats[3];
      time_very_low = cats[4];
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TENDANCES HYPER/HYPO
  // ══════════════════════════════════════════════════════════════════════════
  
  // Tendances hyperglycémiques
  const hyperPatterns = [];
  const hyperMatch = t.match(/Tendances?\s*hyperglycémiques?\s*\((\d+)\)([\s\S]{0,800})/i);
  const hyper_count = hyperMatch ? pi(hyperMatch[1]) : 0;
  if (hyperMatch) {
    const slots = [...hyperMatch[2].matchAll(/(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})[^(]{0,30}\((\d+)\s*occurrence/gi)];
    for (const m of slots) {
      hyperPatterns.push({
        time_slot: m[1].trim(),
        occurrences: pi(m[2]),
        probable_cause: inferCause(m[1].trim()),
      });
    }
  }

  // Tendances hypoglycémiques
  const hypoPatterns = [];
  const hypoMatch = t.match(/Tendances?\s*hypoglycémiques?\s*\((\d+)\)([\s\S]{0,800})/i);
  const hypo_count = hypoMatch ? pi(hypoMatch[1]) : 0;
  if (hypoMatch && hypo_count > 0) {
    const slots = [...hypoMatch[2].matchAll(/(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})[^(]{0,30}\((\d+)\s*occurrence/gi)];
    for (const m of slots) {
      hypoPatterns.push({
        time_slot: m[1].trim(),
        occurrences: pi(m[2]),
        probable_cause: inferHypoCause(m[1].trim()),
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SORTIES SMARTGUARD (raisons)
  // ══════════════════════════════════════════════════════════════════════════
  
  const smartguardExits = {
    no_sensor_value: pi(t.match(/Aucune\s*valeur\s*gluc\.?\s*capteur[^0-9]*(\d+)/i)?.[1]) ?? 0,
    sensor_end_of_life: pi(t.match(/Capteur\s*en\s*fin\s*de\s*vie[^0-9]*(\d+)/i)?.[1]) ?? 0,
    extended_temp_stop: pi(t.match(/Arr[êe]t\s*temp\.?\s*prolong[eé][^0-9]*(\d+)/i)?.[1]) ?? 0,
    user_disabled: pi(t.match(/SmartGuard\s*d[eé]sactiv[eé]\s*par\s*l['']utilisateur[^0-9]*(\d+)/i)?.[1]) ?? 0,
    sensor_init: pi(t.match(/Initialisation\s*SmartGuard[^0-9]*(\d+)/i)?.[1]) ?? 0,
    admin_max: pi(t.match(/Admin\.?\s*max\.?\s*SmartGuard[^0-9]*(\d+)/i)?.[1]) ?? 0,
    admin_min: pi(t.match(/Admin\.?\s*min\.?\s*SmartGuard[^0-9]*(\d+)/i)?.[1]) ?? 0,
    calibration_required: pi(t.match(/Glyc[eé]mie\s*requise\s*pour\s*SmartGuard[^0-9]*(\d+)/i)?.[1]) ?? 0,
    sensor_too_low: pi(t.match(/Algorithme\s*du\s*capteur\s*trop\s*bas[^0-9]*(\d+)/i)?.[1]) ?? 0,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ALERTES GLUCOSE
  // ══════════════════════════════════════════════════════════════════════════
  
  const glucoseAlertsMatch = t.match(/Al\.?\s*glu\.?\s*capt\.?\s*ba\.?\/ht\.?\s*\([^)]+\)\s*(\d+[,.]\d+)\s*\/\s*(\d+[,.]\d+)/i);
  const glucose_alerts = glucoseAlertsMatch ? {
    low_per_day: pf(glucoseAlertsMatch[1]),
    high_per_day: pf(glucoseAlertsMatch[2])
  } : null;

  // ════════════════════════════════════════════════════════════════════���═════
  // RÉGLAGES DE L'APPAREIL (POMPE)
  // ══════════════════════════════════════════════════════════════════════════
  
  const pumpSettings = {
    // Objectif SmartGuard
    smartguard_target: pi(t.match(/Objectif\s*SmartGuard[^0-9]*(\d+)\s*mg\/dL/i)?.[1]) ?? 
                       pi(t.match(/Objectif[^0-9]*(\d+)\s*mg\/dL/i)?.[1]),
    smartguard_enabled: /SmartGuard\s*Oui/i.test(t),
    auto_correction_enabled: /Bolus\s*de\s*correc\.?\s*auto\s*Oui/i.test(t),
    
    // Durée insuline active
    insulin_duration: t.match(/Dur[eé]e\s*ins\.?\s*active[^0-9]*(\d+:\d+)/i)?.[1] ?? 
                     t.match(/(\d+:\d+)\s*h?\s*Dur[eé]e\s*insuline/i)?.[1],
    
    // Bolus maximum
    max_bolus: pf(t.match(/Bolus\s*maximum[^0-9]*(\d+[,.]\d+)\s*U/i)?.[1]),
    
    // Débit basal maximum
    max_basal_rate: pf(t.match(/D[eé]bit\s*basal\s*maximum[^0-9]*(\d+[,.]\d+)\s*U\/H/i)?.[1]),
    
    // Débit basal manuel programmé sur 24h
    programmed_24h_basal: pf(t.match(/D[eé]bit\s*basal\s*manuel\s*programm[eé][^0-9]*(\d+[,.]\d+)U/i)?.[1]),
    
    // Incrément bolus
    bolus_increment: pf(t.match(/Incr[eé]ment\s*bolus[^0-9]*(\d+[,.]\d+)\s*U/i)?.[1]),
    
    // Assistant bolus activé
    bolus_wizard_enabled: /Assistant\s*bolus\s*Oui/i.test(t),
    
    // Rappel remplacement cathéter
    catheter_reminder_days: pi(t.match(/Remplacer\s*cath[eé]ter[^0-9]*(\d+)\s*j/i)?.[1]),
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RATIOS GLUCIDES/INSULINE (par période)
  // ══════════════════════════════════════════════════════════════════════════
  
  const carbRatios = [];
  const ratioMatches = [...t.matchAll(/(\d+[,.]\d+|\d+)\s*(\d{1,2}:\d{2})/gi)];
  // Pattern plus spécifique pour les ratios horaires
  const ratioSection = t.match(/Ratio\s*glucides\s*\(g\/U\)([\s\S]{0,500})/i)?.[1] ?? '';
  const ratioPattern = /(\d+[,.]\d+)\s*(\d{1,2}:\d{2})/g;
  let ratioMatch;
  while ((ratioMatch = ratioPattern.exec(ratioSection)) !== null) {
    carbRatios.push({
      ratio: pf(ratioMatch[1]),
      time: ratioMatch[2]
    });
  }
  
  // Si aucun ratio trouvé, essayer le format alternatif
  if (carbRatios.length === 0) {
    const altRatioPattern = /(\d{1,2}:\d{2})\s*(\d+[,.]\d+)/g;
    while ((ratioMatch = altRatioPattern.exec(t)) !== null) {
      if (pf(ratioMatch[2]) > 0 && pf(ratioMatch[2]) < 20) {
        carbRatios.push({
          time: ratioMatch[1],
          ratio: pf(ratioMatch[2])
        });
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROFIL BASAL (débits horaires)
  // ══════════════════════════════════════════════════════════════════════════
  
  const basalProfile = [];
  const basalSection = t.match(/Sch[eé]ma\s*1\s*\(actif\)([\s\S]{0,600})/i)?.[1] ?? '';
  const basalPattern = /(\d+[,.]\d+)\s*(\d{1,2}:\d{2})/g;
  let basalMatch;
  while ((basalMatch = basalPattern.exec(basalSection)) !== null) {
    const rate = pf(basalMatch[1]);
    if (rate > 0 && rate < 10) {
      basalProfile.push({
        rate: rate,
        time: basalMatch[2]
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SENSIBILITÉ À L'INSULINE
  // ══════════════════════════════════════════════════════════════════════════
  
  const insulinSensitivity = [];
  const sensSection = t.match(/Sensibilit[eé]\s*insul\.?([\s\S]{0,400})/i)?.[1] ?? '';
  const sensPattern = /(\d{1,2}:\d{2})\s*(\d+)/g;
  let sensMatch;
  while ((sensMatch = sensPattern.exec(sensSection)) !== null) {
    const sens = pi(sensMatch[2]);
    if (sens > 10 && sens < 500) {
      insulinSensitivity.push({
        time: sensMatch[1],
        factor: sens
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RÉSUMÉ DES REPAS
  // ══════════════════════════════════════════════════════════════════════════
  
  const mealSummary = {
    breakfast: extractMealStats(t, 'Petit-d[eé]j', '06:00', '10:00'),
    lunch: extractMealStats(t, 'D[eé]jeuner', '11:00', '15:00'),
    dinner: extractMealStats(t, 'D[îi]ner', '16:00', '22:00'),
    overnight: extractMealStats(t, 'Pendant la nuit', '22:00', '06:00'),
  };

  // ══════════════════════════════════════════════════════════════════════════
  // UTILISATION (événements de bolus, purges, etc.)
  // ══════════════════════════════════════════════════════════════════════════
  
  const usage = {
    // Bolus avec repas par jour
    bolus_with_meal_per_day: pf(t.match(/Avec\s*repas[^0-9]*(\d+[,.]\d+)\/jour/i)?.[1]),
    // Bolus avec correction par jour
    bolus_with_correction_per_day: pf(t.match(/Avec\s*correction[^0-9]*(\d+[,.]\d+)\/jour/i)?.[1]),
    // Bolus manuels par jour
    manual_bolus_per_day: pf(t.match(/Bolus\s*manuels[^0-9]*(\d+[,.]\d+)\/jour/i)?.[1]),
    // Mesures de glycémie par jour
    bg_readings_per_day: pf(t.match(/Mesures\s*de\s*glyc[eé]mie[^0-9]*(\d+[,.]\d+)\/jour/i)?.[1]),
    // Durée totale du capteur
    total_sensor_duration: t.match(/(\d+j\s*\d+h\s*\d+m)/i)?.[1],
    // Purges canule
    cannula_primes: pi(t.match(/Purges\s*canule[^0-9]*(\d+)/i)?.[1]),
    // Purges tubulure
    tubing_primes: pi(t.match(/Purges\s*tubulure[^0-9]*(\d+)/i)?.[1]),
    // Volume des purges
    prime_volume: pf(t.match(/Volume\s*des\s*purg\.?[^0-9]*(\d+[,.]\d+)U/i)?.[1]),
    // Arrêt hypo
    hypo_stops: /Arr[êe]t\s*hypo/i.test(t),
    // Arrêt avant hypo
    pre_hypo_stops: /Arr[êe]t\s*avant\s*hypo/i.test(t),
  };

  // ═════════════════════════════════════════════════════════════════��════════
  // REMPLACEMENT CATHÉTER/RÉSERVOIR
  // ══════════════════════════════════════════════════════════════════════════
  
  const catheterMatch = t.match(/Remplacement\s*du\s*cath[eé]ter\/r[eé]servoir[^0-9]*(\d+[,.]\d+)\s*\/\s*(\d+[,.]\d+)\s*j/i);
  const catheterReplacement = catheterMatch ? {
    catheter_days: pf(catheterMatch[1]),
    reservoir_days: pf(catheterMatch[2])
  } : null;

  // ══════════════════════════════════════════════════════════════════════════
  // DONNÉES JOURNALIÈRES (Rapport Carnet)
  // ══════════════════════════════════════════════════════════════════════════
  
  const dailyData = extractDailyData(t);

  // ══════════════════════════════════════════════════════════════════════════
  // ALERTES ET RÉGLAGES HYPO/HYPER
  // ══════════════════════════════════════════════════════════════════════════
  
  const alertSettings = {
    hypo_threshold: pi(t.match(/Faible\s*\(mg\/dL\)[^0-9]*(\d+)/i)?.[1]) ?? 70,
    hyper_threshold: pi(t.match(/Haut\s*\(mg\/dL\)[^0-9]*(\d+)/i)?.[1]) ?? 180,
    urgent_low: pi(t.match(/Avant\s*hypo[^0-9]*(\d+)/i)?.[1]) ?? 55,
    rise_rate_alert: pi(t.match(/Lim\.?\s*vit\.?\s*mont[eé]e[^0-9]*(\d+)/i)?.[1]),
    hyper_reminder_enabled: /Alertes?\s*hyper[^N]*Oui/i.test(t),
    hypo_reminder_enabled: /Alertes?\s*hypo[^N]*Oui/i.test(t),
  };

  // ═════════════════════════════���════════════════════════════════════════════
  // ANALYSE CLINIQUE
  // ══════════════════════════════════════════════════════════════════════════

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
  if (smartguardExits.admin_max > 2) score += 1;

  const status = score >= 6 ? 'critique' : score >= 2 ? 'moyen' : 'bon';

  // ── Key findings ──────────────────────────────────────────────────────────
  const key_findings = [];

  if (gmi != null)
    key_findings.push(
      `GMI de ${gmi}% (cible < 7%). ` +
        (gmi > 8
          ? 'Niveau critique — HbA1c estimée très élevée.'
          : gmi > 7
          ? 'Amélioration nécessaire.'
          : 'Dans la cible !')
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

  if (smartguardExits.admin_max > 0)
    key_findings.push(
      `SmartGuard a atteint son plafond d'insuline ${smartguardExits.admin_max} fois — ` +
        'signe que le débit basal manuel est probablement sous-dosé.'
    );

  if (cv != null && cv > 36)
    key_findings.push(
      `Coefficient de variation élevé (${cv}%) — glycémies instables.`
    );

  if (auto_correction != null && auto_correction_pct != null)
    key_findings.push(
      `Bolus correction auto : ${auto_correction}U/jour (${auto_correction_pct}% du bolus total).`
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

  if (smartguardExits.admin_max > 0)
    recommendations.push({
      category: 'Débits basaux',
      priority: 'haute',
      explanation:
        `SmartGuard a atteint son plafond ${smartguardExits.admin_max} fois. ` +
        "L'algorithme essaie de corriger mais est limité. " +
        'Demandez à votre équipe soignante de revoir les débits basaux programmés.',
      current_value: `${smartguardExits.admin_max} dépassement(s)`,
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
        'Revoyez les débits basaux avec votre diabétologue.',
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

  if (meals_per_day != null && meals_per_day < 2)
    recommendations.push({
      category: 'Repas',
      priority: 'moyenne',
      explanation:
        `Seulement ${meals_per_day} repas/jour enregistré(s) en moyenne. ` +
        'Saisissez tous vos glucides pour que SmartGuard puisse anticiper.',
      current_value: `${meals_per_day} repas/jour`,
      suggested_value: '≥ 3 repas/jour',
    });

  if (hyper_count > 3)
    recommendations.push({
      category: 'Tendances hyperglycémiques',
      priority: 'moyenne',
      explanation:
        `${hyper_count} tendances hyperglycémiques détectées. ` +
        'Analysez les créneaux horaires récurrents pour ajuster les ratios ou bolus.',
      current_value: `${hyper_count} tendances`,
      suggested_value: '0-2 tendances',
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
  if (smartguard_pct != null && smartguard_pct >= 70)
    positive_points.push(`SmartGuard actif ${smartguard_pct}% du temps — bonne utilisation de l'algorithme.`);
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
    exits: smartguardExits,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // COMPARAISON DES PÉRIODES A/B
  // ══════════════════════════════════════════════════════════════════════════
  
  const periodComparison = (periodA && periodB) ? {
    periodA: {
      ...periodA,
      gmi,
      avg_glucose,
      cv,
      sensor_wear,
      smartguard_pct,
      mode_manuel_pct,
      total_daily_insulin,
      basal_ratio,
    },
    periodB: {
      ...periodB,
      gmi: gmiPeriodB,
      avg_glucose: avg_glucose_B,
      cv: cv_B,
      sensor_wear: sensor_wear_B,
      smartguard_pct: smartguard_pct_B,
      mode_manuel_pct: mode_manuel_pct_B,
      total_daily_insulin: total_daily_insulin_B,
      basal_ratio: basal_ratio_B,
    },
    trends: computeTrends({
      gmi, gmiB: gmiPeriodB,
      avg_glucose, avg_glucoseB: avg_glucose_B,
      cv, cvB: cv_B,
      sensor_wear, sensor_wearB: sensor_wear_B,
      smartguard_pct, smartguard_pctB: smartguard_pct_B,
    })
  } : null;

  return {
    // Infos générales
    patient_name: patientName,
    pump_model: pumpModel,
    serial_number: serialNumber,
    report_created: reportCreatedDate,
    period,
    status,
    next_steps,
    
    // Statistiques principales
    summary: {
      avg_glucose,
      glucose_sd,
      gmi,
      time_in_range,
      time_above,
      time_below,
      time_very_high,
      time_very_low,
      sensor_wear,
      cv,
      total_daily_insulin,
      basal_amount,
      basal_ratio,
      bolus_amount,
      bolus_ratio,
      auto_correction,
      auto_correction_pct,
      avg_daily_carbs,
      carbs_sd,
      meals_per_day,
      smartguard_pct,
      mode_manuel_pct,
    },
    
    // Analyses
    key_findings,
    recommendations,
    positive_points,
    hyperglycemia_patterns: hyperPatterns,
    hypoglycemia_patterns: hypoPatterns,
    hyper_count,
    hypo_count,
    sensor_analysis,
    smartguard_analysis,
    glucose_alerts,
    
    // Réglages pompe
    pump_settings: pumpSettings,
    carb_ratios: carbRatios,
    basal_profile: basalProfile,
    insulin_sensitivity: insulinSensitivity,
    alert_settings: alertSettings,
    
    // Données repas
    meal_summary: mealSummary,
    
    // Utilisation
    usage,
    catheter_replacement: catheterReplacement,
    smartguard_exits: smartguardExits,
    
    // Données journalières
    daily_data: dailyData,
    
    // Comparaison des périodes
    period_comparison: periodComparison,
  };
}

// ─── Extraction des stats de repas ────────────────────────────────────────────

function extractMealStats(text, mealName, startTime, endTime) {
  const section = text.match(new RegExp(`${mealName}[^0-9]{0,50}(\\d+[,.]\\d+|\\d+)\\s*[±]?\\s*(\\d+)?\\s*g[^0-9]{0,20}(\\d+[,.]\\d+)\\s*U`, 'i'));
  if (!section) return null;
  
  return {
    avg_carbs: pf(section[1]),
    carbs_sd: section[2] ? pi(section[2]) : null,
    avg_insulin: pf(section[3]),
    time_range: `${startTime} - ${endTime}`,
  };
}

// ─── Extraction des données journalières ──────────────────────────────────────

function extractDailyData(text) {
  const days = [];
  
  // Pattern pour les jours de la semaine avec date
  const dayPatterns = [
    /Lundi\s*(\d{2}\/\d{2}\/\d{4})/gi,
    /Mardi\s*(\d{2}\/\d{2}\/\d{4})/gi,
    /Mercredi\s*(\d{2}\/\d{2}\/\d{4})/gi,
    /Jeudi\s*(\d{2}\/\d{2}\/\d{4})/gi,
    /Vendredi\s*(\d{2}\/\d{2}\/\d{4})/gi,
    /Samedi\s*(\d{2}\/\d{2}\/\d{4})/gi,
    /Dimanche\s*(\d{2}\/\d{2}\/\d{4})/gi,
  ];
  
  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  // Chercher les données journalières dans le rapport carnet
  const carnetSection = text.match(/Rapport\s*Carnet([\s\S]*?)(?=Page\s*\d+|$)/i)?.[1] ?? '';
  
  // Pattern pour extraire les stats quotidiennes
  // Format: "Glyc. moy. (X) : YYYmg/dL Glucid. : ZZZg Bolus : AA%Insuline : BB.BU"
  const dailyPattern = /Glyc\.?\s*moy\.?\s*\((\d+)\)\s*:\s*(\d+|--)\s*mg\/dL[^G]*Glucid\.?\s*:\s*(\d+|--)\s*g[^B]*Bolus\s*:\s*(\d+|--)\s*%[^I]*Insuline\s*:\s*(\d+[,.]\d+|--)\s*U/gi;
  
  let match;
  while ((match = dailyPattern.exec(text)) !== null) {
    days.push({
      bg_readings: pi(match[1]),
      avg_glucose: match[2] !== '--' ? pi(match[2]) : null,
      carbs: match[3] !== '--' ? pi(match[3]) : null,
      bolus_ratio: match[4] !== '--' ? pi(match[4]) : null,
      total_insulin: match[5] !== '--' ? pf(match[5]) : null,
    });
  }
  
  // Chercher aussi les données de TIR journalier
  const tirDailyPattern = /Durée\s*dans\s*la\s*cible[^%]*?(\d+)\s*%[^%]*(\d+)\s*%[^%]*(\d+)\s*%/gi;
  let tirIndex = 0;
  while ((match = tirDailyPattern.exec(text)) !== null && tirIndex < days.length) {
    if (days[tirIndex]) {
      days[tirIndex].time_above = pi(match[1]);
      days[tirIndex].time_in_range = pi(match[2]);
      days[tirIndex].time_below = pi(match[3]);
    }
    tirIndex++;
  }
  
  return days.length > 0 ? days : null;
}

// ─── Calcul des tendances entre périodes ──────────────────────────────────────

function computeTrends(data) {
  const trends = {};
  
  if (data.gmi != null && data.gmiB != null) {
    trends.gmi = {
      change: +(data.gmi - data.gmiB).toFixed(1),
      direction: data.gmi < data.gmiB ? 'amélioration' : data.gmi > data.gmiB ? 'dégradation' : 'stable'
    };
  }
  
  if (data.avg_glucose != null && data.avg_glucoseB != null) {
    trends.avg_glucose = {
      change: data.avg_glucose - data.avg_glucoseB,
      direction: data.avg_glucose < data.avg_glucoseB ? 'amélioration' : data.avg_glucose > data.avg_glucoseB ? 'dégradation' : 'stable'
    };
  }
  
  if (data.cv != null && data.cvB != null) {
    trends.cv = {
      change: +(data.cv - data.cvB).toFixed(1),
      direction: data.cv < data.cvB ? 'amélioration' : data.cv > data.cvB ? 'dégradation' : 'stable'
    };
  }
  
  if (data.sensor_wear != null && data.sensor_wearB != null) {
    trends.sensor_wear = {
      change: data.sensor_wear - data.sensor_wearB,
      direction: data.sensor_wear > data.sensor_wearB ? 'amélioration' : data.sensor_wear < data.sensor_wearB ? 'dégradation' : 'stable'
    };
  }
  
  if (data.smartguard_pct != null && data.smartguard_pctB != null) {
    trends.smartguard = {
      change: data.smartguard_pct - data.smartguard_pctB,
      direction: data.smartguard_pct > data.smartguard_pctB ? 'amélioration' : data.smartguard_pct < data.smartguard_pctB ? 'dégradation' : 'stable'
    };
  }
  
  return trends;
}

// ─── Inférence de cause par créneau horaire (hyperglycémie) ───────────────────

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

// ─── Inférence de cause par créneau horaire (hypoglycémie) ────────────────────

function inferHypoCause(timeSlot) {
  const h = parseInt(timeSlot.split(':')[0], 10);
  if (h >= 0 && h < 6)
    return "Hypoglycémie nocturne — débit basal de nuit peut-être trop élevé ou dîner trop copieux.";
  if (h >= 6 && h < 10)
    return "Hypoglycémie matinale — vérifiez le débit basal du matin ou l'impact du petit-déjeuner de la veille.";
  if (h >= 10 && h < 14)
    return "Hypoglycémie pré-déjeuner — bolus du matin peut-être trop important ou activité physique.";
  if (h >= 14 && h < 18)
    return "Hypoglycémie d'après-midi — activité physique ou ratio déjeuner trop agressif.";
  if (h >= 18 && h < 22)
    return "Hypoglycémie du soir — vérifiez l'activité physique ou le ratio du goûter/dîner.";
  return "Hypoglycémie tardive — possible effet de l'insuline du dîner ou collation du soir.";
}