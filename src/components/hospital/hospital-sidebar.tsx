'use client';

import {
    Building2,
    LayoutDashboard,
    LogOut,
    QrCode,
    Stethoscope,
    Pill,
    Users,
    Calendar,
    Activity
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/auth-context"; // We might need a separate auth context for hospital or reuse custom logic

export function HospitalSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    // Note: Standard useAuth might be for Users. 
    // For now we assume session handling is via cookies/middleware and local state if needed.

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/hospital/login');
        } catch (error) {
            console.error('Logout failed', error);
            router.push('/hospital/login');
        }
    };

    const menuItems = [
        {
            title: "Scanner",
            url: "/hospital/dashboard",
            icon: QrCode,
        },
        {
            title: "Appointments",
            url: "/hospital/appointments",
            icon: Calendar,
        },
        {
            title: "Analytics",
            url: "/hospital/analytics",
            icon: Activity,
        },
    ];

    return (
        <>
            <Sidebar className="border-r border-slate-800 bg-slate-950 text-slate-200" collapsible="icon">
                <SidebarHeader className="border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-2 px-4 py-2">
                        <div className="bg-slate-100 text-slate-950 p-1 rounded-md">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-lg text-slate-100 tracking-tight">Hospital Portal</span>
                    </div>
                </SidebarHeader>
                <SidebarContent className="bg-slate-950">
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-slate-500 uppercase tracking-wider text-xs font-bold">Operations</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {menuItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.url}
                                            className={pathname === item.url
                                                ? "bg-slate-800 text-white font-medium hover:bg-slate-800 hover:text-white"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"}
                                        >
                                            <a href={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="border-t border-slate-800 bg-slate-950 p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setShowLogoutDialog(true)}
                                className="text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Sign Out</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>

            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sign Out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            End your hospital session?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>Sign Out</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
