const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { fetchPriceWithRetry } = require('../services/priceService');
const { recordIdempotency, getIdempotency } = require('../services/idempotencyService');
const { hashString } = require('../utils/cryptoHash');
const { enqueueSettlement } = require('../services/settlementWorker');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /bids
 * body: { amount, direction }
 * headers: Idempotency-Key
 */
async function createBid(req, res) {
  const userId = req.user.id;
  const { amount, direction } = req.body;
  const idempotencyKey = req.headers['idempotency-key'];

  // validation
  if (!amount || !direction) return res.status(400).json({ error: 'amount & direction required' });
  if (!['UP', 'DOWN'].includes(direction)) return res.status(400).json({ error: 'invalid direction' });
  if (amount < 10 || amount > 1000000) return res.status(400).json({ error: 'amount bounds (cents)' });

  // idempotency check
  if (idempotencyKey) {
    const prev = await getIdempotency(idempotencyKey);
    if (prev && prev.userId === userId) {
      return res.json(JSON.parse(prev.response));
    }
  }

  // lock entry price server-side
  const priceResp = await fetchPriceWithRetry();
  if (!priceResp.ok && !priceResp.pending) {
    return res.status(502).json({ error: 'Price API failure' });
  }

  // atomic debit + create bid
  const entryPrice = priceResp.price; // string
  const priceSource = process.env.PRICE_SOURCE || 'COINBASE';
  const settleAt = new Date(Date.now() + 60_000);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      if (user.balance_cents < amount) throw new Error('Insufficient balance');

      // debit
      await tx.user.update({ where: { id: userId }, data: { balance_cents: user.balance_cents - amount } });

      // create bid
      const bid = await tx.bid.create({
        data: {
          userId,
          amount_cents: amount,
          direction,
          status: priceResp.pending ? 'PENDING_SETTLEMENT' : 'OPEN',
          entryPrice,
          priceSource,
          settleAt,
          idempotencyKey: idempotencyKey || undefined
        }
      });

      // audit
      await tx.auditLog.create({
        data: { bidId: bid.id, type: 'BID_CREATED', payload: JSON.stringify({ entryPrice, raw: priceResp.raw, priceSource }) }
      });

      return bid;
    });

    // enqueue settlement if OPEN
    if (result.status === 'OPEN') {
      enqueueSettlement(result.id, result.settleAt);
    }

    const response = {
      bidId: result.id,
      entryPrice: result.entryPrice,
      settleAt: result.settleAt,
      status: result.status
    };

    if (idempotencyKey) {
      await recordIdempotency(idempotencyKey, userId, response);
    }

    return res.json(response);
  } catch (err) {
    console.error('createBid err', err.message);
    return res.status(400).json({ error: err.message });
  }
}

async function listBids(req, res) {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;
  const realLimit = Math.min(parseInt(limit) || 20, 100);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * realLimit;
  const where = { userId };
  if (status) where.status = status;
  const bids = await prisma.bid.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: realLimit,
    include: { auditLogs: true }
  });
  return res.json({ bids });
}

async function getBid(req, res) {
  const userId = req.user.id;
  const bidId = req.params.id;
  const bid = await prisma.bid.findUnique({ where: { id: bidId }, include: { auditLogs: true }});
  if (!bid || bid.userId !== userId) return res.status(404).json({ error: 'Not found' });
  return res.json({ bid });
}

module.exports = { createBid, listBids, getBid };
