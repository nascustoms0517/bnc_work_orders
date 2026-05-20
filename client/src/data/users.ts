export interface User {
  id: string;
  name: string;
  initials: string;
  role: "manager" | "salesperson" | "tech" | "tinter";
  canSell: boolean;
  username: string;
  password: string;
}

const STORAGE_KEY = "bnc_users";

const DEFAULT_ADMIN: User = {
  id: "u01",
  name: "Mazin",
  initials: "MZ",
  role: "manager",
  canSell: true,
  username: "mazin",
  password: "bnc123",
};

export function initUsers(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw || raw === "[]") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]));
  }
}

export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUser(user: User): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function deleteUser(id: string): void {
  const users = getUsers().filter((u) => u.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Convenience helpers used by dropdowns
export function getSellers(): User[] {
  return getUsers().filter((u) => u.canSell);
}

export function getTechs(): User[] {
  return getUsers().filter((u) => u.role === "tech");
}

export function getTinters(): User[] {
  return getUsers().filter((u) => u.role === "tinter");
}

export function authenticate(username: string, password: string): User | null {
  return getUsers().find((u) => u.username === username && u.password === password) || null;
}
