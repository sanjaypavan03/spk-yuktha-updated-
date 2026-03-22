import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITestRecommendation extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  testName: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  notes?: string;
  status: 'pending' | 'done';
  createdAt: Date;
  updatedAt: Date;
}

const testRecommendationSchema = new Schema<ITestRecommendation>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    testName: { type: String, required: true, trim: true },
    urgency: {
      type: String,
      enum: ['Routine', 'Urgent', 'Emergency'],
      default: 'Routine',
    },
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'done'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models && mongoose.models.TestRecommendation) {
  delete mongoose.models.TestRecommendation;
}

export default mongoose.models.TestRecommendation || mongoose.model<ITestRecommendation>('TestRecommendation', testRecommendationSchema);
