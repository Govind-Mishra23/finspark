import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const saved = localStorage.getItem('insightx_auth');
  if (saved) {
    try {
      const auth = JSON.parse(saved);
      if (auth.apiKey) {
        config.headers['x-api-key'] = auth.apiKey;
      }
      if (auth.role === 'admin') {
        config.headers['x-admin-key'] = auth.apiKey;
      }
    } catch (e) {}
  }
  return config;
});

export default api;
