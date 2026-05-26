require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');
const usersRouter = require('./routes/users');
const jobsRouter = require('./routes/jobs');
const messagesRouter = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/users', usersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api', messagesRouter);

app.listen(PORT, () => {
  // Touch db so initialization runs before startup is reported.
  db.prepare('SELECT 1').get();
  console.log('BNC Server running');
});
