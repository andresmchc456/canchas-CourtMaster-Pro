import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Solicitud: Inyecta el token Bearer si existe en localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('courtmaster_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: Maneja tokens expirados o accesos no autorizados
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si la sesión expiró o es inválida, limpiamos storage y redireccionamos al login
      localStorage.removeItem('courtmaster_token');
      localStorage.removeItem('courtmaster_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

