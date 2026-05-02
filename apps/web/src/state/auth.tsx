import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../lib/api';

type User = { id: string; name: string; role: 'ADMIN' | 'CUSTOMER' | 'PROVIDER' | 'DONATION_CENTER'; status: string } | null;

type CtxType = {
  user: User; accessToken: string | null;
  login: (email: string, password: string) => Promise<{ user: User }>;
  register: (data: any) => Promise<void>;
  logout: (password?: string) => Promise<void>;
};
const Ctx = createContext<CtxType>({} as any);

export function AuthProvider({ children }: any) {
  // Initialize from localStorage to persist on refresh
  const [user, setUser] = useState<User>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAT] = useState<string | null>(() => {
    const token = localStorage.getItem('accessToken');
    // Immediately set token in API headers during initialization
    if (token) {
      setAccessToken(token);
    }
    return token;
  });

  // Save to localStorage whenever user or token changes
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
    // Store email for admin logout verification
    localStorage.setItem('userEmail', email);
    return { user: data.user };
  }

  async function register(payload: any) {
    await api.post('/auth/register', payload);
  }

  async function logout(password?: string) {
    // Admin password requirement removed as per request
    
    await api.post('/auth/logout', {});
    setAT(null);
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
  }

  useEffect(() => {
    const id = setInterval(async () => {
      if (!accessToken) return;
      try { const { data } = await api.post('/auth/refresh', {}); setAT(data.accessToken); setAccessToken(data.accessToken); } catch {}
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [accessToken]);

  const value = useMemo(() => ({ user, accessToken, login, register, logout }), [user, accessToken]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);