const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hash,
      role: 'ADMIN',
      balance_cents: 100000,
    },
  });
  console.log('✅ Admin user seeded: admin@example.com / admin123');
}

main().finally(() => prisma.$disconnect());
