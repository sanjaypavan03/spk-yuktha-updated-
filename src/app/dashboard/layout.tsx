
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/dashboard/user-sidebar";
import { EmergencyInfoModal } from "@/components/dashboard/emergency-info-modal";
import { BottomNavbar } from "@/components/dashboard/bottom-navbar";
import { MedicineProvider } from "@/context/medicine-context";
import { EmergencyInfoProvider } from "@/context/emergency-info-context";
import { ReportProvider } from "@/context/report-context";
import { cn } from "@/lib/utils";
import { NotificationProvider } from "@/context/notification-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const hideMainLayout = ['/dashboard/add-prescription'].includes(pathname);
  const isDashboard = pathname === '/dashboard';

  if (hideMainLayout) {
      return (
        <ReportProvider>
            <NotificationProvider>
                <MedicineProvider>
                    <EmergencyInfoProvider>
                        {children}
                    </EmergencyInfoProvider>
                </MedicineProvider>
            </NotificationProvider>
        </ReportProvider>
      );
  }
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ReportProvider>
        <NotificationProvider>
        <MedicineProvider>
            <EmergencyInfoProvider>
                <SidebarProvider>
                    <UserSidebar />
                    <SidebarInset>
                        <main className={cn(
                            "min-h-screen p-4 pt-1 sm:px-8 lg:px-12 sm:pt-2 lg:pt-2 pb-8"
                    )}>
                            {children}
                        </main>
                    </SidebarInset>
                    <EmergencyInfoModal />
                </SidebarProvider>
                <BottomNavbar />
            </EmergencyInfoProvider>
        </MedicineProvider>
    </NotificationProvider>
    </ReportProvider>
  );
}

    
