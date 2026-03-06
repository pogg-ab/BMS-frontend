import axios from 'axios';

const env: any = (import.meta as any).env || {}
const api = axios.create({
  baseURL: env.VITE_API_BASE_URL || 'http://localhost:2546',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Request logging (development) & 401 handling
api.interceptors.request.use((config) => {
  // eslint-disable-next-line no-console
  console.log('[API Request]', config.method, config.url, config.headers?.Authorization ? 'Authorization-set' : 'no-auth');
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // eslint-disable-next-line no-console
    console.error('[API Error]', err?.response?.status, err?.response?.data);
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      // redirect to login to force re-auth
      try { window.location.href = '/login'; } catch (e) { /* ignore */ }
    }
    return Promise.reject(err);
  }
);
