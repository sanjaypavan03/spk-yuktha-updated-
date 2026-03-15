import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedicalRecord extends Document {
    userId: Types.ObjectId;
    hospitalId: Types.ObjectId;
    prescribedBy: string; // Doctor name or ID
    medicines: Array<{
        name: string;
        dosage: string;
        frequency: string;
        instructions: string;
        status: 'Prescribed' | 'Dispensed';
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const medicalRecordSchema = new Schema<IMedicalRecord>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            required: [true, 'Hospital ID is required'],
        },
        prescribedBy: {
            type: String,
            required: true,
        },
        medicines: [
            {
                name: String,
                dosage: String,
                frequency: String,
                instructions: String,
                status: {
                    type: String,
                    enum: ['Prescribed', 'Dispensed'],
                    default: 'Prescribed',
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.MedicalRecord || mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
