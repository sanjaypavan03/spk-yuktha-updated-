import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescription extends Document {
    patientId: mongoose.Schema.Types.ObjectId;
    hospitalId: mongoose.Schema.Types.ObjectId;
    doctorId?: mongoose.Schema.Types.ObjectId;
    doctorName: string; // Optional: Capture responding doctor's name if available, or just use hospital name
    medicineName: string;
    dosage: string;
    frequency: string;
    route: string;
    instructions: string;
    duration: number; // in days
    status: 'Active' | 'Completed' | 'Cancelled';
    issuedAt: Date;
    dispensedAt?: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Patient ID is required'],
        },
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            required: [true, 'Hospital ID is required'],
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
        },
        doctorName: {
            type: String,
            default: 'Hospital Staff',
        },
        medicineName: {
            type: String,
            required: [true, 'Medicine name is required'],
            trim: true,
        },
        dosage: {
            type: String,
            required: [true, 'Dosage is required'],
            trim: true,
        },
        frequency: {
            type: String,
            required: [true, 'Frequency is required'],
            trim: true,
        },
        route: {
            type: String,
            default: 'Oral',
            trim: true,
        },
        instructions: {
            type: String,
            trim: true,
        },
        duration: {
            type: Number,
            default: 7,
        },
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Cancelled'],
            default: 'Active',
        },
        issuedAt: {
            type: Date,
            default: Date.now,
        },
        dispensedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', prescriptionSchema);
