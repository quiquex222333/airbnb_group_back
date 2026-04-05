import { apiClient } from './api';
import { useAuthStore } from './store';

// Set up response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si arroja 401 y no hemos re-intentado ya (para evitar bucle infinito)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Llamada silenciosa al BFF para refrescar cookie HTTPOnly
        const res = await axios.post('http://localhost:3000/api/v1/auth/refresh', {}, {
          withCredentials: true 
        });

        const newAccessToken = res.data.accessToken;
        const user = res.data.user;

        // Actualiza el store de Zustand para que la app reaccione
        useAuthStore.getState().setCredentials(user, newAccessToken);

        // Cambia el header de la petición que falló y la vuelve a despachar
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        // Si el refresh también falla, lo sacamos del sistema
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Set up request interceptor para inyectar Access Token siempre
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

import axios from 'axios';
