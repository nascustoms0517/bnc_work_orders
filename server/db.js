const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'bnc.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    initials TEXT,
    role TEXT NOT NULL,
    can_sell INTEGER DEFAULT 0,
    username TEXT UNIQUE,
    password TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    job_number TEXT,
    status TEXT,
    customer_name TEXT,
    phone TEXT,
    email TEXT,
    vehicle_year TEXT,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_color TEXT,
    factory_amp TEXT,
    service_types TEXT,
    tech_assigned TEXT,
    salesperson TEXT,
    parts_lines TEXT,
    labor_hours REAL,
    promise_date TEXT,
    notes TEXT,
    damage TEXT,
    internal_notes TEXT,
    created_at TEXT,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS dms (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    body TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS board_messages (
    id TEXT PRIMARY KEY,
    from_user_id TEXT,
    from_user_name TEXT,
    body TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    pinned INTEGER DEFAULT 0
  );
`);

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;

if (userCount === 0) {
  db.prepare(`
    INSERT INTO users (id, name, initials, role, can_sell, username, password, phone)
    VALUES (@id, @name, @initials, @role, @can_sell, @username, @password, @phone)
  `).run({
    id: 'u01',
    name: 'Mazin',
    initials: 'M',
    role: 'manager',
    can_sell: 1,
    username: 'mazin',
    password: 'bnc123',
    phone: ''
  });
}

module.exports = db;
