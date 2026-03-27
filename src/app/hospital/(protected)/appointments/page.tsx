"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar, Clock, User, Search, Plus, X, CheckCircle2,
  XCircle, UserX, ChevronDown, FileText, Loader2, Eye
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import "react-day-picker/dist/style.css";

export default function HospitalAppointmentsPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('all');

  // Booking
  const [showBooking, setShowBooking] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [bookDoctor, setBookDoctor] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [bookSlot, setBookSlot] = useState('');
  const [bookReason, setBookReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // OP Sheet
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);

  const inputClass = "w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#02B69A] focus:ring-1 focus:ring-[#02B69A] transition-colors";

  useEffect(() => {
    fetch('/api/hospital/staff').then(r => r.json()).then(d => setDoctors(d.doctors || [])).catch(() => {});
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/appointments?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments((data.appointments || []).sort((a: any, b: any) => {
          const timeA = a.timeSlot || ''; const timeB = b.timeSlot || '';
          return timeA.localeCompare(timeB);
        }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Patient search debounce
  useEffect(() => {
    if (patientSearch.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hospital/patient-search?q=${encodeURIComponent(patientSearch)}`);
        if (res.ok) { const d = await res.json(); setPatientResults(d.patients || []); }
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  // Fetch slots when doctor/date change
  useEffect(() => {
    if (!bookDoctor) return;
    setSlotsLoading(true);
    setBookSlot('');
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    fetch(`/api/appointments/slots?doctorId=${bookDoctor}&date=${dateStr}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [bookDoctor, selectedDate]);

  const handleStatus = async (apptId: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast({ title: `Appointment ${status}` });
        fetchAppointments();
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveNotes = async (apptId: string) => {
    setSavingNotes(apptId);
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes[apptId] })
      });
      if (res.ok) toast({ title: 'Notes Saved' });
    } catch (e) { console.error(e); }
    finally { setSavingNotes(null); }
  };

  const handleBook = async () => {
    if (!selectedPatient || !bookDoctor || !bookSlot) return;
    setBooking(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          doctorId: bookDoctor,
          date: format(selectedDate, 'yyyy-MM-dd'),
          timeSlot: bookSlot,
          reason: bookReason || 'Routine Checkup'
        })
      });
      if (res.ok) {
        toast({ title: 'Appointment Booked' });
        setShowBooking(false);
        resetBooking();
        fetchAppointments();
      } else {
        const d = await res.json();
        toast({ variant: 'destructive', description: d.error || 'Failed' });
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Network error' }); }
    finally { setBooking(false); }
  };

  const resetBooking = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setBookDoctor('');
    setBookSlot('');
    setBookReason('');
    setSlots([]);
  };

  const accentColor = (status: string) => {
    if (status === 'booked' || status === 'scheduled') return 'border-l-[#02B69A]';
    if (status === 'completed') return 'border-l-slate-600';
    if (status === 'cancelled') return 'border-l-rose-500';
    if (status === 'no_show') return 'border-l-amber-500';
    return 'border-l-slate-700';
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      booked: 'bg-[#02B69A]/10 text-[#02B69A]', scheduled: 'bg-[#02B69A]/10 text-[#02B69A]',
      completed: 'bg-slate-800 text-slate-400', cancelled: 'bg-rose-500/10 text-rose-400',
      no_show: 'bg-amber-500/10 text-amber-400'
    };
    return map[s] || 'bg-slate-800 text-slate-400';
  };

  const filtered = doctorFilter === 'all'
    ? appointments
    : appointments.filter(a => a.doctorId?._id === doctorFilter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">Appointments</h2>
        <p className="text-slate-400 font-medium text-sm">Manage outpatient schedules and consultations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Calendar + Controls */}
        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-none overflow-hidden">
            <CardContent className="p-4">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { if (d) setSelectedDate(d); }}
                className="!font-sans"
              />
            </CardContent>
          </Card>

          <select className={inputClass} value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}>
            <option value="all">All Doctors</option>
            {doctors.map(d => <option key={d._id} value={d._id}>{d.name} — {d.specialty}</option>)}
          </select>

          <button onClick={() => { setShowBooking(!showBooking); if (showBooking) resetBooking(); }}
            className="w-full py-3 bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
            {showBooking ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Book Appointment</>}
          </button>

          {showBooking && (
            <Card className="bg-slate-900 border-[#02B69A]/30 shadow-none">
              <CardContent className="p-4 space-y-3">
                {/* Patient Search */}
                {selectedPatient ? (
                  <div className="flex items-center justify-between bg-[#02B69A]/10 border border-[#02B69A]/20 rounded-xl px-3 py-2">
                    <p className="text-sm font-bold text-white">{selectedPatient.name}</p>
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <input className={inputClass} placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                    {patientResults.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl max-h-40 overflow-y-auto shadow-2xl">
                        {patientResults.map(p => (
                          <div key={p._id} onClick={() => { setSelectedPatient(p); setPatientSearch(''); setPatientResults([]); }}
                            className="px-3 py-2 hover:bg-slate-800 cursor-pointer text-sm text-white">{p.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <select className={inputClass} value={bookDoctor} onChange={e => setBookDoctor(e.target.value)}>
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                {slotsLoading ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : slots.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {slots.map(s => (
                      <button key={s} onClick={() => setBookSlot(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${bookSlot === s ? 'bg-[#02B69A] text-black' : 'bg-black border border-slate-700 text-slate-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <input className={inputClass} placeholder="Reason (optional)" value={bookReason} onChange={e => setBookReason(e.target.value)} />
                <button onClick={handleBook} disabled={booking || !selectedPatient || !bookDoctor || !bookSlot}
                  className="w-full py-2.5 bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold rounded-xl text-sm disabled:opacity-50">
                  {booking ? 'Booking...' : 'Book'}
                </button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT — Appointment List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-playfair">
                {format(selectedDate, 'EEEE, d MMM yyyy')}
              </h3>
              <p className="text-xs text-slate-500">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-24 border border-slate-800" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No appointments for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((appt: any) => {
                const isExpanded = expandedId === appt._id;
                const isBooked = appt.status === 'booked' || appt.status === 'scheduled';

                return (
                  <Card key={appt._id} className={`bg-slate-900 border-slate-800 shadow-none overflow-hidden border-l-4 ${accentColor(appt.status)}`}>
                    <CardContent className="p-0">
                      <div className="p-4 flex items-center gap-4">
                        {/* Time Badge */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center shrink-0">
                          <Clock className="w-3 h-3 text-slate-500 mx-auto mb-0.5" />
                          <p className="text-xs font-bold text-white">{appt.timeSlot}</p>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-white truncate">{appt.patientId?.name || 'Unknown'}</p>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusBadge(appt.status)}`}>{appt.status}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{appt.reason}</p>
                          {appt.doctorId?.name && <p className="text-[10px] text-slate-600 mt-0.5">Dr. {appt.doctorId.name}</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isBooked && (
                            <>
                              <button onClick={() => handleStatus(appt._id, 'completed')}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" title="Complete">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleStatus(appt._id, 'no_show')}
                                className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" title="No Show">
                                <UserX className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleStatus(appt._id, 'cancelled')}
                                className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" title="Cancel">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => { setExpandedId(isExpanded ? null : appt._id); if (!notes[appt._id]) setNotes(prev => ({...prev, [appt._id]: appt.notes || ''})); }}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white" title="OP Sheet">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* OP Sheet Expanded */}
                      {isExpanded && (
                        <div className="border-t border-slate-800 bg-slate-950/50 p-4 space-y-3">
                          <h4 className="text-[10px] font-black text-[#02B69A] uppercase tracking-widest">OP Sheet</h4>
                          <textarea className={inputClass} rows={3} placeholder="Appointment notes..."
                            value={notes[appt._id] || ''} onChange={e => setNotes(prev => ({...prev, [appt._id]: e.target.value}))} />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveNotes(appt._id)} disabled={savingNotes === appt._id}
                              className="bg-[#02B69A] hover:bg-[#00D4AA] text-slate-950 font-bold px-5 py-2 rounded-xl text-sm disabled:opacity-50">
                              {savingNotes === appt._id ? 'Saving...' : 'Save Notes'}
                            </button>
                            <button onClick={() => setExpandedId(null)} className="text-slate-400 hover:text-white text-sm font-bold px-4 py-2">Close Sheet</button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
