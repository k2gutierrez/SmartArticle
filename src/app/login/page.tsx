'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Layers, Mail, Lock, Loader2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Nuevo estado para el nombre
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // REGISTRO
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, // Enviamos el nombre a metadata
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) alert(error.message);
      else alert("¡Cuenta creada! Revisa tu email para confirmar tu suscripción.");
    } else {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else router.push('/editor');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6 text-[#2D3436]">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="text-center space-y-2">
          <div className="flex justify-center text-[#5D737E] mb-4">
            <Layers size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">OMNIA</h1>
          <p className="text-slate-400">{isSignUp ? 'Crea tu cuenta de autor' : 'Bienvenido de nuevo'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#5D737E]/20 transition-all"
                  placeholder="Ej. Juan Delgado"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="email" required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="password" required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D3436] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#5D737E] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "Crear Cuenta" : "Entrar")}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-slate-400 hover:text-[#5D737E] font-medium transition-colors"
          >
            {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>
      </div>
    </div>
  );
}