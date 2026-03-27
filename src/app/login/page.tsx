"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

function MultilingualBrand() {
    const [activeBrandIndex, setActiveBrandIndex] = useState(0);
    const brandTransliterations = [
        "yuktha", "युक्त", "যুক্ত", "युक्त", "యుక్త", "யுக்தా", "યુક્ત", "ગુજરાતી",
        "ಯುಕ್ತ", "ଯୁକ୍ତ", "യുക്ത", "ਯੁਕਤ", "যুক্ত", "युक्त", "ᱭᱩᱠᱛᱷᱟ", "یکতھا",
        "युक्त", "يوڪٿا", "युक्त", "युक्त", "য়ুক্তা", "युक्त", "युक्त"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveBrandIndex(prev => (prev + 1) % brandTransliterations.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-24 flex items-center justify-center relative w-full overflow-hidden">
            {brandTransliterations.map((brand, idx) => (
                <h1
                    key={idx}
                    className={cn(
                        "absolute inset-0 flex items-end justify-center text-5xl md:text-6xl font-playfair italic font-black text-[#02B69A] tracking-tighter pb-4 transition-all duration-700 ease-in-out",
                        idx === activeBrandIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    )}
                >
                    <span className="flex items-end">
                        {brand}
                        <span className="w-[8px] h-[8px] md:w-[10px] md:h-[10px] bg-[#00D4AA] rounded-full ml-1 mb-[5px] md:mb-[8px]"></span>
                    </span>
                </h1>
            ))}
        </div>
    );
}

function LoginForm() {
  const { login, signup, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isLoginView, setIsLoginView] = useState(true);
  const [activeTextIndex, setActiveTextIndex] = useState(0);
  const rotatingTexts = [
    "Health connected.",
    "Care protected.",
    "Your medical identity.",
    "Always with you."
  ];

  // Forms state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [user, router, searchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTextIndex(prev => (prev + 1) % rotatingTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (!isLoginView && !fullName)) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isLoginView && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isLoginView) {
        const result = await login(email, password);
        if (result.success) {
          router.push(searchParams.get('redirect') || '/dashboard');
        } else {
          setError(result.error || "Invalid email or password.");
        }
      } else {
        const result = await signup(fullName, email, password);
        if (result.success) {
          toast({
            title: "Account Created!",
            description: "Welcome to Yuktha.",
          });
          router.push('/dashboard');
        } else {
          setError(result.error || "Failed to create account.");
        }
      }
    } catch (err: any) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#0F2027] overflow-hidden flex flex-col font-sans">
      {/* Top Branding Section - Descender Fix */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 pb-8 pt-6">
        <MultilingualBrand />

        {/* Tagline - Refined gap closer to the 96px box */}
        <p className="mt-1 text-lg md:text-xl font-medium text-slate-300 text-center">
           Always with you.
        </p>

        {/* Rotating Text (Secondary) - Tight but legible */}
        <div className="mt-1 h-8 relative w-full flex justify-center opacity-40">
          {rotatingTexts.map((text, idx) => (
            <p
              key={idx}
              className={`absolute text-sm font-medium text-slate-400 transition-all duration-700 ease-in-out whitespace-nowrap ${idx === activeTextIndex ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
                }`}
            >
              {text}
            </p>
          ))}
        </div>
      </div>

      {/* Bottom Sheet Form */}
      <div className="w-full bg-white rounded-t-[32px] px-6 pt-8 pb-10 shadow-2xl z-10 animate-in slide-in-from-bottom-full duration-700 md:max-w-md md:pl-8 md:pr-8 md:mx-auto md:rounded-[32px] md:mb-10 content-end">

        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 md:hidden"></div>

        <h2 className="text-2xl font-bold text-slate-900 mb-6 font-playfair">
          {isLoginView ? 'Welcome back' : 'Create account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {!isLoginView && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Full Name</label>
              <input
                type="text"
                required={!isLoginView}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#02B69A] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#02B69A] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#02B69A] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-[#02B69A] to-[#018A75] text-white rounded-2xl font-bold shadow-[0_8px_25px_rgba(2,182,154,0.4)] hover:shadow-[0_10px_30px_rgba(2,182,154,0.5)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:transform-none"
          >
            {loading ? 'Please wait...' : (isLoginView ? 'Sign Into Yuktha' : 'Create My Account')}
          </button>
        </form>

        <div className="mt-8 text-center pb-2">
          <button
            type="button"
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError(null);
            }}
            className="text-sm text-slate-600 hover:text-[#02B69A] transition-colors font-bold underline decoration-slate-200 underline-offset-4"
          >
            {isLoginView ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F2027] flex items-center justify-center">
        <div className="text-[#02B69A] font-bold animate-pulse">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
