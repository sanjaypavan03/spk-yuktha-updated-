"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Search, Activity, HeartPulse, Droplet, User, CheckCircle2, Users, Calendar, Plus, Key, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Tab = 'operations' | 'staff' | 'appointments';

export default function HospitalDashboardPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('operations');

    // Operations State
    const [qrToken, setQrToken] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    const [patientData, setPatientData] = useState<any>(null);

    // Staff State
    const [staff, setStaff] = useState<{ doctors: any[], pharmacies: any[] }>({ doctors: [], pharmacies: [] });
    const [staffLoading, setStaffLoading] = useState(false);
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [newDoctor, setNewDoctor] = useState({ name: '', email: '', specialty: '' });
    const [passwordModal, setPasswordModal] = useState<{ open: boolean, doctorId: string, doctorName: string }>({ open: false, doctorId: '', doctorName: '' });
    const [newPassword, setNewPassword] = useState('');
    const [settingPassword, setSettingPassword] = useState(false);

    // Appointments State
    const [appointments, setAppointments] = useState<any[]>([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'staff') fetchStaff();
        if (activeTab === 'appointments') fetchAppointments();
    }, [activeTab]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!qrToken.trim()) return;
        setScanLoading(true);
        setPatientData(null);
        try {
            const res = await fetch('/api/hospital/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: qrToken })
            });
            if (res.ok) {
                const data = await res.json();
                setPatientData(data.patient);
                toast({ title: 'Scan Successful', description: 'Patient record loaded.' });
            } else {
                toast({ variant: 'destructive', description: 'Invalid or expired QR Token.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', description: 'Network error.' });
        } finally {
            setScanLoading(false);
        }
    };

    const fetchStaff = async () => {
        setStaffLoading(true);
        try {
            const res = await fetch('/api/hospital/staff');
            if (res.ok) {
                const data = await res.json();
                setStaff({ doctors: data.doctors || [], pharmacies: data.pharmacies || [] });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setStaffLoading(false);
        }
    };

    const handleAddDoctor = async () => {
        if (!newDoctor.name || !newDoctor.email) {
            toast({ variant: 'destructive', description: 'Name and email are required.' });
            return;
        }
        try {
            const res = await fetch('/api/hospital/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'Doctor', ...newDoctor })
            });
            if (res.ok) {
                toast({ title: 'Doctor Added', description: `${newDoctor.name} has been added.` });
                setNewDoctor({ name: '', email: '', specialty: '' });
                setShowAddDoctor(false);
                fetchStaff();
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', description: data.error || 'Failed to add doctor.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        }
    };

    const handleSetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast({ variant: 'destructive', description: 'Password must be at least 6 characters.' });
            return;
        }
        setSettingPassword(true);
        try {
            const res = await fetch('/api/admin/doctors/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorId: passwordModal.doctorId, password: newPassword })
            });
            if (res.ok) {
                toast({ title: 'Password Set', description: `Login password set for ${passwordModal.doctorName}.` });
                setPasswordModal({ open: false, doctorId: '', doctorName: '' });
                setNewPassword('');
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', description: data.error || 'Failed to set password.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        } finally {
            setSettingPassword(false);
        }
    };

    const fetchAppointments = async () => {
        setAppointmentsLoading(true);
        try {
            const res = await fetch('/api/appointments');
            if (res.ok) {
                const data = await res.json();
                setAppointments((data.appointments || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAppointmentsLoading(false);
        }
    };

    const inputClass = "w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#02B69A] focus:ring-1 focus:ring-[#02B69A] transition-colors";

    const tabs: { key: Tab, label: string }[] = [
        { key: 'operations', label: 'Operations' },
        { key: 'staff', label: 'Staff' },
        { key: 'appointments', label: 'Appointments' },
    ];

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h2 className="text-3xl font-bold text-white font-playfair tracking-tight mb-1">Hospital Dashboard</h2>
                <p className="text-slate-400 font-medium text-sm">Manage patient intake, staff, and scheduling.</p>
            </div>

            {/* Tab Bar */}
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === tab.key ? 'bg-[#02B69A] text-black shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/******** OPERATIONS TAB ********/}
            {activeTab === 'operations' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <Card className="bg-slate-900 border-slate-800">
                            <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-[#02B69A]" />
                                <h3 className="font-bold text-white">Scan Patient QR</h3>
                            </div>
                            <CardContent className="p-6">
                                <form onSubmit={handleScan} className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="Enter QR token" value={qrToken} onChange={e => setQrToken(e.target.value)} className={`${inputClass} pl-10`} />
                                    </div>
                                    <button type="submit" disabled={scanLoading || !qrToken.trim()} className="w-full py-3 bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold rounded-xl transition-all disabled:opacity-50">
                                        {scanLoading ? 'Decrypting...' : 'Scan & Retrieve'}
                                    </button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        {!patientData && !scanLoading && (
                            <div className="h-full min-h-[300px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 p-8">
                                <QrCode className="w-16 h-16 mb-4 text-slate-700" />
                                <h3 className="text-xl font-bold text-slate-400 font-playfair">Waiting for Scan</h3>
                                <p className="mt-2 text-sm max-w-sm text-center">Scan a patient QR code to display their full medical profile.</p>
                            </div>
                        )}

                        {patientData && (
                            <div className="animate-in fade-in duration-500 space-y-4">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-bold text-white">{patientData.name || 'Unknown'}</h2>
                                        <span className="bg-[#02B69A]/20 text-[#02B69A] border border-[#02B69A]/30 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 mt-4">
                                        <div className="bg-black/50 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                                            <Droplet className="w-5 h-5 text-rose-500" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Blood</p>
                                                <p className="font-bold text-white">{patientData.bloodGroup || '--'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/50 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                                            <HeartPulse className="w-5 h-5 text-indigo-400" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">BP</p>
                                                <p className="font-bold text-white">{patientData.bpReading || '--'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/50 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                                            <Activity className="w-5 h-5 text-emerald-400" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">BMI</p>
                                                <p className="font-bold text-white">{patientData.bmi || '--'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardContent className="p-5">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-[#02B69A] mb-3">Critical Alerts</h4>
                                            <p className="text-xs text-slate-500 mb-0.5">Allergies</p>
                                            <p className="text-sm font-semibold text-rose-300 mb-2">{patientData.allergiesDetails || 'None'}</p>
                                            <p className="text-xs text-slate-500 mb-0.5">Chronic Conditions</p>
                                            <p className="text-sm font-semibold text-slate-200">{patientData.chronicConditions || 'None'}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardContent className="p-5">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-3">Tier 2 Details</h4>
                                            <p className="text-xs text-slate-500 mb-0.5">Insurance</p>
                                            <p className="text-sm font-semibold text-slate-200 mb-2">{patientData.insuranceProvider || 'Not provided'}</p>
                                            <p className="text-xs text-slate-500 mb-0.5">Current Meds</p>
                                            <p className="text-sm font-semibold text-slate-200">{patientData.currentMedications || 'None'}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/******** STAFF TAB ********/}
            {activeTab === 'staff' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white font-playfair">Doctors</h3>
                        <Button onClick={() => setShowAddDoctor(!showAddDoctor)} className="bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold h-10">
                            <Plus className="w-4 h-4 mr-2" /> Add Doctor
                        </Button>
                    </div>

                    {/* Add Doctor Form */}
                    {showAddDoctor && (
                        <Card className="bg-slate-900 border-slate-800 animate-in slide-in-from-top-4 duration-300">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-white">New Doctor</h4>
                                    <Button size="icon" variant="ghost" onClick={() => setShowAddDoctor(false)}><X className="w-4 h-4 text-slate-400" /></Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <input type="text" placeholder="Full Name" value={newDoctor.name} onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} className={inputClass} />
                                    <input type="email" placeholder="Email" value={newDoctor.email} onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })} className={inputClass} />
                                    <input type="text" placeholder="Specialty" value={newDoctor.specialty} onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })} className={inputClass} />
                                </div>
                                <Button onClick={handleAddDoctor} className="bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold">Create Doctor Account</Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Doctor List */}
                    {staffLoading ? (
                        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-20 border border-slate-800"></div>)}</div>
                    ) : staff.doctors.length === 0 ? (
                        <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-dashed border-slate-800">
                            <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-400">No Doctors Yet</h3>
                            <p className="text-slate-500 text-sm mt-2">Add doctors to your hospital to manage patient care.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {staff.doctors.map((doc: any) => (
                                <Card key={doc._id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-[#02B69A]/10 text-[#02B69A] flex items-center justify-center font-bold text-lg font-playfair shrink-0">
                                            {doc.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{doc.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{doc.email}</p>
                                            {doc.specialty && <p className="text-xs text-slate-400 mt-1">{doc.specialty}</p>}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-[#02B69A]/30 text-[#02B69A] hover:bg-[#02B69A]/10 gap-1.5 shrink-0"
                                            onClick={() => setPasswordModal({ open: true, doctorId: doc._id, doctorName: doc.name })}
                                        >
                                            <Key className="w-3.5 h-3.5" /> Set Password
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/******** APPOINTMENTS TAB ********/}
            {activeTab === 'appointments' && (
                <div className="space-y-4">
                    {appointmentsLoading ? (
                        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-20 border border-slate-800"></div>)}</div>
                    ) : appointments.length === 0 ? (
                        <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-dashed border-slate-800">
                            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-400">No Appointments</h3>
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {appointments.map(appt => (
                                <Card key={appt._id} className="bg-slate-900 border-slate-800">
                                    <CardContent className="p-5 flex items-start gap-4">
                                        <div className="hidden sm:flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl p-3 shrink-0 min-w-[60px]">
                                            <span className="text-[#02B69A] font-bold text-lg leading-none">{format(new Date(appt.date), 'dd')}</span>
                                            <span className="text-slate-500 text-[10px] font-bold uppercase">{format(new Date(appt.date), 'MMM')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{appt.patientId?.name || 'Patient'}</p>
                                            <p className="text-slate-400 text-sm truncate">{appt.reason}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">{appt.timeSlot}</span>
                                                <span className={`font-bold uppercase tracking-wider ${appt.status === 'scheduled' ? 'text-[#02B69A]' : appt.status === 'completed' ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/******** SET PASSWORD MODAL ********/}
            {passwordModal.open && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPasswordModal({ open: false, doctorId: '', doctorName: '' })}>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white font-playfair">Set Doctor Password</h3>
                            <Button size="icon" variant="ghost" onClick={() => setPasswordModal({ open: false, doctorId: '', doctorName: '' })}>
                                <X className="w-4 h-4 text-slate-400" />
                            </Button>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            Setting login password for <strong className="text-white">{passwordModal.doctorName}</strong>.
                        </p>
                        <input
                            type="password"
                            placeholder="New password (min 6 chars)"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className={inputClass}
                        />
                        <Button
                            onClick={handleSetPassword}
                            disabled={settingPassword || newPassword.length < 6}
                            className="w-full mt-4 bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold h-12"
                        >
                            {settingPassword ? 'Setting...' : 'Set Password'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
