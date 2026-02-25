'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Send, BookOpen, Trash2, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function TrainAI() {
  const [inputText, setInputText] = useState('');
  const [inputs, setInputs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  // Cargar lo que ya ha subido el usuario
  useEffect(() => {
    fetchInputs();
  }, []);

  const fetchInputs = async () => {
    const { data } = await supabase.from('training_data').select('*').order('created_at', { ascending: false });
    if (data) setInputs(data);
  };

  const saveInput = async () => {
    if (!inputText) return;
    setIsSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('training_data').insert([
      { content: inputText, user_id: user?.id }
    ]);

    if (!error) {
      setInputText('');
      fetchInputs();
      alert("¡ADN de escritura actualizado!");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-black text-[#2D3436] flex items-center gap-3">
            <Brain className="text-[#5D737E]" size={40} /> Entrenamiento de Estilo
          </h1>
          <p className="text-slate-500 text-lg">
            Sube tus artículos, correos o ensayos. Cuantos más subas, mejor te imitará OMNIA.
          </p>
        </header>

        {/* Input de Entrenamiento */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
          <textarea 
            className="w-full h-48 outline-none resize-none text-lg placeholder:text-slate-200"
            placeholder="Pega aquí un texto que hayas escrito tú..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <button 
              onClick={saveInput}
              disabled={isSaving}
              className="bg-[#5D737E] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2D3436] transition-all"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Entrenar IA</>}
            </button>
          </div>
        </div>

        {/* Lista de Inputs Guardados */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BookOpen size={16}/> Tu Base de Conocimiento ({inputs.length})
          </h3>
          <div className="grid gap-4">
            {inputs.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-start group">
                <p className="text-slate-600 line-clamp-2 text-sm italic">"{item.content}"</p>
                <button className="text-slate-300 hover:text-red-400 p-2 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}