"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BedDouble, User, Calendar, Clock, FileText, ChevronDown,
  AlertTriangle, CheckCircle2, Loader2, Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HospitalInpatientsPage() {
  const { toast } = useToast();
  const [view, setView] = useState<'admitted' | 'discharged'>('admitted');
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dischargeId, setDischargeId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [discharging, setDischarging] = useState(false);

  const inputClass = "w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#02B69A] focus:ring-1 focus:ring-[#02B69A] transition-colors";

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = view === 'admitted'
        ? '/api/hospital/ip-admission'
        : '/api/hospital/ip-admission?status=discharged';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAdmissions(data.admissions || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAddNote = async (admissionId: string) => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/hospital/ip-admission/${admissionId}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });
      if (res.ok) {
        toast({ title: 'Note Added' });
        setNewNote('');
        fetchData();
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Failed to add note' }); }
    finally { setSavingNote(false); }
  };

  const handleDischarge = async (admissionId: string) => {
    setDischarging(true);
    try {
      const res = await fetch(`/api/hospital/ip-admission/${admissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'discharged', dischargeDate: new Date() })
      });
      if (res.ok) {
        toast({ title: 'Patient Discharged' });
        setDischargeId(null);
        setExpandedId(null);
        fetchData();
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Discharge failed' }); }
    finally { setDischarging(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const daysSince = (d: string) => Math.ceil((Date.now() - new Date(d).getTime()) / 86400000);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">Inpatients</h2>
          <p className="text-slate-400 font-medium text-sm">Manage admitted patients and discharge history.</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 max-w-sm">
        {(['admitted', 'discharged'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
              view === v ? 'bg-[#02B69A] text-black shadow-md' : 'text-slate-500 hover:text-white'
            }`}>
            {v === 'admitted' ? 'Currently Admitted' : 'Discharge History'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-28 border border-slate-800" />)}
        </div>
      ) : admissions.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-[32px] p-12 text-center">
          <div className="w-16 h-16 bg-slate-800/50 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BedDouble className="w-8 h-8" />
          </div>
          <p className="text-slate-400 font-bold mb-1">
            {view === 'admitted' ? 'No patients currently admitted' : 'No discharge records'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {admissions.map((adm: any) => {
            const isExpanded = expandedId === adm._id;

            return (
              <Card key={adm._id} className="bg-slate-900 border-slate-800 shadow-none overflow-hidden">
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : adm._id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 font-bold text-lg">
                        {adm.patientId?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{adm.patientId?.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs flex-wrap">
                          <span className="text-[#02B69A] font-bold">{adm.ward} · Bed {adm.bedNumber}</span>
                          {view === 'admitted' && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">Day {daysSince(adm.admissionDate)}</span>
                            </>
                          )}
                          {adm.doctorId?.name && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500">Dr. {adm.doctorId.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {view === 'admitted' && adm.medicalFlags && Object.values(adm.medicalFlags).some(Boolean) && (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded IP Sheet */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/50 p-5 space-y-5">
                      {/* Admission Info */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Admitted</p>
                          <p className="text-sm text-white font-bold">{formatDate(adm.admissionDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Reason</p>
                          <p className="text-sm text-slate-300">{adm.admissionReason}</p>
                        </div>
                        {adm.dischargeDate && (
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Discharged</p>
                            <p className="text-sm text-white font-bold">{formatDate(adm.dischargeDate)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Status</p>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            adm.status === 'admitted' ? 'text-[#02B69A] bg-[#02B69A]/10' : 'text-slate-400 bg-slate-800'
                          }`}>{adm.status}</span>
                        </div>
                      </div>

                      {/* Medical Flags */}
                      {adm.medicalFlags && Object.values(adm.medicalFlags).some(Boolean) && (
                        <div className="flex flex-wrap gap-2">
                          {adm.medicalFlags.hasAllergies && <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-black border border-rose-500/20">Allergies</span>}
                          {adm.medicalFlags.hasChronic && <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-black border border-amber-500/20">Chronic</span>}
                          {adm.medicalFlags.hasImplant && <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-black border border-indigo-500/20">Implant</span>}
                          {adm.medicalFlags.isPregnant && <span className="px-2.5 py-1 rounded-md bg-pink-500/10 text-pink-400 text-[10px] font-black border border-pink-500/20">Pregnant</span>}
                        </div>
                      )}

                      {/* Progress Notes */}
                      {adm.progressNotes && adm.progressNotes.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Progress Notes</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {[...adm.progressNotes].reverse().map((note: any, i: number) => (
                              <div key={i} className="bg-black/40 border border-slate-800 rounded-xl p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] text-[#02B69A] font-bold">{note.addedBy || 'Staff'}</span>
                                  <span className="text-[10px] text-slate-600">{formatDate(note.addedAt)}</span>
                                </div>
                                {note.vitals && (
                                  <div className="flex gap-2 mb-1.5 flex-wrap">
                                    {note.vitals.bp && <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded">BP: {note.vitals.bp}</span>}
                                    {note.vitals.spo2 && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">SpO2: {note.vitals.spo2}</span>}
                                    {note.vitals.temp && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Temp: {note.vitals.temp}</span>}
                                    {note.vitals.pulse && <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">Pulse: {note.vitals.pulse}</span>}
                                  </div>
                                )}
                                <p className="text-sm text-slate-300">{note.note}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Note (only for admitted) */}
                      {view === 'admitted' && (
                        <div className="space-y-3">
                          <textarea className={inputClass} rows={2} placeholder="Add a progress note..." value={newNote} onChange={e => setNewNote(e.target.value)} />
                          <button onClick={() => handleAddNote(adm._id)} disabled={savingNote || !newNote.trim()}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-slate-700 disabled:opacity-50 flex items-center gap-2">
                            {savingNote ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Note</>}
                          </button>
                        </div>
                      )}

                      {/* Discharge */}
                      {view === 'admitted' && (
                        <div>
                          {dischargeId !== adm._id ? (
                            <button onClick={() => setDischargeId(adm._id)}
                              className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-sm rounded-xl border border-rose-500/20 transition-all">
                              Discharge Patient
                            </button>
                          ) : (
                            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 space-y-3">
                              <p className="text-sm text-rose-400 font-bold">Confirm discharge for {adm.patientId?.name}?</p>
                              <div className="flex gap-3">
                                <button onClick={() => handleDischarge(adm._id)} disabled={discharging}
                                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2">
                                  {discharging ? <><Loader2 className="w-4 h-4 animate-spin" /> Discharging...</> : 'Confirm Discharge'}
                                </button>
                                <button onClick={() => setDischargeId(null)} className="text-slate-400 hover:text-white text-sm font-bold px-4 py-2">Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
