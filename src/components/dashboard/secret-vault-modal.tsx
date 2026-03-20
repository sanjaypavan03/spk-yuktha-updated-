"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Shield, X, AlertCircle, Check } from "lucide-react";

interface SecretVaultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SecretVaultModal({ isOpen, onClose, onSuccess }: SecretVaultModalProps) {
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);
    const [mounted, setMounted] = useState(false);

    const CORRECT_PIN = "1234";

    const [langIndex, setLangIndex] = useState(0);

    const languages = [
        "सुरक्षित", "Secure", "Seguro", "Sécurisé", "Sicher", "Sicuro", "Надежный", 
        "安全", "安全", "안전한", "آمن", "Güvenli", "Veilig", "Säker", "Ασφαλής", 
        "מאובטח", "ปลอดภัย", "An toàn", "Aman", "Selamat", "সুরক্ষিত", "Saugus"
    ];

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            setPin(['', '', '', '']);
            setError(false);
            const interval = setInterval(() => {
                setLangIndex((prev) => (prev + 1) % languages.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isOpen, languages.length]);

    const handleNumberClick = (num: string) => {
        setError(false);
        const index = pin.findIndex(p => p === '');
        if (index === -1) return;

        const newPin = [...pin];
        newPin[index] = num;
        setPin(newPin);

        if (index === 3) {
            const finalPin = newPin.join('');
            if (finalPin === CORRECT_PIN) {
                onSuccess();
            } else {
                handleError();
            }
        }
    };

    const handleManualSubmit = () => {
        const finalPin = pin.join('');
        if (finalPin.length === 4 && !pin.includes('')) {
            if (finalPin === CORRECT_PIN) {
                onSuccess();
            } else {
                handleError();
            }
        } else {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const handleBackspace = () => {
        setError(false);
        const lastIndex = [...pin].reverse().findIndex(p => p !== '');
        if (lastIndex === -1) return;
        
        const index = 3 - lastIndex;
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
    };

    const handleClear = () => {
        setPin(['', '', '', '']);
        setError(false);
    };

    const handleError = () => {
        setError(true);
        setShake(true);
        setTimeout(() => {
            setShake(false);
            setPin(['', '', '', '']);
        }, 500);
    };

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with heavy blur */}
            <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500 overflow-hidden"
                onClick={onClose}
            />

            {/* Modal Content - Refined Small Size with Premium Animation */}
            <div className={`relative w-full max-w-[280px] sm:max-w-[320px] bg-[#0F172ACF] border border-white/10 rounded-[40px] p-6 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 ease-out-expo ${shake ? 'animate-shake' : ''}`}>
                <button 
                    onClick={onClose}
                    className="absolute right-5 top-5 p-1.5 text-slate-500 hover:text-white bg-white/5 rounded-full transition-colors border border-white/5"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-8 mt-2">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-[22px] flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <Lock className="w-7 h-7 text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[22px] font-bold text-white font-playfair mb-2 tracking-tight">
                        Your reports are <span className="text-emerald-400 inline-block min-w-[100px] transition-all duration-500">{languages[langIndex]}</span>
                    </h2>
                    <p className="text-slate-400 text-[14px] font-medium opacity-70">Verify your PIN to continue</p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-3 mb-8">
                    {pin.map((digit, idx) => (
                        <div
                            key={idx}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 border-2 ${
                                error ? 'border-red-500/50 text-red-400 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
                                digit ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/10 bg-white/5 text-transparent'
                            }`}
                        >
                            ●
                        </div>
                    ))}
                </div>

                {/* Numberpad Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6 px-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="h-12 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all font-sans"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleClear}
                        className="h-12 flex items-center justify-center bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-2xl text-[10px] font-black tracking-tighter text-slate-500 hover:text-red-400 active:scale-95 transition-all"
                    >
                        CLR
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-12 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all font-sans"
                    >
                        0
                    </button>
                    <button
                        onClick={handleManualSubmit}
                        className="h-12 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-emerald-400 active:scale-95 transition-all"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="flex items-center justify-center gap-1.5 text-red-400 text-[11px] font-bold mb-6 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Invalid authentication PIN
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="flex -space-x-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-4 h-4 rounded-full border border-[#0F172A] bg-slate-800 flex items-center justify-center overflow-hidden">
                                < Shield className="w-2 h-2 text-emerald-500/50" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">End-to-End Encrypted</span>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
