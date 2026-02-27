import api from '../api/axios';

export async function login(username: string, password: string) {
  const payload: any = { password };
  // Some backends expect `email` instead of `username`.
  // If the identifier looks like an email, send it as `email`, otherwise send as `username`.
  if (typeof username === 'string' && username.includes('@')) payload.email = username;
  else payload.username = username;

  const res = await api.post('/auth/login', payload);
  // backend may return token in different fields: token, accessToken, access_token
  let token: any = res.data?.token || res.data?.accessToken || res.data?.access_token || null;
  // some APIs wrap token directly as the response string
  if (!token && typeof res.data === 'string') token = res.data;
  if (!token && res.data && typeof res.data === 'object') {
    // try to find first string value
    const vals = Object.values(res.data).filter(v => typeof v === 'string');
    if (vals.length > 0) token = vals[0];
  }

  if (token) {
    localStorage.setItem('token', token);
    // helpful debug log during development
    // eslint-disable-next-line no-console
    console.log('Saved token:', token?.slice ? token.slice(0, 40) + '...' : token);
  }
  return token;
}

export function logout() {
  localStorage.removeItem('token');
}

export function getToken() {
  return localStorage.getItem('token');
}

export async function getProfile() {
  const res = await api.get('/auth/profile');
  return res.data;
}

export async function getLoginHistory() {
  const res = await api.get('/auth/login-history');
  return res.data;
}
