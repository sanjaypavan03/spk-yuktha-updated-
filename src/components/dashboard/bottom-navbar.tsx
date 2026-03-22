"use client";

import { useState } from 'react';
import { Home, Pill, Plus, FileText, User, Calendar, QrCode, MessageSquare, TestTube2 } from "lucide-react";
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
                    className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 sm:hidden animate-in fade-in duration-300"
                    onClick={() => setIsDialOpen(false)}
                />
            )}

            <div className="md:hidden fixed bottom-0 left-0 z-50 w-full max-w-[100vw] h-[76px] bg-white/95 backdrop-blur-lg border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pb-safe">
                <div className="flex justify-between items-center h-full px-4 relative max-w-full">
                    {navItems.map((item, idx) => {
                        if (item.type === 'speed-dial') {
                            return (
                                <div key="speed-dial" className="relative flex-shrink-0 flex items-center justify-center -translate-y-4">
                                    {/* Floating Menu FAB Actions */}
                                    <div className={cn(
                                        "absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3.5 py-2 transition-all duration-500 ease-out-expo origin-bottom",
                                        isDialOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-12 pointer-events-none"
                                    )}>
                                        <button onClick={() => handleAction('/dashboard/add-prescription')} className="flex items-center justify-between w-[180px] bg-white px-5 py-4 rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 active:scale-95 transition-all">
                                            <span className="font-bold text-[14px] text-slate-800 tracking-tight">Add Medicine</span>
                                            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-[12px]"><Pill className="w-4 h-4" strokeWidth={2.5} /></div>
                                        </button>
                                        <button onClick={() => handleAction('/dashboard/appointments')} className="flex items-center justify-between w-[180px] bg-white px-5 py-4 rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 active:scale-95 transition-all">
                                            <span className="font-bold text-[14px] text-slate-800 tracking-tight">Appointments</span>
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-[12px]"><Calendar className="w-4 h-4" strokeWidth={2.5} /></div>
                                        </button>
                                        <button onClick={() => handleAction('/dashboard/reports')} className="flex items-center justify-between w-[180px] bg-white px-5 py-4 rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 active:scale-95 transition-all">
                                            <span className="font-bold text-[14px] text-slate-800 tracking-tight">Analyse Report</span>
                                            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-[12px]"><FileText className="w-4 h-4" strokeWidth={2.5} /></div>
                                        </button>
                                        <button onClick={() => handleAction('/dashboard/notes')} className="flex items-center justify-between w-[180px] bg-white px-5 py-4 rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 active:scale-95 transition-all">
                                            <span className="font-bold text-[14px] text-slate-800 tracking-tight">Notes</span>
                                            <div className="bg-violet-50 text-violet-600 p-2 rounded-[12px]"><MessageSquare className="w-4 h-4" strokeWidth={2.5} /></div>
                                        </button>
                                        <button onClick={() => handleAction('/dashboard/tests')} className="flex items-center justify-between w-[180px] bg-white px-5 py-4 rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 active:scale-95 transition-all">
                                            <span className="font-bold text-[14px] text-slate-800 tracking-tight">Lab Tests</span>
                                            <div className="bg-cyan-50 text-cyan-600 p-2 rounded-[12px]"><TestTube2 className="w-4 h-4" strokeWidth={2.5} /></div>
                                        </button>
                                        <button onClick={() => handleAction('/dashboard/emergency-qr')} className="flex items-center justify-between w-[180px] bg-white px-5 py-4 rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-red-50 active:scale-95 transition-all">
                                            <span className="font-bold text-[14px] text-red-600 tracking-tight">Emergency Hub</span>
                                            <div className="bg-red-50 text-red-600 p-2 rounded-[12px]"><QrCode className="w-4 h-4" strokeWidth={2.5} /></div>
                                        </button>
                                    </div>

                                    {/* Main Floating "+" Button */}
                                    <button
                                        onClick={toggleDial}
                                        className={cn(
                                            "flex items-center justify-center h-16 w-16 bg-gradient-to-tr from-[#10B981] to-[#059669] text-white rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.3)] transform transition-all duration-500 ease-out-expo border-4 border-white",
                                            isDialOpen ? "rotate-45 scale-110 shadow-none ring-4 ring-emerald-500/10" : "hover:scale-105"
                                        )}
                                    >
                                        <Plus className="h-8 w-8" strokeWidth={3.5} />
                                    </button>
                                </div>
                            )
                        }

                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.label} href={item.href!} className={cn(
                                "flex flex-col items-center justify-center w-12 h-12 gap-1 rounded-xl transition-all active:scale-90",
                                isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                            )}>
                                {item.icon && <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />}
                                <span className={cn(
                                    "text-[10px] font-bold tracking-tight transition-all duration-300",
                                    isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </>
    );
}
