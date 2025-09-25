require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = require('./app');
const { startSettlementWorker } = require('./services/settlementWorker');

const PORT = process.env.PORT || 3000;

async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@local';
  const adminPass = process.env.ADMIN_PASSWORD || 'adminpass';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail }});
  if (!existing) {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(adminPass, 10);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash: hash, role: 'ADMIN', balance_cents: 1000000 }
    });
    console.log('Admin user created:', adminEmail);
  }
}

async function main() {
  await ensureAdmin();
  app.locals.prisma = prisma;
  const server = app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
  // start settlement worker after app started
  startSettlementWorker(prisma);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
