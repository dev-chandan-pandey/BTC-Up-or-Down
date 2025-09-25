const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });
  const existing = await prisma.user.findUnique({ where: { email }});
  if (existing) return res.status(400).json({ error: 'email taken' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash: hash }});
  return res.json({ id: user.id, email: user.email });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user) return res.status(401).json({ error: 'invalid' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
  return res.json({ token });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }});
  if (!user) return res.status(404).json({ error: 'Not found' });
  const openBidsCount = await prisma.bid.count({ where: { userId: user.id, status: 'OPEN' }});
  // console.log("user", user)
  return res.json({ balance: user.balance_cents, openBidsCount , role: user.role});
}

module.exports = { signup, login, me };
