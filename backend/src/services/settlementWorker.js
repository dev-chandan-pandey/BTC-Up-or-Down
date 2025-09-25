const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { fetchPriceWithRetry } = require('./priceService');
const { hashString } = require('../utils/cryptoHash');

const queue = new Map(); // bidId -> timeoutId

function enqueueSettlement(bidId, settleAt) {
  const delay = new Date(settleAt).getTime() - Date.now();
  if (delay <= 0) return settleNow(bidId);
  if (queue.has(bidId)) return;
  const id = setTimeout(() => {
    queue.delete(bidId);
    settleNow(bidId);
  }, delay);
  queue.set(bidId, id);
}

// attempt to settle a bid now (atomic)
async function settleNow(bidId) {
  // batch: fetch current bid
  const bid = await prisma.bid.findUnique({ where: { id: bidId }});
  if (!bid) return;
  if (bid.status !== 'OPEN' && bid.status !== 'PENDING_SETTLEMENT') return;
  // fetch settlement price
  const priceResp = await fetchPriceWithRetry();
  if (!priceResp.ok && priceResp.pending) {
    // mark PENDING_SETTLEMENT if not already
    if (bid.status !== 'PENDING_SETTLEMENT') {
      await prisma.$transaction([
        prisma.bid.update({ where: { id: bidId }, data: { status: 'PENDING_SETTLEMENT' } }),
        prisma.auditLog.create({ data: { bidId, type: 'SETTLE_PENDING', payload: JSON.stringify({ reason: 'price-failed' }) }})
      ]);
    }
    return;
  } else if (!priceResp.ok) {
    // treat as pending
    if (bid.status !== 'PENDING_SETTLEMENT') {
      await prisma.bid.update({ where: { id: bidId }, data: { status: 'PENDING_SETTLEMENT' }});
    }
    return;
  }

  const settlePrice = priceResp.price;
  // rounding to 2dp and compare
  const entry = parseFloat(bid.entryPrice);
  const settle = parseFloat(settlePrice);
  const round = (v) => Math.round(v * 100) / 100;
  const entryR = round(entry), settleR = round(settle);

  // compute result
  let newStatus;
  if (settleR === entryR) newStatus = 'PUSH';
  else {
    const upWin = (settleR > entryR && bid.direction === 'UP');
    const downWin = (settleR < entryR && bid.direction === 'DOWN');
    newStatus = (upWin || downWin) ? 'WON' : 'LOST';
  }

  // do atomic update: set settledAt, settlePrice, status, increment version; credit user on win; refund on push
  await prisma.$transaction(async (tx) => {
    // re-read inside tx
    const fresh = await tx.bid.findUnique({ where: { id: bidId }});
    if (!fresh) throw new Error('bid vanished');
    if (fresh.status !== 'OPEN' && fresh.status !== 'PENDING_SETTLEMENT') {
      // already settled by something else
      return;
    }

    // apply settlement
    const updates = {
      settlePrice,
      status: newStatus,
      settledAt: new Date(),
      version: { increment: 1 }
    };

    await tx.bid.update({ where: { id: bidId }, data: updates });

    // update user balance according to outcome
    const user = await tx.user.findUnique({ where: { id: fresh.userId }});
    if (!user) throw new Error('user missing');

    if (newStatus === 'WON') {
      // payout: simple 2x stake (example). Real odds = 1:1 for this assignment; we'll credit stake*2
      const payout = fresh.amount_cents * 2;
      await tx.user.update({ where: { id: user.id }, data: { balance_cents: user.balance_cents + payout }});
    } else if (newStatus === 'PUSH') {
      // refund stake
      await tx.user.update({ where: { id: user.id }, data: { balance_cents: user.balance_cents + fresh.amount_cents }});
    }
    // LOST -> nothing
    await tx.auditLog.create({ data: { bidId, type: 'SETTLED', payload: JSON.stringify({ settlePrice, raw: priceResp.raw }) }});
  });
}

async function sweepAndEnqueueDue(prismaClient) {
  const due = await prismaClient.bid.findMany({
    where: {
      status: 'OPEN',
      settleAt: { lte: new Date() }
    }
  });
  for (const b of due) enqueueSettlement(b.id, b.settleAt);
  // also enqueue PENDING_SETTLEMENT older than 10s so admin can see; but leave them for admin
}

function startSettlementWorker(prismaClient) {
  console.log('Starting settlement worker (in-memory queue + DB sweep)');
  // initial sweep
  sweepAndEnqueueDue(prismaClient).catch(console.error);
  // periodic sweep in case of restart / missed timers
  setInterval(() => sweepAndEnqueueDue(prismaClient).catch(console.error), 5000);
}

module.exports = { enqueueSettlement, settleNow, startSettlementWorker };
