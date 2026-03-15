'use client';

import {
    Building2,
    Users,
    LayoutDashboard,
    LogOut,
    Hospital
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
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' }); // Reuse existing logout or create specific
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout failed', error);
            // Fallback redirect
            router.push('/admin/login');
        }
    };

    const menuItems = [
        {
            title: "Hospitals",
            url: "/admin/dashboard", // Default to hospitals page
            icon: LocalHospitalIcon,
        },
        {
            title: "Users",
            url: "/admin/dashboard/users",
            icon: Users,
        },
    ];

    function LocalHospitalIcon(props: any) {
        return <Building2 {...props} />;
    }

    return (
        <>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-4 py-2">
                        <div className="bg-slate-900 text-white p-1 rounded-md">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-lg">Admin Panel</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Management</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {menuItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.url}
                                            className={pathname === item.url ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600"}
                                        >
                                            <Link href={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setShowLogoutDialog(true)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
                            Are you sure you want to sign out of the admin panel?
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
