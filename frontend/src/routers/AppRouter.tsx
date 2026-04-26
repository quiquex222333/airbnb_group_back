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

const DashboardDummy = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-primary">{user?.name?.charAt(0).toUpperCase()}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hola, {user?.name}</h1>
        <p className="text-gray-500 mb-6 flex flex-col gap-1">
          <span>{user?.email}</span>
          <span className="inline-block mx-auto mt-2 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wider rounded-full">
            Rol: {user?.role}
          </span>
        </p>
        <button 
          onClick={handleLogout}
          className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

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
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        
        {/* Rutas Privadas / Principal */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardDummy />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
