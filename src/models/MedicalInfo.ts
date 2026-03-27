import mongoose, { Schema, Document } from 'mongoose'

const EmergencyContactSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, default: '' },
}, { _id: false })

const MedicalInfoSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    hospitalId: {
        type: Schema.Types.ObjectId,
        ref: 'Hospital',
        index: true,
    },
    // ── Tier 1 — Public QR (no auth needed) ──
    bloodGroup: { type: String, default: '' },
    allergies: [{ type: String }],
    conditions: [{ type: String }],
    emergencyContacts: [EmergencyContactSchema],   // ← FIX: was scalar fields

    // ── Tier 2 — Hospital JWT required ──
    insuranceProvider: { type: String, default: '' },
    insuranceNumber: { type: String, default: '' },
    medicalHistory: { type: String, default: '' },
    currentMedications: [{ type: String }],
    primaryDoctorName: { type: String, default: '' },

    // ── Clinical readings (doctor-entered) ──
    bpReading: { type: String, default: '' },
    fastingBloodSugar: { type: String, default: '' },
    bmi: { type: String, default: '' },
    conditionControlLevel: { type: String, default: '' },
    weight: { type: String, default: '' },
    height: { type: String, default: '' },
    lastClinicalVisitDate: { type: Date },

    // ── Emergency PIN — Tier 2 PIN access for non-Yuktha hospitals ──
    emergencyPin: {
        type: String,
        select: false,    // ← NEVER returned in normal queries
        default: null,
    },
}, { timestamps: true })

export default mongoose.models.MedicalInfo || mongoose.model('MedicalInfo', MedicalInfoSchema)
