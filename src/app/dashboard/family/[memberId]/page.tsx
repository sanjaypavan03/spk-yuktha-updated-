
"use client";

import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FileText, Pill, Loader2, Trash2, Heart, Activity, Info, ShieldAlert, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useReports } from "@/context/report-context";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FamilyMember {
    _id: string;
    name: string;
    relation: string;
    otherRelation?: string;
    avatarUrl: string;
    bloodGroup?: string;
    allergies?: string;
    medications?: string;
    chronicConditions?: string;
    birthYear?: string;
    weight?: string;
    emergencyContact?: string;
    medicalNotes?: string;
    surgeryHistory?: string;
    habits?: string;
    physicalState?: string;
}

export default function FamilyMemberDetailPage() {
    const router = useRouter();
    const params = useParams<{ memberId: string }>();
    const memberId = params.memberId;
    const { toast } = useToast();

    const [member, setMember] = useState<FamilyMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editForm, setEditForm] = useState<Partial<FamilyMember>>({});

    // Move hooks to top level to avoid Rules of Hooks errors
    const { reports } = useReports();
    const memberReports = reports.filter(r => r.memberId === memberId);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                setLoading(true);
                // Add timestamp to prevent caching
                const res = await fetch(`/api/family/${memberId}?t=${Date.now()}`);
                if (res.ok) {
                    const result = await res.json();
                    setMember(result.data);
                } else {
                    toast({
                        title: "Error",
                        description: "Could not find profile",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch member", error);
            } finally {
                setLoading(false);
            }
        };

        if (memberId) {
            fetchMember();
        }
    }, [memberId]);

    // Initialize form when member is fetched OR when dialog opens
    useEffect(() => {
        if (member && isEditDialogOpen) {
            // Normalize relation case to match select options perfectly
            const standardRelations = [
                "Father", "Mother", "Spouse", "Wife", "Husband",
                "Son", "Daughter", "Elder Brother", "Younger Brother",
                "Elder Sister", "Younger Sister", "Friend", "Neighbor", "Other"
            ];

            const dbRelation = member.relation || "";
            const matchedRelation = standardRelations.find(
                r => r.toLowerCase() === dbRelation.toLowerCase()
            ) || (dbRelation ? "Other" : "");

            setEditForm({
                name: member.name || "",
                relation: matchedRelation,
                otherRelation: matchedRelation === "Other" && !standardRelations.includes(dbRelation) ? dbRelation : (member.otherRelation || ""),
                avatarUrl: member.avatarUrl || `https://picsum.photos/seed/${member._id}/100/100`,
                bloodGroup: member.bloodGroup || "",
                allergies: member.allergies || "",
                medications: member.medications || "",
                chronicConditions: member.chronicConditions || "",
                birthYear: member.birthYear || "",
                weight: member.weight || "",
                emergencyContact: member.emergencyContact || "",
                medicalNotes: member.medicalNotes || "",
                surgeryHistory: member.surgeryHistory || "",
                habits: member.habits || "",
                physicalState: member.physicalState || "",
            });
        }
    }, [member, isEditDialogOpen]);

    const handleUpdate = async () => {
        if (!editForm.name || !editForm.relation) {
            toast({
                title: "Validation Error",
                description: "Name and Relation are required fields.",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsUpdating(true);
            const res = await fetch(`/api/family/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                // Update local state immediately
                setMember(result.data);
                setIsEditDialogOpen(false);

                // Refresh the router to sync all server components
                router.refresh();

                toast({
                    title: "Success",
                    description: `${result.data.name}'s medical profile has been updated and saved to the vault.`,
                });
            } else {
                throw new Error(result.error || "Failed to update profile");
            }
        } catch (error: any) {
            console.error("Update error:", error);
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/family/${memberId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast({
                    title: "Profile Removed",
                    description: "User health records have been deleted.",
                });
                router.push('/dashboard/family');
            } else {
                throw new Error("Failed to delete member");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                <p className="text-muted-foreground mt-4 font-medium">Securing profile access...</p>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <h2 className="text-xl font-bold">Profile Access Not Found</h2>
                <Button variant="link" onClick={() => router.push('/dashboard/family')} className="mt-4 text-primary font-bold uppercase tracking-widest text-xs">
                    Back to Circle
                </Button>
            </div>
        );
    }

    const age = member.birthYear ? new Date().getFullYear() - parseInt(member.birthYear) : null;

    return (
        <div className="space-y-6 pb-20">
            {/* Structured Header */}
            <header className="flex items-center justify-between px-4 sm:px-0 bg-white/50 py-2 sticky top-0 z-10 backdrop-blur-sm border-b sm:border-none">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/family')} className="rounded-full hover:bg-white shadow-soft sm:shadow-none">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-black tracking-tight text-slate-800">Live Emergency Profile</h1>
                        <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-primary/20 font-bold uppercase text-[10px] tracking-widest px-2">
                            {member.relation === 'Other' ? member.otherRelation : member.relation}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-bold text-xs h-9 px-4 shadow-sm">
                                Edit Details
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none translate-y-[-50%]">
                            {/* Sticky Header */}
                            <div className="flex-none bg-slate-900 p-8 md:p-10 text-white flex justify-between items-center">
                                <div className="space-y-1">
                                    <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight text-white m-0">Modify Identity</DialogTitle>
                                    <p className="opacity-50 text-[10px] font-black uppercase tracking-widest">Medical Record Vault • Secure Update</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden md:block">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Active Subject</p>
                                        <p className="text-sm font-bold text-primary">{member.name}</p>
                                    </div>
                                    <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary/20 p-0.5 bg-white/5">
                                        <AvatarImage src={editForm.avatarUrl} className="rounded-full object-cover" />
                                        <AvatarFallback className="text-xl font-black bg-white/10 text-white">
                                            {editForm.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto bg-white p-8 md:p-12 scroll-smooth">
                                <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                                    {/* Column 1: Physical & Relation */}
                                    <section className="space-y-8">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-4">
                                            <Info className="h-4 w-4" /> Subjects Physical Profile
                                        </div>
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Legal Full Name</Label>
                                                <Input className="h-12 rounded-xl focus:ring-primary/20 border-slate-100 font-bold" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Relation</Label>
                                                    <Select value={editForm.relation} onValueChange={v => setEditForm({ ...editForm, relation: v })}>
                                                        <SelectTrigger className="h-12 rounded-xl border-slate-100 font-bold">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl shadow-2xl border-none">
                                                            {[
                                                                "Father", "Mother", "Spouse", "Wife", "Husband",
                                                                "Son", "Daughter", "Elder Brother", "Younger Brother",
                                                                "Elder Sister", "Younger Sister", "Friend", "Neighbor", "Other"
                                                            ].map(r => (
                                                                <SelectItem key={r} value={r} className="h-10 rounded-lg">{r}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Birth Year</Label>
                                                    <Input className="h-12 rounded-xl border-slate-100 font-bold" value={editForm.birthYear} onChange={e => setEditForm({ ...editForm, birthYear: e.target.value })} placeholder="1990" />
                                                </div>
                                            </div>
                                            {editForm.relation === 'Other' && (
                                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Specify Relation</Label>
                                                    <Input className="h-12 rounded-xl border-slate-100 font-bold" value={editForm.otherRelation} onChange={e => setEditForm({ ...editForm, otherRelation: e.target.value })} placeholder="e.g. Grandma" />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Avatar Image URL</Label>
                                                <Input className="h-12 rounded-xl border-slate-100 text-xs" value={editForm.avatarUrl} onChange={e => setEditForm({ ...editForm, avatarUrl: e.target.value })} placeholder="https://..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Weight (kg)</Label>
                                                    <Input className="h-12 rounded-xl border-slate-100 font-bold" value={editForm.weight} onChange={e => setEditForm({ ...editForm, weight: e.target.value })} placeholder="75" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dynamic State</Label>
                                                    <Input className="h-12 rounded-xl border-slate-100 font-bold" value={editForm.physicalState} onChange={e => setEditForm({ ...editForm, physicalState: e.target.value })} placeholder="Athletic" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Lifestyle Habits</Label>
                                                <Input className="h-12 rounded-xl border-slate-100 font-bold" value={editForm.habits} onChange={e => setEditForm({ ...editForm, habits: e.target.value })} placeholder="Non-smoker" />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Column 2: Medical Details */}
                                    <section className="space-y-8">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-[0.2em] border-b pb-4">
                                            <Heart className="h-4 w-4" /> Medical Logic & Essentials
                                        </div>
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Blood Group</Label>
                                                <Select value={editForm.bloodGroup} onValueChange={v => setEditForm({ ...editForm, bloodGroup: v })}>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 font-black text-red-600">
                                                        <SelectValue placeholder="Select Group" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl shadow-2xl border-none">
                                                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map(bg => (
                                                            <SelectItem key={bg} value={bg} className="h-10 rounded-lg font-bold">{bg}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-1">Critical Allergies</Label>
                                                <Input className="h-12 rounded-xl border-red-50 focus:border-red-200 font-bold text-red-700 bg-red-50/5" value={editForm.allergies} onChange={e => setEditForm({ ...editForm, allergies: e.target.value })} placeholder="Mention any reactions..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Chronic Conditions</Label>
                                                <Input className="h-12 rounded-xl border-slate-100 font-bold" value={editForm.chronicConditions} onChange={e => setEditForm({ ...editForm, chronicConditions: e.target.value })} placeholder="e.g. Hypertension" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Daily Medication Protocol</Label>
                                                <textarea className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-100 text-sm font-bold bg-slate-50/30 focus:outline-none focus:ring-2 focus:ring-primary/10" value={editForm.medications} onChange={e => setEditForm({ ...editForm, medications: e.target.value })} placeholder="Dosage & Schedule..." />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Full Width Sections */}
                                    <section className="md:col-span-2 grid md:grid-cols-2 gap-12 border-t pt-10">
                                        <div className="space-y-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 border-b pb-4 items-center flex gap-2">
                                                <Activity className="h-4 w-4" /> Comprehensive Surgery Log
                                            </h3>
                                            <textarea className="w-full min-h-[140px] p-5 rounded-3xl border border-slate-100 text-sm font-bold leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-100 bg-purple-50/5" value={editForm.surgeryHistory} onChange={e => setEditForm({ ...editForm, surgeryHistory: e.target.value })} placeholder="Dates, procedures, and recovery notes..." />
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 border-b pb-4 items-center flex gap-2">
                                                <ShieldAlert className="h-4 w-4" /> Emergency Protocol Logic
                                            </h3>
                                            <div className="space-y-5">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Primary Emergency Contact</Label>
                                                    <Input className="h-12 rounded-xl border-green-100 font-black text-green-700 bg-green-50/10 placeholder:text-green-200" value={editForm.emergencyContact} onChange={e => setEditForm({ ...editForm, emergencyContact: e.target.value })} placeholder="+91 XXXX XXXX" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-1">Life-Saving Instructions</Label>
                                                    <textarea className="w-full min-h-[100px] p-5 rounded-3xl border-red-50 bg-red-50/10 text-sm font-black italic text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-100" value={editForm.medicalNotes} onChange={e => setEditForm({ ...editForm, medicalNotes: e.target.value })} placeholder="Immediate actions for responders..." />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <DialogFooter className="flex-none p-6 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-row justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                                <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-full font-black text-slate-400 hover:text-slate-600 hover:bg-white px-8 h-12">Discard</Button>
                                <Button onClick={handleUpdate} disabled={isUpdating} className="rounded-full px-12 bg-slate-900 hover:bg-black font-black text-white h-14 shadow-2xl transition-all active:scale-95 group">
                                    {isUpdating ? (
                                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Syncing Vault...</span>
                                    ) : (
                                        <span className="flex items-center gap-2">Commit Update <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" /></span>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-xl text-destructive border-transparent hover:bg-destructive/10 h-9 w-9">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl p-8">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-black">Archive Identity?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-medium">
                                    All medical history and report links for {member.name} will be permanently removed.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6">
                                <AlertDialogCancel className="rounded-full font-bold">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full font-bold px-8">
                                    Confirm Archive
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </header>

            {/* Premium Profile Grid Layout */}
            <div className="grid gap-0 border rounded-3xl overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="grid md:grid-cols-2">
                    {/* Primary Identity Section */}
                    <div className="p-10 border-r border-b space-y-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <Info className="h-4 w-4" /> Primary Identity
                        </div>
                        <div className="space-y-8">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-24 w-24 ring-4 ring-slate-50 shadow-lg">
                                    <AvatarImage src={member.avatarUrl} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-black bg-slate-100 text-slate-400">
                                        {member.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Name</p>
                                    <p className="text-3xl font-black text-slate-900 leading-none">{member.name}</p>
                                </div>
                            </div>
                            <div className="flex gap-20">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Age</p>
                                    <p className="text-2xl font-bold text-slate-900">{age ? `${age} yrs` : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Weight</p>
                                    <p className="text-2xl font-bold text-slate-900">{member.weight ? `${member.weight} kg` : "—"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Physical State</p>
                                <p className="text-xl font-bold text-slate-700">{member.physicalState || "Average"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Habits</p>
                                <p className="text-xl font-bold text-slate-700">{member.habits || "None Reported"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Medical Essentials Section */}
                    <div className="p-10 border-b space-y-8 bg-slate-50/20">
                        <div className="flex items-center gap-2 text-[10px] font-black text-red-500/60 uppercase tracking-[0.2em]">
                            <Heart className="h-4 w-4" /> Medical Essentials
                        </div>
                        <div className="space-y-8">
                            <div className="p-6 bg-red-50/40 border border-red-100/50 rounded-2xl">
                                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">Blood Group</p>
                                <p className="text-5xl font-black text-red-600 leading-none">{member.bloodGroup || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Known Allergies</p>
                                <p className="text-xl font-bold text-red-500 leading-tight">{member.allergies || "No known allergies"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Chronic Conditions</p>
                                <p className="text-xl font-bold text-blue-600 leading-tight">{member.chronicConditions || "None Reported"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Medications</p>
                                <p className="text-xl font-bold text-slate-800 leading-tight whitespace-pre-line">{member.medications || "No current medications"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Surgical History Section */}
                    <div className="p-10 border-r space-y-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-purple-500/60 uppercase tracking-[0.2em]">
                            <Activity className="h-4 w-4" /> Surgical History
                        </div>
                        {member.surgeryHistory ? (
                            <div className="space-y-4">
                                <div className="p-5 bg-purple-50/50 border border-purple-100/50 rounded-2xl">
                                    <p className="text-slate-800 font-bold whitespace-pre-line leading-relaxed">{member.surgeryHistory}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                                <p className="text-slate-400 font-medium italic text-sm text-center">No record of previous surgeries</p>
                            </div>
                        )}
                    </div>

                    {/* Emergency Contact Section */}
                    <div className="p-10 space-y-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-green-600/60 uppercase tracking-[0.2em]">
                            <ShieldAlert className="h-4 w-4" /> Emergency Contact
                        </div>
                        <div className="space-y-8">
                            <div className="p-6 bg-green-50/50 border border-green-100/50 rounded-2xl">
                                <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-2">Immediate Responder</p>
                                <p className="text-4xl font-black text-green-700 leading-none">{member.emergencyContact || "—"}</p>
                            </div>
                            <div className="p-6 bg-red-50 border-l-8 border-l-red-500 rounded-r-2xl shadow-sm">
                                <p className="text-[9px] text-red-600 font-black uppercase tracking-[0.25em] mb-2 font-mono">Critical Medical Note</p>
                                <p className="text-xl font-bold text-slate-800 leading-relaxed italic font-serif">
                                    &ldquo;{member.medicalNotes || "Feeling healthy, no critical instructions at this time."}&rdquo;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Section with Manage Button */}
            <div className="mt-12 flex justify-end px-4 sm:px-0">
                <Button variant="outline" className="rounded-2xl border-slate-200 shadow-soft font-bold text-slate-700 bg-white flex items-center gap-2 px-6 h-12" onClick={() => router.push(`/dashboard/reports?memberId=${memberId}`)}>
                    <Plus className="h-5 w-5" /> Manage Reports
                </Button>
            </div>

        </div>
    );
}
