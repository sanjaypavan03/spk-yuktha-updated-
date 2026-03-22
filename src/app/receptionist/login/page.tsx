"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceptionistLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/receptionist/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/receptionist/dashboard");
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="max-w-md w-full bg-slate-900 border-slate-800 shadow-2xl">
                <CardContent className="pt-8 px-8 pb-10 space-y-8">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-[#02B69A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#02B69A]/20">
                            <ShieldCheck className="w-8 h-8 text-[#02B69A]" />
                        </div>
                        <h1 className="text-3xl font-playfair italic font-black text-white tracking-tighter">
                            yuktha<span className="inline-block w-[6px] h-[6px] bg-[#00D4AA] rounded-full ml-1 mb-[2px]"></span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Receptionist Portal Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-black border border-slate-800 rounded-xl px-12 py-3.5 text-white focus:border-[#02B69A] outline-none transition-all placeholder:text-slate-700 font-medium"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black border border-slate-800 rounded-xl px-12 py-3.5 text-white focus:border-[#02B69A] outline-none transition-all placeholder:text-slate-700 font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-rose-400 text-xs font-bold bg-rose-400/10 p-3 rounded-lg border border-rose-400/20">{error}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#02B69A] hover:bg-[#00D4AA] text-black font-black h-14 rounded-xl shadow-lg shadow-[#02B69A]/10 transition-all active:scale-[0.98] text-sm uppercase tracking-widest mt-4"
                        >
                            {loading ? "Authenticating..." : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" /> Signature Access
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
