import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  getNonce: (walletAddress: string) =>
    api.post('/auth/nonce', { walletAddress }),
  
  verify: (walletAddress: string, signature: string, message: string) =>
    api.post('/auth/verify', { walletAddress, signature, message }),
};

export const usernameApi = {
  check: (username: string) =>
    api.get(`/username/check/${username}`),
  
  register: (username: string) =>
    api.post('/username/register', { username }),
  
  resolve: (username: string) =>
    api.get(`/username/resolve/${username}`),
};

export const paymentApi = {
  create: (data: any) =>
    api.post('/payment/create', data),
  
  getRoute: (params: any) =>
    api.get('/payment/route', { params }),
  
  getHistory: () =>
    api.get('/payment/history'),
  
  getById: (id: string) =>
    api.get(`/payment/${id}`),
};

export default api;
