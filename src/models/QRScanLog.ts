import mongoose, { Schema } from 'mongoose'

const QRScanLogSchema = new Schema({
    // Who scanned
    scannedBy: { type: String, default: 'public' },  // 'public' | hospitalId | doctorId
    scannerRole: { type: String, default: 'anonymous' }, // 'anonymous' | 'hospital' | 'doctor'
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', default: null },

    // What was scanned
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    tier: { type: Number, enum: [1, 2], required: true },

    // Where + when
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    scannedAt: { type: Date, default: Date.now, index: true },

    // Result
    accessGranted: { type: Boolean, default: true },
    failReason: { type: String, default: '' },  // if access denied, why
})

// Index for fast lookups by patient or hospital
QRScanLogSchema.index({ patientId: 1, scannedAt: -1 })
QRScanLogSchema.index({ hospitalId: 1, scannedAt: -1 })

export default mongoose.models.QRScanLog || mongoose.model('QRScanLog', QRScanLogSchema)
