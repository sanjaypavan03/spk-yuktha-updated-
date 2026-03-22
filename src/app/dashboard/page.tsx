"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Pill, FileText, CheckCircle, Users, QrCode, Calendar, Check, Bell, User, X } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [pills, setPills] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // For demo notification slide down
  const [showNotifications, setShowNotifications] = useState(false);
  const [refillAlerts, setRefillAlerts] = useState<any[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<any[]>([]);

  const handleToggleTaken = async (pillId: string, status: { taken?: boolean; skipped?: boolean }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent card clicks if any
    
    // Optimistic update
    setPills(prev => prev.map(p => p._id === pillId ? { ...p, ...status } : p));

    try {
      const res = await fetch(`/api/patient/pills/${pillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status)
      });
      if (!res.ok) throw new Error("API failed");
    } catch (e) {
      console.error("Dashboard toggle error", e);
      // We could revert here, but for now we rely on the next fetch
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pillsRes, apptsRes, scoreRes, alertsRes, notesRes] = await Promise.all([
          fetch('/api/patient/pills/today?tzOffset=' + (-(new Date().getTimezoneOffset()))).catch(() => null),
          fetch('/api/appointments?date=today').catch(() => null),
          fetch('/api/patient/health-score').catch(() => null),
          fetch('/api/patient/refill-alerts').catch(() => null),
          fetch('/api/patient/clinical-notes').catch(() => null)
        ]);

        if (pillsRes?.ok) setPills((await pillsRes.json()).pills || []);
        if (apptsRes?.ok) setAppointments((await apptsRes.json()).appointments || []);
        if (scoreRes?.ok) setHealthScore(await scoreRes.json());
        if (alertsRes?.ok) setRefillAlerts((await alertsRes.json()).alerts || []);
        if (notesRes?.ok) setClinicalNotes((await notesRes.json()).notes || []);
      } catch (e) {
        console.error("Dashboard fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const adherence = healthScore?.score !== undefined ? healthScore.score : null;

  const hasItemsToday = pills.length > 0 || appointments.length > 0;

  const getGreetings = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F9FAFB] min-h-screen p-4 pt-1 sm:px-8 sm:pb-8 sm:pt-2">
      {/* 1. Premium Emerald Gradient Header */}
      <div className="relative pt-1">
        <div className="bg-gradient-to-br from-[#10B981] to-[#059669] text-white rounded-[28px] sm:rounded-2xl p-5 shadow-[0_10px_40px_rgba(16,185,129,0.25)] relative z-20 overflow-hidden">
          {/* Decorative background flare */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-[11px] font-bold opacity-70 uppercase tracking-[0.12em] mb-1">
                {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
              </p>
              <h1 className="text-xl font-bold font-playfair tracking-tight mb-0.5 leading-tight">
                {getGreetings()}
              </h1>
              <p className="text-[16px] font-medium opacity-90 leading-tight">
                {user?.firstName || user?.name || 'Guest'}
              </p>
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all active:scale-95"
            >
              <Bell className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              {refillAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#10B981]"></span>
              )}
            </button>
          </div>

          {/* Metrics Row - more compact */}
          {adherence !== null && (
            <div className="bg-white/10 rounded-[18px] p-3.5 backdrop-blur-md border border-white/20 flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-50 tracking-wider mb-0.5 opacity-80">Adherence</p>
                <p className="text-2xl font-bold">{adherence}%</p>
              </div>
              <div className="relative h-12 w-12 flex items-center justify-center">
                <svg className="h-12 w-12 -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/20" />
                  <circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - adherence / 100)} strokeLinecap="round" className="text-white transition-all duration-1000 ease-out" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Slide-down Notifications Panel */}
        <div className={`absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-b-[24px] mx-2 border-x border-b border-slate-100 transition-all duration-500 ease-out-expo z-10 origin-top ${showNotifications ? 'scale-y-100 opacity-100 translate-y-0' : 'scale-y-0 opacity-0 -translate-y-4'}`}>
          <div className="p-5 max-h-72 overflow-y-auto">
            <h3 className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-[0.1em]">Recent Notifications</h3>
            {refillAlerts.length > 0 ? (
              <div className="space-y-3">
                {refillAlerts.map((a, i) => (
                  <div key={i} className="flex gap-4 bg-rose-50/50 p-4 rounded-[16px] border border-rose-100/50 group active:scale-[0.98] transition-all">
                    <div className="w-10 h-10 rounded-[12px] bg-rose-100 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-[14px]">Refill Required</p>
                      <p className="text-[13px] text-slate-500 font-medium leading-snug">{a.medicineName} is running low.</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400 font-medium">All caught up! ✨</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 px-1">
        {/* 2. TODAY'S SCHEDULE - Premium Look */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-end mb-5">
            <h2 className="text-[20px] font-bold text-slate-900 font-playfair tracking-tight">Today's Schedule</h2>
            <Link href="/dashboard/med-tracker" className="text-[13px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">View All</Link>
          </div>

          {loading ? (
            <div className="grid gap-4">
               {[1, 2].map(i => <div key={i} className="animate-pulse bg-white rounded-[20px] h-20 border border-slate-100"></div>)}
            </div>
          ) : (pills.filter(p => !p.taken && !p.skipped).length === 0 && appointments.length === 0) ? (
            <div className="bg-white rounded-[24px] p-6 sm:p-8 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                <CheckCircle className="w-7 h-7 text-emerald-500" strokeWidth={2} />
              </div>
              <p className="font-bold text-slate-900 text-base">You're all clear today</p>
              <p className="text-slate-500 text-[13px] mt-1 max-w-[220px] mx-auto leading-relaxed opacity-80">No medical appointments or medications remaining for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Appointments */}
              {appointments.map((appt: any, i) => (
                <div key={`appt-${i}`} className="bg-white rounded-[20px] p-4 flex items-center gap-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-all">
                  <div className="bg-indigo-50 text-indigo-600 h-11 w-11 rounded-[14px] flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-[15px] truncate">{appt.reason || 'Medical Consultation'}</p>
                    <p className="text-[13px] text-slate-500 font-medium mt-0.5 truncate">{appt.hospitalId?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-indigo-600 text-[15px]">{appt.timeSlot}</p>
                    <span className="text-[10px] uppercase font-bold text-slate-300 tracking-[0.05em] block mt-0.5">Alert</span>
                  </div>
                </div>
              ))}

              {/* Medications */}
              {pills.filter(p => !p.taken && !p.skipped).map((pill, i) => (
                <div key={`pill-${i}`} className="bg-white rounded-[20px] p-4 flex items-center gap-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-all">
                  <div 
                    onClick={(e) => handleToggleTaken(pill._id, { taken: true }, e)}
                    className="h-11 w-11 rounded-[14px] bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 cursor-pointer transition-all hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Pill className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] truncate text-slate-900">{pill.medicineName || pill.name}</p>
                    <p className="text-[13px] text-slate-500 font-medium mt-0.5">{pill.dosage}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 text-[15px]">{pill.scheduledTime}</p>
                    <div className="flex gap-3 mt-1 justify-end relative z-30">
                        <button 
                          onClick={(e) => handleToggleTaken(pill._id, { taken: true }, e)}
                          className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-all shadow-sm cursor-pointer active:scale-90"
                          title="Mark as Taken"
                        >
                          <Check className="w-5 h-5" strokeWidth={3} />
                        </button>
                        <button 
                          onClick={(e) => handleToggleTaken(pill._id, { skipped: true }, e)}
                          className="w-10 h-10 flex items-center justify-center bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition-all shadow-sm cursor-pointer active:scale-90"
                          title="Mark as Skipped"
                        >
                          <X className="w-5 h-5" strokeWidth={3} />
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2.5 DOCTOR'S NOTES & ADVICE */}
        {clinicalNotes.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-[20px] font-bold text-slate-900 font-playfair tracking-tight mb-5">Doctor's Advice</h2>
            <div className="space-y-4">
              {clinicalNotes.map((note, i) => (
                <div key={`note-${i}`} className="bg-white rounded-[24px] p-5 border-l-4 border-emerald-500 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                          <User className="w-4 h-4 text-emerald-600" />
                       </div>
                       <div>
                          <p className="font-bold text-slate-900 text-sm">Dr. {note.doctorId?.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{note.doctorId?.specialty}</p>
                       </div>
                    </div>
                    <span className="text-[10px] text-slate-300 font-bold">{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 text-[13px] leading-relaxed font-medium">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. QUICK ACCESS - Refined Grid */}
        <div className="pb-10">
          <h2 className="text-[20px] font-bold text-slate-900 font-playfair tracking-tight mb-5">Quick Access</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Meds", href: "/dashboard/med-tracker", icon: Pill, color: "bg-emerald-50 text-emerald-600" },
              { label: "Appointments", href: "/dashboard/appointments", icon: Calendar, color: "bg-blue-50 text-blue-600" },
              { label: "Vault", href: "/dashboard/vault", icon: FileText, color: "bg-indigo-50 text-indigo-600" },
              { label: "Family", href: "/dashboard/family", icon: Users, color: "bg-orange-50 text-orange-600" },
              { label: "Emergency", href: "/dashboard/emergency-qr", icon: QrCode, color: "bg-rose-50 text-rose-600" },
              { label: "Profile", href: "/dashboard/profile", icon: User, color: "bg-slate-50 text-slate-600" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push(item.href)}
                className="bg-white rounded-[20px] p-3 sm:p-5 flex flex-col items-center justify-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-emerald-100 transition-all active:scale-95 group"
              >
                <div className={`h-11 w-11 sm:h-14 sm:w-14 rounded-[14px] sm:rounded-[18px] flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] ${item.color}`}>
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                </div>
                <p className="font-bold text-slate-800 text-[11px] sm:text-[13px] text-center leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}

