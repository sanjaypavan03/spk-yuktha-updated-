"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEmergencyInfo } from "@/context/emergency-info-context";
import { useAuth } from "@/context/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit2, BadgeCheck, AlertCircle, HeartPulse, Activity, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function EmergencyInfoModal() {
  const { emergencyInfo, setEmergencyInfo, isModalOpen, setIsModalOpen } = useEmergencyInfo();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'tier1' | 'tier2'>('tier1');

  // Tier 1 Fields
  const [bloodGroup, setBloodGroup] = useState('');
  const [hasAllergies, setHasAllergies] = useState(false);
  const [allergiesDetails, setAllergiesDetails] = useState('');
  const [hasChronic, setHasChronic] = useState(false);
  const [chronicConditions, setChronicConditions] = useState('');
  const [hasMeds, setHasMeds] = useState(false);
  const [currentMedications, setCurrentMedications] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [implant, setImplant] = useState(false);

  // Tier 2 Fields
  const [modalDob, setModalDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [smoking, setSmoking] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [activity, setActivity] = useState('');
  const [hasSurgeries, setHasSurgeries] = useState(false);
  const [surgeries, setSurgeries] = useState([{ name: '', year: '' }]);
  const [secondContact, setSecondContact] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [insurance, setInsurance] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      // Sync from Context
      setBloodGroup(emergencyInfo.bloodGroup || '');
      setHasAllergies(emergencyInfo.knownAllergies || false);
      setAllergiesDetails(emergencyInfo.allergiesDetails || '');
      setHasChronic(!!emergencyInfo.chronicConditions);
      setChronicConditions(emergencyInfo.chronicConditions || '');
      setHasMeds(!!emergencyInfo.currentMedications);
      setCurrentMedications(emergencyInfo.currentMedications || '');
      setEmergencyContact(emergencyInfo.emergencyContact1Name || '');
      setImplant(emergencyInfo.hasPacemakerOrImplant || false);

      setModalDob(user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '');
      setHeight(emergencyInfo.height || '');
      setWeight(emergencyInfo.weight || '');
      setSmoking(emergencyInfo.smokingStatus || '');
      setAlcohol(emergencyInfo.alcoholUse || '');
      setActivity(emergencyInfo.physicalActivityLevel || '');

      setHasSurgeries((emergencyInfo.pastSurgeries?.length || 0) > 0);
      if (emergencyInfo.pastSurgeries && emergencyInfo.pastSurgeries.length > 0) {
        setSurgeries(emergencyInfo.pastSurgeries);
      } else {
        setSurgeries([{ name: '', year: '' }]);
      }

      setSecondContact(emergencyInfo.emergencyContact2Name || '');
      setFamilyHistory(emergencyInfo.familyMedicalHistory || '');
      setInsurance(emergencyInfo.insuranceProvider || '');
      setNotes(emergencyInfo.additionalNotes || '');
    }
  }, [isModalOpen, emergencyInfo, user]);

  const calcProgress = () => {
    let filled = 0;
    if (bloodGroup) filled++;
    if (hasAllergies ? allergiesDetails.trim() : true) filled++;
    if (hasChronic ? chronicConditions.trim() : true) filled++;
    if (hasMeds ? currentMedications.trim() : true) filled++;
    if (emergencyContact.trim()) filled++;
    filled++; // Pacemaker is a boolean, always "filled" with yes/no value
    return filled;
  };

  const progress = calcProgress();
  const maxProgress = 6;
  const isComplete = progress === maxProgress;

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // 1. Save Date of Birth to Profile if provided and not already present
      if (!user?.dateOfBirth && modalDob) {
        await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: user?.name,
            firstName: user?.firstName,
            lastName: user?.lastName,
            dateOfBirth: modalDob
          })
        });
      }

      // 2. Save Medical Info
      const payload = {
        bloodGroup,
        knownAllergies: hasAllergies,
        allergiesDetails: hasAllergies ? allergiesDetails : '',
        chronicConditions: hasChronic ? chronicConditions : '',
        currentMedications: hasMeds ? currentMedications : '',
        emergencyContact1Name: emergencyContact,
        hasPacemakerOrImplant: implant,

        height, weight,
        smokingStatus: smoking, alcoholUse: alcohol, physicalActivityLevel: activity,
        pastSurgeries: hasSurgeries ? surgeries.filter(s => s.name) : [],
        emergencyContact2Name: secondContact,
        familyMedicalHistory: familyHistory,
        insuranceProvider: insurance,
        additionalNotes: notes
      };

      const response = await fetch('/api/medical-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setEmergencyInfo(result.data);
        setIsModalOpen(false);
        refreshUser();
        toast({ title: "Emergency Info Saved", description: "Your digital medical profile is updated." });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to save medical info." });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Connection Error", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSurgery = (index: number, field: string, value: string) => {
    const newSurgeries = [...surgeries];
    newSurgeries[index] = { ...newSurgeries[index], [field]: value };
    setSurgeries(newSurgeries);
  };

  const addSurgeryRow = () => {
    if (surgeries.length < 3) setSurgeries([...surgeries, { name: '', year: '' }]);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-0 bg-slate-50">
        <DialogHeader className="p-6 pb-4 border-b bg-white z-10 relative">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-[60]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
          <DialogTitle className="font-playfair text-2xl font-bold tracking-tight text-slate-900 flex justify-between items-center">
            Emergency File
            {isComplete ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <BadgeCheck className="w-4 h-4" /> Ready
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
                <AlertCircle className="w-4 h-4" /> {progress}/{maxProgress} Tasks
              </span>
            )}
          </DialogTitle>

          {/* Progress Bar */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
            {[...Array(maxProgress)].map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < progress ? 'bg-primary' : 'bg-slate-200'}`}></div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex bg-slate-100 border-b border-slate-200 p-1 px-4 gap-1 z-10">
          <button
            onClick={() => setActiveTab('tier1')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${activeTab === 'tier1' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Tier 1 (Critical)
          </button>
          <button
            onClick={() => setActiveTab('tier2')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${activeTab === 'tier2' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Tier 2 (Details)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 pb-20">

          {/* Base Profile Details (Always visible at the top, conceptually linked to Profile) */}
          <div className="mb-8 p-4 bg-white rounded-2xl border border-slate-200 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient Name</p>
                <p className="font-bold text-slate-800 text-lg">{user?.name}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => { setIsModalOpen(false); router.push('/dashboard/profile'); }}>
                <Edit2 className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>

          {/************ TIER 1 SECTION ************/}
          {activeTab === 'tier1' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-3">
                <Label className="text-slate-600 font-bold">1. Blood Group</Label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger className="bg-white h-12 rounded-xl text-base"><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Other"].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-600 font-bold">2. Known Allergies</Label>
                  <Switch checked={hasAllergies} onCheckedChange={setHasAllergies} />
                </div>
                {hasAllergies && (
                  <textarea
                    value={allergiesDetails} onChange={e => setAllergiesDetails(e.target.value)}
                    placeholder="e.g. Penicillin - causes anaphylaxis"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"
                  />
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-600 font-bold">3. Chronic Conditions</Label>
                  <Switch checked={hasChronic} onCheckedChange={setHasChronic} />
                </div>
                {hasChronic && (
                  <textarea
                    value={chronicConditions} onChange={e => setChronicConditions(e.target.value)}
                    placeholder="e.g. Type 1 Diabetes, Epilepsy"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:border-primary min-h-[80px]"
                  />
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-600 font-bold">4. Current Medications</Label>
                  <Switch checked={hasMeds} onCheckedChange={setHasMeds} />
                </div>
                {hasMeds && (
                  <textarea
                    value={currentMedications} onChange={e => setCurrentMedications(e.target.value)}
                    placeholder="e.g. Metformin 500mg twice daily"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:border-primary min-h-[80px]"
                  />
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <Label className="text-slate-600 font-bold">5. Primary Emergency Contact</Label>
                <Input
                  value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)}
                  placeholder="e.g. John Doe - 9876543210 - Father"
                  className="bg-white h-12 rounded-xl text-base"
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <div>
                    <Label className="text-primary font-bold flex items-center gap-2 mb-1"><HeartPulse className="w-4 h-4" /> Pacemaker / Implant</Label>
                    <p className="text-xs text-slate-500">Do you have an electronic implant?</p>
                  </div>
                  <Switch checked={implant} onCheckedChange={setImplant} />
                </div>
              </div>
            </div>
          )}


          {/************ TIER 2 SECTION ************/}
          {activeTab === 'tier2' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Demographics</h4>
                <div className="space-y-3">
                  <Label className="text-slate-600 font-bold text-sm">Date of Birth</Label>
                  {user?.dateOfBirth ? (
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">{new Date(user.dateOfBirth).toLocaleDateString()}</span>
                      <Link href="/dashboard/profile" onClick={() => setIsModalOpen(false)} className="text-xs font-bold text-primary">Edit in Profile</Link>
                    </div>
                  ) : (
                    <Input type="date" value={modalDob} onChange={e => setModalDob(e.target.value)} className="bg-slate-50 h-12 rounded-xl" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold text-sm">Height</Label>
                    <Input value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 175cm" className="bg-slate-50 h-10 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-bold text-sm">Weight</Label>
                    <Input value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70kg" className="bg-slate-50 h-10 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Lifestyle</h4>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold text-sm">Smoking Status</Label>
                  <Select value={smoking} onValueChange={setSmoking}>
                    <SelectTrigger className="bg-slate-50 h-10 rounded-lg text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Never">Never</SelectItem>
                      <SelectItem value="Former Smoker">Former Smoker</SelectItem>
                      <SelectItem value="Current Smoker">Current Smoker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold text-sm">Alcohol Use</Label>
                  <Select value={alcohol} onValueChange={setAlcohol}>
                    <SelectTrigger className="bg-slate-50 h-10 rounded-lg text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Never">Never</SelectItem>
                      <SelectItem value="Occasional">Occasional</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold text-sm">Physical Activity</Label>
                  <Select value={activity} onValueChange={setActivity}>
                    <SelectTrigger className="bg-slate-50 h-10 rounded-lg text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedentary">Sedentary</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-600 font-bold">Past Surgeries</Label>
                  <Switch checked={hasSurgeries} onCheckedChange={setHasSurgeries} />
                </div>
                {hasSurgeries && (
                  <div className="space-y-3 mt-3">
                    {surgeries.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={s.name} onChange={e => updateSurgery(i, 'name', e.target.value)} placeholder="Procedure" className="bg-slate-50 flex-1 h-10" />
                        <Input value={s.year} onChange={e => updateSurgery(i, 'year', e.target.value)} placeholder="Year" className="bg-slate-50 w-24 h-10" />
                      </div>
                    ))}
                    {surgeries.length < 3 && (
                      <Button variant="outline" size="sm" onClick={addSurgeryRow} className="w-full text-xs">Add Surgery</Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-slate-600 font-bold">Secondary Emergency Contact</Label>
                  <Input value={secondContact} onChange={e => setSecondContact(e.target.value)} placeholder="e.g. Jane Doe - 9876543211 - Mother" className="bg-white h-12 rounded-xl" />
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-600 font-bold">Family Medical History</Label>
                  <textarea
                    value={familyHistory} onChange={e => setFamilyHistory(e.target.value)}
                    placeholder="e.g. Father had heart attack at 55"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:border-primary min-h-[80px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-600 font-bold">Health Insurance details</Label>
                  <Input value={insurance} onChange={e => setInsurance(e.target.value)} placeholder="e.g. Star Health - Policy 1234567" className="bg-white h-12 rounded-xl" />
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-600 font-bold">Additional Notes</Label>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Any other details for the doctor"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:border-primary min-h-[80px]"
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        <DialogFooter className="p-4 border-t bg-white z-20 sticky bottom-0 w-full shadow-[0_-10px_30px_rgba(0,0,0,0.05)] sm:flex-row flex-col gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setIsModalOpen(false)} 
            className="w-full sm:w-auto h-14 sm:h-auto font-bold text-slate-500 hover:text-slate-800"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="flex-1 h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-xl" 
            disabled={isSaving}
          >
            {isSaving ? 'Saving Changes...' : 'Save Emergency File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
