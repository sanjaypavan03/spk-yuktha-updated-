import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: string;
  recipientRole: 'user' | 'doctor' | 'hospital';
  type: 'new_report' | 'appointment_reminder' | 'prescription_issued' | 'test_ordered';
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: String, required: true },
    recipientRole: {
      type: String,
      enum: ['user', 'doctor', 'hospital'],
      required: true,
    },
    type: {
      type: String,
      enum: ['new_report', 'appointment_reminder', 'prescription_issued', 'test_ordered'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });

if (mongoose.models && mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
