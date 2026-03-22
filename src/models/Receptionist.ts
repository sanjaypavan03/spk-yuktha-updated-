import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReceptionist extends Document {
    hospitalId: Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}

const receptionistSchema = new Schema<IReceptionist>(
    {
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            required: [true, 'Hospital ID is required'],
        },
        name: {
            type: String,
            required: [true, 'Receptionist name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Receptionist email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Receptionist || mongoose.model<IReceptionist>('Receptionist', receptionistSchema);
