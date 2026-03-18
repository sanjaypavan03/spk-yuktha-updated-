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
    <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F8FAFC] min-h-screen">

      {/* 1. Teal Gradient Header with Notification panel */}
      <div className="relative">
        <div className="bg-gradient-to-br from-[#02B69A] to-[#018A75] text-white rounded-b-[24px] sm:rounded-2xl p-6 shadow-md -mx-4 -mt-4 sm:mx-0 sm:mt-0 relative z-20">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold font-playfair tracking-tight">Good Morning,</h1>
              <p className="opacity-90 font-medium">{user?.firstName || user?.name || 'Guest'}</p>
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <Bell className="w-5 h-5 text-white" />
              {refillAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#02B69A]"></span>
              )}
            </button>
          </div>

          {/* Metrics */}
          <div className="flex gap-4 sm:gap-12 overflow-hidden">
            {healthScore && (
              <div className="flex-1 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-xs sm:text-sm text-green-100 font-medium mb-1">Adherence Score</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold">{healthScore.score}%</p>
                </div>
                {healthScore.trend === 'up' && <span className="text-[10px] bg-green-400/20 px-2 py-0.5 rounded-full mt-2 inline-block">↑ Improving</span>}
                {healthScore.trend === 'down' && <span className="text-[10px] bg-red-400/20 px-2 py-0.5 rounded-full mt-2 inline-block">↓ Needs Attention</span>}
              </div>
            )}

            {adherence !== null && (
              <div className="flex-1 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-green-100 font-medium mb-1">Adherence</p>
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

        {/* Slide-down Notifications */}
        <div className={`absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-2xl mx-2 border border-slate-100 transition-all duration-300 z-10 origin-top ${showNotifications ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}>
          <div className="p-4 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Notifications</h3>
            {refillAlerts.length > 0 ? (
              <div className="space-y-3">
                {refillAlerts.map((a, i) => (
                  <div key={i} className="flex gap-3 bg-red-50 p-3 rounded-xl border border-red-100">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Refill Required</p>
                      <p className="text-xs text-slate-600">You have under 3 days of {a.medicineName} left.</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-2">You have no new notifications.</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-1">
        {/* 2. TODAY'S SCHEDULE FIRST */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 font-playfair">Today's Schedule</h2>
          </div>

          {loading ? (
            <div className="animate-pulse bg-white rounded-[20px] h-32 border border-slate-100"></div>
          ) : !hasItemsToday ? (
            <div className="bg-white rounded-[20px] p-8 text-center border border-[#F1F5F9] shadow-sm">
              <span className="text-3xl mb-3 block">🌿</span>
              <p className="font-medium text-slate-800 text-lg">You're all clear today</p>
              <p className="text-slate-500 text-sm mt-1">No appointments or medications scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Appointments */}
              {appointments.map((appt: any, i) => (
                <div key={`appt-${i}`} className="bg-white rounded-[20px] p-4 flex items-center gap-4 border border-[#F1F5F9] shadow-sm">
                  <div className="bg-blue-50 text-blue-600 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{appt.reason || 'Medical Appointment'}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{appt.hospitalId?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#02B69A]">{appt.timeSlot}</p>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Appointment</span>
                  </div>
                </div>
              ))}

              {/* Medications */}
              {pills.map((pill, i) => (
                <div key={`pill-${i}`} className="bg-white rounded-[20px] p-4 flex items-center gap-4 border border-[#F1F5F9] shadow-sm">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${pill.taken ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{pill.medicineName}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{pill.dosage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-700">{pill.scheduledTime}</p>
                    {pill.taken ? (
                      <span className="text-[10px] flex items-center justify-end font-bold text-green-600 mt-1 uppercase tracking-wider"><Check className="w-3 h-3 mr-0.5" /> Taken</span>
                    ) : (
                      <button className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-bold mt-1 uppercase tracking-wider hover:bg-orange-200 transition-colors">
                        Mark Taken
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. QUICK ACCESS SECOND */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 font-playfair mb-3">Quick Access</h2>

          {/* Horizontal Scroll Row */}
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { label: "Med Tracker", href: "/dashboard/med-tracker", icon: Pill, color: "bg-blue-50 text-blue-600" },
              { label: "Family", href: "/dashboard/family", icon: Users, color: "bg-orange-50 text-orange-600" },
              { label: "Emergency", href: "/dashboard/emergency-qr", icon: QrCode, color: "bg-red-50 text-red-600" },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push(item.href)}
                className="snap-start shrink-0 w-28 bg-white rounded-[20px] p-4 flex flex-col items-center justify-center border border-[#F1F5F9] shadow-sm cursor-pointer hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-700 text-xs text-center">{item.label}</p>
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
