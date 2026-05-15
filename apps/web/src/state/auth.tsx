import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../lib/api';

type User = { 
  id: string; 
  name: string; 
  role: 'ADMIN' | 'SYSTEM_ADMIN' | 'MANAGER' | 'CUSTOMER' | 'PROVIDER' | 'DONATION_CENTER'; 
  status: string;
  permissions?: any;
  forcePasswordChange?: boolean;
} | null;

type CtxType = {
  user: User; 
  accessToken: string | null;
  login: (email: string, password: string) => Promise<{ user: User }>;
  register: (data: any) => Promise<void>;
  logout: (password?: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
};

const Ctx = createContext<CtxType>({} as any);

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<User>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  
  const [accessToken, setAT] = useState<string | null>(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAccessToken(token);
    }
    return token;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      setAccessToken(accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [accessToken]);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    setAT(data.accessToken);
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('userEmail', email);
    return { user: data.user };
  }

  async function register(payload: any) {
    await api.post('/auth/register', payload);
  }

  async function logout() {
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout cleanup:', error);
    } finally {
      setAT(null);
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');
    }
  }

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  useEffect(() => {
    const id = setInterval(async () => {
      if (!accessToken) return;
      try { 
        const { data } = await api.post('/auth/refresh', {}); 
        setAT(data.accessToken); 
        setAccessToken(data.accessToken); 
      } catch {}
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [accessToken]);

  const value = useMemo(() => ({ user, accessToken, login, register, logout, updateUser }), [user, accessToken]);
  
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);