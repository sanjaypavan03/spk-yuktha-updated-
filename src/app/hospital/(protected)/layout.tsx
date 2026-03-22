"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Calendar, BarChart2, LogOut, QrCode, UserPlus, BedDouble, AlertTriangle, Upload } from "lucide-react";
import Link from 'next/link';

function HospitalSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [alertCount, setAlertCount] = useState(0);

    useEffect(() => {
        fetch('/api/hospital/emergency-flag?resolved=false')
            .then(r => r.json())
            .then(d => setAlertCount(d.flags?.length || 0))
            .catch(() => {});
    }, []);

    const menu = [
        { label: "Dashboard", href: "/hospital/dashboard", icon: QrCode },
        { label: "Appointments", href: "/hospital/appointments", icon: Calendar },
        { label: "Upload Reports", href: "/hospital/upload-report", icon: Upload },
        { label: "Register Patient", href: "/hospital/register-patient", icon: UserPlus },
        { label: "Inpatients", href: "/hospital/inpatients", icon: BedDouble },
        { label: "Alerts", href: "/hospital/alerts", icon: AlertTriangle, badge: alertCount },
        { label: "Analytics", href: "/hospital/analytics", icon: BarChart2 },
    ];

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
            window.location.href = '/hospital/login';
        }
    };

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-40 hidden sm:flex">
            <div className="p-6">
                <h1 className="text-3xl font-playfair italic font-black text-[#02B69A] tracking-tighter">
                    yuktha<span className="inline-block w-[6px] h-[6px] bg-[#00D4AA] rounded-full ml-1 mb-[2px]"></span>
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hospital Admin</p>
            </div>

            <div className="flex-1 px-4 space-y-2 mt-4">
                {menu.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                    ? 'bg-[#02B69A] text-slate-950 shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="flex-1">{item.label}</span>
                            {(item as any).badge > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-black min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
                                    {(item as any).badge}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors font-medium text-left"
                >
                    <LogOut className="w-5 h-5" /> Logout
                </button>
            </div>
        </div>
    );
}

function HospitalBottomNav() {
    const pathname = usePathname();

    const menu = [
        { label: "Scan QR", href: "/hospital/dashboard", icon: QrCode },
        { label: "Visits", href: "/hospital/appointments", icon: Calendar },
        { label: "Register", href: "/hospital/register-patient", icon: UserPlus },
        { label: "Inpatients", href: "/hospital/inpatients", icon: BedDouble },
    ];

    return (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center h-20 z-50 pb-safe">
            {menu.map(item => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center w-20 h-full gap-1 transition-colors ${isActive ? 'text-[#02B69A]' : 'text-slate-500'
                            }`}
                    >
                        <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                        <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                    </Link>
                )
            })}
        </div>
    )
}

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [hospitalUser, setHospitalUser] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me'); // uses standard auth but checking role
                if (res.ok) {
                    const data = await res.json();
                    if (data.user && data.user.role === 'hospital') {
                        setHospitalUser(data.user);
                    } else {
                        router.push('/hospital/login');
                    }
                } else {
                    router.push('/hospital/login');
                }
            } catch (e) {
                router.push('/hospital/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-[#02B69A]">Authenticating...</div>;
    }

    if (!hospitalUser) return null;

    return (
        <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-[#02B69A]/30">
            <HospitalSidebar />

            <div className="sm:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between px-4">
                <h1 className="text-2xl font-playfair italic font-black text-[#02B69A] tracking-tighter shadow-sm flex items-end">
                    yuktha<span className="inline-block w-[5px] h-[5px] bg-[#00D4AA] rounded-full ml-1 mb-[4px]"></span>
                </h1>
                <button onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/hospital/login';
                }} className="text-slate-500 p-2">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <main className="sm:ml-64 p-4 pt-20 sm:p-8 lg:p-12 pb-24 sm:pb-8 min-h-screen">
                {children}
            </main>

            <HospitalBottomNav />
        </div>
    );
}
