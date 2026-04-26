import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store';
import { apiClient } from '../features/auth/api';
import { Loader2, PlaneTakeoff } from 'lucide-react';
import LoginScreen from '../pages/LoginScreen';
import RegisterScreen from '../pages/RegisterScreen';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

import HomeScreen from '../pages/HomeScreen';
import DashboardScreen from '../pages/DashboardScreen';

export const AppRouter = () => {
  const [isChecking, setIsChecking] = useState(true);
  const setCredentials = useAuthStore(state => state.setCredentials);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Intentamos recuperar sesión con la Cookie HttpOnly
        const res = await apiClient.post('/auth/refresh');
        setCredentials(res.data.user, res.data.accessToken);
      } catch (err) {
        console.log("No active session found");
      } finally {
        setIsChecking(false);
      }
    };
    initAuth();
  }, [setCredentials]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <PlaneTakeoff className="absolute inset-0 m-auto w-5 h-5 text-primary" />
        </div>
        <p className="mt-4 text-gray-500 font-medium animate-pulse">Iniciando sesión...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública Principal */}
        <Route path="/" element={<HomeScreen />} />

        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        
        {/* Rutas Privadas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardScreen />
          </ProtectedRoute>
        } />

        {/* Fallback a Home en lugar de Login para vista pública */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
