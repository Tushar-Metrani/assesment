const join = (...parts) => parts.filter(Boolean).join(" ");

// Turns the nine-group object into [{ title, rows: [[label, string | string[]]] }]
export function buildSections(d) {
  const p = d.patient_details;
  const hpi = d.history_of_present_illness;
  const sym = d.symptoms;
  const pmh = d.past_medical_history;
  const med = d.medication_history;
  const obs = d.clinical_observations;
  const v = obs.vitals;
  const a = d.assessment;
  const plan = d.plan;

  const symptom = (s) => (s.detail ? `${s.name} (${s.detail})` : s.name);
  const allergies = med.allergies.length
    ? med.allergies.map((x) => (x.reaction ? `${x.substance} — ${x.reaction}` : x.substance))
    : med.allergy_status === "none_reported" ? "None reported" : null;

  return [
    { title: "Patient Details", rows: [
      ["Name", p.name], ["Age", p.age], ["Sex", p.sex],
      ["Identifiers", p.identifiers.map((i) => `${i.type}: ${i.value}`)],
    ]},
    { title: "Chief Complaint", rows: [["Complaint", d.chief_complaint.text]] },
    { title: "History of Present Illness", rows: [
      ["Onset", hpi.onset], ["Duration", hpi.duration], ["Progression", hpi.progression],
      ["Aggravating", hpi.aggravating_factors], ["Relieving", hpi.relieving_factors],
    ]},
    { title: "Symptoms", rows: [
      ["Present", sym.positive.map(symptom)], ["Denied", sym.negative.map(symptom)],
    ]},
    { title: "Past Medical History", rows: [
      ["Conditions", pmh.conditions], ["Surgeries", pmh.surgeries],
      ["Hospitalisations", pmh.hospitalisations],
    ]},
    { title: "Medication History", rows: [
      ["Medications", med.current_medications.map((m) =>
        join(m.name, m.dose, m.frequency) + (m.adherence ? ` — ${m.adherence}` : ""))],
      ["Allergies", allergies],
    ]},
    { title: "Clinical Observations", rows: [
      ["BP", v.bp], ["Heart rate", v.heart_rate], ["Temperature", v.temperature],
      ["Resp. rate", v.resp_rate], ["SpO2", v.spo2], ["Weight", v.weight],
      ["Other vitals", v.other], ["Examination", obs.examination_findings],
    ]},
    { title: "Assessment", rows: [
      ["Diagnosis", a.provisional_diagnosis], ["Differentials", a.differentials],
    ]},
    { title: "Plan", rows: [
      ["Investigations", plan.investigations],
      ["Prescriptions", plan.prescriptions.map((x) =>
        join(x.name, x.dose, x.frequency, x.duration && `for ${x.duration}`))],
      ["Advice", plan.advice], ["Follow-up", plan.follow_up],
    ]},
  ];
}
