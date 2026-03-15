import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDoctor extends Document {
    hospitalId: Types.ObjectId;
    name: string;
    email: string;
    specialty: string;
    createdAt: Date;
    updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
    {
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            required: [true, 'Hospital ID is required'],
        },
        name: {
            type: String,
            required: [true, 'Doctor name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Doctor email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        specialty: {
            type: String,
            default: 'General Physician',
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', doctorSchema);
