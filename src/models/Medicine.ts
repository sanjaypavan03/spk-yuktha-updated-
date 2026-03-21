/**
 * Medicine Model
 * Stores user's medicine and pill schedule
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedicine extends Document {
  userId: Types.ObjectId; // Reference to User
  name: string;
  dosage: string; // e.g., "500mg"
  times: string[]; // e.g., ["8:00 AM", "8:00 PM"] - multiple times of day to take medicine
  time?: string; // Backward compatibility
  frequency: string; // e.g., "Twice daily"
  purpose: string; // e.g., "Blood pressure control"
  startDate: Date;
  endDate?: Date;
  instructions: string;
  taken: boolean | null; // Daily status: null = not yet, true = taken, false = skipped
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
    },
    times: {
      type: [String],
      required: [true, 'At least one time is required'],
      default: ['09:00 AM'],
    },
    // Backward compatibility for singular time
    time: {
      type: String,
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: ['Once daily', 'Twice daily', 'Thrice daily', 'As needed', 'Custom'],
    },
    purpose: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    instructions: {
      type: String,
      trim: true,
    },
    taken: {
      type: Schema.Types.Mixed, // Can be boolean or null
      default: null,
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

// Index for quick lookup by userId
medicineSchema.index({ userId: 1 });
medicineSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', medicineSchema);
