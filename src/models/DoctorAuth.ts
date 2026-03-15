import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDoctorAuth extends Document {
    doctorId: Types.ObjectId;
    passwordHash: string;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const doctorAuthSchema = new Schema<IDoctorAuth>(
    {
        doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, unique: true },
        passwordHash: { type: String, required: true, select: false },
        lastLogin: { type: Date },
    },
    {
        timestamps: true,
    }
);

if (mongoose.models && mongoose.models.DoctorAuth) {
    delete mongoose.models.DoctorAuth;
}

export default mongoose.models.DoctorAuth || mongoose.model<IDoctorAuth>('DoctorAuth', doctorAuthSchema);
