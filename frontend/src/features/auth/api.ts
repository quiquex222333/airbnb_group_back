import axios from 'axios';

// Instancia base de Axios para comunicarse con el Backend
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // ¡CRÍTICO! Esto asegura que enviemos Cookies (Refresh Token) en cada petición cruzada.
  withCredentials: true,
});
