"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Activity, Calendar, Users, LogOut, ClipboardList, Pill, BedDouble, Bell } from "lucide-react";
import Link from 'next/link';

// Simple Doctor Sidebar Component
function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  const doctorNavItems = [
    { label: "Dashboard", href: "/doctor/dashboard", icon: Activity },
    { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill },
    { label: "Rounds", href: "/doctor/rounds", icon: BedDouble },
    { label: "My Patients", href: "/doctor/patients", icon: Users },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/doctor/login';
    }
  };

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-900 h-screen flex flex-col fixed left-0 top-0 z-40 hidden sm:flex">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-playfair italic font-black text-[#02B69A] tracking-tighter">
            yuktha<span className="inline-block w-[6px] h-[6px] bg-[#00D4AA] rounded-full ml-1 mb-[2px]"></span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Doctor Portal</p>
        </div>
        
        <button 
          onClick={() => router.push('/doctor/dashboard')}
          className="relative text-slate-400 hover:text-[#02B69A] transition-colors p-2"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 px-4 space-y-2 mt-4">
        {doctorNavItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                ? 'bg-[#02B69A]/10 text-[#02B69A] shadow-inner border border-[#02B69A]/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-[#02B69A]' : 'text-slate-500'}`} />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-900">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors font-medium text-left"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </div>
  );
}

// Doctor Bottom Nav for Mobile
function DoctorBottomNav() {
  const pathname = usePathname();

  const doctorBottomNavItems = [
    { label: "Home", href: "/doctor/dashboard", icon: Activity },
    { label: "Visits", href: "/doctor/appointments", icon: Calendar },
    { label: "Patients", href: "/doctor/patients", icon: Users },
    { label: "Rx", href: "/doctor/prescriptions", icon: Pill },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 flex justify-around items-center h-20 z-50 pb-safe">
      {doctorBottomNavItems.map(item => {
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

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [doctorUser, setDoctorUser] = useState<any>(null);

  useEffect(() => {
    // Skip check on login page
    if (pathname === '/doctor/login') {
      setLoading(false);
      return;
    }

    const checkDoctorAuth = async () => {
      try {
        // Must explicitly call doctor/me, not auth/me because this requires 'doctor' role
        const res = await fetch('/api/doctor/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setDoctorUser(data.user);
          } else {
            router.push('/doctor/login');
          }
        } else {
          router.push('/doctor/login');
        }
      } catch (e) {
        router.push('/doctor/login');
      } finally {
        setLoading(false);
      }
    };

    checkDoctorAuth();
  }, [pathname, router]);

  if (pathname === '/doctor/login') {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-[#02B69A]">Loading Doctor Portal...</div>;
  }

  if (!doctorUser) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-[#02B69A]/30">
      <DoctorSidebar />

      {/* Mobile Header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-900 z-40 flex items-center justify-between px-4">
        <h1 className="text-2xl font-playfair italic font-black text-[#02B69A] tracking-tighter shadow-sm flex items-end">
          yuktha<span className="inline-block w-[5px] h-[5px] bg-[#00D4AA] rounded-full ml-1 mb-[4px]"></span>
        </h1>
        <button onClick={async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/doctor/login';
        }} className="text-slate-500 p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <main className="sm:ml-64 p-4 pt-20 sm:p-8 lg:p-12 pb-24 sm:pb-8 min-h-screen">
        {children}
      </main>

      <DoctorBottomNav />
    </div>
  );
}
