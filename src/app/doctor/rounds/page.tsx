"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BedDouble, Activity, Thermometer, Heart, Wind, ChevronDown,
  Plus, AlertTriangle, FileText, Calendar, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DoctorRoundsPage() {
  const { toast } = useToast();
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dischargeId, setDischargeId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');

  // Vitals for Log Round
  const [vitals, setVitals] = useState({ bp: '', spo2: '', temp: '', pulse: '' });
  const [progressNote, setProgressNote] = useState('');
  const [savingRound, setSavingRound] = useState(false);

  // Discharge form
  const [dischargeForm, setDischargeForm] = useState({ finalDiagnosis: '', medications: '', followUpInstructions: '', followUpDate: '' });
  const [discharging, setDischarging] = useState(false);

  const inputClass = "w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#02B69A] focus:ring-1 focus:ring-[#02B69A] transition-colors";

  useEffect(() => {
    fetch('/api/doctor/me').then(r => r.json()).then(d => setDoctorName(d.user?.name || 'Doctor'));
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/ip-rounds');
      if (res.ok) {
        const data = await res.json();
        setRounds(data.rounds || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogRound = async (admissionId: string) => {
    setSavingRound(true);
    try {
      const res = await fetch(`/api/hospital/ip-admission/${admissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addNote: {
            note: progressNote,
            vitals: { bp: vitals.bp, spo2: vitals.spo2, temp: vitals.temp, pulse: vitals.pulse },
            addedBy: `Dr. ${doctorName}`
          }
        })
      });
      if (res.ok) {
        toast({ title: 'Round Logged', description: 'Progress note and vitals saved.' });
        setVitals({ bp: '', spo2: '', temp: '', pulse: '' });
        setProgressNote('');
        fetchRounds();
      } else {
        toast({ variant: 'destructive', description: 'Failed to save round' });
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Network error' }); }
    finally { setSavingRound(false); }
  };

  const handleDischarge = async (admission: any) => {
    setDischarging(true);
    try {
      // 1. Create discharge note
      const noteContent = `DISCHARGE SUMMARY\n\nFinal Diagnosis: ${dischargeForm.finalDiagnosis}\nMedications on Discharge: ${dischargeForm.medications}\nFollow-up Instructions: ${dischargeForm.followUpInstructions}\nFollow-up Date: ${dischargeForm.followUpDate}\n\nAdmission Date: ${new Date(admission.admissionDate).toLocaleDateString()}\nDischarge Date: ${new Date().toLocaleDateString()}`;

      await fetch('/api/doctor/clinical-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: admission.patientId?._id || admission.patientId,
          content: noteContent,
          noteType: 'discharge',
          isVisibleToPatient: true
        })
      });

      // 2. Discharge the patient
      const res = await fetch(`/api/hospital/ip-admission/${admission._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'discharged', dischargeDate: new Date() })
      });

      if (res.ok) {
        toast({ title: 'Patient Discharged', description: 'Discharge summary created.' });
        setDischargeId(null);
        setDischargeForm({ finalDiagnosis: '', medications: '', followUpInstructions: '', followUpDate: '' });
        fetchRounds();
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Failed to discharge' }); }
    finally { setDischarging(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">IP Rounds</h2>
          <p className="text-slate-400 font-medium text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <span className="bg-[#02B69A]/10 text-[#02B69A] text-xs font-black px-3 py-1.5 rounded-lg border border-[#02B69A]/20 uppercase tracking-widest self-start">
          {rounds.length} Admitted
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-44 border border-slate-800" />)}
        </div>
      ) : rounds.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-[32px] p-12 text-center">
          <div className="w-16 h-16 bg-slate-800/50 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BedDouble className="w-8 h-8" />
          </div>
          <p className="text-slate-400 font-bold mb-1">No admitted patients</p>
          <p className="text-slate-600 text-[13px]">Your IP list is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rounds.map((admission: any) => {
            const isExpanded = expandedId === admission._id;
            const isDischarging = dischargeId === admission._id;
            const latestNote = admission.progressNotes?.[admission.progressNotes.length - 1];

            return (
              <Card key={admission._id} className="bg-slate-900 border-slate-800 shadow-none overflow-hidden">
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{admission.patientId?.name}</h3>
                        <p className="text-[#02B69A] text-sm font-bold mt-0.5">
                          {admission.ward} · Bed {admission.bedNumber}
                        </p>
                      </div>
                      <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg">
                        Day {admission.daysAdmitted || Math.ceil((Date.now() - new Date(admission.admissionDate).getTime()) / 86400000)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1 mb-2">{admission.admissionReason}</p>
                    {latestNote && (
                      <p className="text-xs text-slate-500 italic line-clamp-1">
                        Latest: "{latestNote.note}"
                      </p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => { setExpandedId(isExpanded ? null : admission._id); setDischargeId(null); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold text-xs rounded-xl transition-all">
                        <Activity className="w-4 h-4" /> Log Round
                      </button>
                      <button onClick={() => { setExpandedId(isExpanded ? null : admission._id); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all">
                        <FileText className="w-4 h-4" /> View Sheet
                      </button>
                    </div>
                  </div>

                  {/* Expanded Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/50 p-5 space-y-5">
                      {/* Vitals Input */}
                      <div>
                        <h4 className="text-[10px] font-black text-[#02B69A] uppercase tracking-widest mb-3">Record Vitals</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1"><Heart className="w-3 h-3 text-rose-400" /> BP</label>
                            <input className={inputClass} placeholder="120/80" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1"><Wind className="w-3 h-3 text-blue-400" /> SpO2</label>
                            <input className={inputClass} placeholder="98%" value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1"><Thermometer className="w-3 h-3 text-amber-400" /> Temp</label>
                            <input className={inputClass} placeholder="98.6°F" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1"><Activity className="w-3 h-3 text-green-400" /> Pulse</label>
                            <input className={inputClass} placeholder="72 bpm" value={vitals.pulse} onChange={e => setVitals({...vitals, pulse: e.target.value})} />
                          </div>
                        </div>
                        <textarea className={`${inputClass} mt-3`} rows={2} placeholder="Clinical observations from today's round..."
                          value={progressNote} onChange={e => setProgressNote(e.target.value)} />
                        <button onClick={() => handleLogRound(admission._id)} disabled={savingRound}
                          className="mt-3 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2">
                          {savingRound ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Round'}
                        </button>
                      </div>

                      {/* Previous Notes */}
                      {admission.progressNotes && admission.progressNotes.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Progress Notes</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {[...admission.progressNotes].reverse().map((note: any, i: number) => (
                              <div key={i} className="bg-black/40 border border-slate-800 rounded-xl p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] text-slate-400 font-bold">{note.addedBy || 'Staff'}</span>
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

                      {/* Discharge Button */}
                      <button onClick={() => setDischargeId(isDischarging ? null : admission._id)}
                        className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-sm rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {isDischarging ? 'Cancel Discharge' : 'Discharge Patient'}
                      </button>

                      {/* Discharge Form */}
                      {isDischarging && (
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 space-y-4">
                          <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest">Discharge Summary</h4>
                          <textarea className={inputClass} rows={2} placeholder="Final diagnosis..." value={dischargeForm.finalDiagnosis}
                            onChange={e => setDischargeForm({...dischargeForm, finalDiagnosis: e.target.value})} />
                          <textarea className={inputClass} rows={2} placeholder="Medications on discharge..."  value={dischargeForm.medications}
                            onChange={e => setDischargeForm({...dischargeForm, medications: e.target.value})} />
                          <textarea className={inputClass} rows={2} placeholder="Follow-up instructions..." value={dischargeForm.followUpInstructions}
                            onChange={e => setDischargeForm({...dischargeForm, followUpInstructions: e.target.value})} />
                          <input type="date" className={inputClass} value={dischargeForm.followUpDate}
                            onChange={e => setDischargeForm({...dischargeForm, followUpDate: e.target.value})} />
                          <button onClick={() => handleDischarge(admission)} disabled={discharging || !dischargeForm.finalDiagnosis}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2">
                            {discharging ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Confirm Discharge'}
                          </button>
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
