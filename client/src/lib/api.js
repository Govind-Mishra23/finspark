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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || '';

    if (error.response?.status === 403 && /invalid or inactive api key/i.test(message)) {
      localStorage.removeItem('insightx_auth');
      window.dispatchEvent(new Event('insightx_auth_invalid'));
    }

    return Promise.reject(error);
  },
);

export default api;
