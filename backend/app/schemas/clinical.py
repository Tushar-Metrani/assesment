from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class Base(BaseModel):
    model_config = ConfigDict(extra="forbid")


# 1. Patient details
class Identifier(Base):
    type: str
    value: str


class PatientDetails(Base):
    name: Optional[str] = None
    age: Optional[str] = None
    sex: Optional[str] = None
    identifiers: list[Identifier] = []


# 2. Chief complaint
class ChiefComplaint(Base):
    text: Optional[str] = None


# 3. History of present illness
class HistoryOfPresentIllness(Base):
    onset: Optional[str] = None
    duration: Optional[str] = None
    progression: Optional[str] = None
    aggravating_factors: list[str] = []
    relieving_factors: list[str] = []


# 4. Symptoms
class Symptom(Base):
    name: str
    detail: Optional[str] = None


class Symptoms(Base):
    positive: list[Symptom] = []
    negative: list[Symptom] = []


# 5. Past medical history
class PastMedicalHistory(Base):
    conditions: list[str] = []
    surgeries: list[str] = []
    hospitalisations: list[str] = []


# 6. Medication history
class Medication(Base):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    adherence: Optional[str] = None


class Allergy(Base):
    substance: str
    reaction: Optional[str] = None


class MedicationHistory(Base):
    current_medications: list[Medication] = []
    allergies: list[Allergy] = []
    allergy_status: Literal["stated", "none_reported", "not_discussed"] = "not_discussed"


# 7. Clinical observations
class Vitals(Base):
    bp: Optional[str] = None
    heart_rate: Optional[str] = None
    temperature: Optional[str] = None
    resp_rate: Optional[str] = None
    spo2: Optional[str] = None
    weight: Optional[str] = None
    other: list[str] = []


class ClinicalObservations(Base):
    vitals: Vitals = Field(default_factory=Vitals)
    examination_findings: list[str] = []


# 8. Assessment
class Assessment(Base):
    provisional_diagnosis: Optional[str] = None
    differentials: list[str] = []


# 9. Plan
class Prescription(Base):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None


class Plan(Base):
    investigations: list[str] = []
    prescriptions: list[Prescription] = []
    advice: list[str] = []
    follow_up: Optional[str] = None


class ClinicalData(Base):
    patient_details: PatientDetails = Field(default_factory=PatientDetails)
    chief_complaint: ChiefComplaint = Field(default_factory=ChiefComplaint)
    history_of_present_illness: HistoryOfPresentIllness = Field(default_factory=HistoryOfPresentIllness)
    symptoms: Symptoms = Field(default_factory=Symptoms)
    past_medical_history: PastMedicalHistory = Field(default_factory=PastMedicalHistory)
    medication_history: MedicationHistory = Field(default_factory=MedicationHistory)
    clinical_observations: ClinicalObservations = Field(default_factory=ClinicalObservations)
    assessment: Assessment = Field(default_factory=Assessment)
    plan: Plan = Field(default_factory=Plan)


class SummarizeResponse(Base):
    data: ClinicalData
    summary: str
