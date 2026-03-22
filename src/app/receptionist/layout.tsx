"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Calendar, BarChart2, LogOut, QrCode, UserPlus, BedDouble, AlertTriangle, Upload } from "lucide-react";
import Link from 'next/link';

function ReceptionistSidebar() {
    const pathname = usePathname();
    
    const menu = [
        { label: "Dashboard", href: "/receptionist/dashboard", icon: QrCode },
        { label: "Register Patient", href: "/receptionist/register", icon: UserPlus },
        { label: "Upload Reports", href: "/receptionist/upload-report", icon: Upload },
        { label: "Scan QR", href: "/receptionist/scan", icon: QrCode },
        { label: "Appointments", href: "/receptionist/appointments", icon: Calendar },
    ];

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            // ## ✅ Verification
            // - [x] Run `npx tsc --noEmit`
            // - [x] Final walkthrough
        } finally {
            window.location.href = '/receptionist/login';
        }
    };

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-40 hidden sm:flex">
            <div className="p-6">
                <h1 className="text-3xl font-playfair italic font-black text-[#02B69A] tracking-tighter">
                    yuktha<span className="inline-block w-[6px] h-[6px] bg-[#00D4AA] rounded-full ml-1 mb-[2px]"></span>
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Receptionist</p>
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

function ReceptionistBottomNav() {
    const pathname = usePathname();

    const menu = [
        { label: "Dashboard", href: "/receptionist/dashboard", icon: QrCode },
        { label: "Reg", href: "/receptionist/register", icon: UserPlus },
        { label: "Scan", href: "/receptionist/scan", icon: QrCode },
        { label: "Upload", href: "/receptionist/upload-report", icon: Upload },
        { label: "Visits", href: "/receptionist/appointments", icon: Calendar },
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

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [receptionistUser, setReceptionistUser] = useState<any>(null);

    useEffect(() => {
        if (pathname === '/receptionist/login') {
            setLoading(false);
            return;
        }

        const checkAuth = async () => {
            try {
                const res = await fetch('/api/receptionist/me'); 
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setReceptionistUser(data.user);
                    } else {
                        router.push('/receptionist/login');
                    }
                } else {
                    router.push('/receptionist/login');
                }
            } catch (e) {
                router.push('/receptionist/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    if (pathname === '/receptionist/login') {
        return <>{children}</>;
    }

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-[#02B69A]">Authenticating...</div>;
    }

    if (!receptionistUser) return null;

    return (
        <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-[#02B69A]/30">
            <ReceptionistSidebar />

            <div className="sm:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between px-4">
                <h1 className="text-2xl font-playfair italic font-black text-[#02B69A] tracking-tighter shadow-sm flex items-end">
                    yuktha<span className="inline-block w-[5px] h-[5px] bg-[#00D4AA] rounded-full ml-1 mb-[4px]"></span>
                </h1>
                <button onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/receptionist/login';
                }} className="text-slate-500 p-2">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <main className="sm:ml-64 p-4 pt-20 sm:p-8 lg:p-12 pb-24 sm:pb-8 min-h-screen">
                {children}
            </main>

            <ReceptionistBottomNav />
        </div>
    );
}
