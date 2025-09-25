const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recordIdempotency(key, userId, response) {
  const now = new Date();
  await prisma.idempotency.upsert({
    where: { key },
    update: { response: JSON.stringify(response), createdAt: now },
    create: { key, userId, response: JSON.stringify(response) }
  });
}

async function getIdempotency(key) {
  const rec = await prisma.idempotency.findUnique({ where: { key }});
  if (!rec) return null;
  // expire after 5 minutes
  if ((Date.now() - new Date(rec.createdAt).getTime()) > 5*60*1000) {
    await prisma.idempotency.delete({ where: { key }});
    return null;
  }
  return rec;
}

module.exports = { recordIdempotency, getIdempotency };
