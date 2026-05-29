'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from './api';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  organizationId: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Initial load checks
    async function initializeAuth() {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify with server in background
          const meData = await fetchApi('/auth/me');
          setUser(meData.data);
          localStorage.setItem('user', JSON.stringify(meData.data));
        } catch (err) {
          // Token expired or invalid
          console.error('[Auth] Init validation failed:', err);
          logoutLocal();
        }
      }
      setLoading(false);
    }
    initializeAuth();
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/', '/login', '/register'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!user && !isPublicPath) {
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [user, pathname, loading, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });

      const { accessToken, refreshToken } = res.data.tokens;
      const loggedUser = res.data.user;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));

      setUser(loggedUser);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, organizationName: string) => {
    setLoading(true);
    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ name, email, password, organizationName }),
      });

      const { accessToken, refreshToken } = res.data.tokens;
      const loggedUser = res.data.user;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));

      setUser(loggedUser);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await fetchApi('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (err) {
      console.error('[Auth] Logout server call failed:', err);
    } finally {
      logoutLocal();
      setUser(null);
      setLoading(false);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const meData = await fetchApi('/auth/me');
      setUser(meData.data);
      localStorage.setItem('user', JSON.stringify(meData.data));
    } catch (err) {
      console.error('[Auth] Failed to refresh user profile:', err);
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
