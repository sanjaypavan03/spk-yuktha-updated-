import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmergencyFlag extends Document {
  patientId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  flaggedAt: Date;
  reason: string;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyFlagSchema = new Schema<IEmergencyFlag>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    flaggedAt: { type: Date, default: Date.now },
    reason: { type: String, required: true },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

emergencyFlagSchema.index({ hospitalId: 1, resolved: 1 });

if (mongoose.models && mongoose.models.EmergencyFlag) {
  delete mongoose.models.EmergencyFlag;
}

export default mongoose.models.EmergencyFlag || mongoose.model<IEmergencyFlag>('EmergencyFlag', emergencyFlagSchema);
