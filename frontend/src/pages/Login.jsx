// import React, { useState } from "react";
// import { login } from "../services/api";
// import { useNavigate } from "react-router-dom";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [msg, setMsg] = useState("");
//   const navigate = useNavigate();

//   async function submit(e) {
//     e.preventDefault();
//     try {
//       const res = await login(email, password);
//       localStorage.setItem("token", res.data.token);
//       setMsg("Login successful!");
//       setTimeout(() => navigate("/place-bid"), 1000);
//     } catch (err) {
//       setMsg(err.response?.data?.error || "Error");
//     }
//   }

//   return (
//     <form onSubmit={submit}>
//       <h2>Login</h2>
//       <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
//       <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
//       <button type="submit">Login</button>
//       <div>{msg}</div>
//     </form>
//   );
// }
import React from 'react';
import { login } from '../services/api';

export default function Login({ onAuth, onGotoSignup }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [msg, setMsg] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setMsg('Email and password are required');

    try {
      setMsg('Logging in...');
      const r = await login(email, password);
      const token = r.data.token;
      localStorage.setItem('token', token);
      setMsg('Login successful!');
      onAuth?.(token);
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Login</h2>
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
        <button type="submit" style={{ padding: 8 }}>Login</button>
      </form>
      <p style={{ marginTop: 8 }}>
        Don't have an account? <button onClick={onGotoSignup} style={{ textDecoration: 'underline', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Signup</button>
      </p>
      {msg && <p>{msg}</p>}
    </div>
  );
}
