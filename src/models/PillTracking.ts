import mongoose, { Schema, Document } from 'mongoose';

export interface IPillTracking extends Document {
    patientId: mongoose.Schema.Types.ObjectId;
    prescriptionId: mongoose.Schema.Types.ObjectId;
    medicineName: string;
    dosage: string;
    scheduledTime: string; // e.g. "09:00 AM"
    date: Date; // e.g. 2026-01-28T00:00:00.000Z (Normalized to midnight)
    taken: boolean;
    takenAt?: Date;
}

const pillTrackingSchema = new Schema<IPillTracking>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true },
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        scheduledTime: { type: String, required: true },
        date: { type: Date, required: true },
        taken: { type: Boolean, default: false },
        takenAt: { type: Date },
    },
    { timestamps: true }
);

// Compound index for efficient querying of a patient's schedule for a day
pillTrackingSchema.index({ patientId: 1, date: 1 });

export default mongoose.models.PillTracking || mongoose.model<IPillTracking>('PillTracking', pillTrackingSchema);
