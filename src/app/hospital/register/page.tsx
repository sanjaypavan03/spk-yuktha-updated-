'use client';

import React, { useState } from 'react';

export default function HospitalRegister() {
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '', address: '', city: '', state: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/hospital/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (res.ok) {
                window.location.href = '/hospital/dashboard';
            } else {
                setError(data.error || 'Registration failed.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "appearance-none block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-[#02B69A] focus:border-[#02B69A] text-sm bg-black text-white transition-colors";

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h1 className="text-4xl font-playfair italic font-black text-[#02B69A] tracking-tighter">
                    yuktha<span className="inline-block w-[7px] h-[7px] bg-[#00D4AA] rounded-full ml-1 mb-[2px]"></span>
                </h1>
                <h2 className="mt-6 text-2xl font-bold text-white tracking-tight">
                    Register your hospital
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                    Create your hospital admin account to manage doctors, patients, and analytics.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-800">
                    <form className="space-y-5" onSubmit={handleRegister}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                                <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Hospital Name *</label>
                            <input type="text" name="name" required value={form.name} onChange={handleChange} className={inputClass} placeholder="e.g. City General Hospital" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                            <input type="email" name="email" required value={form.email} onChange={handleChange} className={inputClass} placeholder="admin@hospital.com" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                            <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} className={inputClass} placeholder="Min 6 characters" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                            <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+91 98765 43210" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                            <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Street address" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                                <input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="City" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                                <input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} placeholder="State" />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-[#02B69A] to-[#00C9A7] hover:from-[#018A75] hover:to-[#02B69A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02B69A] focus:ring-offset-gray-900 disabled:opacity-50 transition-all duration-200"
                                style={{ boxShadow: '0 6px 20px rgba(2,182,154,0.4)' }}
                            >
                                {loading ? 'Creating Account...' : 'Register Hospital'}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-slate-400 mt-6">
                        Already registered?{' '}
                        <a href="/hospital/login" className="text-[#02B69A] hover:text-[#00D4AA] font-semibold transition-colors">
                            Sign in →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
