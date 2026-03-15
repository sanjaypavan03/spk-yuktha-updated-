
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
    <SidebarProvider>
      <ReportProvider>
          <NotificationProvider>
            <MedicineProvider>
                <EmergencyInfoProvider>
                <UserSidebar />
                <SidebarInset>
                    <main className={cn(
                        "min-h-screen",
                        isDashboard ? "p-4 pt-0 sm:p-8 lg:p-12" : "p-4 sm:p-8 lg:p-12"
                    )}>
                        {children}
                    </main>
                </SidebarInset>
                <BottomNavbar />
                <EmergencyInfoModal />
                </EmergencyInfoProvider>
            </MedicineProvider>
        </NotificationProvider>
      </ReportProvider>
    </SidebarProvider>
  );
}

    
