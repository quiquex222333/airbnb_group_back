import React, { useState } from 'react';
import { Mail, Lock, LogIn, PlaneTakeoff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../features/auth/api';
import { useAuthStore } from '../features/auth/store';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setCredentials = useAuthStore(state => state.setCredentials);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      setCredentials(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image Native with V4 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop')" }}
      >
        {/* Dark overlay specifically for aesthetics */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Glassmorphism Container */}
      <div className="z-10 w-full max-w-md glass-panel rounded-3xl p-8 transform transition-all hover:scale-[1.01] duration-500">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <PlaneTakeoff className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bienvenido de nuevo</h1>
          <p className="text-gray-500 mt-2 text-sm">Reserva estancias increíbles u ofrece tu espacio.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none"
                placeholder="tu@correo.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 px-4 flex items-center justify-center bg-primary hover:bg-red-500 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <LogIn className="w-5 h-5 mr-2" /> Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          ¿No tienes una cuenta? <a href="/register" className="text-primary font-semibold hover:underline">Regístrate</a>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
