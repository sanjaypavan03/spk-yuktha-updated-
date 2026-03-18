"use client";

import { useState } from 'react';
import { Home, Pill, Plus, FileText, User, Calendar, QrCode } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/dashboard/med-tracker", icon: Pill, label: "Meds" },
    { type: 'speed-dial' },
    { href: "/dashboard/reports", icon: FileText, label: "Reports" },
    { href: "/dashboard/profile", icon: User, label: "Profile" },
];

export function BottomNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isDialOpen, setIsDialOpen] = useState(false);

    const toggleDial = () => setIsDialOpen(!isDialOpen);
    const handleAction = (href: string) => {
        setIsDialOpen(false);
        router.push(href);
    }

    return (
        <>
            {/* Backdrop for speed dial */}
            {isDialOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 sm:hidden transition-opacity"
                    onClick={() => setIsDialOpen(false)}
                />
            )}

            <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-20 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
                <div className="flex justify-around items-center h-full px-2">
                    {navItems.map((item, idx) => {
                        if (item.type === 'speed-dial') {
                            return (
                                <div key="speed-dial" className="relative flex-shrink-0 flex items-center justify-center">
                                    {/* Fan-out actions */}
                                    <div className={cn(
                                        "absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 py-2 transition-all duration-300 origin-bottom",
                                        isDialOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10 pointer-events-none"
                                    )}>
                                        <button onClick={() => handleAction('/dashboard/add-prescription')} className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 whitespace-nowrap active:scale-95 transition-transform">
                                            <span className="font-semibold text-sm text-slate-700">Add Medicine</span>
                                            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full"><Pill className="w-4 h-4" /></div>
                                        </button>
                                        <button onClick={() => handleAction('/dashboard/reports')} className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 whitespace-nowrap active:scale-95 transition-transform">
                                            <span className="font-semibold text-sm text-slate-700">Analyse Report</span>
                                            <div className="bg-purple-100 text-purple-600 p-1.5 rounded-full"><FileText className="w-4 h-4" /></div>
                                        </button>
                                        <button onClick={() => handleAction('/dashboard/appointments')} className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 whitespace-nowrap active:scale-95 transition-transform">
                                            <span className="font-semibold text-sm text-slate-700">Book Appointment</span>
                                            <div className="bg-[#02B69A]/20 text-[#018A75] p-1.5 rounded-full"><Calendar className="w-4 h-4" /></div>
                                        </button>
                                        <button onClick={() => handleAction('/dashboard/emergency-qr')} className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 whitespace-nowrap active:scale-95 transition-transform">
                                            <span className="font-semibold text-sm text-slate-700 font-bold text-red-600">Emergency QR</span>
                                            <div className="bg-red-100 text-red-600 p-1.5 rounded-full"><QrCode className="w-4 h-4" /></div>
                                        </button>
                                    </div>

                                    {/* Main Dial Button */}
                                    <button
                                        onClick={toggleDial}
                                        className={cn(
                                            "flex items-center justify-center h-14 w-14 bg-gradient-to-tr from-[#02B69A] to-[#00C9A7] text-white rounded-full shadow-[0_6px_16px_rgba(2,182,154,0.4)] transform transition-transform duration-300 -translate-y-6 border-4 border-white",
                                            isDialOpen && "rotate-45 shadow-none bg-gradient-to-tr from-slate-400 to-slate-500"
                                        )}
                                    >
                                        <Plus className="h-6 w-6" strokeWidth={3} />
                                    </button>
                                </div>
                            )
                        }

                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.label} href={item.href!} className={cn(
                                "flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-xl transition-colors",
                                isActive ? "text-[#02B69A]" : "text-slate-400 hover:text-slate-600"
                            )}>
                                {item.icon && <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />}
                                <span className={cn("text-[10px] font-medium tracking-wide", isActive && "font-bold")}>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </>
    );
}
