// import React from 'react';
// import { listBids } from '../services/api';

// export default function MyBids(){
//   const [bids, setBids] = React.useState([]);
//   const token = localStorage.getItem('token');

//   React.useEffect(()=>{
//     async function load(){ 
//       const r = await listBids(token);
//       setBids(r.data.bids || []);
//     }
//     load().catch(console.error);
//   }, []);

//   return (
//     <div>
//       <h2>My Bids</h2>
//       <ul>
//         {bids.map(b => (
//           <li key={b.id}>
//             {b.direction} {b.amount_cents}c — {b.status} — entry {b.entryPrice} — settleAt {new Date(b.settleAt).toLocaleTimeString()}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
import React from 'react';
import { listBids } from '../services/api';

export default function MyBids({ token }) {
  const [bids, setBids] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const r = await listBids(token);
        setBids(r.data.bids || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <div>Loading bids...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>My Bids</h2>
      {bids.length === 0 ? (
        <p>No bids placed yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Direction</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Entry Price</th>
              <th style={thStyle}>Settle Price</th>
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
                <td style={tdStyle}>{b.settlePrice || '-'}</td>
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
