import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3000' });

export async function signup(email, password){ return API.post('/auth/signup', { email, password }); }
export async function login(email, password){ return API.post('/auth/login', { email, password }); }
export async function me(token){ return API.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }); }
export async function placeBid(token, amount, direction, idempotencyKey){ 
  return API.post('/bids', { amount, direction,idempotencyKey }, { headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': idempotencyKey }});
}
export async function listBids(token, status, page=1, limit=20){ 
  return API.get('/bids', { params: { status, page, limit }, headers: { Authorization: `Bearer ${token}` }});
}
