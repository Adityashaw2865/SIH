// The patient-facing kiosk always presents "chief complaint" as a fixed
// 9-option dropdown (see frontend PatientIntake.jsx — chestPainFlow,
// feverFlow, stomachPainFlow, headacheFlow, breathlessnessFlow,
// weaknessFlow, injuryFlow, genericFlow all share the same options list).
// Since the input is a closed set, not free text, a direct lookup is both
// faster and more reliable than a keyword-regex or an AI call — every
// possible value maps to exactly one department, deterministically.
const COMPLAINT_TO_DEPARTMENT = {
  "Chest pain": "Cardiology",
  "Breathlessness": "Pulmonology",
  "Stomach pain": "Gastroenterology",
  "Fever": "General Medicine",
  "Headache": "Neurology",
  "Weakness / one-sided body weakness": "Neurology",
  "Injury / bleeding": "Orthopaedics",
  "Knee / joint pain": "Orthopaedics",
  "Something else": "General Medicine"
};

// Returns the best-matching department for a chief complaint string,
// falling back to "General Medicine" for anything unrecognised (e.g. if
// the questionnaire options ever change and this map isn't updated yet).
export function suggestDepartmentForComplaint(complaint) {
  if (!complaint) return null;
  return COMPLAINT_TO_DEPARTMENT[complaint] || "General Medicine";
}

// Picks the best-matching doctor for a chief complaint out of a live list
// of doctors (as fetched from the Staff collection), so the suggestion
// always reflects who's actually registered — no separate roster to keep
// in sync. `doctors` is an array of { id, name, department }.
export function suggestDoctorForComplaint(complaint, doctors) {
  if (!complaint || !doctors?.length) return null;
  const department = suggestDepartmentForComplaint(complaint);
  return doctors.find(d => d.department === department) || null;
}