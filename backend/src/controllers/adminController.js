const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { settleNow } = require('../services/settlementWorker');

async function manualSettle(req, res) {
  const bidId = req.params.id;
  const bid = await prisma.bid.findUnique({ where: { id: bidId }});
  if (!bid) return res.status(404).json({ error: 'Not found' });
  if (bid.status !== 'PENDING_SETTLEMENT' && bid.status !== 'OPEN') {
    return res.status(400).json({ error: 'Not pending' });
  }
  // attempt immediate settlement (settleNow handles fetch and DB updates)
  await settleNow(bidId);
  const updated = await prisma.bid.findUnique({ where: { id: bidId }, include: { auditLogs: true }});
  return res.json({ bid: updated });
}

async function listPendingBids(req, res) {
  const bids = await prisma.bid.findMany({
    where: {
      status: { in: ['OPEN', 'PENDING_SETTLEMENT'] }
    },
    orderBy: { createdAt: 'desc' },
    include: { auditLogs: true, user: true }
  });
  return res.json({ bids });
}

module.exports = { manualSettle,listPendingBids };
