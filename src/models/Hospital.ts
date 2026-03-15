import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IHospital extends Document {
    name: string;
    email: string;
    password: string;
    roles: string[];
    status: 'Active' | 'Disabled';
    contactNumber: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword: (plainPassword: string) => Promise<boolean>;
}

const hospitalSchema = new Schema<IHospital>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a hospital name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide an email/login ID'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 6,
            select: false,
        },
        roles: {
            type: [String],
            enum: ['doctor', 'pharmacy'],
            default: ['doctor'],
        },
        status: {
            type: String,
            enum: ['Active', 'Disabled'],
            default: 'Active',
        },
        contactNumber: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Method to compare passwords
hospitalSchema.methods.comparePassword = async function (plainPassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(plainPassword, this.password);
};

export default mongoose.models.Hospital || mongoose.model<IHospital>('Hospital', hospitalSchema);
