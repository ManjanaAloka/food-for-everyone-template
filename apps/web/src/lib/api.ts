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
