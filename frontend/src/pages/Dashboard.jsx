import React from 'react';
import { me, listBids } from '../services/api';

export default function Dashboard({ token }) {
  const [balance, setBalance] = React.useState(null);
  const [bids, setBids] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const rMe = await me(token);
        setBalance(rMe.data.balance);

        const rBids = await listBids(token, undefined, 1, 10);
        setBids(rBids.data.bids || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>Dashboard</h2>
      <div style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, marginBottom: 16 }}>
        <strong>Balance:</strong> {balance != null ? `$${(balance / 100).toFixed(2)}` : 'N/A'}
      </div>

      <h3>Last 10 Bids</h3>
      {bids.length === 0 ? (
        <p>No bids yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Direction</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Entry Price</th>
              <th style={thStyle}>Settle At</th>
              <th style={thStyle}>Price Source</th>
            </tr>
          </thead>
          <tbody>
            {bids.map(b => (
              <tr key={b.id}>
                <td style={tdStyle}>{b.direction}</td>
                <td style={tdStyle}>{b.amount_cents}c</td>
                <td style={tdStyle}>{b.status}</td>
                <td style={tdStyle}>{b.entryPrice}</td>
                <td style={tdStyle}>{new Date(b.settleAt).toLocaleTimeString()}</td>
                <td style={tdStyle}>{b.priceSource || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = { borderBottom: '1px solid #999', textAlign: 'left', padding: '4px 8px' };
const tdStyle = { borderBottom: '1px solid #eee', padding: '4px 8px' };
