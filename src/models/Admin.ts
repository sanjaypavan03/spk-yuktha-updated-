import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IAdmin extends Document {
    email: string;
    password: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword: (plainPassword: string) => Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
    {
        email: {
            type: String,
            required: [true, 'Please provide an email'],
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
        name: {
            type: String,
            required: [true, 'Please provide a name'],
        },
    },
    {
        timestamps: true,
    }
);

// Note: Password hashing is handled manually in the API routes.

// Method to compare passwords
adminSchema.methods.comparePassword = async function (plainPassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(plainPassword, this.password);
};

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', adminSchema);
