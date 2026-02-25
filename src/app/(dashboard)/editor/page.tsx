'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  Sparkles, ChevronLeft, Save, Type, Wand2,
  History, Loader2, BrainCircuit, Layers
} from 'lucide-react';

export default function OmniaEditor() {
  const router = useRouter();
  const supabase = createClient();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // Estados para versiones de IA
  const [aiLinkedInVersion, setAiLinkedInVersion] = useState('');
  const [aiTwitterVersion, setAiTwitterVersion] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState('');

  // 1. Cargar el perfil del usuario al entrar
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  // 2. Función Mágica: Generar versiones Multicanal
  const handleMagicGeneration = async () => {
    if (!content) return alert("Escribe algo primero");
    setIsProcessing(true);
    setCurrentAction('Generando versiones...');

    try {
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          mode: 'simulate',
          userStyleContext: profile?.writing_style_context
        }),
      });

      const data = await response.json();
      setContent(data.blog);
      setAiLinkedInVersion(data.linkedIn);
      setAiTwitterVersion(data.twitter);
      alert("¡Versiones de LinkedIn y X generadas con éxito!");
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
      setCurrentAction('');
    }
  };

  // 3. Función de Publicar: Guardar en Supabase
  const handlePublish = async () => {
    // Validación básica: al menos necesitamos título y el contenido principal
    if (!content || !title) {
      alert("Por favor, asegúrate de tener un título y contenido para tu artículo.");
      return;
    }

    setIsProcessing(true);
    setCurrentAction('Guardando en Supabase...');

    try {
      // 1. Obtener la sesión del usuario actual
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Debes iniciar sesión para publicar.");
        router.push('/login');
        return;
      }

      // 2. Insertar el artículo con todas sus variantes generadas por la IA
      const { data, error } = await supabase
        .from('articles')
        .insert([
          {
            user_id: user.id,
            title: title,
            content_original: content,           // El post del Blog/Web
            content_linkedin: aiLinkedInVersion,   // Generado por la IA
            content_twitter_thread: aiTwitterVersion, // Generado por la IA
            status: 'published',
            published_at: new Date().toISOString(),
          }
        ])
        .select();

      if (error) throw error;

      // 3. Éxito: Redirigir a la página de éxito pasando las versiones por URL (base64)
      // Esto es para que la página de éxito pueda mostrar los botones de compartir sin volver a consultar la DB
      const liEncoded = btoa(unescape(encodeURIComponent(aiLinkedInVersion || '')));
      const xEncoded = btoa(unescape(encodeURIComponent(aiTwitterVersion || '')));

      router.push(`/editor/success?li=${liEncoded}&x=${xEncoded}`);

    } catch (error: any) {
      console.error("Error detallado:", error);
      alert(`Error al publicar: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setCurrentAction('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#2D3436]">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
            <input
              type="text" placeholder="Título del artículo..."
              className="text-lg font-bold outline-none bg-transparent w-64 md:w-96"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handlePublish} disabled={isProcessing} className="bg-[#2D3436] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#5D737E] flex items-center gap-2">
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : "Publicar"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-4">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 min-h-[60vh]">
            <textarea
              className="w-full h-full min-h-[50vh] text-xl outline-none resize-none bg-transparent leading-relaxed"
              placeholder="Escribe tu artículo..."
              value={content} onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-[#5D737E] font-bold italic"><BrainCircuit size={20} /> OMNIA AI</div>
            <button
              onClick={handleMagicGeneration}
              disabled={isProcessing}
              className="w-full flex items-center justify-between px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-[#5D737E] transition-all group"
            >
              <span className="font-bold text-sm">Omni-Generar</span>
              {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-[#A2AD91]" />}
            </button>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center">Genera posts para LinkedIn y X automáticamente</p>
          </div>
        </aside>
      </main>
    </div>
  );
}