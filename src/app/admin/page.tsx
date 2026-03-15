import { redirect } from 'next/navigation';

export default function AdminPage() {
    // Automatically redirect /admin to the dashboard
    // The middleware will handle auth checks and redirect to /admin/login if needed
    redirect('/admin/dashboard');
}
