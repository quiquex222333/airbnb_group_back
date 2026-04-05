import React, { useState } from 'react';
import { UserPlus, Mail, Lock, MapPin, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../features/auth/api';
import { useNavigate } from 'react-router-dom';

const RegisterScreen = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'guest' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg({ text: '', type: '' });
    
    if (formData.password !== formData.confirmPassword) {
      setMsg({ text: 'Las contraseñas no coinciden', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await apiClient.post('/auth/register', registerData);
      setMsg({ text: '¡Código de verificación enviado a tu correo!', type: 'success' });
      setIsConfirming(true);
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error?.message || 'Error en validación', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg({ text: '', type: '' });
    try {
      await apiClient.post('/auth/confirm', { email: formData.email, code: confirmCode });
      setMsg({ text: '¡Cuenta confirmada exitosamente! Ya puedes iniciar sesión.', type: 'success' });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error?.message || 'Código inválido o expirado', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=2070&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="z-10 w-full max-w-lg glass-panel rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Crea tu cuenta</h1>
          <p className="text-gray-600 mt-2 text-sm text-center">Únete a nuestra comunidad global de alojamientos.</p>
        </div>

        {msg.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm text-center font-medium transition-all ${msg.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {msg.text}
          </div>
        )}

        {!isConfirming ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setFormData({...formData, role: 'guest'})}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${formData.role === 'guest' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white/50 text-gray-500 hover:bg-white'} `}
            >
              <MapPin className="w-6 h-6" />
              <span className="font-semibold text-sm">Soy Huésped</span>
            </div>
            
            <div 
              onClick={() => setFormData({...formData, role: 'host'})}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${formData.role === 'host' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white/50 text-gray-500 hover:bg-white'} `}
            >
              <User className="w-6 h-6" />
              <span className="font-semibold text-sm">Soy Anfitrión</span>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" required placeholder="Tu Nombre Completo"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="email" required placeholder="tu@correo.com"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input 
                type={showPassword ? "text" : "password"} required placeholder="Contraseña segura (Min. 8 chars, 1 mayúsucla, 1 símbolo)"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input 
                type={showConfirmPassword ? "text" : "password"} required placeholder="Verificiar tu contraseña"
                value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

            <button 
              type="submit" disabled={isLoading}
              className="w-full mt-6 py-3 px-4 flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5 mr-2" /> Crear Cuenta</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-gray-700 mb-4 text-center">Hemos enviado un código seguro de 6 dígitos a <strong>{formData.email}</strong>. Por favor, ingrésalo a continuación.</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" required maxLength={6} placeholder="Código de confirmación (Ej: 123456)"
                value={confirmCode} onChange={e => setConfirmCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-center tracking-widest text-lg font-bold rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <button 
              type="submit" disabled={isLoading || confirmCode.length < 6}
              className="w-full mt-6 py-3 px-4 flex items-center justify-center bg-primary hover:bg-red-500 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Registro'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta? <a href="/login" className="text-gray-900 font-semibold hover:underline">Inicia Sesión</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
