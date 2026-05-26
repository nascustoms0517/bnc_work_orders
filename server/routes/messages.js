const express = require('express');
const db = require('../db');

const router = express.Router();

function createId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function toIntBoolean(value) {
  return value ? 1 : 0;
}

router.get('/dms', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }

  const messages = db.prepare(`
    SELECT * FROM dms
    WHERE from_user_id = ? OR to_user_id = ?
    ORDER BY timestamp ASC
  `).all(userId, userId);

  res.json(messages);
});

router.post('/dms', (req, res) => {
  try {
    const message = {
      id: req.body.id ?? createId('dm'),
      from_user_id: req.body.from_user_id ?? req.body.fromUserId ?? '',
      to_user_id: req.body.to_user_id ?? req.body.toUserId ?? '',
      body: req.body.body ?? '',
      timestamp: req.body.timestamp ?? new Date().toISOString(),
      read: toIntBoolean(req.body.read)
    };

    db.prepare(`
      INSERT INTO dms (id, from_user_id, to_user_id, body, timestamp, read)
      VALUES (@id, @from_user_id, @to_user_id, @body, @timestamp, @read)
    `).run(message);

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/dms/read', (req, res) => {
  const { id, ids, userId, fromUserId, from_user_id } = req.body;
  let result;

  if (Array.isArray(ids) && ids.length > 0) {
    const placeholders = ids.map(() => '?').join(', ');
    result = db.prepare(`UPDATE dms SET read = 1 WHERE id IN (${placeholders})`).run(...ids);
  } else if (id) {
    result = db.prepare('UPDATE dms SET read = 1 WHERE id = ?').run(id);
  } else if (userId && (fromUserId || from_user_id)) {
    result = db.prepare('UPDATE dms SET read = 1 WHERE to_user_id = ? AND from_user_id = ?').run(userId, fromUserId ?? from_user_id);
  } else if (userId) {
    result = db.prepare('UPDATE dms SET read = 1 WHERE to_user_id = ?').run(userId);
  } else {
    return res.status(400).json({ error: 'Provide id, ids, or userId to mark messages as read' });
  }

  res.json({ success: true, updated: result.changes });
});

router.get('/board', (req, res) => {
  const messages = db.prepare('SELECT * FROM board_messages ORDER BY pinned DESC, timestamp DESC').all();
  res.json(messages);
});

router.post('/board', (req, res) => {
  try {
    const message = {
      id: req.body.id ?? createId('bm'),
      from_user_id: req.body.from_user_id ?? req.body.fromUserId ?? '',
      from_user_name: req.body.from_user_name ?? req.body.fromUserName ?? '',
      body: req.body.body ?? '',
      timestamp: req.body.timestamp ?? new Date().toISOString(),
      pinned: toIntBoolean(req.body.pinned)
    };

    db.prepare(`
      INSERT INTO board_messages (id, from_user_id, from_user_name, body, timestamp, pinned)
      VALUES (@id, @from_user_id, @from_user_name, @body, @timestamp, @pinned)
    `).run(message);

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/board/:id/pin', (req, res) => {
  const existing = db.prepare('SELECT * FROM board_messages WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Board message not found' });
  }

  const pinned = req.body.pinned === undefined ? (existing.pinned ? 0 : 1) : toIntBoolean(req.body.pinned);

  db.prepare('UPDATE board_messages SET pinned = ? WHERE id = ?').run(pinned, req.params.id);

  res.json({ ...existing, pinned });
});

module.exports = router;
