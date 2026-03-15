
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Search,
    ChevronLeft,
    Activity,
    Droplets,
    Scan,
    FlaskConical,
    Beaker,
    ClipboardList,
    FileText,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function HealthRepositoryPage() {
    const router = useRouter();

    const reportCategories = [
        { name: "MRI Scan", icon: Activity, bg: "bg-blue-50", iconBg: "bg-blue-100", color: "text-blue-600" },
        { name: "Blood Test", icon: Droplets, bg: "bg-pink-50", iconBg: "bg-pink-100", color: "text-red-500" },
        { name: "X-Ray", icon: Scan, bg: "bg-green-50", iconBg: "bg-green-100", color: "text-green-600" },
        { name: "Urine Analysis", icon: FlaskConical, bg: "bg-yellow-50", iconBg: "bg-yellow-100", color: "text-yellow-600" },
        { name: "Urine Analysis", icon: Beaker, bg: "bg-yellow-50", iconBg: "bg-yellow-100", color: "text-orange-600" },
        { name: "Other", icon: ClipboardList, bg: "bg-blue-50/50", iconBg: "bg-blue-100/50", color: "text-blue-500" },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Health Repository</h1>
                        <p className="text-muted-foreground">Access all your diagnostic reports and laboratory tests.</p>
                    </div>
                </div>
            </div>

            {/* Search and Categories Sections */}
            <div className="space-y-8">
                <div className="text-center pt-2">
                    <h2 className="text-2xl font-bold text-blue-900">Your Reports</h2>
                </div>

                <div className="relative max-w-2xl mx-auto w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search for test or report..."
                        className="bg-white border-gray-200 h-14 pl-12 rounded-xl text-lg shadow-sm focus-visible:ring-primary/20"
                    />
                </div>

                <div>
                    <h3 className="text-lg font-bold text-blue-900 mb-6 px-1">Tests & Diagnostics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {reportCategories.map((cat, index) => (
                            <Card key={index} className={cn("border-none shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden", cat.bg)}>
                                <CardContent className="p-6 flex flex-col items-center text-center h-full justify-between gap-6">
                                    <div className={cn("h-24 w-24 rounded-full flex items-center justify-center bg-white shadow-inner")}>
                                        <cat.icon className={cn("h-12 w-12", cat.color)} />
                                    </div>
                                    <p className="text-sm sm:text-lg font-bold text-blue-900 leading-tight">{cat.name}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Navigation to Reports Analysis */}
                <div className="pt-8">
                    <Card className="bg-slate-50 border-dashed border-2 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push('/dashboard/reports')}>
                        <CardContent className="p-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900">Health Report AI Analysis</h4>
                                    <p className="text-sm text-slate-500">Upload a report for a detailed breakdown and history tracking.</p>
                                </div>
                            </div>
                            <Button variant="outline" className="gap-2">
                                New Analysis <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
