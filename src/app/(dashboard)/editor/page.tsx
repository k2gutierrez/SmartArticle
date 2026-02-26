'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  Sparkles, ChevronLeft, Save, Type, Wand2,
  Loader2, BrainCircuit, Target, Send, Copy
} from 'lucide-react';

export default function OmniaEditor() {
  const router = useRouter();
  const supabase = createClient();

  // Estados de contenido
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [promptIdea, setPromptIdea] = useState('');
  const [goal, setGoal] = useState('educar');
  const [length, setLength] = useState('medio'); // corto | medio | largo

  // Estados de perfil y versiones sociales
  const [profile, setProfile] = useState<any>(null);
  const [aiLinkedInVersion, setAiLinkedInVersion] = useState('');
  const [aiTwitterVersion, setAiTwitterVersion] = useState('');

  // Estados de carga
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState('');

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const articleId = searchParams?.get('id');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (articleId) {
      loadArticle(articleId);
    }
  }, [articleId]);

  const loadArticle = async (id: string) => {
    setIsProcessing(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setTitle(data.title);
      setContent(data.content_original);
      setAiLinkedInVersion(data.content_linkedin || '');
      setAiTwitterVersion(data.content_twitter_thread || '');
    }
    setIsProcessing(false);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
  };

  const handleAIGeneration = async (mode: 'generate' | 'correct') => {
    const input = mode === 'generate' ? promptIdea : content;
    if (!input) return alert("Por favor, ingresa una idea o escribe algo primero.");

    setIsProcessing(true);
    setCurrentAction(mode === 'generate' ? 'Redactando con tu estilo...' : 'Puliendo tu texto...');

    try {
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: input,
          mode: mode,
          goal: goal,
          length: length,
          userStyleContext: profile?.writing_style_context
        }),
      });

      const data = await response.json();

      if (response.ok && data.blog) {
        setContent(data.blog);
        setAiLinkedInVersion(data.linkedIn || '');
        setAiTwitterVersion(data.twitter || '');
        if (mode === 'generate') setPromptIdea('');
      } else {
        throw new Error(data.error || "La IA no pudo estructurar el contenido.");
      }

    } catch (error: any) {
      console.error("Error en la generación:", error);
      alert(`Aviso de OMNIA: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setCurrentAction('');
    }
  };

  const handlePublish = async () => {
    if (!content || !title) return alert("Falta título o contenido para publicar.");
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Generar el slug para la URL pública
      const articleSlug = title.toLowerCase().trim()
        .replace(/\s+/g, '-')           // Reemplaza espacios por guiones
        .replace(/[^\w\-]+/g, '')       // Elimina caracteres especiales
        .replace(/\-\-+/g, '-');        // Evita guiones dobles

      const articleData = {
        user_id: user?.id,
        title: title,
        article_slug: articleSlug,
        content_original: content,
        content_linkedin: aiLinkedInVersion,
        content_twitter_thread: aiTwitterVersion,
        status: 'published'
      };

      let error;

      if (articleId) {
        // MODO EDICIÓN: Actualizar el artículo existente
        const { error: updateError } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', articleId);
        error = updateError;
      } else {
        // MODO NUEVO: Insertar un nuevo registro
        const { error: insertError } = await supabase
          .from('articles')
          .insert([articleData]);
        error = insertError;
      }

      if (error) throw error;

      // 2. Codificación para la redirección a la página de éxito
      const encodeText = (text: string) => btoa(encodeURIComponent(text));
      const liParam = encodeText(aiLinkedInVersion || '');
      const xParam = encodeText(aiTwitterVersion || '');

      // 3. Redirección
      router.push(`/editor/success?li=${liParam}&x=${xParam}`);

    } catch (error: any) {
      console.error("Error al publicar:", error);
      alert("Error al guardar en la base de datos: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#2D3436] pb-20">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Título de tu pieza de autoridad..."
              className="text-2xl font-black outline-none bg-transparent w-full placeholder:text-slate-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <button
            onClick={handlePublish}
            disabled={isProcessing}
            className="..."
          >
            {isProcessing && currentAction === '' ? (
              <><Loader2 className="animate-spin" size={18} /> Guardando...</>
            ) : (
              articleId ? "Guardar Cambios" : "Publicar Ahora"
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#E9EDEC] p-6 rounded-[2.5rem] border border-[#A2AD91]/20 shadow-inner">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-[#5D737E] font-bold text-sm ml-2">
                  <BrainCircuit size={18} /> ¿Qué quieres comunicar hoy?
                </div>
                <input
                  type="text"
                  placeholder="Escribe una idea simple: 'El futuro del Real Estate en 2026'..."
                  className="w-full p-4 bg-white rounded-2xl outline-none shadow-sm text-sm border-none"
                  value={promptIdea}
                  onChange={(e) => setPromptIdea(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#5D737E] font-bold text-sm ml-2">
                  <Target size={18} /> Objetivo
                </div>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full p-4 bg-white rounded-2xl outline-none shadow-sm text-sm border-none font-bold text-[#5D737E] appearance-none cursor-pointer"
                >
                  <option value="educar">Educar / Enseñar</option>
                  <option value="vender">Vender / Convencer</option>
                  <option value="inspirar">Inspirar / Motivar</option>
                </select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#5D737E] font-bold text-sm ml-2">
                  <Type size={18} /> Extensión
                </div>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full p-4 bg-white rounded-2xl outline-none shadow-sm text-sm border-none font-bold text-[#5D737E] appearance-none cursor-pointer"
                >
                  <option value="corto">Corto (~300 palabras)</option>
                  <option value="medio">Estándar (~600 palabras)</option>
                  <option value="largo">Profundo (+1,000 palabras)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => handleAIGeneration('generate')}
                  disabled={isProcessing}
                  className="h-[52px] bg-[#5D737E] text-white px-6 rounded-2xl font-bold hover:bg-[#2D3436] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isProcessing && currentAction.includes('Redactando') ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <><Sparkles size={18} /> Redactar</>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 min-h-[60vh] relative">
            <textarea
              className="w-full h-full min-h-[55vh] text-xl outline-none resize-none bg-transparent leading-relaxed placeholder:text-slate-100"
              placeholder="El lienzo es tuyo... o deja que la IA redacte por ti arriba."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Refinar texto</h3>
            <button
              onClick={() => handleAIGeneration('correct')}
              disabled={isProcessing || !content}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-[#F4F5F2] transition-all group border border-transparent hover:border-[#A2AD91]/30 disabled:opacity-50"
            >
              <div className="flex items-center gap-3 font-bold text-sm">
                <Wand2 size={18} className="text-[#5D737E]" />
                {isProcessing && currentAction.includes('Puliendo') ? "Procesando..." : "Pulir Estilo"}
              </div>
            </button>

            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 text-center tracking-tighter">Versiones Sociales Listas</p>
              <div className="flex flex-col gap-2">
                <div className={`p-3 rounded-xl text-xs font-medium border transition-colors ${aiLinkedInVersion ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                  LinkedIn: {aiLinkedInVersion ? 'Generado ✓' : 'Pendiente'}
                </div>
                <div className={`p-3 rounded-xl text-xs font-medium border transition-colors ${aiTwitterVersion ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                  X (Twitter): {aiTwitterVersion ? 'Generado ✓' : 'Pendiente'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#2D3436] p-6 rounded-[2.5rem] text-white space-y-2 shadow-xl">
            <p className="text-xs font-bold text-[#A2AD91] uppercase tracking-widest">Tip de Autoridad</p>
            <p className="text-sm leading-relaxed opacity-80 italic">"La consistencia es más importante que la perfección. Publica hoy."</p>
          </div>
        </aside>
      </main>
    </div>
  );
}