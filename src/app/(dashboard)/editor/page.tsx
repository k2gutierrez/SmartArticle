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
  const [goal, setGoal] = useState('educar'); // vender | inspirar | educar
  
  // Estados de perfil y versiones sociales
  const [profile, setProfile] = useState<any>(null);
  const [aiLinkedInVersion, setAiLinkedInVersion] = useState('');
  const [aiTwitterVersion, setAiTwitterVersion] = useState('');
  
  // Estados de carga
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
  };

  // Función para Generar desde Cero (Ghostwriter Mode) o Corregir
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
          goal: goal, // Enviamos el objetivo a la IA
          userStyleContext: profile?.writing_style_context 
        }),
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      setContent(data.blog);
      setAiLinkedInVersion(data.linkedIn);
      setAiTwitterVersion(data.twitter);
      
      if (mode === 'generate') setPromptIdea(''); // Limpiamos la idea tras generar
      
    } catch (error) {
      console.error(error);
      alert("Hubo un error con la IA. Revisa tu API Key de OpenAI.");
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
      const { error } = await supabase.from('articles').insert([{
        user_id: user?.id,
        title: title,
        content_original: content,
        content_linkedin: aiLinkedInVersion,
        content_twitter_thread: aiTwitterVersion,
        status: 'published'
      }]);

      if (error) throw error;
      
      // Codificamos para pasar a la página de éxito
      // const liEncoded = btoa(encodeURIComponent(aiLinkedInVersion || ''));
      // const xEncoded = btoa(encodeURIComponent(aiTwitterVersion || ''));
      
      // router.push(`/editor/success?li=${liEncoded}&x=${xEncoded}`);

      const liEncoded = btoa(encodeURIComponent(aiLinkedInVersion));
      const xEncoded = btoa(encodeURIComponent(aiTwitterVersion));
      router.push(`/editor/success?li=${liEncoded}&x=${xEncoded}`);
    } catch (error) {
      alert("Error al guardar en la base de datos.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#2D3436] pb-20">
      {/* Header Superior */}
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
            className="bg-[#2D3436] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#5D737E] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isProcessing && currentAction === '' ? <Loader2 className="animate-spin" size={18}/> : "Publicar Ahora"}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Lado Izquierdo: Herramientas y Lienzo */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Módulo Ghostwriter (Generación por Idea) */}
          <div className="bg-[#E9EDEC] p-6 rounded-[2.5rem] border border-[#A2AD91]/20 shadow-inner">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-[#5D737E] font-bold text-sm ml-2">
                  <BrainCircuit size={18} /> ¿Qué quieres comunicar hoy?
                </div>
                <input 
                  type="text"
                  placeholder="Escribe una idea simple: 'Los beneficios de la meditación en CEOs'..."
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
              <div className="flex items-end">
                <button 
                  onClick={() => handleAIGeneration('generate')}
                  disabled={isProcessing}
                  className="h-[52px] bg-[#5D737E] text-white px-6 rounded-2xl font-bold hover:bg-[#2D3436] transition-all flex items-center gap-2 shadow-md"
                >
                  {isProcessing && currentAction.includes('Redactando') ? <Loader2 className="animate-spin" /> : <><Sparkles size={18}/> Redactar</>}
                </button>
              </div>
            </div>
          </div>

          {/* Área del Editor Principal */}
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 min-h-[60vh] relative">
            <textarea 
              className="w-full h-full min-h-[55vh] text-xl outline-none resize-none bg-transparent leading-relaxed placeholder:text-slate-100"
              placeholder="El lienzo es tuyo... o deja que la IA redacte por ti arriba."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        {/* Lado Derecho: Acciones de Refinamiento */}
        <aside className="space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Refinar texto</h3>
            
            <button 
              onClick={() => handleAIGeneration('correct')}
              disabled={isProcessing || !content}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-[#F4F5F2] transition-all group border border-transparent hover:border-[#A2AD91]/30"
            >
              <div className="flex items-center gap-3 font-bold text-sm">
                <Wand2 size={18} className="text-[#5D737E]" />
                Pulir Estilo
              </div>
            </button>

            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 text-center tracking-tighter">Versiones Sociales Listas</p>
              <div className="flex flex-col gap-2">
                <div className={`p-3 rounded-xl text-xs font-medium border ${aiLinkedInVersion ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                   LinkedIn: {aiLinkedInVersion ? 'Generado ✓' : 'Pendiente'}
                </div>
                <div className={`p-3 rounded-xl text-xs font-medium border ${aiTwitterVersion ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
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