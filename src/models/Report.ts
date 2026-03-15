import mongoose, { Schema, Document } from 'mongoose';
import dbConnectReports from '@/lib/db-reports';

export interface IReport extends Document {
    userId: string;
    memberId?: string;
    title: string;
    type: string;
    date: Date;
    clinic?: string;
    fileDataUri?: string;
    analysis: any;
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
    {
        userId: { type: String, required: true, index: true },
        memberId: { type: String, index: true },
        title: { type: String, required: true },
        type: { type: String, required: true },
        date: { type: Date, required: true },
        clinic: { type: String },
        fileDataUri: { type: String },
        analysis: { type: Schema.Types.Mixed, required: true }
    },
    { timestamps: true }
);

export const getReportModel = async () => {
    const conn: any = await dbConnectReports();
    return conn.models.Report || conn.model('Report', reportSchema);
};
