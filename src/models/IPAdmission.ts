import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIPAdmission extends Document {
  patientId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  doctorId: Types.ObjectId;
  ward: string;
  bedNumber: string;
  admissionReason: string;
  admissionDate: Date;
  dischargeDate?: Date;
  status: 'admitted' | 'discharged';
  progressNotes: {
    note: string;
    vitals: {
      bp?: string;
      spo2?: string;
      temp?: string;
      pulse?: string;
    };
    addedAt: Date;
    addedBy: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const progressNoteSchema = new Schema(
  {
    note: { type: String, required: true },
    vitals: {
      bp: { type: String },
      spo2: { type: String },
      temp: { type: String },
      pulse: { type: String },
    },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: String, required: true },
  },
  { _id: false }
);

const ipAdmissionSchema = new Schema<IIPAdmission>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    ward: { type: String, required: true, trim: true },
    bedNumber: { type: String, required: true, trim: true },
    admissionReason: { type: String, required: true },
    admissionDate: { type: Date, required: true, default: Date.now },
    dischargeDate: { type: Date },
    status: {
      type: String,
      enum: ['admitted', 'discharged'],
      default: 'admitted',
    },
    progressNotes: [progressNoteSchema],
  },
  {
    timestamps: true,
  }
);

ipAdmissionSchema.index({ hospitalId: 1, status: 1 });
ipAdmissionSchema.index({ doctorId: 1, status: 1 });

if (mongoose.models && mongoose.models.IPAdmission) {
  delete mongoose.models.IPAdmission;
}

export default mongoose.models.IPAdmission || mongoose.model<IIPAdmission>('IPAdmission', ipAdmissionSchema);
