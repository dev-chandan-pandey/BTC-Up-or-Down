// import { useState } from "react";
// import { signup } from "../services/api";
// import { useNavigate } from "react-router-dom";

// export default function Signup() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [msg, setMsg] = useState("");
//   const navigate = useNavigate();

//   async function submit(e) {
//     e.preventDefault();
//     try {
//       await signup(email, password);
//       setMsg("Signup successful! Please login.");
//       setTimeout(() => navigate("/login"), 1000);
//     } catch (err) {
//       setMsg(err.response?.data?.error || "Error");
//     }
//   }

//   return (
//     <form onSubmit={submit}>
//       <h2>Signup</h2>
//       <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
//       <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
//       <button type="submit">Signup</button>
//       <div>{msg}</div>
//     </form>
//   );
// }
import React from 'react';
import { signup } from '../services/api';

export default function Signup({ onGotoLogin }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [msg, setMsg] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setMsg('Email and password are required');
    try {
      setMsg('Signing up...');
      await signup(email, password);
      setMsg('Signup successful! You can now login.');
      setEmail('');
      setPassword('');
      onGotoLogin?.();
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>Signup</button>
      </form>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
