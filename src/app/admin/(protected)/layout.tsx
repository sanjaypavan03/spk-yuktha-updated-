'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <main className="min-h-screen bg-slate-50/50 p-4 sm:p-8 lg:p-12">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
