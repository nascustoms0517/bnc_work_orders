import { createContext, useContext, useState, type ReactNode } from "react";
import { type User } from "@/data/users";

interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
});

const STORAGE_KEY = "bnc_currentUser";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  function login(user: User) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
