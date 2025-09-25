const fetch = require('node-fetch');
const { hashString } = require('../utils/cryptoHash');

/**
 * Fetch price from Coinbase public endpoint.
 * Returns { ok: true, price: "12345.67", raw: <string> }
 * If failure but retriable: returns { ok:false, pending:true }
 */
async function fetchPriceOnce() {
  try {
    // Coinbase spot price endpoint
    const url = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
    const r = await fetch(url, { timeout: 5000 });
    if (!r.ok) throw new Error('non-200');
    const data = await r.json();
    // Coinbase provides data.amount as a string
    const price = data?.data?.amount;
    const raw = JSON.stringify(data);
    return { ok: true, price, raw, hash: hashString(raw) };
  } catch (err) {
    return { ok: false, error: err.message || 'fetch-fail' };
  }
}

/**
 * Try up to 3 times within ~10s total. If success -> {ok:true, price, raw}
 * If all failed -> {ok:false, pending:true}
 */
async function fetchPriceWithRetry() {
  const maxAttempts = 3;
  const retries = [0, 3000, 6000]; // attempt times 0ms, 3s, 6s
  let lastErr;
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, retries[i]));
    const result = await fetchPriceOnce();
    if (result.ok) return { ok: true, price: result.price, raw: result.raw, hash: result.hash };
    lastErr = result.error;
  }
  // mark pending settlement: admin will settle later
  return { ok: false, pending: true, error: lastErr };
}

module.exports = { fetchPriceWithRetry, fetchPriceOnce };
