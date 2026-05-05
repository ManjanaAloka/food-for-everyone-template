import axios from 'axios';
import { API } from '../env';
let accessToken: string | null = null;

export const api = axios.create({ baseURL: API, withCredentials: true });

// Request interceptor to ensure token is always attached
api.interceptors.request.use((config) => {
  // Get token from localStorage as backup
  const token = accessToken || localStorage.getItem('accessToken');
  console.log('🔍 API Request:', config.url, 'Token:', token ? '✅ Present' : '❌ Missing');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ 401 Unauthorized received. Clearing token and reloading.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      accessToken = null;
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('accessToken');
  }
}
