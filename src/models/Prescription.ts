import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescription extends Document {
    patientId: mongoose.Schema.Types.ObjectId;
    hospitalId: mongoose.Schema.Types.ObjectId;
    doctorId?: mongoose.Schema.Types.ObjectId;
    doctorName: string; 
    medicines: Array<{
        name: string;
        dosage: string;
        frequency: string; // OD, BD, TDS, QID
        duration: number; // in days
        route: string;
    }>;
    instructions: string;
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
        medicines: [{
            name: { type: String, required: true },
            dosage: { type: String, required: true },
            frequency: { type: String, required: true },
            duration: { type: Number, default: 7 },
            route: { type: String, default: 'Oral' },
        }],
        instructions: {
            type: String,
            trim: true,
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
