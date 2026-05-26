import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUsers } from '../data/api';

interface User {
  id: string;
  name: string;
  initials: string;
  role: string;
  canSell: boolean;
  username: string;
  phone?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load
  useEffect(() => {
    const stored = localStorage.getItem('bnc_current_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored) as User);
      } catch {
        localStorage.removeItem('bnc_current_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const users = await getUsers();
      const match = users.find(
        (u: any) => u.username === username && u.password === password
      );
      if (match) {
        setCurrentUser(match as User);
        localStorage.setItem('bnc_current_user', JSON.stringify(match));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bnc_current_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}