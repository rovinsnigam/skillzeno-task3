import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './db.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || 'local-development-secret-change-before-deploying';
const statuses = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
app.use(express.json({ limit: '32kb' }));

const publicUser = ({ id, name, email }) => ({ id, name, email });
const tokenFor = (user) => jwt.sign({ sub: String(user.id) }, jwtSecret, { expiresIn: '7d' });

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  try {
    if (!token) throw new Error('Missing token');
    const payload = jwt.verify(token, jwtSecret);
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in to continue.' });
  }
}

function cleanApplication(body) {
  const fields = ['company', 'role', 'location', 'jobUrl', 'notes', 'appliedOn'];
  const value = Object.fromEntries(fields.map((field) => [field, String(body[field] ?? '').trim()]));
  value.status = statuses.includes(body.status) ? body.status : 'Saved';
  return value;
}

function validateApplication(value) {
  if (!value.company || !value.role) return 'Company and role are required.';
  if (value.company.length > 100 || value.role.length > 120) return 'Company or role is too long.';
  if (value.notes.length > 4000 || value.location.length > 120) return 'Notes or location is too long.';
  if (value.jobUrl && !/^https?:\/\//i.test(value.jobUrl)) return 'Job link must start with http:// or https://.';
  return null;
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/auth/setup', (_req, res) => {
  const setupRequired = db.prepare('SELECT 1 FROM users LIMIT 1').get() === undefined;
  res.json({ setupRequired });
});

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 200) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  try {
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, await bcrypt.hash(password, 12));
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ user, token: tokenFor(user) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'An account with that email already exists.' });
    res.status(500).json({ error: 'Could not create your account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  res.json({ user: publicUser(user), token: tokenFor(user) });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  res.json({ user });
});

app.get('/api/applications', authenticate, (req, res) => {
  const applications = db.prepare('SELECT * FROM applications WHERE user_id = ? ORDER BY COALESCE(applied_on, substr(created_at, 1, 10)) DESC, id DESC').all(req.userId);
  res.json({ applications });
});

app.post('/api/applications', authenticate, (req, res) => {
  const value = cleanApplication(req.body);
  const issue = validateApplication(value);
  if (issue) return res.status(400).json({ error: issue });
  const result = db.prepare(`INSERT INTO applications (user_id, company, role, status, location, job_url, notes, applied_on)
    VALUES (@userId, @company, @role, @status, @location, @jobUrl, @notes, @appliedOn)`).run({ userId: req.userId, ...value });
  res.status(201).json({ application: db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(result.lastInsertRowid, req.userId) });
});

app.put('/api/applications/:id', authenticate, (req, res) => {
  const value = cleanApplication(req.body);
  const issue = validateApplication(value);
  if (issue) return res.status(400).json({ error: issue });
  const result = db.prepare(`UPDATE applications SET company=@company, role=@role, status=@status, location=@location,
    job_url=@jobUrl, notes=@notes, applied_on=@appliedOn, updated_at=CURRENT_TIMESTAMP
    WHERE id=@id AND user_id=@userId`).run({ ...value, id: Number(req.params.id), userId: req.userId });
  if (!result.changes) return res.status(404).json({ error: 'Application not found.' });
  res.json({ application: db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.userId) });
});

app.delete('/api/applications/:id', authenticate, (req, res) => {
  const result = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.userId);
  if (!result.changes) return res.status(404).json({ error: 'Application not found.' });
  res.status(204).end();
});

const currentFile = fileURLToPath(import.meta.url);
const root = path.dirname(path.dirname(currentFile));
const dist = path.join(root, 'dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(dist, 'index.html'), (error) => error && next());
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong.' });
});

const server = app.listen(port, () => console.log(`Offerflow API listening on http://localhost:${port}`));
server.on('error', async (error) => {
  if (error.code !== 'EADDRINUSE') {
    console.error(error);
    process.exitCode = 1;
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const health = response.ok ? await response.json() : null;
    if (health?.ok) {
      console.log(`Offerflow is already running at http://localhost:${port}`);
      return;
    }
  } catch {}

  console.error(`Port ${port} is already in use. Stop that process or set PORT to an available port.`);
  process.exitCode = 1;
});