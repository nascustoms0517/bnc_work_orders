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

function seedUsers(): User[] {
  return [{ ...DEFAULT_ADMIN }];
}

function parseUsers(raw: string | null): User[] | null {
  if (raw === null) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function initUsers(): void {
  const raw = localStorage.getItem(STORAGE_KEY);

  // Only seed when the key is completely absent. If it already exists — even
  // as an empty array — do not overwrite staff data stored by the app.
  if (raw === null) {
    writeUsers(seedUsers());
  }
}

export function getUsers(): User[] {
  const users = parseUsers(localStorage.getItem(STORAGE_KEY));

  // Always read localStorage first. Only fall back to seed data when the key is
  // missing, unreadable, or currently stores an empty array.
  if (!users || users.length === 0) {
    return seedUsers();
  }

  return users;
}

export function saveUser(user: User): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);

  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }

  writeUsers(users);
}

export function deleteUser(id: string): void {
  const users = getUsers().filter((u) => u.id !== id);
  writeUsers(users);
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
