
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockReports, Report } from '@/lib/data';

interface ReportContextType {
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  addReport: (report: Report, memberId?: string) => void;
  removeReport: (reportId: string) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports.map((r: any) => ({
            id: r._id,
            memberId: r.memberId,
            title: r.title,
            type: r.type,
            date: new Date(r.date),
            clinic: r.clinic,
            createdAt: new Date(r.createdAt),
            analysis: r.analysis,
            file: null,
            fileDataUri: r.fileDataUri
          })));
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    fetchReports();
  }, []);

  const addReport = async (report: Report, memberId?: string) => {
    // Add locally immediately for responsive UI
    setReports(prev => [report, ...prev]);

    try {
      let finalFileDataUri = report.fileDataUri;
      if (!finalFileDataUri && report.file) {
        finalFileDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(report.file);
        });
      }

      const payload = {
        title: report.title,
        type: report.type,
        date: report.date,
        clinic: report.clinic,
        analysis: report.analysis,
        fileDataUri: finalFileDataUri,
        memberId: memberId === '...' ? undefined : memberId // LINK TO FAMILY/FRIEND PROFILE
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedData = await res.json();
        setReports(prev => prev.map(r => r === report ? { ...r, id: savedData.report._id, memberId: savedData.report.memberId } : r));
      }
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const removeReport = async (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    try {
      await fetch(`/api/reports?id=${reportId}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  }

  return (
    <ReportContext.Provider value={{ reports, setReports, addReport, removeReport }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};
