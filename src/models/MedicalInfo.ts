import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedicalInfo extends Document {
  userId: Types.ObjectId;
  // Tier 1 (Public)
  displayNamePreference: string;
  birthYear: string;
  bloodGroup: string;
  knownAllergies: boolean;
  allergiesDetails: string;
  chronicConditions: string;
  currentMedications: string;
  emergencyContact1Name: string;
  emergencyContact1Phone: string;
  emergencyContact1Relation: string;
  hasPacemakerOrImplant: boolean;
  isPregnant: boolean;

  // Tier 2 (Patient fills)
  fullLegalName: string;
  dob: string;
  emergencyContact2Name: string;
  emergencyContact2Phone: string;
  emergencyContact2Relation: string;
  primaryDoctorOrHospital: string;
  height: string;
  weight: string;
  smokingStatus: string;
  alcoholUse: string;
  physicalActivityLevel: string;
  pastSurgeries: Array<{ name: string; year: string }>;
  pastHospitalisations: string;
  familyMedicalHistory: string;
  implantDetails: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  isBloodDonor: boolean;
  organDonorPreference: string;
  dnrPreference: string;
  additionalNotes: string;

  // Tier 2 (Doctor fills only)
  bpReading: string;
  fastingBloodSugar: string;
  bmi: string; // Could be auto-calc, but storing it for historical consistency
  conditionControlLevel: 'Well controlled' | 'Poorly controlled' | 'Uncontrolled' | '';
  lastClinicalVisitDate: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const pastSurgerySchema = new Schema({
  name: { type: String, default: '' },
  year: { type: String, default: '' }
}, { _id: false });

const medicalInfoSchema = new Schema<IMedicalInfo>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Tier 1 (Public)
    displayNamePreference: { type: String, default: '' },
    birthYear: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    knownAllergies: { type: Boolean, default: false },
    allergiesDetails: { type: String, default: '' },
    chronicConditions: { type: String, default: '' },
    currentMedications: { type: String, default: '' },
    emergencyContact1Name: { type: String, default: '' },
    emergencyContact1Phone: { type: String, default: '' },
    emergencyContact1Relation: { type: String, default: '' },
    hasPacemakerOrImplant: { type: Boolean, default: false },
    isPregnant: { type: Boolean, default: false },

    // Tier 2 (Patient fills)
    fullLegalName: { type: String, default: '' },
    dob: { type: String, default: '' },
    emergencyContact2Name: { type: String, default: '' },
    emergencyContact2Phone: { type: String, default: '' },
    emergencyContact2Relation: { type: String, default: '' },
    primaryDoctorOrHospital: { type: String, default: '' },
    height: { type: String, default: '' },
    weight: { type: String, default: '' },
    smokingStatus: { type: String, default: '' },
    alcoholUse: { type: String, default: '' },
    physicalActivityLevel: { type: String, default: '' },
    pastSurgeries: { type: [pastSurgerySchema], default: [] },
    pastHospitalisations: { type: String, default: '' },
    familyMedicalHistory: { type: String, default: '' },
    implantDetails: { type: String, default: '' },
    insuranceProvider: { type: String, default: '' },
    insurancePolicyNumber: { type: String, default: '' },
    isBloodDonor: { type: Boolean, default: false },
    organDonorPreference: { type: String, default: '' },
    dnrPreference: { type: String, default: '' },
    additionalNotes: { type: String, default: '' },

    // Tier 2 (Doctor fills only)
    bpReading: { type: String, default: '' },
    fastingBloodSugar: { type: String, default: '' },
    bmi: { type: String, default: '' },
    conditionControlLevel: {
      type: String,
      enum: ['Well controlled', 'Poorly controlled', 'Uncontrolled', ''],
      default: ''
    },
    lastClinicalVisitDate: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models && mongoose.models.MedicalInfo) {
  delete mongoose.models.MedicalInfo;
}

export default mongoose.models.MedicalInfo || mongoose.model<IMedicalInfo>('MedicalInfo', medicalInfoSchema);
