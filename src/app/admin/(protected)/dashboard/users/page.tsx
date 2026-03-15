'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Users,
    Search,
    Loader2,
    RefreshCw,
    Mail,
    QrCode,
    HeartPulse,
    Info,
    CheckCircle2,
    XCircle,
    User as UserIcon
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface UserData {
    _id: string;
    name: string;
    email: string;
    qrCode?: string;
    emergencyDetailsCompleted: boolean;
    medicalInfo?: {
        bloodGroup?: string;
        allergies?: string;
        medications?: string;
        emergencyContact?: string;
    };
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const { toast } = useToast();

    const fetchUsers = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users || []);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.error || 'Failed to fetch users',
                });
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Network error occurred',
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Directory</h1>
                    <p className="text-slate-500">View and monitor registered users and their emergency status.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchUsers(true)}
                        disabled={isRefreshing}
                        className="bg-white"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-10 bg-slate-50 border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-slate-500 font-medium">Loading user directory...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-20 px-4">
                            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900">No users found</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                {searchQuery ? 'No results match your search query.' : 'There are currently no registered users.'}
                            </p>
                            {searchQuery && (
                                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-blue-600">
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">QR Status</th>
                                        <th className="px-6 py-4">Medical Info</th>
                                        <th className="px-6 py-4 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                        <UserIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{user.name}</p>
                                                        <div className="flex items-center text-xs text-slate-500 gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.qrCode ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1">
                                                        <QrCode className="h-3 w-3" />
                                                        Not Generated
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.emergencyDetailsCompleted ? (
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 w-fit">
                                                            Completed
                                                        </Badge>
                                                        {user.medicalInfo?.bloodGroup && (
                                                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                                                                Blood: {user.medicalInfo.bloodGroup}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 gap-1">
                                                        <HeartPulse className="h-3 w-3" />
                                                        Incomplete
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => setSelectedUser(user)}
                                                >
                                                    <Info className="h-4 w-4 mr-2" />
                                                    View Info
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                    {selectedUser && (
                        <>
                            <DialogHeader className="p-6 bg-slate-900 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                                        <UserIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl">{selectedUser.name}</DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            {selectedUser.email}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Emergency Status</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">QR Code</p>
                                            <p className="text-sm font-semibold">{selectedUser.qrCode ? 'Active' : 'Inactive'}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Profile Status</p>
                                            <p className="text-sm font-semibold">{selectedUser.emergencyDetailsCompleted ? 'Completed' : 'Incomplete'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Medical Summary</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Blood Group</span>
                                            <span className="text-sm font-bold text-slate-900">{selectedUser.medicalInfo?.bloodGroup || 'Not provided'}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-sm text-slate-500">Allergies</span>
                                            <p className="text-sm text-slate-900 font-medium">{selectedUser.medicalInfo?.allergies || 'None reported'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-sm text-slate-500">Current Medications</span>
                                            <p className="text-sm text-slate-900 font-medium">{selectedUser.medicalInfo?.medications || 'None reported'}</p>
                                        </div>
                                        <div className="space-y-1 py-1 px-3 bg-red-50 border border-red-100 rounded-md">
                                            <span className="text-[10px] text-red-500 font-bold uppercase">Emergency Contact</span>
                                            <p className="text-sm font-bold text-red-900">{selectedUser.medicalInfo?.emergencyContact || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-400 text-center uppercase font-medium tracking-widest">
                                    Read-only administrator access
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
