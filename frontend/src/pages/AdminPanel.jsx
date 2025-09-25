import React from 'react';
import axios from 'axios';

export default function AdminPanel({ token }) {
  const [bids, setBids] = React.useState([]);
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const r = await axios.get('https://btc-up-or-down.onrender.com/bids', {
        params: { status: 'PENDING_SETTLEMENT' },
        headers: { Authorization: `Bearer ${token}` }
      });
//       const r = await axios.get('http://localhost:3000/admin/pending-bids', {
//   headers: { Authorization: `Bearer ${token}` }
// });
//  console.log(r,"r")
      setBids(r.data.bids || []);
    } catch (err) {
      console.error(err);
      setMsg('Error fetching pending bids: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const settleBid = async (bidId) => {
    try {
      setMsg('Settling bid ' + bidId + '...');
      await axios.post(`https://btc-up-or-down.onrender.com/admin/settle/${bidId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Bid ' + bidId + ' settled successfully!');
      fetchPending();
    } catch (err) {
      console.error(err);
      setMsg('Error settling bid: ' + (err.response?.data?.error || err.message));
    }
  };

  React.useEffect(() => { fetchPending(); }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>Admin Panel — Manual Settlement</h2>
      {loading && <p>Loading...</p>}
      {msg && <p>{msg}</p>}
      {bids.length === 0 && !loading ? (
        <p>No pending settlements.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Bid ID</th>
              <th style={thStyle}>User ID</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Direction</th>
              <th style={thStyle}>Entry Price</th>
              <th style={thStyle}>Settle At</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bids.map(b => (
              <tr key={b.id}>
                <td style={tdStyle}>{b.id}</td>
                <td style={tdStyle}>{b.userId}</td>
                <td style={tdStyle}>{b.amount_cents}c</td>
                <td style={tdStyle}>{b.direction}</td>
                <td style={tdStyle}>{b.entryPrice}</td>
                <td style={tdStyle}>{new Date(b.settleAt).toLocaleTimeString()}</td>
                <td style={tdStyle}>
                  <button onClick={() => settleBid(b.id)}>Settle</button>
                </td>
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
