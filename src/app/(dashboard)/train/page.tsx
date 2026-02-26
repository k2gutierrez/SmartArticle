'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Send, BookOpen, Trash2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function TrainAI() {
  const [inputText, setInputText] = useState('');
  const [inputs, setInputs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dnaGenerated, setDnaGenerated] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchInputs();
  }, []);

  const fetchInputs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Filtramos explícitamente por user_id por seguridad adicional
    const { data, error } = await supabase
      .from('training_data')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setInputs(data);
  };

  const saveInput = async () => {
    if (!inputText) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión");

      const { error } = await supabase.from('training_data').insert([
        { content: inputText, user_id: user.id }
      ]);

      if (error) throw error;

      setInputText('');
      await fetchInputs();
      alert("Texto agregado a tu base de conocimiento.");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteInput = async (id: string) => {
    setIsDeleting(id);
    try {
      const { error } = await supabase
        .from('training_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInputs(inputs.filter(item => item.id !== id));
    } catch (error: any) {
      alert("No se pudo borrar: " + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  // 2. La función para disparar el análisis
  const handleAnalyzeStyle = async () => {
    setIsAnalyzing(true);
    try {
      const supabase = createClient();

      // 1. Obtenemos la sesión actual directamente del navegador
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No hay sesión activa. Por favor, recarga la página.");
      }

      // 2. Enviamos la petición incluyendo el Token explícitamente
      const response = await fetch('/api/ai/train-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // <--- LA BALA DE PLATA
        }
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error en el servidor");

        setDnaGenerated(true);
        alert("¡Voz clonada con éxito!");
      } else {
        const textError = await response.text();
        throw new Error("El servidor no respondió correctamente.");
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black text-[#2D3436] flex items-center gap-3">
              <Brain className="text-[#5D737E]" size={40} /> Entrenamiento de Estilo
            </h1>
            <div className="bg-[#E9EDEC] px-4 py-2 rounded-full text-[#5D737E] text-xs font-bold flex items-center gap-2 border border-white shadow-sm">
              <Sparkles size={14} /> Modo Autoridad Activo
            </div>
          </div>
          <p className="text-slate-500 text-lg max-w-2xl">
            Pega tus mejores escritos. OMNIA analizará tu tono, vocabulario y estructura para clonar tu voz profesional.
          </p>
        </header>

        {/* Input de Entrenamiento */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-4">
          <textarea
            className="w-full h-48 outline-none resize-none text-lg placeholder:text-slate-200 leading-relaxed"
            placeholder="Pega aquí un artículo, un post de LinkedIn o un ensayo que defina tu estilo..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="flex justify-between items-center pt-4 border-t border-slate-50">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Recomendado: +300 palabras
            </span>
            <button
              onClick={saveInput}
              disabled={isSaving || !inputText}
              className="bg-[#2D3436] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#5D737E] transition-all shadow-xl active:scale-95 disabled:opacity-30"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Entrenar Mi IA</>}
            </button>
          </div>
        </div>

        {/* Lista de Inputs Guardados */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <BookOpen size={16} /> Tu ADN Digital ({inputs.length} piezas)
            </h3>
          </div>

          <div className="grid gap-4">
            {inputs.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-300 font-medium">Aún no hay textos cargados.</p>
              </div>
            )}

            {inputs.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="bg-[#F4F5F2] p-2 rounded-lg text-[#5D737E]">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-slate-600 line-clamp-1 text-sm font-medium">
                    {item.content}
                  </p>
                </div>
                <button
                  onClick={() => deleteInput(item.id)}
                  disabled={isDeleting === item.id}
                  className="text-slate-200 hover:text-red-400 p-2 transition-colors ml-4"
                >
                  {isDeleting === item.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                </button>
              </div>
            ))}

            {inputs.length > 0 && (
              <div className="mt-12 p-10 bg-gradient-to-br from-[#5D737E] to-[#2D3436] rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Sparkles size={120} />
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black">¿Listo para clonar tu voz?</h2>
                    <p className="text-slate-300 max-w-md">
                      OMNIA procesará tus {inputs.length} textos para crear tu manual de identidad verbal único.
                    </p>
                  </div>

                  <button
                    onClick={handleAnalyzeStyle}
                    disabled={isAnalyzing}
                    className="bg-white text-[#2D3436] px-10 py-5 rounded-[2rem] font-bold flex items-center gap-3 hover:bg-[#F4F5F2] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <><Loader2 className="animate-spin" size={20} /> Analizando tu estilo...</>
                    ) : (
                      <><Brain size={20} /> Generar Mi ADN de Escritura</>
                    )}
                  </button>

                  {dnaGenerated && (
                    <p className="text-xs font-bold text-green-400 flex items-center gap-2">
                      <CheckCircle2 size={14} /> Tu ADN ha sido actualizado y está listo en el Editor.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}