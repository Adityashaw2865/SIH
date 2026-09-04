/**
 * Extracts structured medical fields from raw OCR text.
 *
 * If GEMINI_API_KEY is set, this calls Google Gemini (free tier) with a strict
 * JSON-only prompt to do real clinical entity extraction. Otherwise it falls
 * back to a transparent rule-based extractor so the pipeline still works
 * end-to-end for demo purposes (fallback confidences are intentionally capped lower).
 */
export async function extractClinicalEntities(ocrText, ocrConfidence) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return extractWithGemini(ocrText, ocrConfidence, apiKey);
  }
  return extractWithRules(ocrText, ocrConfidence);
}

async function extractWithGemini(ocrText, ocrConfidence, apiKey) {
  const prompt = `You are a clinical document extraction system. You will be given raw OCR text from a scanned medical document (prescription, lab report, or discharge summary).

Extract structured fields as a JSON array. Each item must have:
- "label": one of "Diagnosis", "Medication", "Dosage", "Frequency", "Doctor", "Date", "Test Name", "Result", "Reference Range"
- "value": the extracted value as plain text
- "confidence": your confidence 0-100 that this extraction is correct, given OCR noise
- "status": "confirmed" if confidence >= 85, otherwise "needs-verification"

Respond with ONLY the JSON array, no other text, no markdown fences.

OCR text (OCR engine confidence was ${ocrConfidence}%):
"""
${ocrText}
"""`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });
  if (!response.ok) {
    return extractWithRules(ocrText, ocrConfidence);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return extractWithRules(ocrText, ocrConfidence);
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return extractWithRules(ocrText, ocrConfidence);
  }
}

/**
 * Turns the raw "question → answer" pairs recorded during the voice/touch
 * intake interview into a single, physician-readable clinical narrative
 * paragraph (spec 3.3 Module C — structured HPI). If GEMINI_API_KEY is set,
 * Gemini writes the paragraph; otherwise the raw pairs are returned as-is
 * so the summary pipeline still works end-to-end without an API key.
 */
export async function structureNarrative(chiefComplaint, rawAnswerPairs) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!rawAnswerPairs) return rawAnswerPairs;
  if (!apiKey) return rawAnswerPairs;
  try {
    return await structureNarrativeWithGemini(chiefComplaint, rawAnswerPairs, apiKey);
  } catch {
    return rawAnswerPairs;
  }
}

async function structureNarrativeWithGemini(chiefComplaint, rawAnswerPairs, apiKey) {
  const prompt = `You are a clinical documentation assistant. A patient answered intake questions
about their History of Present Illness at an Indian hospital kiosk. Chief complaint: "${chiefComplaint}".

Raw question-answer pairs from the interview:
"""
${rawAnswerPairs}
"""

Rewrite this as a single, concise, physician-ready clinical narrative paragraph (2-4 sentences,
professional clinical tone, third person, no invented facts — only use what's stated above).
Respond with ONLY the paragraph text, no JSON, no markdown, no preamble.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }]
    })
  });
  if (!response.ok) return rawAnswerPairs;
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || rawAnswerPairs;
}

/**
 * Transparent, deterministic fallback extractor — no external calls.
 * Looks for common "Label: value" patterns produced by structured prescriptions
 * and lab reports.
 *
 * FIX: this previously only matched Diagnosis/Medication/Frequency/Doctor/Date
 * — it never produced "Test Name" / "Result" / "Reference Range" / "Dosage",
 * so clinicalSafetyService.findAbnormalValues() could never fire when running
 * without GEMINI_API_KEY. Added those patterns below.
 */
function extractWithRules(ocrText, ocrConfidence) {
  const patterns = [{
    label: "Diagnosis",
    regex: /diagnosis\s*[:\-]\s*(.+)/i
  }, {
    label: "Medication",
    regex: /medication\s*[:\-]\s*(.+)/i
  }, {
    label: "Dosage",
    regex: /dosage\s*[:\-]\s*(.+)/i
  }, {
    label: "Frequency",
    regex: /frequency\s*[:\-]\s*(.+)/i
  }, {
    label: "Doctor",
    regex: /doctor\s*[:\-]\s*(.+)/i
  }, {
    label: "Date",
    regex: /date\s*[:\-]\s*(.+)/i
  }, {
    label: "Test Name",
    regex: /test\s*name\s*[:\-]\s*(.+)/i
  }, {
    label: "Result",
    regex: /result\s*[:\-]\s*(.+)/i
  }, {
    label: "Reference Range",
    regex: /reference\s*range\s*[:\-]\s*(.+)/i
  }];
  const fields = [];
  for (const line of ocrText.split("\n")) {
    for (const p of patterns) {
      const match = line.match(p.regex);
      if (match) {
        const confidence = Math.min(80, Math.round(ocrConfidence * 0.85));
        fields.push({
          label: p.label,
          value: match[1].trim(),
          confidence,
          status: confidence >= 85 ? "confirmed" : "needs-verification"
        });
      }
    }
  }
  return fields;
}