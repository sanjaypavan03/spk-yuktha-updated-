
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface MedicalData {
  success: boolean;
  patient: {
    name: string;
  };
  medical: {
    fullName: string;
    age: string;
    weight: string;
    dob: string;
    bodyCondition: string;
    badHabits: string;
    hasPastSurgery: boolean;
    surgery1Name: string;
    surgery1Date: string;
    surgery2Name: string;
    surgery2Date: string;
    surgery3Name: string;
    surgery3Date: string;
    bloodGroup: string;
    allergies: string;
    chronicConditions: string;
    medicalNotes: string;
    emergencyContact: string | null;
    medications: string;
  };
  reports?: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
    clinic: string;
    fileDataUri?: string;
    summary?: string;
  }>;
}

export default function QRPage() {
  const params = useParams<{ qrCode: string }>();
  const qrCode = params.qrCode;
  const [data, setData] = useState<MedicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/qr/${qrCode}`);
        if (!response.ok) {
          throw new Error('Failed to fetch medical information');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (qrCode) {
      fetchData();
    }
  }, [qrCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600 animate-pulse font-medium">Loading emergency medical information...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-red-600">⚠ EMERGENCY ACCESS ERROR</h1>
          <p className="text-gray-500 mb-6">{error || 'Could not retrieve medical information'}</p>
        </div>
      </div>
    );
  }

  const { medical } = data;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Urgent Header */}
        <div className="bg-red-700 text-white p-4 rounded-xl shadow-lg border-b-4 border-red-900">
          <h1 className="text-xl font-black uppercase tracking-tighter text-center">⚠ EMERGENCY MEDICAL PROFILE ⚠</h1>
        </div>

        {/* CRITICAL ALERTS - Highlighted First */}
        {medical.medicalNotes && (
          <div className="bg-red-50 border-4 border-red-600 p-5 rounded-2xl shadow-xl animate-pulse-slow">
            <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">CRITICAL MEDICAL ALERT</p>
            <p className="text-2xl font-black text-red-700 leading-tight">"{medical.medicalNotes}"</p>
          </div>
        )}

        {/* Identity Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Patient Name</p>
            <h2 className="text-3xl font-black text-gray-900">{medical.fullName || data.patient.name}</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
            <div className="p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Age</p>
              <p className="text-xl font-bold text-gray-800">{medical.age || '--'} yrs</p>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Weight</p>
              <p className="text-xl font-bold text-gray-800">{medical.weight || '--'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date of Birth</p>
              <p className="text-sm font-bold text-gray-800">{medical.dob || '--'}</p>
            </div>
            <div className="p-4 bg-red-50/30">
              <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Blood Group</p>
              <p className="text-3xl font-black text-red-600">{medical.bloodGroup}</p>
            </div>
          </div>
        </div>

        {/* Main Health Data */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-md border-l-8 border-orange-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Drug & Food Allergies</h3>
            <p className="text-lg font-bold text-orange-700 leading-tight">{medical.allergies || 'No known allergies'}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border-l-8 border-blue-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Chronic Conditions</h3>
            <p className="text-lg font-bold text-blue-700 leading-tight">{medical.chronicConditions || 'None reported'}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border-l-8 border-indigo-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Medications</h3>
            <p className="text-lg font-bold text-indigo-700 leading-tight">{medical.medications || 'None reported'}</p>
          </div>
        </div>

        {/* Medical Reports Section - Fantastic Feature */}
        {data.reports && data.reports.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Linked Clinical Documents</h3>
            </div>

            {data.reports.map((report) => (
              <div key={report.id} className="bg-white rounded-2xl shadow-md border overflow-hidden transition-all duration-300">
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                >
                  <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-gray-900 leading-tight">{report.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{report.type.replace('_', ' ')}</span>
                      <span className="text-[10px] font-bold text-gray-400">{new Date(report.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`transition-transform duration-300 ${expandedReportId === report.id ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>

                {expandedReportId === report.id && (
                  <div className="p-4 border-t bg-gray-50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {report.summary && (
                      <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm text-sm">
                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">AI Summary Findings</p>
                        <p className="text-gray-700 leading-relaxed italic">"{report.summary}"</p>
                      </div>
                    )}
                    {report.fileDataUri && (
                      <div className="rounded-xl overflow-hidden border shadow-inner bg-black">
                        <img
                          src={report.fileDataUri}
                          alt={report.title}
                          className="w-full h-auto max-h-96 object-contain opacity-90 hover:opacity-100 transition-opacity"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Secondary Info */}

        <div className="bg-white rounded-2xl shadow-md overflow-hidden p-6 space-y-6 border border-gray-200">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Habits & Condition</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200">{medical.bodyCondition || 'Average Condition'}</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200">{medical.badHabits || 'No bad habits'}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              Surgical History
              {medical.hasPastSurgery ? <span className="text-red-500 text-[10px] font-black underline">SURGICAL PATIENT</span> : null}
            </h3>
            {medical.hasPastSurgery ? (
              <div className="space-y-3">
                {medical.surgery1Name && (
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="font-bold text-gray-800">{medical.surgery1Name}</span>
                    <span className="text-xs font-black text-gray-400">{medical.surgery1Date}</span>
                  </div>
                )}
                {medical.surgery2Name && (
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="font-bold text-gray-800">{medical.surgery2Name}</span>
                    <span className="text-xs font-black text-gray-400">{medical.surgery2Date}</span>
                  </div>
                )}
                {medical.surgery3Name && (
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="font-bold text-gray-800">{medical.surgery3Name}</span>
                    <span className="text-xs font-black text-gray-400">{medical.surgery3Date}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-400">No past surgeries reported</p>
            )}
          </div>
        </div>

        {/* Emergency Contact CTA */}
        {medical.emergencyContact && (
          <a
            href={`tel:${medical.emergencyContact.split('-')[1]?.trim() || medical.emergencyContact}`}
            className="block bg-green-600 hover:bg-green-700 transition-colors text-white text-center p-6 rounded-2xl shadow-lg ring-4 ring-green-100"
          >
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 text-white">Tap to Call Emergency Contact</p>
            <p className="text-2xl font-black">{medical.emergencyContact}</p>
          </a>
        )}

        <div className="text-center py-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Digital Health File by Yuktah AI</p>
        </div>
      </div>
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
