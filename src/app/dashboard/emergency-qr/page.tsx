"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useEmergencyInfo } from '@/context/emergency-info-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Activity, Phone, HeartPulse, Stethoscope, Droplet, User as UserIcon, Edit2, ArrowLeft } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export default function EmergencyQRPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { setIsModalOpen } = useEmergencyInfo();

  const [medicalInfo, setMedicalInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicalInfo = async () => {
      try {
        if (user?.qrCode) {
          const res = await fetch(`/api/emergency/${user.qrCode}`);
          if (res.ok) {
            const data = await res.json();
            setMedicalInfo(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch medical info:", error);
        toast({ variant: 'destructive', description: "Failed to load medical data." });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMedicalInfo();
    }
  }, [user, toast]);

  const qrUrl = user?.qrCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://yuktha-health.vercel.app'}/api/emergency/${user.qrCode}`
    : '';

  const qrImageUrl = qrUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&color=02b69a` : null;

  return (
    <div className="space-y-6 pb-24 sm:pb-8 font-sans bg-[#F8FAFC] min-h-screen">

      {/* Red Alert Style Header */}
      <div className="bg-red-500 rounded-b-[32px] sm:rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden -mx-4 -mt-4 sm:mx-0 sm:mt-0">
        <button 
            onClick={() => router.back()}
            className="absolute left-6 top-8 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all z-30 active:scale-95"
            aria-label="Go back"
        >
            <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="relative z-10 flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl mb-4 border-4 border-red-400">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold font-playfair tracking-tight mb-2">Emergency Hub</h1>
          <p className="text-red-100 max-w-sm text-sm font-medium">
            Present this QR code to first responders or medical staff. It provides instant access to your critical, life-saving information.
          </p>
        </div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      <div className="px-2 sm:px-0">

        {/* QR Code Container */}
        <Card className="border-none shadow-md rounded-[32px] overflow-hidden -mt-8 relative z-20 mx-auto max-w-sm">
          <CardContent className="p-8 flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 font-sans">Public Medical Identity</p>

            {qrImageUrl ? (
              <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 shadow-inner">
                <img src={qrImageUrl} alt="Emergency QR Code" className="w-48 h-48 sm:w-56 sm:h-56 mix-blend-multiply" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-slate-100 rounded-3xl animate-pulse"></div>
            )}

            <p className="text-[10px] sm:text-xs text-center text-slate-400 mt-6 font-medium leading-relaxed">
              Scanning this code grants read-only access to the <strong className="text-red-500">Tier 1 fields</strong> displayed below.
            </p>
          </CardContent>
        </Card>

        {/* EDIT BUTTON */}
        <div className="max-w-sm mx-auto mt-4">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-14 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
          >
            <Edit2 className="w-5 h-5" />
            Edit Emergency Information
          </Button>
        </div>

        {/* What happens on scan preview */}
        <div className="mt-8 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-slate-800 font-playfair mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-slate-400" /> What First Responders See
          </h2>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 bg-white rounded-2xl animate-pulse"></div>
              <div className="h-20 bg-white rounded-2xl animate-pulse"></div>
            </div>
          ) : !medicalInfo ? (
            <div className="bg-white p-6 rounded-2xl text-center border border-slate-100">
              <p className="text-slate-500 text-sm">No emergency data found. Click "Edit Emergency Information" above to complete your profile.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="bg-rose-50 p-2.5 rounded-xl text-rose-500"><Droplet className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Blood Group</p>
                  <p className="font-bold text-slate-800 text-lg">{medicalInfo.bloodGroup || 'Unknown'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-500"><Activity className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Critical Allergies to Meds</p>
                  <p className="font-bold text-slate-800">{medicalInfo.allergies && medicalInfo.allergies.length > 0 ? medicalInfo.allergies.join(', ') : 'None reported'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-500"><HeartPulse className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chronic Conditions</p>
                  <p className="font-bold text-slate-800">{medicalInfo.chronicConditions && medicalInfo.chronicConditions.length > 0 ? medicalInfo.chronicConditions.join(', ') : 'None'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-500"><Stethoscope className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Current Essential Meds</p>
                  <p className="font-bold text-slate-800">{medicalInfo.currentMedications && medicalInfo.currentMedications.length > 0 ? medicalInfo.currentMedications.join(', ') : 'None reported'}</p>
                </div>
              </div>

              {/* Alert Tags Row */}
              <div className="flex flex-wrap gap-2 pt-2">
                {medicalInfo.hasImplant && (
                  <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 uppercase tracking-wide">
                    Implant / Pacemaker
                  </div>
                )}
                {medicalInfo.isPregnant && (
                  <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-100 uppercase tracking-wide">
                    Pregnant
                  </div>
                )}
              </div>

              {medicalInfo.emergencyContact1?.phone && (
                <div className="bg-slate-900 rounded-2xl p-5 shadow-sm flex items-center justify-between mt-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Emergency Contact</p>
                    <p className="font-bold text-white text-lg">{medicalInfo.emergencyContact1.name}</p>
                    <p className="text-slate-300 text-sm mt-0.5 font-medium">{medicalInfo.emergencyContact1.relation}</p>
                  </div>
                  <a href={`tel:${medicalInfo.emergencyContact1.phone}`} className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 active:scale-95 transition-transform">
                    <Phone className="w-5 h-5 text-white" />
                  </a>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
