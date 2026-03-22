"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Search, Activity, HeartPulse, Droplet, User, CheckCircle2, Users, Calendar as CalendarIcon, Plus, Key, X, AlertCircle, ShieldAlert, Baby, Info, TrendingUp, Clock, Filter, Phone, Mail, FileText } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Tab = 'operations' | 'staff' | 'appointments' | 'patient-registration' | 'alerts';

export default function HospitalDashboardPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('operations');

    // Operations State
    const [qrToken, setQrToken] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    const [patientData, setPatientData] = useState<any>(null);

    // Staff State
    const [staff, setStaff] = useState<{ doctors: any[], pharmacies: any[], receptionists: any[] }>({ doctors: [], pharmacies: [], receptionists: [] });
    const [staffLoading, setStaffLoading] = useState(false);
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [newDoctor, setNewDoctor] = useState({ name: '', email: '', specialty: '' });
    const [showAddReceptionist, setShowAddReceptionist] = useState(false);
    const [newReceptionist, setNewReceptionist] = useState({ name: '', email: '', phone: '' });
    const [passwordModal, setPasswordModal] = useState<{ open: boolean, id: string, name: string, type: 'doctor' | 'receptionist' }>({ open: false, id: '', name: '', type: 'doctor' });
    const [newPassword, setNewPassword] = useState('');
    const [settingPassword, setSettingPassword] = useState(false);

    // Appointments State
    const [appointments, setAppointments] = useState<any[]>([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);

    // Patient Registration State
    const [regType, setRegType] = useState<'OP' | 'IP'>('OP');
    const [searchPhone, setSearchPhone] = useState('');
    const [searchingPatient, setSearchingPatient] = useState(false);
    const [foundPatient, setFoundPatient] = useState<any>(null);
    const [showCreatePatient, setShowCreatePatient] = useState(false);
    const [newPatientForm, setNewPatientForm] = useState({ name: '', email: '', phone: '', dob: '' });
    const [opForm, setOpForm] = useState({ doctorId: '', date: '', timeSlot: '', reason: '' });
    const [ipForm, setIpForm] = useState({ doctorId: '', ward: '', bedNumber: '', admissionReason: '', admissionDate: '' });
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [registrationSuccess, setRegistrationSuccess] = useState<{ patientName: string, type: string } | null>(null);
    const [ipAdmissions, setIpAdmissions] = useState<any[]>([]);
    const [ipLoading, setIpLoading] = useState(false);
    const [selectedIPAdmission, setSelectedIPAdmission] = useState<any>(null);
    const [newProgressNote, setNewProgressNote] = useState('');

    // Alerts & Emergency State
    const [emergencyFlags, setEmergencyFlags] = useState<any[]>([]);
    const [emergencyLoading, setEmergencyLoading] = useState(false);
    const [dailyStats, setDailyStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [emergencyReason, setEmergencyReason] = useState('');
    const [selectedPatientMedicalInfo, setSelectedPatientMedicalInfo] = useState<any>(null);
    const [showMedicalInfoModal, setShowMedicalInfoModal] = useState(false);

    // Scheduling State
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [appointmentFilterDoctor, setAppointmentFilterDoctor] = useState('');
    const [showBookAppointmentModal, setShowBookAppointmentModal] = useState(false);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpData, setFollowUpData] = useState<any>(null);
    const [bookingData, setBookingData] = useState({ patientPhone: '', doctorId: '', timeSlot: '', reason: '' });
    const [foundPatientForBooking, setFoundPatientForBooking] = useState<any>(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [availableSlotsForBooking, setAvailableSlotsForBooking] = useState<string[]>([]);

    useEffect(() => {
        if (activeTab === 'staff' || activeTab === 'patient-registration' || activeTab === 'appointments' || activeTab === 'alerts') fetchStaff();
        if (activeTab === 'appointments') fetchAppointmentsForDate();
        if (activeTab === 'patient-registration' || activeTab === 'alerts') fetchIPAdmissions();
        if (activeTab === 'alerts') {
            fetchEmergencyFlags();
            fetchDailyStats();
        }
    }, [activeTab, selectedDate, appointmentFilterDoctor]);

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
            const [staffRes, recepRes] = await Promise.all([
                fetch('/api/hospital/staff'),
                fetch('/api/hospital/staff/receptionist')
            ]);
            
            let doctors = [];
            let pharmacies = [];
            let receptionists = [];

            if (staffRes.ok) {
                const data = await staffRes.json();
                doctors = data.doctors || [];
                pharmacies = data.pharmacies || [];
            }

            if (recepRes.ok) {
                const data = await recepRes.json();
                receptionists = data.receptionists || [];
            }

            setStaff({ doctors, pharmacies, receptionists });
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

    const handleAddReceptionist = async () => {
        if (!newReceptionist.name || !newReceptionist.email || !newReceptionist.phone) {
            toast({ variant: 'destructive', description: 'Name, email, and phone are required.' });
            return;
        }
        try {
            const res = await fetch('/api/hospital/staff/receptionist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReceptionist)
            });
            if (res.ok) {
                toast({ title: 'Receptionist Added', description: `${newReceptionist.name} has been added.` });
                setNewReceptionist({ name: '', email: '', phone: '' });
                setShowAddReceptionist(false);
                fetchStaff();
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', description: data.error || 'Failed to add receptionist.' });
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
            const url = passwordModal.type === 'doctor' 
                ? '/api/admin/doctors/set-password' 
                : '/api/admin/receptionists/set-password';
            
            const body = passwordModal.type === 'doctor'
                ? { doctorId: passwordModal.id, password: newPassword }
                : { receptionistId: passwordModal.id, password: newPassword };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                toast({ title: 'Password Set', description: `Login password set for ${passwordModal.name}.` });
                setPasswordModal({ open: false, id: '', name: '', type: 'doctor' });
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

    const fetchAppointmentsForDate = async () => {
        if (!selectedDate) return;
        setAppointmentsLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            let url = `/api/appointments?date=${dateStr}`;
            if (appointmentFilterDoctor) url += `&doctorId=${appointmentFilterDoctor}`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setAppointments(data.appointments || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAppointmentsLoading(false);
        }
    };

    const fetchIPAdmissions = async () => {
        setIpLoading(true);
        try {
            const res = await fetch('/api/hospital/ip-admission');
            if (res.ok) {
                const data = await res.json();
                setIpAdmissions(data.admissions || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIpLoading(false);
        }
    };

    const fetchPatientPrescriptions = async (userId: string) => {
        try {
            const res = await fetch(`/api/hospital/prescribe?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setPrescriptions(data.prescriptions || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveAppointmentNotes = async (id: string, notes: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
            if (res.ok) {
                toast({ title: 'Notes Saved' });
                fetchAppointmentsForDate();
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Failed to save notes' });
        }
    };

    const handleUpdateAppointmentStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                toast({ title: 'Status Updated', description: `Appointment marked as ${status.replace('_', ' ')}.` });
                fetchAppointmentsForDate();
                
                if (status === 'completed') {
                    // Trigger Follow-up Modal
                    const appt = appointments.find(a => a._id === id);
                    if (appt) {
                        setFollowUpData({
                            patientId: appt.patientId?._id,
                            patientName: appt.patientId?.name,
                            patientPhone: appt.patientId?.phone,
                            doctorId: appt.doctorId?._id,
                            doctorName: appt.doctorId?.name
                        });
                        setShowFollowUpModal(true);
                    }
                }
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Failed to update status.' });
        }
    };

    const handleBookingPatientSearch = async () => {
        if (bookingData.patientPhone.length < 10) return;
        try {
            const res = await fetch(`/api/hospital/patient-search?phone=${bookingData.patientPhone}`);
            if (res.ok) {
                const data = await res.json();
                setFoundPatientForBooking(data.patient);
                toast({ title: 'Patient Found', description: data.patient.name });
            } else {
                setFoundPatientForBooking(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBookingSlots = async (doctorId: string, date: Date) => {
        if (!doctorId || !date) return;
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await fetch(`/api/appointments/slots?date=${dateStr}&doctorId=${doctorId}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableSlotsForBooking(data.slots || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDoBookAppointment = async () => {
        if (!foundPatientForBooking || !bookingData.doctorId || !bookingData.timeSlot) {
            toast({ variant: 'destructive', description: 'Please complete all fields.' });
            return;
        }
        setBookingLoading(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: foundPatientForBooking._id,
                    doctorId: bookingData.doctorId,
                    date: selectedDate,
                    timeSlot: bookingData.timeSlot,
                    reason: bookingData.reason || 'Routine Checkup'
                })
            });
            if (res.ok) {
                toast({ title: 'Appointment Booked', description: 'The schedule has been updated.' });
                setShowBookAppointmentModal(false);
                setBookingData({ patientPhone: '', doctorId: '', timeSlot: '', reason: '' });
                setFoundPatientForBooking(null);
                fetchAppointmentsForDate();
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', description: data.error || 'Failed to book.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        } finally {
            setBookingLoading(false);
        }
    };

    const handleAddIPNote = async (id: string) => {
        if (!newProgressNote.trim()) return;
        try {
            const res = await fetch(`/api/hospital/ip-admission/${id}/note`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: newProgressNote })
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedIPAdmission(data.admission);
                setNewProgressNote('');
                toast({ title: 'Note Added' });
                fetchIPAdmissions();
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Failed to add note' });
        }
    };

    const handleDischarge = async (id: string) => {
        try {
            const res = await fetch(`/api/hospital/ip-admission/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'discharged' })
            });
            if (res.ok) {
                toast({ title: 'Patient Discharged' });
                setSelectedIPAdmission(null);
                fetchIPAdmissions();
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Failed to discharge' });
        }
    };

    const fetchEmergencyFlags = async () => {
        setEmergencyLoading(true);
        try {
            const res = await fetch('/api/hospital/emergency-flag?resolved=false');
            if (res.ok) {
                const data = await res.json();
                setEmergencyFlags(data.flags || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setEmergencyLoading(false);
        }
    };

    const fetchDailyStats = async () => {
        setStatsLoading(true);
        try {
            // We can calculate these from fetched appointments and admissions for simplicity or hit a new route
            // For now, let's use the UI to calculate or hit a simple aggregate route if it exists
            const res = await fetch('/api/hospital/analytics/performance'); // Repurposing or could be a dedicated stats route
            if (res.ok) {
                const data = await res.json();
                // We'll calculate today's specific stats here or handle in the tab
                setDailyStats(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleMarkEmergency = async () => {
        if (!patientData || !emergencyReason.trim()) return;
        try {
            const res = await fetch('/api/hospital/emergency-flag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: patientData._id || patientData.id,
                    reason: emergencyReason
                })
            });
            if (res.ok) {
                toast({ title: 'Emergency Flagged', description: 'Priority push successful.' });
                setShowEmergencyModal(false);
                setEmergencyReason('');
                fetchEmergencyFlags();
            } else {
                toast({ variant: 'destructive', description: 'Failed to flag emergency.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        }
    };

    const handleResolveEmergency = async (id: string) => {
        try {
            const res = await fetch(`/api/hospital/emergency-flag/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolved: true })
            });
            if (res.ok) {
                toast({ title: 'Emergency Resolved' });
                fetchEmergencyFlags();
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Failed to resolve emergency.' });
        }
    };

    const handlePatientSearch = async () => {
        if (!searchPhone) return;
        setSearchingPatient(true);
        setFoundPatient(null);
        setShowCreatePatient(false);
        try {
            const res = await fetch(`/api/hospital/patient-search?phone=${searchPhone}`);
            if (res.ok) {
                const data = await res.json();
                setFoundPatient(data.patient);
                toast({ title: 'Patient Found', description: `Identified: ${data.patient.name}` });
            } else {
                setShowCreatePatient(true);
                setNewPatientForm({ ...newPatientForm, phone: searchPhone, name: '', email: '', dob: '' });
                toast({ description: 'Patient not found. Please register.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Search failed.' });
        } finally {
            setSearchingPatient(false);
        }
    };

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/hospital/patient-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPatientForm)
            });
            if (res.ok) {
                const data = await res.json();
                setFoundPatient(data.patient);
                setShowCreatePatient(false);
                toast({ title: 'Patient Registered', description: `Account created for ${newPatientForm.name}` });
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', description: data.error || 'Registration failed' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        }
    };

    const fetchSlots = async (date: string) => {
        if (!date || !opForm.doctorId) return;
        try {
            const res = await fetch(`/api/appointments/slots?date=${date}&doctorId=${opForm.doctorId}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableSlots(data.slots || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleOPRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foundPatient) return;
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: foundPatient._id,
                    doctorId: opForm.doctorId,
                    date: opForm.date,
                    timeSlot: opForm.timeSlot,
                    reason: opForm.reason,
                    status: 'booked'
                })
            });
            if (res.ok) {
                setRegistrationSuccess({ patientName: foundPatient.name, type: 'OP' });
                setOpForm({ doctorId: '', date: '', timeSlot: '', reason: '' });
                setFoundPatient(null);
                setSearchPhone('');
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', description: data.error || 'Appointment failed' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        }
    };

    const handleIPRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foundPatient) return;
        try {
            const res = await fetch('/api/hospital/ip-admission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: foundPatient._id,
                    doctorId: ipForm.doctorId,
                    ward: ipForm.ward,
                    bedNumber: ipForm.bedNumber,
                    admissionReason: ipForm.admissionReason,
                    admissionDate: ipForm.admissionDate
                })
            });
            if (res.ok) {
                setRegistrationSuccess({ patientName: foundPatient.name, type: 'IP' });
                setIpForm({ doctorId: '', ward: '', bedNumber: '', admissionReason: '', admissionDate: '' });
                setFoundPatient(null);
                setSearchPhone('');
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', description: data.error || 'Admission failed' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        }
    };

    const inputClass = "w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#02B69A] focus:ring-1 focus:ring-[#02B69A] transition-colors";

    const tabs: { key: Tab, label: string }[] = [
        { key: 'alerts', label: 'Alerts' },
        { key: 'operations', label: 'Operations' },
        { key: 'staff', label: 'Staff' },
        { key: 'appointments', label: 'Appointments' },
        { key: 'patient-registration', label: 'Patient Registration' },
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

            {/******** ALERTS TAB ********/}
            {activeTab === 'alerts' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Active Emergencies Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
                            <h3 className="text-xl font-bold text-white font-playfair uppercase tracking-widest">Active Emergencies</h3>
                        </div>
                        {emergencyLoading ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-40 border border-slate-800"></div>)}
                            </div>
                        ) : emergencyFlags.length === 0 ? (
                            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                                <p className="text-slate-500 font-medium">No active emergency alerts at this time.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {emergencyFlags.map((flag: any) => (
                                    <Card key={flag._id} className="bg-slate-900 border-rose-500/30 shadow-lg shadow-rose-900/10 overflow-hidden">
                                        <div className="bg-rose-500/10 px-4 py-2 border-b border-rose-500/20 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">Emergency Push</span>
                                            <span className="text-[10px] text-slate-500">{format(new Date(flag.flaggedAt), 'h:mm a')}</span>
                                        </div>
                                        <CardContent className="p-5 space-y-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white leading-tight">{flag.patientId?.name}</h4>
                                                <p className="text-xs text-rose-400 font-bold uppercase">{flag.patientId?.bloodGroup} Blood Group</p>
                                            </div>
                                            <div className="bg-black/40 rounded-xl p-3 border border-slate-800">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Reason</p>
                                                <p className="text-sm text-slate-200">{flag.reason}</p>
                                            </div>
                                            <Button 
                                                onClick={() => handleResolveEmergency(flag._id)}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 rounded-xl transition-all"
                                            >
                                                Mark Resolved
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Section A: IP Patients with Flags */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-[#02B69A]" />
                                <h3 className="text-lg font-bold text-white font-playfair uppercase tracking-wider">IP Patients with Flags</h3>
                            </div>
                            <div className="grid gap-4">
                                {ipAdmissions.filter(adm => adm.medicalFlags && Object.values(adm.medicalFlags).some(v => v)).length === 0 ? (
                                    <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 text-center italic text-slate-600">
                                        No current IP patients with critical medical flags.
                                    </div>
                                ) : (
                                    ipAdmissions.filter(adm => adm.medicalFlags && Object.values(adm.medicalFlags).some(v => v)).map((adm: any) => (
                                        <Card key={adm._id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group" onClick={async () => {
                                            try {
                                                const res = await fetch(`/api/hospital/scan`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ userId: adm.patientId._id || adm.patientId })
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setSelectedPatientMedicalInfo(data.patient);
                                                    setShowMedicalInfoModal(true);
                                                }
                                            } catch (e) {
                                                toast({ variant: 'destructive', description: 'Failed to fetch medical info.' });
                                            }
                                        }}>
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                                                        {adm.patientId?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white group-hover:text-[#02B69A] transition-colors">{adm.patientId?.name}</h4>
                                                        <p className="text-xs text-slate-500">{adm.ward} • Bed {adm.bedNumber}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {adm.medicalFlags.hasAllergies && <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase border border-rose-500/30">Allergies</span>}
                                                    {adm.medicalFlags.hasChronic && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase border border-amber-500/30">Chronic</span>}
                                                    {adm.medicalFlags.hasImplant && <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/30">Implant</span>}
                                                    {adm.medicalFlags.isPregnant && <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-black uppercase border border-pink-500/30">Pregnant</span>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Section B: Daily Summary */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-lg font-bold text-white font-playfair uppercase tracking-wider">Daily Summary</h3>
                            </div>
                            <div className="grid gap-4">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                                <User className="w-4 h-4 text-teal-400" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-400">Total OP Visits</span>
                                        </div>
                                        <span className="text-lg font-black text-white">{appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                <HeartPulse className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-400">Total IP Admitted</span>
                                        </div>
                                        <span className="text-lg font-black text-white">{ipAdmissions.length}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800 space-y-3">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                                            <span className="text-slate-500">Visit Status</span>
                                            <span className="text-white">
                                                {appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && a.status === 'completed').length} / {appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length} Done
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#02B69A] transition-all duration-1000" 
                                                style={{ width: `${(appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && a.status === 'completed').length / (appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Card className="bg-indigo-600 border-none overflow-hidden relative group cursor-pointer" onClick={() => window.location.href = '/hospital/analytics'}>
                                    <div className="bg-slate-950/20 p-5 relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <TrendingUp className="w-6 h-6 text-white" />
                                            <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Monthly</span>
                                        </div>
                                        <h4 className="text-white font-bold">Doctor Performance</h4>
                                        <p className="text-indigo-100 text-xs mt-1">View detailed analytics & completion rates.</p>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

                                    <Button 
                                        onClick={() => setShowEmergencyModal(true)}
                                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black h-12 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-rose-900/20"
                                    >
                                        <ShieldAlert className="w-5 h-5" /> Mark as EMERGENCY
                                    </Button>
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
                        <div className="bg-slate-900/50 rounded-2xl p-8 text-center border border-dashed border-slate-800">
                            <p className="text-slate-500 text-sm">No doctors added yet.</p>
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
                                            onClick={() => setPasswordModal({ open: true, id: doc._id, name: doc.name, type: 'doctor' })}
                                        >
                                            <Key className="w-3.5 h-3.5" /> Set Password
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-8 border-t border-slate-800">
                        <h3 className="text-lg font-bold text-white font-playfair">Receptionists</h3>
                        <Button onClick={() => setShowAddReceptionist(!showAddReceptionist)} className="bg-white hover:bg-slate-100 text-black font-bold h-10">
                            <Plus className="w-4 h-4 mr-2" /> Add Receptionist
                        </Button>
                    </div>

                    {/* Add Receptionist Form */}
                    {showAddReceptionist && (
                        <Card className="bg-slate-900 border-slate-800 animate-in slide-in-from-top-4 duration-300">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-white">New Receptionist</h4>
                                    <Button size="icon" variant="ghost" onClick={() => setShowAddReceptionist(false)}><X className="w-4 h-4 text-slate-400" /></Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <input type="text" placeholder="Full Name" value={newReceptionist.name} onChange={e => setNewReceptionist({ ...newReceptionist, name: e.target.value })} className={inputClass} />
                                    <input type="email" placeholder="Email" value={newReceptionist.email} onChange={e => setNewReceptionist({ ...newReceptionist, email: e.target.value })} className={inputClass} />
                                    <input type="text" placeholder="Phone" value={newReceptionist.phone} onChange={e => setNewReceptionist({ ...newReceptionist, phone: e.target.value })} className={inputClass} />
                                </div>
                                <Button onClick={handleAddReceptionist} className="bg-white hover:bg-slate-100 text-black font-bold">Create Receptionist Account</Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Receptionist List */}
                    {staffLoading ? (
                        <div className="space-y-3">{[1].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-20 border border-slate-800"></div>)}</div>
                    ) : staff.receptionists.length === 0 ? (
                        <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-dashed border-slate-800">
                            <p className="text-slate-500 text-sm">No receptionists added yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {staff.receptionists.map((recep: any) => (
                                <Card key={recep._id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg font-playfair shrink-0">
                                            {recep.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{recep.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{recep.email}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 gap-1.5 shrink-0"
                                            onClick={() => setPasswordModal({ open: true, id: recep._id, name: recep.name, type: 'receptionist' })}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                    {/* LEFT COLUMN: CALENDAR */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-slate-900 border-slate-800 p-4 shadow-xl">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-xl border-none text-white"
                                classNames={{
                                    day_selected: "bg-[#02B69A] text-black hover:bg-[#02B69A] hover:text-black focus:bg-[#02B69A] focus:text-black",
                                    day_today: "bg-slate-800 text-white",
                                }}
                            />
                        </Card>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                            <h4 className="text-[10px] font-black text-[#02B69A] uppercase tracking-widest">Quick Actions</h4>
                            <Button 
                                onClick={() => setShowBookAppointmentModal(true)}
                                className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-14 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#02B69A]/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus className="w-5 h-5" /> Book Appointment
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: APPOINTMENT LIST */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-white font-playfair tracking-tight">
                                    {selectedDate ? format(selectedDate, 'EEEE, MMM do') : 'Select a Date'}
                                </h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Schedule for this day</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <select 
                                        value={appointmentFilterDoctor}
                                        onChange={(e) => setAppointmentFilterDoctor(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#02B69A] transition-all appearance-none min-w-[200px]"
                                    >
                                        <option value="">All Doctors</option>
                                        {staff.doctors.map((d: any) => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {appointmentsLoading ? (
                            <div className="grid gap-4">
                                {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-32 border border-slate-800"></div>)}
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="bg-slate-900/40 rounded-3xl py-20 px-6 text-center border-2 border-dashed border-slate-800/50">
                                <Activity className="w-16 h-16 text-slate-800 mx-auto mb-4 opacity-20" />
                                <h3 className="text-xl font-bold text-slate-600 font-playfair italic">Quiet Day...</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">No appointments found for the selected date and filters.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {appointments.map(appt => (
                                    <Card key={appt._id} className={`bg-slate-950/50 border-slate-800 transition-all hover:border-slate-700 shadow-lg ${appt.status === 'booked' ? 'border-l-4 border-l-[#02B69A]' : ''}`}>
                                        <CardContent className="p-0">
                                            <div className="p-6 flex flex-col sm:flex-row gap-6">
                                                <div className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-4 min-w-[100px] h-fit">
                                                    <Clock className="w-4 h-4 text-slate-500 mb-1" />
                                                    <span className="text-white font-black text-sm">{appt.timeSlot}</span>
                                                </div>
                                                
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                        <div>
                                                            <h4 className="text-lg font-black text-white font-playfair flex items-center gap-2">
                                                                {appt.patientId?.name || 'Unknown Patient'}
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                                    appt.status === 'booked' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                    appt.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                                    appt.status === 'no_show' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                                }`}>
                                                                    {appt.status.replace('_', ' ')}
                                                                </span>
                                                            </h4>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-slate-500 text-xs flex items-center gap-1 font-bold">
                                                                    <User className="w-3 h-3" /> Dr. {appt.doctorId?.name}
                                                                </span>
                                                                <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                                                <p className="text-slate-400 text-xs italic">"{appt.reason}"</p>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            className="text-[#02B69A] hover:bg-[#02B69A]/10 font-black text-[10px] uppercase tracking-widest h-9 border border-[#02B69A]/20 rounded-xl"
                                                            onClick={() => {
                                                                setSelectedAppointment(appt);
                                                                fetchPatientPrescriptions(appt.patientId?._id || appt.patientId);
                                                            }}
                                                        >
                                                            Open OP Sheet
                                                        </Button>
                                                    </div>

                                                    {appt.status === 'booked' && (
                                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                                                            <Button 
                                                                size="sm" 
                                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-4 rounded-lg h-8"
                                                                onClick={() => handleUpdateAppointmentStatus(appt._id, 'completed')}
                                                            >
                                                                Confirm Visit
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost"
                                                                className="text-amber-500 hover:bg-amber-500/10 font-bold text-[10px] px-4 rounded-lg h-8 border border-amber-500/20"
                                                                onClick={() => handleUpdateAppointmentStatus(appt._id, 'no_show')}
                                                            >
                                                                Mark No Show
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost"
                                                                className="text-slate-500 hover:bg-slate-500/10 font-bold text-[10px] px-4 rounded-lg h-8"
                                                                onClick={() => handleUpdateAppointmentStatus(appt._id, 'cancelled')}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/******** PATIENT REGISTRATION TAB ********/}
            {activeTab === 'patient-registration' && (
                <div className="space-y-6">
                    <div className="flex bg-slate-900/50 rounded-lg p-1 w-fit border border-slate-800">
                        <button
                            onClick={() => { setRegType('OP'); setRegistrationSuccess(null); }}
                            className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${regType === 'OP' ? 'bg-[#02B69A] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            OUTPATIENT (OP)
                        </button>
                        <button
                            onClick={() => { setRegType('IP'); setRegistrationSuccess(null); }}
                            className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${regType === 'IP' ? 'bg-[#02B69A] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            INPATIENT (IP)
                        </button>
                    </div>

                    {registrationSuccess ? (
                        <Card className="bg-slate-900 border-[#02B69A]/30 border-2 overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-[#02B69A]/10 p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-[#02B69A] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-black" />
                                </div>
                                <h3 className="text-2xl font-bold text-white font-playfair">
                                    {registrationSuccess.type === 'OP' ? 'Appointment Scheduled!' : 'Patient Admitted!'}
                                </h3>
                                <p className="text-slate-400 max-w-md mx-auto">
                                    Patient <strong className="text-white">{registrationSuccess.patientName}</strong> has been successfully registered in the {registrationSuccess.type} system.
                                </p>
                                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button className="bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold px-8 h-12">
                                        Generate Visit Summary
                                    </Button>
                                    <Button variant="outline" onClick={() => setRegistrationSuccess(null)} className="border-slate-700 text-white hover:bg-slate-800 px-8 h-12">
                                        New Registration
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                {/* Step 1: Search Patient */}
                                <Card className="bg-slate-900 border-slate-800">
                                    <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Search className="w-5 h-5 text-[#02B69A]" />
                                            <h3 className="font-bold text-white">1. Identify Patient</h3>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Enter phone number"
                                                    value={searchPhone}
                                                    onChange={e => setSearchPhone(e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <Button
                                                onClick={handlePatientSearch}
                                                disabled={searchingPatient || !searchPhone}
                                                className="bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold h-12 px-6"
                                            >
                                                {searchingPatient ? '...' : <Search className="w-5 h-5" />}
                                            </Button>
                                        </div>

                                        {foundPatient && (
                                            <div className="bg-[#02B69A]/10 border border-[#02B69A]/30 rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2">
                                                <div className="w-12 h-12 rounded-full bg-[#02B69A] flex items-center justify-center text-black font-bold text-xl font-playfair">
                                                    {foundPatient.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{foundPatient.name}</p>
                                                    <p className="text-xs text-slate-400">{foundPatient.phone} • {foundPatient.email}</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <CheckCircle2 className="w-5 h-5 text-[#02B69A]" />
                                                </div>
                                            </div>
                                        )}

                                        {showCreatePatient && (
                                            <form onSubmit={handleCreatePatient} className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in">
                                                <p className="text-xs font-bold text-[#02B69A] uppercase tracking-wider">Create New Patient Account</p>
                                                <input
                                                    type="text"
                                                    placeholder="Full Name"
                                                    required
                                                    value={newPatientForm.name}
                                                    onChange={e => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                                                    className={inputClass}
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email Address"
                                                    required
                                                    value={newPatientForm.email}
                                                    onChange={e => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                                                    className={inputClass}
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Phone"
                                                        disabled
                                                        value={newPatientForm.phone}
                                                        className={`${inputClass} opacity-50`}
                                                    />
                                                    <input
                                                        type="date"
                                                        required
                                                        value={newPatientForm.dob}
                                                        onChange={e => setNewPatientForm({ ...newPatientForm, dob: e.target.value })}
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <Button type="submit" className="w-full bg-white hover:bg-slate-100 text-black font-bold h-11">
                                                    Register & Continue
                                                </Button>
                                            </form>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                {/* Step 2: Registration Details */}
                                <Card className={`bg-slate-900 border-slate-800 transition-opacity ${!foundPatient ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-[#02B69A]" />
                                        <h3 className="font-bold text-white">2. {regType} Details</h3>
                                    </div>
                                    <CardContent className="p-6">
                                        {regType === 'OP' ? (
                                            <form onSubmit={handleOPRegistration} className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Assign Doctor</label>
                                                    <select
                                                        required
                                                        className={inputClass}
                                                        value={opForm.doctorId}
                                                        onChange={e => {
                                                            const docId = e.target.value;
                                                            setOpForm({ ...opForm, doctorId: docId });
                                                            if (opForm.date) {
                                                                // Use docId directly as state might not be updated yet
                                                                fetch(`/api/appointments/slots?date=${opForm.date}&doctorId=${docId}`)
                                                                    .then(res => res.json())
                                                                    .then(data => setAvailableSlots(data.slots || []))
                                                                    .catch(console.error);
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Select Doctor</option>
                                                        {staff.doctors.map(doc => (
                                                            <option key={doc._id} value={doc._id}>{doc.name} - {doc.specialty}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Visit Date</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            className={inputClass}
                                                            value={opForm.date}
                                                            onChange={e => {
                                                                setOpForm({ ...opForm, date: e.target.value });
                                                                fetchSlots(e.target.value);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Time Slot</label>
                                                        <select
                                                            required
                                                            className={inputClass}
                                                            value={opForm.timeSlot}
                                                            onChange={e => setOpForm({ ...opForm, timeSlot: e.target.value })}
                                                            disabled={!opForm.date || !opForm.doctorId}
                                                        >
                                                            <option value="">Select Slot</option>
                                                            {availableSlots.map(slot => (
                                                                <option key={slot} value={slot}>{slot}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Reason for Visit</label>
                                                    <textarea
                                                        placeholder="Symptom or checkup details..."
                                                        className={`${inputClass} h-24 resize-none`}
                                                        value={opForm.reason}
                                                        onChange={e => setOpForm({ ...opForm, reason: e.target.value })}
                                                        required
                                                    />
                                                </div>

                                                <Button type="submit" className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold h-12 rounded-xl">
                                                    Confirm OP Registration
                                                </Button>
                                            </form>
                                        ) : (
                                            <form onSubmit={handleIPRegistration} className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Admitting Doctor</label>
                                                    <select
                                                        required
                                                        className={inputClass}
                                                        value={ipForm.doctorId}
                                                        onChange={e => setIpForm({ ...ipForm, doctorId: e.target.value })}
                                                    >
                                                        <option value="">Select Doctor</option>
                                                        {staff.doctors.map(doc => (
                                                            <option key={doc._id} value={doc._id}>{doc.name} - {doc.specialty}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ward / Department</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. ICU, General"
                                                            required
                                                            className={inputClass}
                                                            value={ipForm.ward}
                                                            onChange={e => setIpForm({ ...ipForm, ward: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Bed Number</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. B-102"
                                                            required
                                                            className={inputClass}
                                                            value={ipForm.bedNumber}
                                                            onChange={e => setIpForm({ ...ipForm, bedNumber: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Admission Date</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        className={inputClass}
                                                        value={ipForm.admissionDate}
                                                        onChange={e => setIpForm({ ...ipForm, admissionDate: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Admission Reason</label>
                                                    <textarea
                                                        placeholder="Primary diagnosis or reason for admission..."
                                                        className={`${inputClass} h-20 resize-none`}
                                                        value={ipForm.admissionReason}
                                                        onChange={e => setIpForm({ ...ipForm, admissionReason: e.target.value })}
                                                        required
                                                    />
                                                </div>

                                                <Button type="submit" className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold h-12 rounded-xl">
                                                    Confirm IP Admission
                                                </Button>
                                            </form>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Current Admissions Section */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white font-playfair">Current Inpatient Admissions</h3>
                                        <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                                            {ipAdmissions.filter((a: any) => a.status === 'admitted').length} Active
                                        </span>
                                    </div>
                                    
                                    {ipLoading ? (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {[1, 2].map(i => <div key={i} className="animate-pulse bg-slate-900 rounded-2xl h-24 border border-slate-800"></div>)}
                                        </div>
                                    ) : ipAdmissions.filter((a: any) => a.status === 'admitted').length === 0 ? (
                                        <div className="bg-slate-900/50 rounded-2xl p-8 text-center border border-dashed border-slate-800">
                                            <p className="text-slate-500 text-sm">No patients currently admitted.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {ipAdmissions.filter((a: any) => a.status === 'admitted').map((adm: any) => (
                                                <Card key={adm._id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group">
                                                    <CardContent className="p-5">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-white group-hover:text-[#02B69A] transition-colors truncate">
                                                                    {adm.patientId?.name || 'Patient'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                                    Ward: {adm.ward} • Bed: {adm.bedNumber}
                                                                </p>
                                                            </div>
                                                            <div className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/20">
                                                                ADMITTED
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="w-full border-slate-700 text-slate-300 hover:bg-[#02B69A] hover:text-black hover:border-[#02B69A] font-bold h-9 transition-all"
                                                            onClick={() => setSelectedIPAdmission(adm)}
                                                        >
                                                            View IP Sheet
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/******** OP SHEET SLIDE-OVER ********/}
            {selectedAppointment && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)} />
                    <div className="relative w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h3 className="text-2xl font-playfair font-black text-white italic">Digital OP Sheet</h3>
                                <p className="text-xs text-[#02B69A] font-bold uppercase tracking-widest mt-1">Visit ID: {selectedAppointment._id?.slice(-8)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedAppointment(null)} className="rounded-full hover:bg-slate-800 text-slate-400">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <section className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient Name</label>
                                    <p className="text-lg font-bold text-white">{selectedAppointment.patientId?.name || 'Patient'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date of Visit</label>
                                    <p className="text-lg font-bold text-white">{format(new Date(selectedAppointment.date), 'PPP')}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned Doctor</label>
                                    <p className="text-lg font-bold text-white">{selectedAppointment.doctorId?.name || 'Dr. Assigned'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Complaint / Reason</label>
                                    <p className="text-lg font-bold text-slate-200 bg-slate-900 p-3 rounded-xl border border-slate-800">{selectedAppointment.reason}</p>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Doctor's Clinical Notes</label>
                                <textarea 
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:border-[#02B69A] outline-none transition-all h-32 resize-none"
                                    placeholder="Enter clinical observations, diagnosis, or advice..."
                                    defaultValue={selectedAppointment.notes}
                                    onBlur={(e) => handleSaveAppointmentNotes(selectedAppointment._id, e.target.value)}
                                />
                                <p className="text-[10px] text-slate-500 italic ml-1">* Notes are saved automatically when you click away.</p>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prescription Issued</label>
                                    <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">{prescriptions.length} Meds</span>
                                </div>
                                <div className="space-y-2">
                                    {prescriptions.length === 0 ? (
                                        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-6 text-center">
                                            <p className="text-sm text-slate-500">No active prescriptions for this patient.</p>
                                        </div>
                                    ) : (
                                        prescriptions.map((med: any) => (
                                            <div key={med._id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between group">
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-[#02B69A] transition-colors">{med.medicineName}</p>
                                                    <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{format(new Date(med.issuedAt), 'dd MMM')}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="p-8 border-t border-slate-800 bg-slate-900/20">
                            <Button 
                                onClick={() => handleUpdateAppointmentStatus(selectedAppointment._id, 'completed')}
                                disabled={selectedAppointment.status === 'completed'}
                                className="w-full h-14 bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black text-lg rounded-2xl shadow-xl shadow-[#02B69A]/20 transition-all uppercase tracking-widest"
                            >
                                {selectedAppointment.status === 'completed' ? 'Visit Completed' : 'Mark Visit as Completed'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/******** IP SHEET SLIDE-OVER ********/}
            {selectedIPAdmission && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedIPAdmission(null)} />
                    <div className="relative w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h3 className="text-2xl font-playfair font-black text-white italic">Digital IP Sheet</h3>
                                <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">Admission ID: {selectedIPAdmission._id?.slice(-8)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedIPAdmission(null)} className="rounded-full hover:bg-slate-800 text-slate-400">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 text-slate-300">
                            <section className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-slate-800/50">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient Name</label>
                                    <p className="text-lg font-bold text-white">{selectedIPAdmission.patientId?.name || 'Patient'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admission Date</label>
                                    <p className="text-lg font-bold text-white">{format(new Date(selectedIPAdmission.admissionDate), 'PPP')}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ward / Bed</label>
                                    <p className="text-lg font-bold text-white">{selectedIPAdmission.ward} • {selectedIPAdmission.bedNumber}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admitting Doctor</label>
                                    <p className="text-lg font-bold text-white">{selectedIPAdmission.doctorId?.name || 'Dr. Assigned'}</p>
                                </div>
                                <div className="sm:col-span-2 space-y-1 mt-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admission Reason</label>
                                    <p className="text-slate-300 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 italic leading-relaxed text-sm">
                                        "{selectedIPAdmission.admissionReason}"
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[#02B69A]" /> Daily Progress Notes
                                    </h4>
                                    <span className="text-[10px] text-slate-500">{selectedIPAdmission.progressNotes?.length || 0} entries</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                                        <textarea 
                                            placeholder="Add today's update..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-[#02B69A] outline-none transition-all h-20 resize-none shadow-inner"
                                            value={newProgressNote}
                                            onChange={(e) => setNewProgressNote(e.target.value)}
                                        />
                                        <div className="flex justify-end">
                                            <Button 
                                                size="sm"
                                                onClick={() => handleAddIPNote(selectedIPAdmission._id)}
                                                disabled={!newProgressNote.trim()}
                                                className="bg-[#02B69A] hover:bg-[#00D4AA] text-black font-bold h-9 px-6 rounded-lg transition-all"
                                            >
                                                Add Note
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mt-6 relative pl-4 border-l border-slate-800">
                                        {selectedIPAdmission.progressNotes?.length === 0 ? (
                                            <p className="text-sm text-slate-600 text-center py-4 italic">No notes recorded yet.</p>
                                        ) : (
                                            [...(selectedIPAdmission.progressNotes || [])].reverse().map((note: any, idx: number) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-950" />
                                                    <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 hover:bg-slate-900/60 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="text-[10px] font-bold text-[#02B69A] uppercase tracking-widest">{note.addedBy}</p>
                                                            <p className="text-[10px] text-slate-500">{format(new Date(note.addedAt), 'MMM d, h:mm a')}</p>
                                                        </div>
                                                        <p className="text-sm text-slate-300 leading-relaxed">{note.note}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-8 border-t border-slate-800 bg-slate-900/20">
                            <Button 
                                variant="outline"
                                onClick={() => handleDischarge(selectedIPAdmission._id)}
                                className="w-full h-14 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-black text-lg rounded-2xl transition-all uppercase tracking-widest"
                            >
                                Discharge Patient
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/******** SET PASSWORD MODAL ********/}
            {passwordModal.open && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPasswordModal({ open: false, id: '', name: '', type: 'doctor' })}>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white font-playfair">Set {passwordModal.type === 'doctor' ? 'Doctor' : 'Receptionist'} Password</h3>
                            <Button size="icon" variant="ghost" onClick={() => setPasswordModal({ open: false, id: '', name: '', type: 'doctor' })}>
                                <X className="w-4 h-4 text-slate-400" />
                            </Button>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            Setting login password for <strong className="text-white">{passwordModal.name}</strong>.
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
            {/******** EMERGENCY MODAL ********/}
            {showEmergencyModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-white font-playfair uppercase tracking-tighter">Emergency Alert</h3>
                            <p className="text-slate-400 text-sm">Flagging <strong className="text-white">{patientData?.name}</strong> for priority emergency treatment.</p>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Emergency Reason / Observations</label>
                            <textarea
                                value={emergencyReason}
                                onChange={e => setEmergencyReason(e.target.value)}
                                placeholder="e.g. Chest pain, High fever, Unconscious..."
                                className={`${inputClass} min-h-[100px] resize-none py-4`}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1 text-slate-500 hover:text-white h-12 font-bold" onClick={() => setShowEmergencyModal(false)}>Cancel</Button>
                            <Button 
                                className="flex-[2] bg-rose-600 hover:bg-rose-500 text-white font-black h-12 rounded-xl transition-all"
                                onClick={handleMarkEmergency}
                                disabled={!emergencyReason.trim()}
                            >
                                Initiate Priority Push
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/******** MEDICAL INFO MODAL ********/}
            {showMedicalInfoModal && selectedPatientMedicalInfo && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setShowMedicalInfoModal(false)}>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#02B69A]/10 text-[#02B69A] flex items-center justify-center font-bold text-2xl font-playfair">
                                    {selectedPatientMedicalInfo.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white font-playfair">{selectedPatientMedicalInfo.name}</h3>
                                    <p className="text-slate-500 font-medium">{selectedPatientMedicalInfo.phone} • {selectedPatientMedicalInfo.bloodGroup} Blood Group</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowMedicalInfoModal(false)} className="rounded-full hover:bg-slate-800 text-slate-400">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <section className="space-y-2">
                                    <h4 className="text-[10px] font-black text-[#02B69A] uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5" /> Critical Alerts
                                    </h4>
                                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase">Allergies</p>
                                            <p className={`text-sm font-bold ${selectedPatientMedicalInfo.allergiesDetails ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {selectedPatientMedicalInfo.allergiesDetails || 'No known allergies'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase">Chronic Conditions</p>
                                            <p className="text-sm font-bold text-slate-200">
                                                {selectedPatientMedicalInfo.chronicConditions || 'None reported'}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                                <section className="space-y-2">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" /> Other Info
                                    </h4>
                                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Pacemaker/Implant</span>
                                            <span className={`text-xs font-bold ${selectedPatientMedicalInfo.hasPacemakerOrImplant ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                {selectedPatientMedicalInfo.hasPacemakerOrImplant ? 'YES' : 'NO'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">Pregnant</span>
                                            <span className={`text-xs font-bold ${selectedPatientMedicalInfo.isPregnant ? 'text-pink-400' : 'text-slate-500'}`}>
                                                {selectedPatientMedicalInfo.isPregnant ? 'YES' : 'NO'}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-4">
                                <section className="space-y-2">
                                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" /> Tier 2 Details
                                    </h4>
                                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase">Current Medications</p>
                                            <p className="text-sm font-medium text-slate-300">{selectedPatientMedicalInfo.currentMedications || 'None'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase">Insurance Provider</p>
                                            <p className="text-sm font-medium text-slate-300">{selectedPatientMedicalInfo.insuranceProvider || 'N/A'}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <Button 
                            className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-12 rounded-xl transition-all"
                            onClick={() => setShowMedicalInfoModal(false)}
                        >
                            Close Profile
                        </Button>
                    </div>
                </div>
            )}
            {/******** BOOK APPOINTMENT MODAL ********/}
            {showBookAppointmentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setShowBookAppointmentModal(false)}>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-white font-playfair tracking-tight">Schedule Appointment</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Hospital Management System</p>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => setShowBookAppointmentModal(false)} className="rounded-full hover:bg-slate-800 text-slate-400">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Patient Phone Number</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Enter phone to search..."
                                            value={bookingData.patientPhone}
                                            onChange={e => setBookingData({ ...bookingData, patientPhone: e.target.value })}
                                            className={`${inputClass} pl-11`}
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleBookingPatientSearch}
                                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold h-12 px-6 rounded-xl"
                                    >
                                        Find
                                    </Button>
                                </div>
                                {foundPatientForBooking && (
                                    <div className="bg-[#02B69A]/10 border border-[#02B69A]/20 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2">
                                        <div className="w-10 h-10 rounded-xl bg-[#02B69A] text-black flex items-center justify-center font-bold">
                                            {foundPatientForBooking.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{foundPatientForBooking.name}</p>
                                            <p className="text-[10px] text-[#02B69A] font-bold uppercase tracking-wider">{foundPatientForBooking.email || 'No Email'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Doctor</label>
                                    <select 
                                        value={bookingData.doctorId}
                                        onChange={e => {
                                            setBookingData({ ...bookingData, doctorId: e.target.value });
                                            if (selectedDate) fetchBookingSlots(e.target.value, selectedDate);
                                        }}
                                        className={inputClass}
                                    >
                                        <option value="">Choose a Doctor</option>
                                        {staff.doctors.map((d: any) => (
                                            <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Available Slot</label>
                                    <select 
                                        value={bookingData.timeSlot}
                                        onChange={e => setBookingData({ ...bookingData, timeSlot: e.target.value })}
                                        disabled={!bookingData.doctorId || availableSlotsForBooking.length === 0}
                                        className={inputClass}
                                    >
                                        <option value="">{bookingData.doctorId ? 'Pick a Time' : 'Select Doctor First'}</option>
                                        {availableSlotsForBooking.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason for Visit</label>
                                <textarea
                                    placeholder="e.g. Follow-up, Consultation..."
                                    value={bookingData.reason}
                                    onChange={e => setBookingData({ ...bookingData, reason: e.target.value })}
                                    className={`${inputClass} min-h-[80px] py-4`}
                                />
                            </div>

                            <Button 
                                onClick={handleDoBookAppointment}
                                disabled={bookingLoading || !foundPatientForBooking || !bookingData.timeSlot}
                                className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-14 rounded-2xl transition-all shadow-xl shadow-[#02B69A]/10"
                            >
                                {bookingLoading ? 'Processing...' : 'Finalize Booking'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/******** FOLLOW-UP MODAL ********/}
            {showFollowUpModal && followUpData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-[#02B69A]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Calendar className="w-8 h-8 text-[#02B69A]" />
                            </div>
                            <h3 className="text-2xl font-black text-white font-playfair tracking-tight">Schedule Follow-up?</h3>
                            <p className="text-slate-400 text-sm">Would you like to book a follow-up visit for <strong className="text-white">{followUpData.patientName}</strong>?</p>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button 
                                variant="ghost" 
                                className="flex-1 text-slate-500 hover:text-white h-12 font-bold" 
                                onClick={() => setShowFollowUpModal(false)}
                            >
                                Not Now
                            </Button>
                            <Button 
                                className="flex-[2] bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-12 rounded-xl"
                                onClick={() => {
                                    setShowFollowUpModal(false);
                                    setBookingData({
                                        patientPhone: followUpData.patientPhone,
                                        doctorId: followUpData.doctorId,
                                        timeSlot: '',
                                        reason: 'Follow-up Visit'
                                    });
                                    setFoundPatientForBooking({
                                        _id: followUpData.patientId,
                                        name: followUpData.patientName,
                                        phone: followUpData.patientPhone
                                    });
                                    setShowBookAppointmentModal(true);
                                }}
                            >
                                Schedule Now
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
