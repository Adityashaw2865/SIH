import { randomUUID } from "crypto";
/** Builds a valid FHIR R4 Patient resource. */
export function buildFhirPatient(p) {
  return {
    resourceType: "Patient",
    id: p.id,
    identifier: p.abha ? [{
      system: "https://healthid.ndhm.gov.in",
      value: p.abha
    }] : [],
    name: [{
      text: p.name
    }],
    gender: p.gender === "M" ? "male" : p.gender === "F" ? "female" : "other",
    birthDate: undefined,
    extension: [{
      url: "http://medikiosk.local/fhir/StructureDefinition/age",
      valueInteger: p.age
    }]
  };
}

/** Builds a valid FHIR R4 Condition resource. */
export function buildFhirCondition(c) {
  return {
    resourceType: "Condition",
    id: randomUUID(),
    clinicalStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "active"
      }]
    },
    verificationStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: "unconfirmed"
      }]
    },
    code: {
      text: c.text
    },
    subject: {
      reference: `Patient/${c.patientId}`
    },
    recordedDate: c.recordedDate || new Date().toISOString().slice(0, 10)
  };
}

/** Builds a valid FHIR R4 MedicationStatement resource. */
export function buildFhirMedicationStatement(m) {
  return {
    resourceType: "MedicationStatement",
    id: randomUUID(),
    status: "active",
    medicationCodeableConcept: {
      text: m.medicationText
    },
    subject: {
      reference: `Patient/${m.patientId}`
    },
    dosage: [{
      text: [m.dosage, m.frequency].filter(Boolean).join(" — ") || undefined
    }]
  };
}

/** Bundles multiple resources into a FHIR Bundle for transmission to a HIS/ABDM sandbox. */
export function buildFhirBundle(resources) {
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: resources.map(r => ({
      resource: r
    }))
  };
}
