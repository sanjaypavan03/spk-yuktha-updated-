"use client";

import { useEffect, useState } from "react";
import { MessageSquare, User, FileText, AlertTriangle } from "lucide-react";

interface ClinicalNote {
  _id: string;
  content: string;
  noteType: 'advice' | 'discharge' | 'general';
  doctorId: { name: string; specialty?: string };
  createdAt: string;
  isVisibleToPatient: boolean;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/patient/clinical-notes');
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch (e) {
        console.error("Failed to fetch notes:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const dischargeNotes = notes.filter(n => n.noteType === 'discharge');
  const adviceNotes = notes.filter(n => n.noteType === 'advice');
  const generalNotes = notes.filter(n => n.noteType === 'general');

  const borderMap: Record<string, string> = {
    discharge: 'border-l-rose-500',
    advice: 'border-l-emerald-500',
    general: 'border-l-slate-300',
  };

  const labelMap: Record<string, { text: string; color: string }> = {
    discharge: { text: 'Discharge Summary', color: 'text-rose-600 bg-rose-50' },
    advice: { text: "Doctor's Advice", color: 'text-emerald-600 bg-emerald-50' },
    general: { text: 'Clinical Note', color: 'text-slate-600 bg-slate-100' },
  };

  const renderNoteCard = (note: ClinicalNote) => (
    <div
      key={note._id}
      className={`bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-l-4 ${borderMap[note.noteType]}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${labelMap[note.noteType].color}`}>
          {labelMap[note.noteType].text}
        </span>
        <span className="text-[11px] text-slate-400 font-bold">{formatDate(note.createdAt)}</span>
      </div>
      <p className="text-slate-700 text-[14px] leading-relaxed font-medium mb-3 whitespace-pre-wrap">
        {note.content}
      </p>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-slate-600">Dr. {note.doctorId?.name}</p>
          {note.doctorId?.specialty && (
            <p className="text-[10px] text-slate-400 font-medium">{note.doctorId.specialty}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSection = (title: string, sectionNotes: ClinicalNote[]) => {
    if (sectionNotes.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-[16px] font-bold text-slate-800 font-playfair tracking-tight mb-4">{title}</h3>
        <div className="space-y-4">
          {sectionNotes.map(renderNoteCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F9FAFB] min-h-screen p-4 pt-1 sm:px-8 sm:pt-2">
      <div className="pt-1">
        <h1 className="text-[24px] font-bold text-slate-900 font-playfair tracking-tight mb-1">Clinical Notes</h1>
        <p className="text-[13px] text-slate-500 font-medium">Notes and advice from your doctors</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-[20px] h-28 border border-slate-100" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-[24px] p-8 sm:p-12 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-8">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <MessageSquare className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-bold text-slate-800 text-[16px] mb-1">No notes from your doctors yet</p>
          <p className="text-slate-400 text-[13px] max-w-[260px] mx-auto leading-relaxed">
            Clinical notes and advice from your doctors will appear here after your consultations.
          </p>
        </div>
      ) : (
        <div className="pt-2">
          {renderSection("Discharge Summaries", dischargeNotes)}
          {renderSection("Doctor's Advice", adviceNotes)}
          {renderSection("General Notes", generalNotes)}
        </div>
      )}
    </div>
  );
}
