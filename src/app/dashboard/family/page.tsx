"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, Phone, Shield, X, UserPlus, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PremiumSelect } from "@/components/ui/premium-select";

interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    phone: string;
    access: 'view' | 'manage';
}

export default function FamilyPage() {
    const { toast } = useToast();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', relation: '', phone: '', access: 'view' as 'view' | 'manage' });

    const handleAdd = () => {
        if (!newMember.name || !newMember.relation) {
            toast({ variant: 'destructive', description: 'Name and relation are required.' });
            return;
        }

        const member: FamilyMember = {
            id: Date.now().toString(),
            ...newMember
        };

        setMembers([...members, member]);
        setNewMember({ name: '', relation: '', phone: '', access: 'view' });
        setShowAdd(false);
        toast({ title: 'Family Member Added', description: `${member.name} can now ${member.access === 'view' ? 'view' : 'manage'} your health data.` });
    };

    const removeMember = (id: string) => {
        setMembers(members.filter(m => m.id !== id));
        toast({ description: 'Family member removed.' });
    };

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

    return (
        <div className="space-y-6 pb-24 sm:pb-8 bg-[#F8FAFC] min-h-screen font-sans">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-b-[24px] sm:rounded-2xl p-6 -mx-4 -mt-4 sm:mx-0 sm:mt-0 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold font-playfair tracking-tight">Family & Caregivers</h1>
                        <p className="text-orange-100 text-sm font-medium mt-1">
                            Share your health data with trusted family members.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAdd(!showAdd)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Add
                    </Button>
                </div>
            </div>

            {/* Add Form */}
            {showAdd && (
                <Card className="border-orange-200 shadow-lg animate-in slide-in-from-top-4 duration-300">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800">Add Family Member</h3>
                            <Button size="icon" variant="ghost" onClick={() => setShowAdd(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Full Name *</label>
                                <input type="text" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="e.g. Ravi Kumar" className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                    <PremiumSelect
                                        label="Relation *"
                                        value={newMember.relation}
                                        onChange={val => setNewMember({ ...newMember, relation: val })}
                                        options={[
                                            { value: 'Father', label: 'Father' },
                                            { value: 'Mother', label: 'Mother' },
                                            { value: 'Spouse', label: 'Spouse' },
                                            { value: 'Sibling', label: 'Sibling' },
                                            { value: 'Son', label: 'Son' },
                                            { value: 'Daughter', label: 'Daughter' },
                                            { value: 'Guardian', label: 'Guardian' },
                                            { value: 'Caregiver', label: 'Caregiver' },
                                            { value: 'Other', label: 'Other' },
                                        ]}
                                        icon={Heart}
                                    />
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Phone</label>
                                    <input type="tel" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} placeholder="9876543210" className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Access Level</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewMember({ ...newMember, access: 'view' })}
                                        className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${newMember.access === 'view' ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 text-slate-500'}`}
                                    >
                                        👁️ View Only
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewMember({ ...newMember, access: 'manage' })}
                                        className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${newMember.access === 'manage' ? 'bg-orange-500/10 border-orange-500 text-orange-600' : 'border-slate-200 text-slate-500'}`}
                                    >
                                        ✏️ Full Manage
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleAdd} className="w-full h-12 font-bold rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                            <UserPlus className="w-4 h-4 mr-2" /> Add Family Member
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Members List */}
            <div className="px-1 space-y-3">
                {members.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 font-playfair">No Family Members</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                            Add trusted family members or caregivers who should have access to your health data in emergencies.
                        </p>
                    </div>
                ) : (
                    members.map(member => (
                        <Card key={member.id} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-lg font-playfair shrink-0 uppercase">
                                    {member.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800">{member.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">{member.relation}</p>
                                    {member.phone && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                            <Phone className="w-3 h-3" /> {member.phone}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${member.access === 'manage' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                        <Shield className="w-3 h-3 inline mr-1" />
                                        {member.access}
                                    </span>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-rose-500" onClick={() => removeMember(member.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Information Card */}
            <Card className="border-slate-100 bg-slate-50">
                <CardContent className="p-5">
                    <h4 className="text-sm font-bold text-slate-700 mb-2">How Family Access Works</h4>
                    <ul className="space-y-2 text-xs text-slate-500">
                        <li className="flex gap-2">
                            <span className="text-blue-500 font-bold">View</span> — Can see your medications, appointments, and emergency info.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-orange-500 font-bold">Manage</span> — Can add medications, book appointments, and update emergency data on your behalf.
                        </li>
                    </ul>
                    <p className="text-[10px] text-slate-400 mt-3">
                        Family members will receive an invite link. They don't need a Yuktha account to view data.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
