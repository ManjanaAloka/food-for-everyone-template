// Environment configuration
export const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || API.replace('/api', '');
export const GOOGLE_MAPS_API_KEY = 'AIzaSyBrLCNjte2IjHTRuDn-SYQMLqH56QGAxCM';