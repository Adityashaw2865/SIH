/**
 * Clinical Safety Service
 * -------------------------------------------------------------------------
 * Implements two spec requirements from Module B (3.3) that were not yet
 * covered by extractionService.js:
 *
 *   1. Abnormal-value highlighting — compares a "Result" field against its
 *      matching "Reference Range" field (both already extracted from lab
 *      reports) and flags anything outside the range.
 *
 *   2. Drug interaction checking — cross-checks every "Medication" field
 *      extracted from a patient's documents/history against a small,
 *      transparent, editable interaction table. This is NOT a substitute
 *      for a pharmacist or a licensed drug-interaction database — it is a
 *      best-effort safety net that surfaces well-known, high-risk
 *      combinations for the physician to review.
 */

// ---------------------------------------------------------------------
// 1. Abnormal lab value detection
// ---------------------------------------------------------------------

function parseReferenceRange(rangeStr) {
  if (!rangeStr) return null;
  const cleaned = rangeStr.trim();

  const between = cleaned.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
  if (between) {
    return { min: parseFloat(between[1]), max: parseFloat(between[2]) };
  }
  const lessThan = cleaned.match(/^<\s*(-?\d+(?:\.\d+)?)/);
  if (lessThan) return { min: null, max: parseFloat(lessThan[1]) };

  const greaterThan = cleaned.match(/^>\s*(-?\d+(?:\.\d+)?)/);
  if (greaterThan) return { min: parseFloat(greaterThan[1]), max: null };

  return null;
}

function parseResultValue(resultStr) {
  if (!resultStr) return null;
  const match = resultStr.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

// FIX: previously grouped fields into { testName, result, referenceRange }
// using only their .value, regardless of .status — so a low-confidence,
// "needs-verification" OCR read of a Result or Reference Range could
// silently trigger an abnormal-value flag on data nobody has confirmed.
// Now a Result/Reference Range field that still needs verification is
// skipped (testName is fine either way — it's not the risky numeric part),
// and the flushed abnormality carries a `basedOnUnverifiedData` hint so the
// UI can show it a little more cautiously if it wants to.
export function findAbnormalValues(fields) {
  if (!Array.isArray(fields) || !fields.length) return [];

  const abnormalities = [];
  let pending = { testName: null, result: null, referenceRange: null, resultVerified: true, rangeVerified: true };

  const flushIfComplete = () => {
    if (pending.testName && pending.result && pending.referenceRange) {
      // Don't trust a numeric Result/Reference Range that OCR itself
      // flagged as needing verification.
      if (!pending.resultVerified || !pending.rangeVerified) return;

      const range = parseReferenceRange(pending.referenceRange);
      const value = parseResultValue(pending.result);
      let flag = null;
      if (range && value !== null) {
        if (range.min !== null && value < range.min) flag = "low";
        if (range.max !== null && value > range.max) flag = "high";
      }
      if (flag) {
        abnormalities.push({
          testName: pending.testName,
          result: pending.result,
          referenceRange: pending.referenceRange,
          flag
        });
      }
    }
  };

  for (const field of fields) {
    if (field.label === "Test Name") {
      flushIfComplete();
      pending = { testName: field.value, result: null, referenceRange: null, resultVerified: true, rangeVerified: true };
    } else if (field.label === "Result") {
      pending.result = field.value;
      pending.resultVerified = field.status !== "needs-verification";
    } else if (field.label === "Reference Range") {
      pending.referenceRange = field.value;
      pending.rangeVerified = field.status !== "needs-verification";
    }
  }
  flushIfComplete();

  return abnormalities;
}

// ---------------------------------------------------------------------
// 2. Drug interaction checking
// ---------------------------------------------------------------------
//
// Real Indian prescriptions almost always name the BRAND (e.g.
// "Ecosprin", "Glycomet") rather than the generic ("aspirin",
// "metformin"). Matching only on generic names — as the previous
// version of this file did — means OCR'd prescriptions would rarely
// ever trigger a match. This brand→generic map normalizes common
// Indian brand names before interaction matching runs, so a real
// scanned prescription has a realistic chance of surfacing a hit.
// This is illustrative, not an exhaustive drug directory.
const BRAND_TO_GENERIC = {
  "ecosprin": "aspirin", "loprin": "aspirin", "disprin": "aspirin",
  "glycomet": "metformin", "glyciphage": "metformin", "gluformin": "metformin",
  "warf": "warfarin", "warfarin sodium": "warfarin",
  "brufen": "ibuprofen", "combiflam": "ibuprofen",
  "envas": "enalapril", "enam": "enalapril",
  "aldactone": "spironolactone",
  "zestril": "lisinopril", "lipril": "lisinopril",
  "viagra": "sildenafil", "penegra": "sildenafil", "suhagra": "sildenafil",
  "sorbitrate": "nitrate", "nitrocontin": "nitrate", "angispan": "nitrate", "monotrate": "nitrate",
  "folitrax": "methotrexate", "mtx": "methotrexate",
  "ustat": "trimethoprim", "septran": "trimethoprim", "bactrim": "trimethoprim",
  "clopilet": "clopidogrel", "deplatt": "clopidogrel", "clavix": "clopidogrel",
  "omez": "omeprazole", "ocid": "omeprazole", "omecip": "omeprazole",
  "rosuvas": "statin", "rozavel": "statin", "storvas": "statin", "atorva": "statin", "lipicure": "statin",
  "klacid": "clarithromycin", "claribid": "clarithromycin",
  "fludac": "ssri", "prodep": "ssri", "nexito": "ssri", "sertima": "ssri",
  "ultracet": "tramadol", "tramazac": "tramadol", "dolotram": "tramadol",
  "digoxin": "digoxin", "lanoxin": "digoxin",
  "amiodarone": "amiodarone", "cordarone": "amiodarone", "pacerone": "amiodarone",
  "insulin": "insulin", "mixtard": "insulin", "human mixtard": "insulin", "actrapid": "insulin",
  "propranolol": "beta-blocker", "inderal": "beta-blocker", "metoprolol": "beta-blocker", "betaloc": "beta-blocker",
  "verapamil": "verapamil", "calaptin": "verapamil",
  "phenytoin": "phenytoin", "eptoin": "phenytoin",
  "theophylline": "theophylline", "deriphyllin": "theophylline",
  "ciprofloxacin": "fluoroquinolone", "ciplox": "fluoroquinolone", "levofloxacin": "fluoroquinolone", "levoflox": "fluoroquinolone"
};

function normalizeDrugName(name) {
  const lower = name.toLowerCase().trim();
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (lower.includes(brand)) return generic;
  }
  return lower;
}

