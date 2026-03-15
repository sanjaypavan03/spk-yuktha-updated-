import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPharmacy extends Document {
    hospitalId: Types.ObjectId;
    name: string;
    location?: string;
    createdAt: Date;
    updatedAt: Date;
}

const pharmacySchema = new Schema<IPharmacy>(
    {
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            required: [true, 'Hospital ID is required'],
        },
        name: {
            type: String,
            required: [true, 'Pharmacy name is required'],
            trim: true,
        },
        location: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Pharmacy || mongoose.model<IPharmacy>('Pharmacy', pharmacySchema);
