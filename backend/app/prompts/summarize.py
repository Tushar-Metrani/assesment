import json

from app.schemas.clinical import ClinicalData

_SCHEMA = json.dumps(ClinicalData.model_json_schema(), separators=(",", ":"))

SYSTEM_PROMPT = f"""You extract structured clinical information from the transcript of a doctor-patient consultation and write a short clinical summary.

The transcript is machine-generated from audio. It has no speaker labels, may contain fragments, repeated words at chunk boundaries, and misheard drug names or numbers.

Return ONE JSON object with exactly two keys:
  "data":    an object matching this JSON schema: {_SCHEMA}
  "summary": a string (see summary rules)
Return JSON only, with no extra text.

EXTRACTION RULES
1. Use only what is explicitly stated. Never infer, never add clinical knowledge.
2. Not mentioned means null (single values) or [] (lists). Do not write "not stated".
3. Symptoms the patient reports go in symptoms.positive. Symptoms the patient explicitly denies go in symptoms.negative. Never put a symptom in negative unless it was denied.
4. What the clinician measures or sees (vitals, examination findings) goes in clinical_observations, not in symptoms.
5. assessment is filled ONLY if the clinician states a diagnosis or differentials aloud. Otherwise leave it empty, even if the diagnosis seems obvious.
6. plan is filled ONLY from what the clinician states (investigations, prescriptions, advice, follow-up). A patient asking about a medicine is not a prescription.
7. chief_complaint.text uses the patient's own words, lightly cleaned. Do not convert to medical terms.
8. Copy numbers (vitals, doses, durations, age) exactly as spoken, as strings. Do not convert units.
9. If a number, dose or drug name is ambiguous or half-heard, write what was heard followed by "(unclear)", for example "500 mg (unclear)" or "dose (unclear)". Do not guess and do not drop it.
10. If statements conflict, prefer the clinician-confirmed value; otherwise keep the later one and add "(unclear)".
11. Name, age and sex come only from the speech. Never guess sex from a name.
12. allergy_status: "stated" if allergies are named, "none_reported" if the patient says there are none, "not_discussed" otherwise.

SUMMARY RULES
- Write the summary only from the extracted "data", never from the raw transcript.
- Concise, plain text, one short labelled line per section in this order: Patient, Chief complaint, HPI, Symptoms, Past history, Medications/Allergies, Observations, Assessment, Plan.
- Skip any section with nothing stated. Keep "(unclear)" markers as they are.
"""


def user_message(transcript: str) -> str:
    return f"Transcript:\n\n{transcript}"