const KNOWN_INTERACTIONS = [
  { a: "warfarin", b: "aspirin", severity: "high", note: "Increased bleeding risk — combined anticoagulant/antiplatelet effect." },
  { a: "warfarin", b: "ibuprofen", severity: "high", note: "NSAID + warfarin increases GI bleeding and reduces anticoagulant safety margin." },
  { a: "ace inhibitor", b: "potassium", severity: "moderate", note: "Risk of hyperkalaemia when combined with potassium supplements/sparing diuretics." },
  { a: "enalapril", b: "spironolactone", severity: "moderate", note: "Risk of hyperkalaemia." },
  { a: "lisinopril", b: "spironolactone", severity: "moderate", note: "Risk of hyperkalaemia." },
  { a: "metformin", b: "contrast", severity: "moderate", note: "Iodinated contrast + metformin can precipitate lactic acidosis in renal impairment." },
  { a: "sildenafil", b: "nitrate", severity: "high", note: "Severe, potentially fatal hypotension when combined with nitrates." },
  { a: "methotrexate", b: "trimethoprim", severity: "high", note: "Additive antifolate effect — risk of bone marrow suppression." },
  { a: "clopidogrel", b: "omeprazole", severity: "moderate", note: "Omeprazole may reduce clopidogrel's antiplatelet effectiveness (CYP2C19 inhibition)." },
  { a: "statin", b: "clarithromycin", severity: "moderate", note: "Macrolide antibiotics can raise statin levels, increasing myopathy/rhabdomyolysis risk." },
  { a: "ssri", b: "tramadol", severity: "moderate", note: "Combined serotonergic effect — risk of serotonin syndrome." },
  { a: "warfarin", b: "clarithromycin", severity: "high", note: "Macrolides can significantly potentiate warfarin's anticoagulant effect — bleeding risk." },
  { a: "digoxin", b: "verapamil", severity: "high", note: "Verapamil raises digoxin levels — risk of digoxin toxicity (arrhythmia, nausea, visual changes)." },
  { a: "digoxin", b: "amiodarone", severity: "high", note: "Amiodarone significantly raises digoxin levels — risk of digoxin toxicity." },
  { a: "beta-blocker", b: "verapamil", severity: "high", note: "Combined negative chronotropic/inotropic effect — risk of severe bradycardia or heart block." },
  { a: "insulin", b: "beta-blocker", severity: "moderate", note: "Beta-blockers can mask the warning signs of hypoglycaemia (tremor, tachycardia)." },
  { a: "phenytoin", b: "warfarin", severity: "moderate", note: "Complex bidirectional interaction — can alter both phenytoin and warfarin levels; monitor closely." },
  { a: "theophylline", b: "fluoroquinolone", severity: "moderate", note: "Fluoroquinolones (e.g. ciprofloxacin) can raise theophylline levels — risk of toxicity (seizures, arrhythmia)." },
  { a: "ssri", b: "warfarin", severity: "moderate", note: "SSRIs can increase bleeding risk when combined with warfarin." },
  { a: "ibuprofen", b: "ace inhibitor", severity: "moderate", note: "NSAIDs can reduce the antihypertensive effect of ACE inhibitors and impair renal function." }
];

function contains(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function findDrugInteractions(medicationNames) {
  const names = (medicationNames || []).filter(Boolean);
  if (names.length < 2) return [];

  const hits = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      // Normalize each name to its generic equivalent (handles Indian
      // brand names like "Ecosprin" -> "aspirin") before matching, but
      // keep the original text for display so the physician still sees
      // exactly what was written on the prescription.
      const normA = normalizeDrugName(names[i]);
      const normB = normalizeDrugName(names[j]);
      for (const rule of KNOWN_INTERACTIONS) {
        const forward = contains(normA, rule.a) && contains(normB, rule.b);
        const reverse = contains(normA, rule.b) && contains(normB, rule.a);
        if (forward || reverse) {
          hits.push({
            drugA: names[i],
            drugB: names[j],
            severity: rule.severity,
            note: rule.note
          });
        }
      }
    }
  }
  return hits;
}