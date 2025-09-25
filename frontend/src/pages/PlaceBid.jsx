import React from 'react';
import { placeBid } from '../services/api';

export default function PlaceBid({ token, onRequireAuth }) {
  const [amount, setAmount] = React.useState(1000);
  const [direction, setDirection] = React.useState('UP');
  const [msg, setMsg] = React.useState('');
  const [confirmData, setConfirmData] = React.useState(null);

  React.useEffect(() => {
    if (!token) onRequireAuth?.();
  }, [token, onRequireAuth]);

  const cryptoRandom = () => Math.random().toString(36).slice(2);

  // Step 1: Fetch entry price and prepare confirm dialog
  async function showConfirm() {
    if (!token) return onRequireAuth?.();

    if (!Number.isFinite(amount) || amount < 10 || amount > 1000000) {
      return setMsg('Amount must be between 10 and 1,000,000 cents');
    }

    try {
      setMsg('Fetching entry price...');
      const idempotencyKey = cryptoRandom();

      // Call backend to lock entry price (backend will return entryPrice and settleAt)
      const r = await placeBid(token, amount, direction, idempotencyKey);

      setConfirmData({
        bidId: r.data.bidId,
        entryPrice: r.data.entryPrice,
        settleAt: r.data.settleAt,
        idempotencyKey
      });

      setMsg('');
    } catch (e) {
      setMsg('Error fetching entry price: ' + (e.response?.data?.error || e.message));
    }
  }

  // Step 2: Confirm bid by placing it
  async function placeConfirmedBid() {
    if (!confirmData) return;
    try {
      setMsg('Placing bid...');
      const r = await placeBid(token, amount, direction, confirmData.idempotencyKey);
      setMsg('Bid placed successfully! ' + JSON.stringify(r.data));
      setConfirmData(null);
    } catch (e) {
      setMsg('Error placing bid: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div style={{ maxWidth: 540 }}>
      <h2>Place Bid</h2>
      <label>
        Amount (cents):
        <input value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ marginLeft: 8, padding: 6 }} />
      </label>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setDirection('UP')} style={{ fontWeight: direction === 'UP' ? 'bold' : 'normal' }}>UP</button>
        <button onClick={() => setDirection('DOWN')} style={{ fontWeight: direction === 'DOWN' ? 'bold' : 'normal', marginLeft: 8 }}>DOWN</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={showConfirm}>Confirm</button>
      </div>

      {confirmData && (
        <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 12, background: '#f9f9f9' }}>
          <h4>Confirm Bid</h4>
          <p>Amount: {amount}c</p>
          <p>Direction: {direction}</p>
          <p>Entry Price: {confirmData.entryPrice}</p>
          <p>Settle At: {new Date(confirmData.settleAt).toLocaleTimeString()}</p>
          <button onClick={placeConfirmedBid}>Place Bid</button>
          <button onClick={() => setConfirmData(null)} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      )}

      <div style={{ marginTop: 12 }}>{msg}</div>
    </div>
  );
}
