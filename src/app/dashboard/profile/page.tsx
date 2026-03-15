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
        <div className="bg-card sm:bg-transparent min-h-screen">
            <header className="p-4 flex items-center justify-between border-b sm:hidden sticky top-0 bg-card z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="font-semibold text-lg">My Profile</h2>
                </div>
                {!isEditing && (
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4 text-primary" />
                    </Button>
                )}
            </header>

            <main className="max-w-xl mx-auto p-0 sm:p-4 md:p-6 space-y-6 sm:space-y-8 pb-24 sm:pb-8">
                {/* Profile Header Block */}
                <div className="bg-white sm:rounded-3xl p-6 sm:shadow-sm border-b sm:border border-slate-100 relative">
                    <div className="flex justify-between items-start hidden sm:flex absolute right-6 top-6">
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 h-9">
                                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-primary/20 mb-4">
                            <AvatarImage src={`https://picsum.photos/seed/user-avatar/100/100`} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-playfair">{user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>

                        {isEditing ? (
                            <div className="w-full space-y-4 text-left animate-in fade-in duration-300">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                            placeholder="e.g. 9876543210"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editForm.dateOfBirth}
                                            onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                                        <X className="w-4 h-4 mr-2" /> Cancel
                                    </Button>
                                    <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSaveProfile} disabled={isSaving || !editForm.name}>
                                        <Check className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Details'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-300">
                                <h1 className="text-2xl font-bold font-playfair">{user?.name}</h1>
                                <p className="text-muted-foreground text-sm mb-4">{user?.email}</p>

                                <div className="flex items-center justify-center gap-6 mt-2">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                                        <p className="text-sm font-semibold text-slate-700">{user?.phone || 'Not provided'}</p>
                                    </div>
                                    <div className="w-[1px] h-8 bg-slate-100"></div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DOB / Year</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {user?.dateOfBirth ? (
                                                <>{new Date(user.dateOfBirth).toLocaleDateString()} <span className="text-slate-400 font-normal">({new Date(user.dateOfBirth).getFullYear()})</span></>
                                            ) : 'Not provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <Card className="shadow-none sm:shadow-soft border-slate-100/50">
                    <CardContent className="p-4">
                        <h3 className="font-semibold font-headline mb-4 px-2">Health Overview</h3>
                        <div className="grid grid-cols-3 text-center divide-x divide-slate-100">
                            <div>
                                <p className="text-2xl font-bold text-primary">{adherence}%</p>
                                <p className="text-xs text-muted-foreground mt-1">Adherence</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">{medicines.length}</p>
                                <p className="text-xs text-muted-foreground mt-1">Active Meds</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">{monthlyStreak}</p>
                                <p className="text-xs text-muted-foreground mt-1">Day Streak</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* QR Code Card */}
                {hasData && (
                    <Card className="shadow-none sm:shadow-soft border-slate-100/50 bg-slate-50/50">
                        <CardContent className="p-6">
                            <h3 className="font-bold text-lg font-playfair mb-4 text-center">Emergency QR Identity</h3>
                            <div className="flex flex-col items-center gap-5">
                                {emergencyToken ? (
                                    <>
                                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mix-blend-multiply">
                                            <QRCodeDisplay
                                                qrData={emergencyUrl}
                                                size={180}
                                                copyableUrl={emergencyUrl}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium text-center max-w-[250px] leading-relaxed">
                                            First responders can scan this to instantly view your life-saving medical profile.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Button onClick={getOrCreateToken} className="w-full max-w-[250px]">
                                            Generate Emergency QR Code
                                        </Button>
                                        <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                                            Create a unique QR code for first responders to access your medical information.
                                        </p>
                                    </>
                                )}
                                <Button asChild variant="outline" className="w-full max-w-[250px] bg-white">
                                    <Link href="/dashboard/emergency-qr">
                                        View Security Settings
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}


                {/* Settings */}
                <Card className="shadow-none sm:shadow-soft border-slate-100/50">
                    <CardContent className="p-4 sm:p-6">
                        <h3 className="font-semibold font-headline mb-4 px-2">App Settings</h3>
                        <div className="space-y-1">
                            {settingsItems.map(item => {
                                const ItemWrapper = item.href ? Link : 'div';
                                return (
                                    <ItemWrapper href={item.href || '#'} key={item.title} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="bg-primary/10 text-primary p-2.5 rounded-full">
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{item.description}</p>
                                        </div>
                                        <div className="ml-auto">
                                            {item.href ? <ChevronRight className="h-5 w-5 text-slate-400" /> : item.action}
                                        </div>
                                    </ItemWrapper>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Sign Out */}
                <div className="px-2">
                    <Button variant="ghost" className="w-full justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-12 font-bold" onClick={logout}>
                        <LogOut className="mr-2 h-5 w-5" />
                        Sign Out Completely
                    </Button>
                </div>
            </main>
        </div>
    );
}