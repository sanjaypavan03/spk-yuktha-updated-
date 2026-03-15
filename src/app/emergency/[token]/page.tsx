'use client';

import { useParams } from 'next/navigation';
import { useEmergencyInfoFetch } from '@/hooks/use-emergency-info-fetch';
import { AlertCircle, Loader2, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmergencyPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data: emergencyInfo, loading, error } = useEmergencyInfoFetch(token);

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Fetching emergency information…
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- Error ---------------- */
  if (error || !emergencyInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full shadow-soft">
          <CardContent className="p-6 space-y-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Unable to load emergency data</h2>
            <p className="text-sm text-muted-foreground">
              This QR code may be invalid or expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const phoneMatch =
    emergencyInfo.emergencyContact?.match(/[\d\-\+\(\)\s]{8,}/);

  return (
    <div className="min-h-screen bg-background pb-10">
      <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold font-headline">
            Emergency Medical Information
          </h1>
          <p className="text-xs text-muted-foreground">
            Authorized emergency access only
          </p>
        </div>

        {/* Patient Name */}
        <Card className="shadow-soft">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs text-muted-foreground uppercase">
              Patient Name
            </p>
            <div className="h-px bg-border/60" />
            <h2 className="text-2xl font-bold">
              {emergencyInfo.userName}
            </h2>
          </CardContent>
        </Card>

        {/* Blood + Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Blood Group */}
          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-3 text-center">
              <p className="text-xs text-muted-foreground uppercase">
                Blood Group
              </p>
              <div className="h-px bg-border/60" />
              <div className="text-4xl font-black text-primary">
                {emergencyInfo.bloodGroup}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Emergency Contact
              </p>

              <div className="h-px bg-border/60" />

              <p className="font-semibold">
                {emergencyInfo.emergencyContact}
              </p>

              {phoneMatch && (
                <Button asChild className="w-full">
                  <a href={`tel:${phoneMatch[0].trim()}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Allergies */}
        <Card className="shadow-soft">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              Allergies & Reactions
            </h3>

            <div className="h-px bg-border/60" />

            {emergencyInfo.allergies || emergencyInfo.allergiesOther ? (
              <div className="space-y-3">
                {emergencyInfo.allergies && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    {emergencyInfo.allergies}
                  </div>
                )}
                {emergencyInfo.allergiesOther && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    {emergencyInfo.allergiesOther}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No known allergies
              </p>
            )}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card className="shadow-soft">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              Current Medications
            </h3>

            <div className="h-px bg-border/60" />

            {emergencyInfo.medications || emergencyInfo.medicationsOther ? (
              <div className="space-y-3">
                {emergencyInfo.medications && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    {emergencyInfo.medications}
                  </div>
                )}
                {emergencyInfo.medicationsOther && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    {emergencyInfo.medicationsOther}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No current medications
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            For complete medical records, scan from a verified Yuktha hospital account.
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Yuktha Medical ID — Tier 1 Public Access Only
          </p>
        </div>

      </main>
    </div>
  );
}
