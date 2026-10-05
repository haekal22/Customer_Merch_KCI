import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/customer',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor untuk menambahkan Bearer token dari LocalStorage
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;