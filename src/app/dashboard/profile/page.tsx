"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { ArrowLeft, Bell, ChevronRight, HelpCircle, LogOut, Moon, QrCode, Shield, Users, Edit2, Check, X, Phone, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useMedicine } from "@/context/medicine-context";
import { useEmergencyInfo } from "@/context/emergency-info-context";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { getEmergencyUrl } from "@/lib/emergency-token";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
    const { user, logout, refreshUser } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { medicines } = useMedicine();
    const { emergencyInfo, generateAndStoreToken, emergencyToken } = useEmergencyInfo();
    const { toast } = useToast();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [adherence, setAdherence] = useState(0);
    const [monthlyStreak, setMonthlyStreak] = useState(0);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        dateOfBirth: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setEditForm({
                name: user.name || '',
                phone: user.phone || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
            });
        }
    }, [user]);

    useEffect(() => {
        const takenCount = medicines.filter(m => m.taken === true).length;
        const skippedCount = medicines.filter(m => m.taken === false).length;
        const totalDecided = takenCount + skippedCount;
        const newAdherence = totalDecided > 0 ? Math.round((takenCount / totalDecided) * 100) : 0;
        setAdherence(newAdherence);

        const dayOfMonth = new Date().getDate();
        const streak = Math.floor(dayOfMonth / 3) + (newAdherence > 90 ? 2 : 0);
        setMonthlyStreak(streak);
    }, [medicines]);

    const getEmail = (name: string | undefined) => {
        if (!name) return "";
        return `${name.toLowerCase().replace(' ', '.')}@email.com`;
    }

    const bloodGroupText = emergencyInfo.bloodGroup === 'Other' ? emergencyInfo.bloodGroupOther : emergencyInfo.bloodGroup;
    const allergiesText = emergencyInfo.allergies === 'Other' ? emergencyInfo.allergiesOther : emergencyInfo.allergies;
    const medicationsText = emergencyInfo.medications === 'Other' ? emergencyInfo.medicationsOther : emergencyInfo.medications;
    const hasData = bloodGroupText || allergiesText || medicationsText || emergencyInfo.emergencyContact;

    const getOrCreateToken = () => {
        if (emergencyToken) return emergencyToken;
        return generateAndStoreToken();
    }

    const token = emergencyToken || '';
    const emergencyUrl = token ? getEmergencyUrl(token) : '';

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const parts = editForm.name.trim().split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ') || 'User';

            const payload = {
                name: editForm.name,
                firstName,
                lastName,
                phone: editForm.phone,
                dateOfBirth: editForm.dateOfBirth || null
            };

            const res = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast({ title: 'Profile Updated', description: 'Your personal details have been saved.' });
                setIsEditing(false);
                refreshUser();
            } else {
                toast({ variant: 'destructive', description: 'Failed to update profile.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', description: 'Network error.' });
        } finally {
            setIsSaving(false);
        }
    };

    const settingsItems = [
        { icon: QrCode, title: "Emergency QR", description: "View and share your code", href: "/dashboard/emergency-qr" },
        { icon: Bell, title: "Notifications", description: "Medicine reminders and alerts", action: <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} /> },
        { icon: Moon, title: "Theme", description: "Switch to Dark Mode", action: <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} /> },
        { icon: Users, title: "Family Members", description: "Manage caregiver access", href: "/dashboard/family" },
        { icon: Shield, title: "Privacy & Security", description: "Data protection settings", href: "#" },
        { icon: HelpCircle, title: "Help & Support", description: "FAQs and contact support", href: "#" },
    ]

    return (
        <div className="bg-[#F9FAFB] min-h-screen font-sans">
            <header className="p-5 flex items-center justify-between border-b border-slate-100 sm:hidden sticky top-0 bg-white/80 backdrop-blur-xl z-30">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
                    </Button>
                    <h2 className="font-bold text-lg text-slate-900 font-playfair tracking-tight">Account Settings</h2>
                </div>
                {!isEditing && (
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="rounded-full hover:bg-emerald-50 text-emerald-600">
                        <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                    </Button>
                )}
            </header>

            <main className="max-w-xl mx-auto px-4 pt-4 sm:p-6 md:p-10 space-y-6 pb-24 sm:pb-8">
                {/* Profile Header Block - Refined Gradient */}
                <div className="bg-white sm:rounded-[32px] p-8 sm:shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start hidden sm:flex absolute right-8 top-8">
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 h-10 px-5 rounded-xl border-slate-200 text-slate-700 font-bold hover:border-emerald-200 hover:text-emerald-600 transition-all">
                                <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Edit Profile
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="relative mb-6">
                            <Avatar className="h-28 w-28 border-4 border-white shadow-[0_15px_30px_rgba(0,0,0,0.1)] ring-1 ring-slate-100">
                                <AvatarImage src={`https://picsum.photos/seed/user-avatar/120/120`} />
                                <AvatarFallback className="text-3xl bg-emerald-50 text-emerald-600 font-playfair">{user?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="w-full space-y-5 text-left animate-in fade-in zoom-in-95 duration-500">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2 block px-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2 block px-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Mobile</label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                            placeholder="9876543210"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2 block px-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editForm.dateOfBirth}
                                            onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-3">
                                    <Button variant="ghost" className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
                                    <Button className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 font-bold active:scale-[0.98] transition-all" onClick={handleSaveProfile} disabled={isSaving || !editForm.name}>
                                        {isSaving ? 'Updating...' : 'Save Profile'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-700">
                                <h1 className="text-3xl font-bold font-playfair text-slate-900 tracking-tight mb-1">{user?.name}</h1>
                                <p className="text-slate-400 text-[15px] font-medium mb-6">{user?.email}</p>

                                <div className="flex items-center justify-center gap-10 mt-2">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em] mb-1.5">Mobile</p>
                                        <p className="text-[15px] font-bold text-slate-700">{user?.phone || '—'}</p>
                                    </div>
                                    <div className="w-[1px] h-10 bg-slate-100"></div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em] mb-1.5">Born</p>
                                        <p className="text-[15px] font-bold text-slate-700">
                                            {user?.dateOfBirth ? (
                                                <>{new Date(user.dateOfBirth).getFullYear()}</>
                                            ) : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Health Overview Stats - Premium Cards */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Adherence', value: `${adherence}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Active Meds', value: medicines.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Streak', value: monthlyStreak, color: 'text-orange-600', bg: 'bg-orange-50' }
                    ].map(stat => (
                        <Card key={stat.label} className="border-none shadow-[0_4px_15px_rgba(0,0,0,0.02)] rounded-[24px] overflow-hidden">
                            <CardContent className={`p-5 flex flex-col items-center justify-center space-y-1.5 ${stat.bg}/30`}>
                                <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">{stat.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Emergency QR Card - Premium Trusted Look */}
                {hasData && (
                    <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:shadow-lg rounded-[32px] bg-white overflow-hidden group">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-center gap-2 mb-6 text-[11px] font-bold text-rose-500 uppercase tracking-[0.15em] bg-rose-50 px-4 py-2 rounded-full w-fit mx-auto border border-rose-100/50">
                                <QrCode className="w-3.5 h-3.5" strokeWidth={2.5} /> Live Emergency ID
                            </div>
                            <h3 className="text-xl font-bold font-playfair mb-6 text-center text-slate-900">Your Secure Digital Wallet</h3>
                            <div className="flex flex-col items-center gap-6">
                                {emergencyToken ? (
                                    <>
                                        <div className="bg-white p-5 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-50 transition-transform group-hover:scale-[1.02] duration-500">
                                            <QRCodeDisplay
                                                qrData={emergencyUrl}
                                                size={200}
                                                copyableUrl={emergencyUrl}
                                            />
                                        </div>
                                        <p className="text-[13px] text-slate-500 font-medium text-center max-w-[280px] leading-relaxed opacity-80">
                                            Enable paramedics to access your critical medical data <span className="text-slate-900 font-bold">instantly</span> in case of an emergency.
                                        </p>
                                    </>
                                ) : (
                                    <Button onClick={getOrCreateToken} className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg shadow-emerald-500/20 text-white font-bold transition-all active:scale-95">
                                        Generate Emergency QR Code
                                    </Button>
                                )}
                                <Button asChild variant="ghost" className="h-11 px-6 text-emerald-600 font-bold hover:bg-emerald-50 transition-all">
                                    <Link href="/dashboard/emergency-qr">
                                        Manage Security Settings <ChevronRight className="ml-1 w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}


                {/* Settings Items - Clean Production List */}
                <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] rounded-[32px] bg-white overflow-hidden">
                    <CardContent className="p-4 sm:p-8">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6 px-4">Preference & Privacy</h3>
                        <div className="space-y-1">
                            {settingsItems.map(item => {
                                const ItemWrapper = item.href ? Link : 'div';
                                return (
                                    <ItemWrapper href={item.href || '#'} key={item.title} className="flex items-center gap-5 p-4 rounded-[20px] hover:bg-slate-50 transition-all duration-300 active:scale-[0.99] group">
                                        <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-[16px] transition-transform group-hover:scale-110">
                                            <item.icon className="h-5 w-5" strokeWidth={2.2} />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-slate-900 text-[15px]">{item.title}</p>
                                            <p className="text-[13px] text-slate-400 font-medium mt-0.5">{item.description}</p>
                                        </div>
                                        <div className="ml-auto">
                                            {item.href ? <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-400 transition-colors" strokeWidth={2.5} /> : item.action}
                                        </div>
                                    </ItemWrapper>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Secure Sign Out */}
                <div className="px-5 pb-8 pt-4">
                    <Button variant="ghost" className="w-full justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl h-14 font-black tracking-tight" onClick={logout}>
                        <LogOut className="mr-2 h-5 w-5" strokeWidth={2.5} />
                        Disconnect Account
                    </Button>
                </div>
            </main>
        </div>
    );
}