const express = require('express');
const db = require('../db');
const { sendOptInInvite, sendReadyNotification, sendTechAssignment, handleInboundSMS, sendSMS } = require('../sms.js');

const router = express.Router();

const JOB_COLUMNS = [
  'id', 'job_number', 'status', 'customer_name', 'phone', 'email',
  'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_color',
  'factory_amp', 'service_types', 'tech_assigned', 'salesperson',
  'parts_lines', 'labor_hours', 'promise_date', 'notes', 'damage',
  'internal_notes', 'created_at', 'completed_at'
];

function serializeValue(value) {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.stringify(value);
  }
  return value ?? '';
}

function deserializeValue(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return value;
  try { return JSON.parse(value); } catch { return value; }
}

function formatJob(row) {
  if (!row) return null;
  return {
    ...row,
    service_types: deserializeValue(row.service_types),
    parts_lines: deserializeValue(row.parts_lines),
    damage: deserializeValue(row.damage)
  };
}

function normalizeJobInput(body = {}, existing = {}) {
  return {
    id: body.id ?? existing.id ?? `j${Date.now()}`,
    job_number: body.job_number ?? existing.job_number ?? '',
    status: body.status ?? existing.status ?? 'new',
    customer_name: body.customer_name ?? existing.customer_name ?? '',
    phone: body.phone ?? existing.phone ?? '',
    email: body.email ?? existing.email ?? '',
    vehicle_year: body.vehicle_year ?? existing.vehicle_year ?? '',
    vehicle_make: body.vehicle_make ?? existing.vehicle_make ?? '',
    vehicle_model: body.vehicle_model ?? existing.vehicle_model ?? '',
    vehicle_color: body.vehicle_color ?? existing.vehicle_color ?? '',
    factory_amp: body.factory_amp ?? existing.factory_amp ?? '',
    service_types: serializeValue(body.service_types ?? existing.service_types),
    tech_assigned: body.tech_assigned ?? existing.tech_assigned ?? '',
    salesperson: body.salesperson ?? existing.salesperson ?? '',
    parts_lines: serializeValue(body.parts_lines ?? existing.parts_lines),
    labor_hours: body.labor_hours ?? existing.labor_hours ?? 0,
    promise_date: body.promise_date ?? existing.promise_date ?? '',
    notes: body.notes ?? existing.notes ?? '',
    damage: serializeValue(body.damage ?? existing.damage),
    internal_notes: body.internal_notes ?? existing.internal_notes ?? '',
    created_at: body.created_at ?? existing.created_at ?? new Date().toISOString(),
    completed_at: body.completed_at ?? existing.completed_at ?? ''
  };
}

// Handle inbound SMS (STOP/START/HELP from customers)
router.post('/sms/inbound', (req, res) => {
  const incomingMsg = req.body.Body || '';
  const from = req.body.From || '';
  const reply = handleInboundSMS(incomingMsg);
  if (reply) {
    sendSMS(from, reply);
  }
  res.set('Content-Type', 'text/xml');
  res.send('');
});

router.get('/', (req, res) => {
  const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all().map(formatJob);
  res.json(jobs);
});

router.get('/:id', (req, res) => {
  const job = formatJob(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id));
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.post('/', async (req, res) => {
  try {
    const job = normalizeJobInput(req.body);

    db.prepare(`
      INSERT INTO jobs (${JOB_COLUMNS.join(', ')})
      VALUES (${JOB_COLUMNS.map(col => `@${col}`).join(', ')})
    `).run(job);

    // SMS: Send opt-in invite to customer
    if (job.phone) {
      sendOptInInvite(job.phone, job.customer_name);
    }

    // SMS: Notify assigned tech
    if (job.tech_assigned) {
      const tech = db.prepare('SELECT * FROM users WHERE id = ?').get(job.tech_assigned);
      if (tech?.phone) {
        sendTechAssignment(
          tech.phone, tech.name, job.job_number,
          job.customer_name, job.vehicle_year, job.vehicle_make, job.vehicle_model
        );
      }
    }

    res.status(201).json(formatJob(job));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const job = normalizeJobInput(req.body, existing);
    job.id = req.params.id;

    db.prepare(`
      UPDATE jobs SET
        job_number = @job_number, status = @status, customer_name = @customer_name,
        phone = @phone, email = @email, vehicle_year = @vehicle_year,
        vehicle_make = @vehicle_make, vehicle_model = @vehicle_model,
        vehicle_color = @vehicle_color, factory_amp = @factory_amp,
        service_types = @service_types, tech_assigned = @tech_assigned,
        salesperson = @salesperson, parts_lines = @parts_lines,
        labor_hours = @labor_hours, promise_date = @promise_date,
        notes = @notes, damage = @damage, internal_notes = @internal_notes,
        created_at = @created_at, completed_at = @completed_at
      WHERE id = @id
    `).run(job);

    // SMS: Notify customer when job is marked ready
    if (job.status === 'ready' && existing.status !== 'ready' && job.phone) {
      sendReadyNotification(
        job.phone, job.customer_name,
        job.vehicle_year, job.vehicle_make, job.vehicle_model
      );
    }

    // SMS: Notify new tech if tech assignment changed
    if (job.tech_assigned && job.tech_assigned !== existing.tech_assigned) {
      const tech = db.prepare('SELECT * FROM users WHERE id = ?').get(job.tech_assigned);
      if (tech?.phone) {
        sendTechAssignment(
          tech.phone, tech.name, job.job_number,
          job.customer_name, job.vehicle_year, job.vehicle_make, job.vehicle_model
        );
      }
    }

    res.json(formatJob(job));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;