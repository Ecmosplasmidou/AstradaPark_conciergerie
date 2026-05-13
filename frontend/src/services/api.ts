import axios from 'axios';

const api = axios.create({
  // Utilise automatiquement le backend Render en production, et localhost en développement
  baseURL: import.meta.env.PROD 
    ? 'https://astradapark-conciergerie.onrender.com'
    : 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;