/**
 * Emergency Token Model
 * Stores emergency QR tokens linked to users
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmergencyToken extends Document {
  token: string; // Unique UUID token
  userId: Types.ObjectId; // Reference to User
  isActive: boolean; // Whether token is active
  createdAt: Date;
  updatedAt: Date;
}

const emergencyTokenSchema = new Schema<IEmergencyToken>(
  {
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookups
emergencyTokenSchema.index({ token: 1, isActive: 1 });
emergencyTokenSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.EmergencyToken || mongoose.model<IEmergencyToken>('EmergencyToken', emergencyTokenSchema);
