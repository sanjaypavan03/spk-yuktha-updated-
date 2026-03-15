'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Hospital,
    Trash2,
    Search,
    Loader2,
    RefreshCw,
    Building2,
    Mail,
    Phone,
    UserPlus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface HospitalData {
    _id: string;
    name: string;
    email: string;
    roles: string[];
    status: 'Active' | 'Disabled';
    contactNumber: string;
    createdAt: string;
}

export default function AdminHospitalsPage() {
    const [hospitals, setHospitals] = useState<HospitalData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        roles: ['doctor'],
        contactNumber: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchHospitals = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        try {
            const response = await fetch('/api/admin/hospitals');
            const data = await response.json();
            if (response.ok) {
                setHospitals(data.hospitals || []);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.error || 'Failed to fetch hospitals',
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
        fetchHospitals();
    }, []);

    const handleAddHospital = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/admin/hospitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Hospital added successfully',
                });
                setIsAddModalOpen(false);
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    roles: ['doctor'],
                    contactNumber: '',
                });
                fetchHospitals();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.error || 'Failed to add hospital',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Network error occurred',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteHospital = async (id: string) => {
        if (!confirm('Are you sure you want to delete this hospital?')) return;

        try {
            const response = await fetch(`/api/admin/hospitals/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Hospital deleted successfully',
                });
                fetchHospitals();
            } else {
                const data = await response.json();
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.error || 'Failed to delete hospital',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Network error occurred',
            });
        }
    };

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.roles || []).some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hospitals & Partners</h1>
                    <p className="text-slate-500">Manage healthcare providers and partner accounts.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchHospitals(true)}
                        disabled={isRefreshing}
                        className="bg-white"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> Add Hospital
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleAddHospital}>
                                <DialogHeader>
                                    <DialogTitle>Add New Hospital</DialogTitle>
                                    <DialogDescription>
                                        Create a new partner account for a hospital or pharmacy.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Hospital Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="City Central Hospital"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email / Login ID</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@hospital.com"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Temporary Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Account Role</Label>
                                        <Select
                                            value={formData.roles.includes('doctor') && formData.roles.includes('pharmacy') ? 'Both' : formData.roles[0]}
                                            onValueChange={(v: string) => {
                                                const newRoles = v === 'Both' ? ['doctor', 'pharmacy'] : [v.toLowerCase()];
                                                setFormData({ ...formData, roles: newRoles });
                                            }}
                                        >
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="doctor">Doctor / Hospital</SelectItem>
                                                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                                                <SelectItem value="Both">Both (Full Access)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contact">Contact Number</Label>
                                        <Input
                                            id="contact"
                                            placeholder="+91 00000 00000"
                                            value={formData.contactNumber}
                                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                        Create Account
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
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
                            <p className="text-slate-500 font-medium">Loading hospital data...</p>
                        </div>
                    ) : filteredHospitals.length === 0 ? (
                        <div className="text-center py-20 px-4">
                            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900">No hospitals found</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                {searchQuery ? 'No results match your search query.' : 'Get started by adding your first hospital partner.'}
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
                                        <th className="px-6 py-4">Hospital / Partner</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Contact Info</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredHospitals.map((hospital) => (
                                        <tr key={hospital._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <Hospital className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{hospital.name}</p>
                                                        <p className="text-xs text-slate-400">ID: {hospital._id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    {(hospital.roles || []).map(r => (
                                                        <Badge key={r} variant="outline" className={
                                                            r === 'doctor' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 capitalize' :
                                                                'bg-emerald-50 text-emerald-700 border-emerald-100 capitalize'
                                                        }>
                                                            {r}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-xs text-slate-600 gap-2">
                                                        <Mail className="h-3 w-3" />
                                                        {hospital.email}
                                                    </div>
                                                    {hospital.contactNumber && (
                                                        <div className="flex items-center text-xs text-slate-600 gap-2">
                                                            <Phone className="h-3 w-3" />
                                                            {hospital.contactNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeleteHospital(hospital._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
        </div>
    );
}
