import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  qrCode?: string;
  hospitalId?: Types.ObjectId; // which hospital registered them
  emergencyToken?: string; // UUID for public emergency access
  emergencyDetailsCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (plainPassword: string) => Promise<boolean>;
}

const userSchema = new Schema<IUser>(
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
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      default: 'User',
    },
    phone: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    emergencyToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    emergencyDetailsCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (plainPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(plainPassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
