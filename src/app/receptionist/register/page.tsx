"use client";

import { useState, useEffect } from "react";
import { 
    UserPlus, 
    Search, 
    CheckCircle2, 
    ArrowRight, 
    Calendar,
    Phone,
    Mail,
    User,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceptionistRegisterPatient() {
    const [step, setStep] = useState(1);
    const [searchPhone, setSearchPhone] = useState("");
    const [searching, setSearching] = useState(false);
    const [foundPatient, setFoundPatient] = useState<any>(null);
    const [receptionist, setReceptionist] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dateOfBirth: "",
    });

    const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch('/api/receptionist/me')
            .then(res => res.json())
            .then(data => setReceptionist(data.user))
            .catch(console.error);
    }, []);

    const handleSearch = async () => {
        if (!searchPhone) return;
        setSearching(true);
        setError("");
        try {
            const res = await fetch(`/api/hospital/patient-search?phone=${searchPhone}`);
            const data = await res.json();
            if (res.ok) {
                setFoundPatient(data.patient);
                setStep(2);
            } else {
                setFoundPatient(null);
                setFormData({ ...formData, phone: searchPhone });
                setStep(2);
            }
        } catch (err) {
            setError("Search failed");
        } finally {
            setSearching(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch('/api/hospital/patient-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setRegistrationSuccess(data);
                setStep(3);
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#02B69A] outline-none transition-all placeholder:text-slate-700";

    if (step === 3 && registrationSuccess) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
                <Card className="bg-slate-900 border-[#02B69A]/30 border-2 overflow-hidden shadow-2xl shadow-[#02B69A]/5">
                    <div className="bg-[#02B69A]/10 p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-[#02B69A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#02B69A]/20">
                            <CheckCircle2 className="w-12 h-12 text-black" />
                        </div>
                        <h3 className="text-3xl font-black text-white font-playfair tracking-tight">Registration Complete!</h3>
                        <div className="space-y-2">
                            <p className="text-slate-400">Patient <strong className="text-white">{registrationSuccess.patient.name}</strong> is now registered at <strong className="text-[#02B69A]">{receptionist?.hospitalName}</strong>.</p>
                            <div className="bg-black/50 border border-slate-800 rounded-2xl p-4 mt-6 inline-block">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Temporary Portal Password</p>
                                <p className="text-2xl font-mono font-black text-[#00D4AA] tracking-wider">{registrationSuccess.tempPassword}</p>
                            </div>
                        </div>
                        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <Button 
                                onClick={() => window.location.reload()}
                                className="bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black px-10 h-14 rounded-xl shadow-lg shadow-[#02B69A]/10 text-sm uppercase tracking-widest"
                            >
                                New Registration
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => window.location.href='/receptionist/dashboard'}
                                className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 px-10 h-14 rounded-xl text-sm uppercase tracking-widest"
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-[10px] font-black text-[#02B69A] uppercase tracking-[0.2em] mb-2">Patient Intake Operations</h2>
                    <h1 className="text-4xl md:text-5xl font-playfair font-black text-white italic tracking-tighter">
                        Register Patient
                    </h1>
                    <p className="text-slate-500 font-medium font-playfair">Managing onboarding for {receptionist?.hospitalName}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-full border border-slate-800 shrink-0">
                    {[1, 2].map((s) => (
                        <div 
                            key={s} 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                step === s ? 'bg-[#02B69A] text-black' : 'text-slate-600'
                            }`}
                        >
                            {s}
                        </div>
                    ))}
                </div>
            </div>

            {step === 1 && (
                <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="p-8 lg:p-12 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white font-playfair tracking-tight">Identity Search</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">Check if the patient already has a global Yuktha profile by searching their phone number.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                <input
                                                    type="text"
                                                    placeholder="Enter phone number"
                                                    value={searchPhone}
                                                    onChange={e => setSearchPhone(e.target.value)}
                                                    className={`${inputClass} pl-12`}
                                                />
                                            </div>
                                            <Button 
                                                onClick={handleSearch}
                                                disabled={searching || !searchPhone}
                                                className="bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-12 px-6 rounded-xl transition-all"
                                            >
                                                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                            </Button>
                                        </div>
                                    </div>
                                    {error && <p className="text-rose-400 text-[10px] font-bold uppercase bg-rose-400/10 p-3 rounded-lg border border-rose-400/10">{error}</p>}
                                </div>
                            </div>
                            <div className="bg-black/40 border-l border-slate-800 p-8 lg:p-12 flex flex-col justify-center items-center text-center space-y-4">
                                <Search className="w-12 h-12 text-slate-800 mb-2" />
                                <h4 className="text-slate-400 font-bold font-playfair italic">Proactive Care</h4>
                                <p className="text-[10px] text-slate-600 uppercase tracking-widest leading-loose">Always search before creating a new account to prevent duplicate medical records.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-right-4">
                    <CardContent className="p-0">
                        {foundPatient ? (
                            <div className="p-12 text-center space-y-8">
                                <div className="w-20 h-20 bg-[#02B69A]/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-[#02B69A]/20">
                                    <CheckCircle2 className="w-10 h-10 text-[#02B69A]" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-white font-playfair tracking-tight">Patient Found!</h3>
                                    <p className="text-slate-400">{foundPatient.name} is already registered on Yuktha.</p>
                                </div>
                                <div className="bg-black/50 border border-slate-800 rounded-3xl p-6 max-w-sm mx-auto text-left space-y-3">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Global Profile Data</p>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500">Email</p>
                                        <p className="text-sm font-bold text-white tracking-tight">{foundPatient.email}</p>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800">
                                        <p className="text-xs font-bold text-slate-500">Phone</p>
                                        <p className="text-sm font-bold text-white tracking-tight">{foundPatient.phone}</p>
                                    </div>
                                </div>
                                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button 
                                        onClick={() => window.location.href='/receptionist/appointments?patientId=' + foundPatient._id}
                                        className="bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black px-10 h-14 rounded-xl shadow-lg shadow-[#02B69A]/10 text-sm uppercase tracking-widest"
                                    >
                                        Proceed to Appointment
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setStep(1)}
                                        className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 px-10 h-14 rounded-xl text-sm uppercase tracking-widest"
                                    >
                                        Wrong Person? Search Again
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-5">
                                <div className="md:col-span-3 p-8 lg:p-12">
                                    <form onSubmit={handleRegister} className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-white font-playfair tracking-tight">Create New Profile</h3>
                                            <p className="text-xs text-slate-500 font-medium">New patient record for <span className="text-[#02B69A]">{receptionist?.hospitalName}</span></p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Legal Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Johnathan Doe"
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        className={`${inputClass} pl-12`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="john@example.com"
                                                        value={formData.email}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                        className={`${inputClass} pl-12`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number (Locked)</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                    <input
                                                        type="text"
                                                        disabled
                                                        value={formData.phone}
                                                        className={`${inputClass} pl-12 opacity-50 bg-black/80`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date of Birth</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.dateOfBirth}
                                                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                                        className={`${inputClass} pl-12`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {error && <p className="text-rose-400 text-[10px] font-bold uppercase bg-rose-400/10 p-3 rounded-xl border border-rose-400/10">{error}</p>}

                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-white hover:bg-slate-100 text-black font-black h-14 rounded-xl shadow-xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest mt-4"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
                                        </Button>
                                    </form>
                                </div>
                                <div className="md:col-span-2 bg-black/40 border-l border-slate-800 p-8 lg:p-12 flex flex-col justify-center space-y-6">
                                    <div className="space-y-2">
                                        <h4 className="text-slate-400 font-bold font-playfair italic">Digital Identity</h4>
                                        <p className="text-[10px] text-slate-600 uppercase tracking-widest leading-loose">Registering this patient will generate their unique QR identity. This profile will be accessible across all Yuktha Health affiliate hospitals.</p>
                                    </div>
                                    <div className="bg-[#02B69A]/5 border border-[#02B69A]/10 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-[#02B69A] uppercase tracking-[0.2em] mb-2 text-center">Security Notice</p>
                                        <p className="text-[9px] text-slate-500 leading-relaxed text-center font-medium">A temporary password will be generated for the patient to access their portal and digitize their own vault.</p>
                                    </div>
                                    <Button variant="ghost" className="text-slate-600 hover:text-white text-[10px] uppercase font-bold tracking-widest" onClick={() => setStep(1)}>
                                        Cancel & Go Back
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
