"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Pill, FileText, CheckCircle, Users, QrCode, Calendar, Check, Bell } from "lucide-react";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pillsRes, apptsRes, scoreRes, alertsRes] = await Promise.all([
          fetch('/api/patient/pills/today').catch(() => null),
          fetch('/api/appointments?date=today').catch(() => null),
          fetch('/api/patient/health-score').catch(() => null),
          fetch('/api/patient/refill-alerts').catch(() => null)
        ]);

        if (pillsRes?.ok) setPills((await pillsRes.json()).pils || []);
        if (apptsRes?.ok) setAppointments((await apptsRes.json()).appointments || []);
        if (scoreRes?.ok) setHealthScore(await scoreRes.json());
        if (alertsRes?.ok) setRefillAlerts((await alertsRes.json()).alerts || []);
      } catch (e) {
        console.error("Dashboard fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const adherence = pills.length > 0
    ? Math.round((pills.filter(p => p.taken).length / pills.length) * 100)
    : null; // null means no schedule for today

  const hasItemsToday = pills.length > 0 || appointments.length > 0;

  return (
    <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F9FAFB] min-h-screen p-4 pt-1 sm:px-8 sm:pb-8 sm:pt-2">
      {/* 1. Premium Emerald Gradient Header */}
      <div className="relative">
        <div className="bg-gradient-to-br from-[#10B981] to-[#059669] text-white rounded-[28px] sm:rounded-2xl p-6 shadow-[0_10px_40px_rgba(16,185,129,0.25)] relative z-20 overflow-hidden">
          {/* Decorative background flare */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h1 className="text-2xl font-bold font-playfair tracking-tight">Good Morning,</h1>
              <p className="opacity-90 font-medium text-lg leading-tight">{user?.firstName || user?.name || 'Guest'}</p>
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all active:scale-95"
            >
              <Bell className="w-5 h-5 text-white" strokeWidth={2.5} />
              {refillAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[#10B981]"></span>
              )}
            </button>
          </div>

          {/* Metrics Row */}
          <div className="flex gap-4 sm:gap-6 relative z-10">
            {healthScore && (
              <div className="flex-1 bg-white/10 rounded-[20px] p-4 backdrop-blur-md border border-white/20">
                <p className="text-[11px] uppercase font-bold text-emerald-50 tracking-wider mb-1 opacity-80">Health Score</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold">{healthScore.score}%</p>
                </div>
                {healthScore.trend === 'up' && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-lg mt-2 inline-block">↑ Improving</span>}
              </div>
            )}

            {adherence !== null && (
              <div className="flex-1 bg-white/10 rounded-[20px] p-4 backdrop-blur-md border border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase font-bold text-emerald-50 tracking-wider mb-1 opacity-80">Adherence</p>
                  <p className="text-3xl font-bold">{adherence}%</p>
                </div>
                <div className="relative w-12 h-12">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/20" strokeWidth="3" />
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-white" strokeWidth="3" strokeDasharray={`${adherence}, 100`} strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            )}
          </div>
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
        <div className="mb-10">
          <div className="flex justify-between items-end mb-5">
            <h2 className="text-[20px] font-bold text-slate-900 font-playfair tracking-tight">Today's Schedule</h2>
            <Link href="/dashboard/med-tracker" className="text-[13px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">View All</Link>
          </div>

          {loading ? (
            <div className="grid gap-4">
               {[1, 2].map(i => <div key={i} className="animate-pulse bg-white rounded-[20px] h-20 border border-slate-100"></div>)}
            </div>
          ) : !hasItemsToday ? (
            <div className="bg-white rounded-[24px] p-10 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 transition-transform group-hover:scale-110">
                <CheckCircle className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-slate-900 text-lg">You're all clear today</p>
              <p className="text-slate-500 text-sm mt-1.5 max-w-[200px] mx-auto leading-relaxed">No medical appointments or medications remaining for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Appointments */}
              {appointments.map((appt: any, i) => (
                <div key={`appt-${i}`} className="bg-white rounded-[20px] p-5 flex items-center gap-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-all">
                  <div className="bg-indigo-50 text-indigo-600 h-14 w-14 rounded-[16px] flex items-center justify-center shrink-0">
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
              {pills.map((pill, i) => (
                <div key={`pill-${i}`} className="bg-white rounded-[20px] p-5 flex items-center gap-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-all">
                  <div className={`h-14 w-14 rounded-[16px] flex items-center justify-center shrink-0 ${pill.taken ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    <Pill className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-[15px] truncate">{pill.medicineName}</p>
                    <p className="text-[13px] text-slate-500 font-medium mt-0.5">{pill.dosage}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 text-[15px]">{pill.scheduledTime}</p>
                    {pill.taken ? (
                      <span className="text-[10px] flex items-center justify-end font-bold text-emerald-600 mt-1 uppercase tracking-wider"><Check className="w-3.5 h-3.5 mr-0.5" /> Done</span>
                    ) : (
                      <button className="text-[11px] bg-orange-100/80 text-orange-700 px-3 py-1 rounded-[8px] font-bold mt-1.5 uppercase tracking-wide hover:bg-orange-200 transition-colors">
                        Take Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. QUICK ACCESS - Refined Grid */}
        <div className="pb-10">
          <h2 className="text-[20px] font-bold text-slate-900 font-playfair tracking-tight mb-5">Quick Access</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Med Tracker", href: "/dashboard/med-tracker", icon: Pill, color: "bg-emerald-50 text-emerald-600" },
              { label: "Vault", href: "/dashboard/vault", icon: FileText, color: "bg-indigo-50 text-indigo-600" },
              { label: "Family", href: "/dashboard/family", icon: Users, color: "bg-orange-50 text-orange-600" },
              { label: "Emergency", href: "/dashboard/emergency-qr", icon: QrCode, color: "bg-rose-50 text-rose-600" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push(item.href)}
                className="bg-white rounded-[24px] p-6 flex flex-col items-center justify-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-emerald-100 transition-all active:scale-95 group"
              >
                <div className={`h-16 w-16 rounded-[20px] flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] ${item.color}`}>
                  <item.icon className="h-7 w-7" strokeWidth={2.2} />
                </div>
                <p className="font-bold text-slate-800 text-[14px] text-center">{item.label}</p>
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
