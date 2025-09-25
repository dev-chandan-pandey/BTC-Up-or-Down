const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
let server;
let token;
beforeAll(async () => {
  server = app.listen(4001);
  // create test user
  await prisma.user.create({ data: { email: 't@u.com', passwordHash: '$2b$10$abcdefabcdefabcdefabcd', balance_cents: 100000 }});
  const res = await request(app).post('/auth/login').send({ email: 't@u.com', password: 'wrong' });
  // we won't actually login here; these tests are smoke for server endpoints existence.
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

test('GET / returns ok', async () => {
  const res = await request(app).get('/');
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
});
