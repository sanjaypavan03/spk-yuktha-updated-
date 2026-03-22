'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle, Lock, Server, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function AdminSettingsPage() {
    const [showResetModal, setShowResetModal] = useState(false);

    const loginEndpoints = [
        { endpoint: '/api/auth/login', role: 'Patient', limit: '5 attempts / 15 min' },
        { endpoint: '/api/doctor/login', role: 'Doctor', limit: '5 attempts / 15 min' },
        { endpoint: '/api/hospital/login', role: 'Hospital', limit: '5 attempts / 15 min' },
        { endpoint: '/api/admin/login', role: 'Admin', limit: '5 attempts / 15 min' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
                <p className="text-slate-500">Configuration, security, and system controls.</p>
            </div>

            {/* Section 1 — Platform Config */}
            <Card className="border-slate-200 shadow-sm">
                <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                    <Server className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">Platform Configuration</h3>
                </div>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                            <p className="font-medium text-slate-900 text-sm">Environment</p>
                            <p className="text-xs text-slate-500">Current deployment mode</p>
                        </div>
                        <Badge className="bg-amber-50 text-amber-700 border-amber-100">
                            {process.env.NODE_ENV || 'development'}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                            <p className="font-medium text-slate-900 text-sm">Admin Creation Guard</p>
                            <p className="text-xs text-slate-500">ALLOW_ADMIN_CREATE environment variable</p>
                        </div>
                        <Badge className="bg-green-50 text-green-700 border-green-100">
                            <Lock className="w-3 h-3 mr-1" /> Protected
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-slate-900 text-sm">Production Guard</p>
                            <p className="text-xs text-slate-500">/api/admin/create-first endpoint protection</p>
                        </div>
                        <Badge className="bg-green-50 text-green-700 border-green-100">
                            <Shield className="w-3 h-3 mr-1" /> Enabled
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2 — Security */}
            <Card className="border-slate-200 shadow-sm">
                <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">Security — Rate Limiting</h3>
                </div>
                <CardContent className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Endpoint</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Rate Limit</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loginEndpoints.map((ep, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-sm font-mono text-slate-700">{ep.endpoint}</td>
                                    <td className="px-6 py-3">
                                        <Badge variant="outline" className="text-[10px] capitalize">{ep.role}</Badge>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-600">{ep.limit}</td>
                                    <td className="px-6 py-3">
                                        <Badge className="bg-green-50 text-green-700 border-green-100 text-[10px]">Active</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Section 3 — Danger Zone */}
            <Card className="border-red-200 shadow-sm">
                <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">Danger Zone</h3>
                </div>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 text-sm">Reset Admin Password</p>
                            <p className="text-xs text-slate-500">Re-create admin credentials using the setup endpoint.</p>
                        </div>
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Key className="w-4 h-4 inline mr-1.5" />
                            Reset Password
                        </button>
                    </div>

                    {showResetModal && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
                            <h4 className="font-semibold text-red-800 text-sm">Password Reset Instructions</h4>
                            <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
                                <li>Set <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs">ALLOW_ADMIN_CREATE=true</code> in your environment variables</li>
                                <li>Access <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs">/api/admin/create-first</code> with new credentials</li>
                                <li><strong className="text-red-700">Immediately remove</strong> the <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs">ALLOW_ADMIN_CREATE</code> variable after setup</li>
                            </ol>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowResetModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
