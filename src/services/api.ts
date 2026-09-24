import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_NAME || `http://${window.location.hostname}:3001/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if ((error.response?.status === 401 || error.response?.status === 403) && !error.config?.url?.includes('/LoginUser')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;