import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyMember extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    relation: string;
    otherRelation?: string;
    avatarUrl: string;
    // Medical Details for the member
    bloodGroup?: string;
    allergies?: string;
    medications?: string;
    chronicConditions?: string;
    birthYear?: string;
    weight?: string;
    emergencyContact?: string;
    medicalNotes?: string;
    surgeryHistory?: string;
    habits?: string;
    physicalState?: string;
    createdAt: Date;
    updatedAt: Date;
}

const familyMemberSchema = new Schema<IFamilyMember>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        relation: { type: String, required: true },
        otherRelation: { type: String, default: '' },
        avatarUrl: { type: String, default: '' },
        bloodGroup: { type: String, default: '' },
        allergies: { type: String, default: '' },
        medications: { type: String, default: '' },
        chronicConditions: { type: String, default: '' },
        birthYear: { type: String, default: '' },
        weight: { type: String, default: '' },
        emergencyContact: { type: String, default: '' },
        medicalNotes: { type: String, default: '' },
        surgeryHistory: { type: String, default: '' },
        habits: { type: String, default: '' },
        physicalState: { type: String, default: '' },
    },
    {
        timestamps: true,
    }
);

// Add index for faster queries
familyMemberSchema.index({ userId: 1 });

const FamilyMember = mongoose.models.FamilyMember || mongoose.model<IFamilyMember>('FamilyMember', familyMemberSchema);

export default FamilyMember;
