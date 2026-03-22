'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Building2, Users, Heart, Shield, Activity, Stethoscope,
    Loader2, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function AdminOverviewPage() {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/hospitals').then(r => r.json()),
            fetch('/api/admin/users').then(r => r.json()),
        ]).then(([hData, uData]) => {
            setHospitals(hData.hospitals || []);
            setUsers(uData.users || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const totalHospitals = hospitals.length;
    const activePartners = hospitals.filter(h => h.status !== 'Disabled').length;
    const totalPatients = users.length;
    const emergencyComplete = users.filter(u => u.emergencyDetailsCompleted).length;
    const hospitalPartners = hospitals.filter(h => (h.roles || []).includes('doctor')).length;
    const pharmacyPartners = hospitals.filter(h => (h.roles || []).includes('pharmacy')).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const stats = [
        { label: 'Total Partner Hospitals', value: totalHospitals, icon: Building2, color: 'bg-blue-50 text-blue-600' },
        { label: 'Active Partners', value: activePartners, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
        { label: 'Total Patients', value: totalPatients, icon: Users, color: 'bg-slate-100 text-slate-700' },
        { label: 'Emergency Profiles', value: emergencyComplete, icon: Heart, color: 'bg-teal-50 text-teal-600' },
        { label: 'Hospital Partners', value: hospitalPartners, icon: Stethoscope, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Pharmacy Partners', value: pharmacyPartners, icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
    ];

    const recentHospitals = [...hospitals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    const recentUsers = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
                <p className="text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Hospitals */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-white border-b border-slate-100 px-6 py-4">
                    <h3 className="font-semibold text-slate-900">Recent Hospitals</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentHospitals.map(h => (
                                <tr key={h._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-semibold text-slate-900 text-sm">{h.name}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex gap-1">
                                            {(h.roles || []).map((r: string) => (
                                                <Badge key={r} variant="outline" className={r === 'doctor' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 capitalize text-[10px]' : 'bg-emerald-50 text-emerald-700 border-emerald-100 capitalize text-[10px]'}>
                                                    {r}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 text-xs">{h.email}</td>
                                    <td className="px-6 py-3 text-slate-400 text-xs">{format(new Date(h.createdAt), 'dd MMM yyyy')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Recent Users */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-white border-b border-slate-100 px-6 py-4">
                    <h3 className="font-semibold text-slate-900">Recent Patients</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Emergency Profile</th>
                                <th className="px-6 py-3">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentUsers.map(u => (
                                <tr key={u._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-semibold text-slate-900 text-sm">{u.name}</td>
                                    <td className="px-6 py-3 text-slate-500 text-xs">{u.email}</td>
                                    <td className="px-6 py-3">
                                        {u.emergencyDetailsCompleted ? (
                                            <Badge className="bg-green-50 text-green-700 border-green-100 text-[10px]">Complete</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px]">Incomplete</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-slate-400 text-xs">{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
