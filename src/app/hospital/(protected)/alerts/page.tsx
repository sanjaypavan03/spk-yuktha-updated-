"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Activity, Users, Heart,
  CheckCircle2, BedDouble, Clock, Calendar, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function HospitalAlertsPage() {
  const { toast } = useToast();

  const [emergencyFlags, setEmergencyFlags] = useState<any[]>([]);
  const [emLoading, setEmLoading] = useState(true);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  const [admissions, setAdmissions] = useState<any[]>([]);
  const [ipLoading, setIpLoading] = useState(true);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [ipAll, setIpAll] = useState<any[]>([]);

  const fetchEmergencyFlags = useCallback(async () => {
    try {
      const res = await fetch('/api/hospital/emergency-flag?resolved=false');
      if (res.ok) {
        const data = await res.json();
        setEmergencyFlags(data.flags || []);
      }
    } catch (e) { console.error(e); }
    finally { setEmLoading(false); }
  }, []);

  const fetchAdmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/hospital/ip-admission?status=admitted');
      if (res.ok) {
        const data = await res.json();
        setAdmissions(data.admissions || []);
      }
    } catch (e) { console.error(e); }
    finally { setIpLoading(false); }
  }, []);

  const fetchDailyStats = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [apptRes, ipRes, ipDisRes] = await Promise.all([
        fetch(`/api/appointments?date=${today}`),
        fetch('/api/hospital/ip-admission?status=admitted'),
        fetch('/api/hospital/ip-admission?status=discharged')
      ]);
      if (apptRes.ok) { const d = await apptRes.json(); setAppointments(d.appointments || []); }
      if (ipRes.ok) { const d = await ipRes.json(); setIpAll(prev => [...d.admissions || []]); }
      if (ipDisRes.ok) {
        const d = await ipDisRes.json();
        const todayDischarged = (d.admissions || []).filter((a: any) =>
          a.dischargeDate && format(new Date(a.dischargeDate), 'yyyy-MM-dd') === today
        );
        setIpAll(prev => {
          const admitted = prev.filter(a => a.status === 'admitted');
          return [...admitted, ...todayDischarged];
        });
      }
    } catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    fetchEmergencyFlags();
    fetchAdmissions();
    fetchDailyStats();

    const interval = setInterval(() => {
      fetchEmergencyFlags();
      fetchAdmissions();
      fetchDailyStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchEmergencyFlags, fetchAdmissions, fetchDailyStats]);

  const handleResolve = async (id: string) => {
    setResolvingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch('/api/hospital/emergency-flag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setFadingIds(prev => new Set(prev).add(id));
        setTimeout(() => {
          setEmergencyFlags(prev => prev.filter(f => f._id !== id));
          setFadingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        }, 500);
        toast({ title: 'Emergency Resolved' });
      }
    } catch (e) { toast({ variant: 'destructive', description: 'Failed to resolve' }); }
    finally { setResolvingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Clinical flags from MedicalInfo (embedded in patient data from IP admission populate)
  const flaggedAdmissions = admissions.filter((adm: any) => {
    const mi = adm.patientId?.medicalInfo || adm.medicalInfo;
    if (!mi) return false;
    return mi.knownAllergies || mi.hasPacemakerOrImplant || mi.isPregnant ||
      (mi.chronicConditions && mi.chronicConditions.trim()) ||
      mi.conditionControlLevel === 'Poorly controlled' || mi.conditionControlLevel === 'Uncontrolled';
  });

  const todayAppointments = appointments;
  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;
  const pendingToday = todayAppointments.filter(a => a.status === 'booked' || a.status === 'scheduled').length;
  const activeIP = admissions.length;
  const dischargedToday = ipAll.filter(a => a.status === 'discharged' && a.dischargeDate &&
    format(new Date(a.dischargeDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">Alerts & Monitoring</h2>
        <p className="text-slate-400 font-medium text-sm">Auto-refreshes every 30 seconds</p>
      </div>

      {/* SECTION 1 — Active Emergencies */}
      <section className="bg-rose-950/20 border border-rose-800/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
          <h3 className="text-xl font-bold text-white font-playfair uppercase tracking-widest">Active Emergencies</h3>
          <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black px-2 py-0.5 rounded border border-rose-500/30 ml-auto">
            {emergencyFlags.length}
          </span>
        </div>

        {emLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-40 border border-slate-800" />)}
          </div>
        ) : emergencyFlags.length === 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-emerald-400">No active emergencies</p>
              <p className="text-sm text-slate-500">All emergency flags have been resolved.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {emergencyFlags.map((flag: any) => (
              <Card key={flag._id} className={`bg-slate-900 border-rose-500/30 shadow-lg shadow-rose-900/10 overflow-hidden transition-opacity duration-500 ${fadingIds.has(flag._id) ? 'opacity-0' : 'opacity-100'}`}>
                <div className="bg-rose-500/10 px-4 py-2 border-b border-rose-500/20 flex justify-between items-center">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">Emergency Push</span>
                  <span className="text-[10px] text-slate-500">{timeAgo(flag.flaggedAt)}</span>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{flag.patientId?.name || flag.patientId?.firstName}</h4>
                    {flag.patientId?.bloodGroup && (
                      <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase mt-1 inline-block">
                        {flag.patientId.bloodGroup}
                      </span>
                    )}
                  </div>
                  <div className="bg-black/40 rounded-xl p-3 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Reason</p>
                    <p className="text-sm text-slate-300 italic">{flag.reason}</p>
                  </div>
                  <button
                    onClick={() => handleResolve(flag._id)}
                    disabled={resolvingIds.has(flag._id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resolvingIds.has(flag._id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Mark Resolved
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2 — Clinical Flags */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white font-playfair uppercase tracking-wider">Clinical Flags — Admitted Patients</h3>
        </div>

        {ipLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-32 border border-slate-800" />)}</div>
        ) : flaggedAdmissions.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
            <p className="text-slate-500 font-medium">No admitted patients with critical medical flags.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {flaggedAdmissions.map((adm: any) => {
              const mi = adm.patientId?.medicalInfo || adm.medicalInfo || {};
              return (
                <Card key={adm._id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-white text-lg">{adm.patientId?.name}</h4>
                        <p className="text-xs text-[#02B69A] font-bold">{adm.ward} · Bed {adm.bedNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {mi.knownAllergies && <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase border border-rose-500/30">Allergy Alert</span>}
                      {mi.hasPacemakerOrImplant && <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/30">Implant</span>}
                      {mi.isPregnant && <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-400 text-[10px] font-black uppercase border border-pink-500/30">Pregnant</span>}
                      {mi.chronicConditions && mi.chronicConditions.trim() && <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase border border-amber-500/30">Chronic</span>}
                      {(mi.conditionControlLevel === 'Poorly controlled' || mi.conditionControlLevel === 'Uncontrolled') && (
                        <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-black uppercase border border-red-500/30">Poorly Controlled</span>
                      )}
                    </div>
                    {mi.allergiesDetails && (
                      <p className="text-xs text-rose-400 bg-rose-500/5 rounded-lg p-2 border border-rose-500/10 mb-2">
                        Allergies: {mi.allergiesDetails}
                      </p>
                    )}
                    <a href="/hospital/inpatients" className="text-xs text-[#02B69A] hover:text-[#00D4AA] font-bold">
                      View Full Profile →
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3 — Daily Summary */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#02B69A]" />
          <h3 className="text-lg font-bold text-white font-playfair uppercase tracking-wider">Daily OP/IP Summary</h3>
          <span className="text-[10px] text-slate-600 font-bold ml-auto">{format(new Date(), 'dd MMM yyyy')}</span>
        </div>
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-28 border border-slate-800" />)}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total OP Today', value: todayAppointments.length, icon: Users, color: 'text-[#02B69A]' },
              { label: 'Completed OP', value: completedToday, icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Pending OP', value: pendingToday, icon: Clock, color: 'text-amber-400' },
              { label: 'Active IP', value: activeIP, icon: BedDouble, color: 'text-indigo-400' },
              { label: 'Discharged Today', value: dischargedToday, icon: Activity, color: 'text-slate-400' },
            ].map((stat, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800 shadow-none">
                <CardContent className="p-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-slate-800`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
