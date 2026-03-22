"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  qrCode?: string;
  qrPublicUrl?: string | null;
  dateOfBirth?: string;
  phone?: string;
  role: 'user' | 'admin' | 'hospital' | 'doctor';
  hospitalRoles?: string[];
  specialty?: string;
  hospitalName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch current user on mount
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = { email, password };
      console.log('📤 Auth Context: Sending login request');
      console.log('📧 Auth Context: Email:', email);
      console.log('🔑 Auth Context: Password length:', password?.length || 0);
      console.log('📦 Auth Context: Payload:', { email, password: '[REDACTED]' });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Auth Context: Response status:', response.status);
      const data = await response.json();
      console.log('📥 Auth Context: Response data:', { ...data, user: data.user ? 'present' : 'missing' });

      if (response.ok) {
        console.log('✅ Auth Context: Login successful, setting user');
        setUser(data.user);
        return { success: true };
      } else {
        console.log('❌ Auth Context: Login failed:', data.error);
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Auth Context: Network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = { name, email, password };
      console.log('📤 Auth Context: Sending signup request');
      console.log('👤 Auth Context: Name:', name);
      console.log('📧 Auth Context: Email:', email);
      console.log('🔑 Auth Context: Password length:', password?.length || 0);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Auth Context: Signup response status:', response.status);
      const data = await response.json();
      console.log('📥 Auth Context: Signup response data:', { ...data, user: data.user ? 'present' : 'missing' });

      if (response.ok) {
        console.log('✅ Auth Context: Signup successful, setting user');
        setUser(data.user);
        return { success: true };
      } else {
        console.log('❌ Auth Context: Signup failed:', data.error);
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('❌ Auth Context: Signup network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
