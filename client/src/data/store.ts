// ─── Types ────────────────────────────────────────────────────────────────────

export interface PartsLine {
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Job {
  id: string;
  jobNumber: number;
  status: "intake" | "in-progress" | "ready" | "complete";
  customerName: string;
  phone: string;
  vehicle: { year: string; make: string; model: string };
  serviceTypes: string[];
  techAssigned: string;
  salesperson: string;
  partsLines: PartsLine[];
  laborHours: number;
  totalEstimate: number;
  createdAt: string;
  notes: string;
  damage: string;
  internalNotes: { text: string; timestamp: string }[];
}

export interface DM {
  id: string;
  fromUser: string;
  toUser: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface BoardMessage {
  id: string;
  fromUser: string;
  body: string;
  timestamp: string;
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const JOBS_KEY = "bnc_jobs";
const DMS_KEY = "bnc_dms";
const BOARD_KEY = "bnc_board";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export function getJobs(): Job[] {
  const jobs = read<Job>(JOBS_KEY);
  if (jobs.length === 0) {
    const seeded = seedJobs();
    write(JOBS_KEY, seeded);
    return seeded;
  }
  return jobs;
}

export function saveJob(job: Job) {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.push(job);
  }
  write(JOBS_KEY, jobs);
}

export function deleteJob(id: string) {
  const jobs = getJobs().filter((j) => j.id !== id);
  write(JOBS_KEY, jobs);
}

// ─── DMs ──────────────────────────────────────────────────────────────────────

export function getDMs(): DM[] {
  return read<DM>(DMS_KEY);
}

export function saveDM(dm: DM) {
  const dms = getDMs();
  const idx = dms.findIndex((d) => d.id === dm.id);
  if (idx >= 0) {
    dms[idx] = dm;
  } else {
    dms.push(dm);
  }
  write(DMS_KEY, dms);
}

// ─── Board Messages ───────────────────────────────────────────────────────────

export function getBoardMessages(): BoardMessage[] {
  return read<BoardMessage>(BOARD_KEY);
}

export function saveBoardMessage(msg: BoardMessage) {
  const msgs = getBoardMessages();
  const idx = msgs.findIndex((m) => m.id === msg.id);
  if (idx >= 0) {
    msgs[idx] = msg;
  } else {
    msgs.push(msg);
  }
  write(BOARD_KEY, msgs);
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

function seedJobs(): Job[] {
  return [
    {
      id: uid(),
      jobNumber: 1001,
      status: "intake",
      customerName: "Maria Lopez",
      phone: "(555) 123-4567",
      vehicle: { year: "2021", make: "Toyota", model: "Camry" },
      serviceTypes: ["Window Tint"],
      techAssigned: "Habibi",
      salesperson: "Mazin",
      partsLines: [{ description: "Ceramic Tint Roll 20%", qty: 1, unitPrice: 85 }],
      laborHours: 2,
      totalEstimate: 250,
      createdAt: new Date().toISOString(),
      notes: "Customer wants 20% all around, no windshield strip.",
      damage: "",
      internalNotes: [],
    },
    {
      id: uid(),
      jobNumber: 1002,
      status: "in-progress",
      customerName: "James Carter",
      phone: "(555) 987-6543",
      vehicle: { year: "2019", make: "Ford", model: "F-150" },
      serviceTypes: ["PPF", "Ceramic Coating"],
      techAssigned: "Maro",
      salesperson: "Frank",
      partsLines: [
        { description: "PPF Full Hood", qty: 1, unitPrice: 450 },
        { description: "Ceramic Coat Kit", qty: 1, unitPrice: 120 },
      ],
      laborHours: 5,
      totalEstimate: 1200,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      notes: "Rush job — customer picking up Friday.",
      damage: "Small rock chip on hood, noted before PPF.",
      internalNotes: [],
    },
    {
      id: uid(),
      jobNumber: 1003,
      status: "ready",
      customerName: "Aisha Patel",
      phone: "(555) 222-3344",
      vehicle: { year: "2023", make: "BMW", model: "X5" },
      serviceTypes: ["Vinyl Wrap"],
      techAssigned: "Ivan",
      salesperson: "Oscar",
      partsLines: [
        { description: "Satin Black Vinyl 60ft", qty: 1, unitPrice: 600 },
      ],
      laborHours: 8,
      totalEstimate: 2800,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      notes: "Full body satin black wrap. Mirrors and handles included.",
      damage: "",
      internalNotes: [],
    },
  ];
}
