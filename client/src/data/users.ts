export interface User {
  id: string;
  name: string;
  initials: string;
  role: "manager" | "salesperson" | "tech" | "tinter";
  canSell: boolean;
  username: string;
  password: string;
}

export const users: User[] = [
  // MANAGERS
  { id: "u01", name: "Mazin",      initials: "MZ", role: "manager",     canSell: true,  username: "mazin",      password: "bnc123" },
  { id: "u02", name: "Frank",      initials: "FK", role: "manager",     canSell: true,  username: "frank",      password: "bnc123" },

  // SALESPEOPLE
  { id: "u03", name: "Oscar",      initials: "OS", role: "salesperson", canSell: true,  username: "oscar",      password: "bnc123" },
  { id: "u04", name: "Luis",       initials: "LS", role: "salesperson", canSell: true,  username: "luis",        password: "bnc123" },
  { id: "u05", name: "Nasser",     initials: "NS", role: "salesperson", canSell: true,  username: "nasser",     password: "bnc123" },
  { id: "u06", name: "Adam",       initials: "AD", role: "salesperson", canSell: true,  username: "adam",        password: "bnc123" },

  // TECHS
  { id: "u07", name: "Maro",       initials: "MR", role: "tech", canSell: false, username: "maro",       password: "bnc123" },
  { id: "u08", name: "David",      initials: "DV", role: "tech", canSell: false, username: "david",      password: "bnc123" },
  { id: "u09", name: "Eric",       initials: "ER", role: "tech", canSell: false, username: "eric",       password: "bnc123" },
  { id: "u10", name: "Luis Jr",    initials: "LJ", role: "tech", canSell: false, username: "luisjr",     password: "bnc123" },
  { id: "u11", name: "Jr Buckner", initials: "JB", role: "tech", canSell: false, username: "jrbuckner",  password: "bnc123" },
  { id: "u12", name: "Dale",       initials: "DL", role: "tech", canSell: false, username: "dale",       password: "bnc123" },
  { id: "u13", name: "Ivan",       initials: "IV", role: "tech", canSell: false, username: "ivan",       password: "bnc123" },
  { id: "u14", name: "Gary",       initials: "GR", role: "tech", canSell: false, username: "gary",       password: "bnc123" },
  { id: "u15", name: "Angel",      initials: "AN", role: "tech", canSell: false, username: "angel",      password: "bnc123" },
  { id: "u16", name: "Jimmy",      initials: "JM", role: "tech", canSell: false, username: "jimmy",      password: "bnc123" },
  { id: "u17", name: "Manuel",     initials: "MN", role: "tech", canSell: false, username: "manuel",     password: "bnc123" },

  // TINTERS
  { id: "u18", name: "Marlin",     initials: "ML", role: "tinter", canSell: false, username: "marlin",     password: "bnc123" },
  { id: "u19", name: "Ivan Nuevo", initials: "IN", role: "tinter", canSell: false, username: "ivannuevo",  password: "bnc123" },
];

export function getSellers(): User[] {
  return users.filter((u) => u.canSell);
}

export function getTechs(): User[] {
  return users.filter((u) => u.role === "tech");
}

export function getTinters(): User[] {
  return users.filter((u) => u.role === "tinter");
}

export function authenticate(username: string, password: string): User | null {
  return users.find((u) => u.username === username && u.password === password) || null;
}
