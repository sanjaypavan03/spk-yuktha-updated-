import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClinicalNote extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  noteType: 'advice' | 'discharge' | 'general';
  content: string;
  isVisibleToPatient: boolean;
  appointmentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clinicalNoteSchema = new Schema<IClinicalNote>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    noteType: {
      type: String,
      enum: ['advice', 'discharge', 'general'],
      default: 'general',
    },
    content: { type: String, required: true, trim: true },
    isVisibleToPatient: { type: Boolean, default: false },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  },
  {
    timestamps: true,
  }
);

clinicalNoteSchema.index({ patientId: 1, isVisibleToPatient: 1 });

if (mongoose.models && mongoose.models.ClinicalNote) {
  delete mongoose.models.ClinicalNote;
}

export default mongoose.models.ClinicalNote || mongoose.model<IClinicalNote>('ClinicalNote', clinicalNoteSchema);
