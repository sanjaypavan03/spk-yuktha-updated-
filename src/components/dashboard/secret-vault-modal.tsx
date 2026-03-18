"use client";

import { useState, useEffect } from 'react';
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

    const CORRECT_PIN = "1234";

    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '']);
            setError(false);
        }
    }, [isOpen]);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            {/* Backdrop with heavy blur */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content - Refined Small Size with Premium Animation */}
            <div className={`relative w-full max-w-[280px] bg-[#0F172ACF] border border-white/5 rounded-[32px] p-5 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 ease-out-expo ${shake ? 'animate-shake' : ''}`}>
                <button 
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 text-slate-500 hover:text-white bg-white/5 rounded-full transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-5 mt-1">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-indigo-500/20">
                        <Lock className="w-5 h-5 text-indigo-400" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-lg font-bold text-white font-playfair mb-0.5 tracking-tight">Locked Vault</h2>
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest opacity-80">Enter 4-Digit PIN</p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-2.5 mb-6">
                    {pin.map((digit, idx) => (
                        <div
                            key={idx}
                            className={`w-9 h-11 bg-white/5 border-2 rounded-xl flex items-center justify-center text-lg font-bold text-white transition-all ${
                                error ? 'border-red-500/50 text-red-400 bg-red-500/5' : 
                                digit ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/5'
                            }`}
                        >
                            {digit ? '●' : ''}
                        </div>
                    ))}
                </div>

                {/* Numberpad Grid */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="h-10 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-lg font-bold text-white active:scale-90 transition-all font-sans"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleClear}
                        className="h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-xl text-slate-500 hover:text-red-400 active:scale-90 transition-all text-[9px] font-black tracking-tighter"
                    >
                        CLR
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-10 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-lg font-bold text-white active:scale-90 transition-all font-sans"
                    >
                        0
                    </button>
                    <button
                        onClick={handleManualSubmit}
                        className="h-10 flex items-center justify-center bg-white/5 hover:bg-emerald-500/10 border border-white/5 rounded-xl text-slate-500 hover:text-emerald-400 active:scale-90 transition-all"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="flex items-center justify-center gap-1.5 text-red-400 text-[10px] font-bold mb-4 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3" /> Incorrect PIN
                    </div>
                )}

                <div className="flex items-center justify-center gap-1.5 opacity-30 mt-2">
                    <Shield className="w-2.5 h-2.5 text-indigo-400" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
            </div>
        </div>
    );
}
