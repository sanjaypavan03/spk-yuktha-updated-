import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAppointment extends Document {
  patientId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  date: Date;
  timeSlot: string;
  reason: string;
  status: 'booked' | 'completed' | 'no_show' | 'cancelled';
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['booked', 'completed', 'no_show', 'cancelled'],
      default: 'booked',
    },
    reminderSent: { type: Boolean, default: false },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models && mongoose.models.Appointment) {
  delete mongoose.models.Appointment;
}

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', appointmentSchema);
