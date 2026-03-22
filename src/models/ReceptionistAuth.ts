import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReceptionistAuth extends Document {
    receptionistId: Types.ObjectId;
    passwordHash: string;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const receptionistAuthSchema = new Schema<IReceptionistAuth>(
    {
        receptionistId: { type: Schema.Types.ObjectId, ref: 'Receptionist', required: true, unique: true },
        passwordHash: { type: String, required: true, select: false },
        lastLogin: { type: Date },
    },
    {
        timestamps: true,
    }
);

if (mongoose.models && mongoose.models.ReceptionistAuth) {
    delete mongoose.models.ReceptionistAuth;
}

export default mongoose.models.ReceptionistAuth || mongoose.model<IReceptionistAuth>('ReceptionistAuth', receptionistAuthSchema);
