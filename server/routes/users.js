const express = require('express');
const db = require('../db');

const router = express.Router();

const USER_COLUMNS = ['id', 'name', 'initials', 'role', 'can_sell', 'username', 'password', 'phone'];

function normalizeUserInput(body = {}, existing = {}) {
  return {
    id: body.id ?? existing.id ?? `u${Date.now()}`,
    name: body.name ?? existing.name ?? '',
    initials: body.initials ?? existing.initials ?? '',
    role: body.role ?? existing.role ?? 'tech',
    can_sell: body.can_sell === undefined ? (existing.can_sell ?? 0) : (body.can_sell ? 1 : 0),
    username: body.username ?? existing.username ?? '',
    password: body.password ?? existing.password ?? '',
    phone: body.phone ?? existing.phone ?? ''
  };
}

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, name, initials, role, can_sell, username, password, phone FROM users ORDER BY name').all();
  res.json(users);
});

router.post('/', (req, res) => {
  try {
    const user = normalizeUserInput(req.body);

    db.prepare(`
      INSERT INTO users (${USER_COLUMNS.join(', ')})
      VALUES (@id, @name, @initials, @role, @can_sell, @username, @password, @phone)
    `).run(user);

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = normalizeUserInput(req.body, existing);
    user.id = req.params.id;

    db.prepare(`
      UPDATE users
      SET name = @name,
          initials = @initials,
          role = @role,
          can_sell = @can_sell,
          username = @username,
          password = @password,
          phone = @phone
      WHERE id = @id
    `).run(user);

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ success: true });
});

module.exports = router;
