'use client';

import React, { useState } from 'react';

export default function HospitalLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Use existing unified login which supports hospital role
            const res = await fetch('/api/auth/login', {
                method: 'POST', // Assuming unified auth handles hospital or we have /api/hospital/login
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.user?.role === 'hospital') {
                window.location.href = '/hospital/dashboard';
            } else if (res.ok) {
                // If logged in but not hospital
                setError('Unauthorized role for hospital portal.');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h1 className="text-4xl font-playfair italic font-black text-[#02B69A] tracking-tighter">
                    yuktha<span className="inline-block w-[7px] h-[7px] bg-[#00D4AA] rounded-full ml-1 mb-[2px]"></span>
                </h1>
                <h2 className="mt-6 text-2xl font-bold text-white tracking-tight">
                    Hospital Administrator
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                    Manage your doctors, view analytics, and process patient scans.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-800">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                                <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Hospital Email
                            </label>
                            <div className="mt-1">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-[#02B69A] focus:border-[#02B69A] sm:text-sm bg-black text-white"
                                    placeholder="admin@hospital.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-[#02B69A] focus:border-[#02B69A] sm:text-sm bg-black text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-[#02B69A] to-[#00C9A7] hover:from-[#018A75] hover:to-[#02B69A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02B69A] focus:ring-offset-gray-900 disabled:opacity-50 transition-all duration-200"
                                style={{ boxShadow: '0 6px 20px rgba(2,182,154,0.4)' }}
                            >
                                {loading ? 'Authenticating...' : 'Access Hospital System'}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-slate-400 mt-6">
                        New hospital?{' '}
                        <a href="/hospital/register" className="text-[#02B69A] hover:text-[#00D4AA] font-semibold transition-colors">
                            Register here →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
