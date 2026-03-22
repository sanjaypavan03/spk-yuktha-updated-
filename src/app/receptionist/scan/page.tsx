"use client";

import { useState } from "react";
import { 
    QrCode, 
    Search, 
    AlertTriangle, 
    CheckCircle2, 
    User, 
    Activity, 
    Loader2, 
    ArrowRight,
    ShieldAlert,
    Clock,
    UserCheck,
    Phone,
    HeartPulse
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReceptionistScanPage() {
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [patient, setPatient] = useState<any>(null);
    const [flagging, setFlagging] = useState(false);
    const [flagged, setFlagged] = useState(false);

    const handleScan = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!token) return;

        setLoading(true);
        setError("");
        setPatient(null);
        setFlagged(false);

        try {
            const res = await fetch('/api/hospital/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (res.ok) {
                setPatient(data.patient);
            } else {
                setError(data.error || "Failed to retrieve patient profile");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmergencyFlag = async (reason: string) => {
        if (!patient) return;
        setFlagging(true);
        try {
            const res = await fetch('/api/hospital/emergency-flag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    patientId: patient.id, 
                    reason: reason || "Emergency front-desk escalation" 
                })
            });
            if (res.ok) {
                setFlagged(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFlagging(false);
        }
    };

    const inputClass = "w-full bg-black border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-[#02B69A] outline-none transition-all placeholder:text-slate-700 font-mono text-lg tracking-wider";

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-[10px] font-black text-[#02B69A] uppercase tracking-[0.2em] mb-2">Digital Identity Verification</h2>
                    <h1 className="text-4xl md:text-5xl font-playfair font-black text-white italic tracking-tighter">
                        Scan Patient QR
                    </h1>
                </div>
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Network Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Input Section */}
                <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-2xl overflow-hidden h-fit">
                    <div className="p-8 space-y-8">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-[#02B69A]/10 rounded-3xl flex items-center justify-center mx-auto border border-[#02B69A]/20 shadow-lg shadow-[#02B69A]/5">
                                <QrCode className="w-10 h-10 text-[#02B69A]" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-white font-playfair italic">Digital Handshake</h3>
                                <p className="text-xs text-slate-500 font-medium">Input the token or use a connected scanner</p>
                            </div>
                        </div>

                        <form onSubmit={handleScan} className="space-y-4">
                            <div className="space-y-1.5 text-center">
                                <input
                                    type="text"
                                    placeholder="QR TOKEN (e.g. YUK-XXXX)"
                                    value={token}
                                    onChange={e => setToken(e.target.value.toUpperCase())}
                                    className={inputClass}
                                    autoFocus
                                />
                                {error && (
                                    <p className="text-rose-400 text-[10px] font-black uppercase mt-2">{error}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-14 rounded-2xl shadow-xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                            </Button>
                        </form>

                        <div className="pt-8 border-t border-slate-800/50 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Operational Guidance</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-black/40 rounded-2xl border border-slate-800 space-y-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                                    <p className="text-[9px] text-slate-500 leading-tight">Retrieve critical allergies and blood group instantly.</p>
                                </div>
                                <div className="p-4 bg-black/40 rounded-2xl border border-slate-800 space-y-2">
                                    <Clock className="w-4 h-4 text-[#02B69A]" />
                                    <p className="text-[9px] text-slate-500 leading-tight">Mark patient as admitted within seconds of arrival.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Result Section */}
                <div className="lg:col-span-3">
                    {!patient && !loading && (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px] text-center space-y-4">
                            <UserCheck className="w-16 h-16 text-slate-800" />
                            <p className="text-slate-500 font-medium font-playfair italic">Awaiting patient handshake via digital token.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-slate-800 rounded-[40px] text-center space-y-6">
                            <div className="relative">
                                <Activity className="w-12 h-12 text-[#02B69A] animate-pulse" />
                                <div className="absolute inset-0 bg-[#02B69A]/20 blur-xl animate-pulse"></div>
                            </div>
                            <p className="text-[#02B69A] text-sm font-black uppercase tracking-[0.2em] animate-pulse">Retrieving Clinical Data...</p>
                        </div>
                    )}

                    {patient && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            {/* Profile Header */}
                            <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden rounded-[40px]">
                                <CardContent className="p-0">
                                    <div className="bg-black/50 p-8 flex flex-col md:flex-row items-center gap-8 border-b border-slate-800">
                                        <div className="w-24 h-24 bg-[#02B69A] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#02B69A]/20 rotate-3 group-hover:rotate-0 transition-transform">
                                            <User className="w-12 h-12 text-black" />
                                        </div>
                                        <div className="flex-1 text-center md:text-left space-y-2">
                                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                                <h3 className="text-3xl font-black text-white font-playfair tracking-tight">{patient.name}</h3>
                                                <span className="bg-[#02B69A]/10 text-[#02B69A] text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-[#02B69A]/20 w-fit mx-auto md:mx-0">Verified Global ID</span>
                                            </div>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 text-sm font-medium">
                                                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {patient.phone}</span>
                                                <span className="flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5" /> {patient.bloodGroup || 'O+'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => window.location.href='/receptionist/appointments?patientId=' + patient.id} className="bg-white hover:bg-slate-100 text-black font-black px-6 h-12 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
                                                Book Checkup
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        {/* Critical Alerts */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Critical Conditions</h4>
                                                <div className="bg-black/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                                                    {patient.knownAllergies?.length > 0 ? (
                                                        <div className="flex gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                                                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white mb-1">Known Allergies</p>
                                                                <p className="text-[10px] text-slate-500 leading-relaxed font-mono uppercase tracking-tighter">{patient.knownAllergies.join(', ')}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-600 italic">No critical allergies documented.</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Emergency Actions</h4>
                                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-center gap-4">
                                                    {flagged ? (
                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                                                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Emergency Escalated</p>
                                                        </div>
                                                    ) : (
                                                        <Button 
                                                            onClick={() => handleEmergencyFlag("Front-desk escalation: Acute distress")}
                                                            disabled={flagging}
                                                            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black h-14 rounded-2xl shadow-xl shadow-rose-900/20 text-xs uppercase tracking-widest group transition-all"
                                                        >
                                                            {flagging ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                                <>
                                                                    <AlertTriangle className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" /> 
                                                                    Escalate to Emergency
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    <p className="text-[9px] text-slate-600 text-center font-medium leading-relaxed">Escalating marks this patient for immediate doctor attention in the system dashboard.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
