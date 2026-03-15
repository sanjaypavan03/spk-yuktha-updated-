"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
} from "@/components/ui/sidebar";
import {
  Users,
  Calendar,
  Pill,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { useEffect, useState } from "react";

const menuItems = [
  { href: "/doctor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/doctor/patients", icon: Users, label: "My Patients" },
  { href: "/doctor/appointments", icon: Calendar, label: "Appointments" },
  { href: "/doctor/prescriptions", icon: Pill, label: "Prescriptions" },
];

export function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    fetch('/api/doctor/me')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setDoctor(data);
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/doctor/login');
    } catch {
      router.push('/doctor/login');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r border-slate-800 bg-slate-900 text-slate-200">
      <SidebarHeader className="border-b border-slate-800 pb-4">
        <div className="flex items-center justify-center p-2 group-data-[collapsible=icon]:p-0">
          <Logo className="h-8" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="mt-6 space-y-2 px-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  className={`h-11 rounded-lg transition-colors hover:bg-slate-800 hover:text-teal-400 ${isActive ? "bg-teal-900/30 text-teal-400 font-medium" : "text-slate-400"
                    }`}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-10 w-10 border border-slate-700">
            <AvatarFallback className="bg-slate-800 text-slate-300">
              {doctor ? getInitials(doctor.name) : <User />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
            <p className="font-semibold text-sm text-slate-200 truncate">{doctor ? doctor.name : 'Loading...'}</p>
            <p className="text-xs text-slate-500 truncate">{doctor ? doctor.specialty || 'General' : 'Doctor'}</p>
          </div>
        </div>
        <div className="mt-4 group-data-[collapsible=icon]:hidden">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-red-900/40 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
