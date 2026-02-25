'use client';

import React, { Suspense } from 'react'; // Importamos Suspense
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Linkedin, Twitter, Copy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// 1. Creamos un componente interno que maneja la lógica de los parámetros
function SuccessContent() {
  const searchParams = useSearchParams();
  
  // Decodificamos los textos que vienen del editor
  // Usamos try-catch por si la URL viene mal formada
  let liText = '';
  let xText = '';

  try {
    const liParam = searchParams.get('li');
    const xParam = searchParams.get('x');
    liText = liParam ? decodeURIComponent(atob(liParam)) : '';
    xText = xParam ? decodeURIComponent(atob(xParam)) : '';
  } catch (e) {
    console.error("Error decodificando parámetros", e);
  }

  const copyAndShare = (text: string, platform: 'li' | 'x') => {
    if (!text) {
      alert("No hay contenido para compartir.");
      return;
    }
    navigator.clipboard.writeText(text);
    alert("¡Texto copiado al portapapeles! Pégalo ahora en tu red social.");
    
    const url = platform === 'li' 
      ? 'https://www.linkedin.com/feed/' 
      : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.substring(0, 240) + "...")}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-xl w-full bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 text-center space-y-8 animate-in zoom-in-95 duration-500">
      <CheckCircle2 size={80} className="text-[#A2AD91] mx-auto" />
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-[#2D3436]">¡Publicado con éxito!</h1>
        <p className="text-slate-400">Tu artículo ya es parte de tu biblioteca de autoridad.</p>
      </div>
      
      <div className="grid gap-4">
        <button 
          onClick={() => copyAndShare(liText, 'li')} 
          className="bg-[#0077B5] text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95"
        >
          <Linkedin size={20} /> LinkedIn (Copiar y Abrir)
        </button>
        <button 
          onClick={() => copyAndShare(xText, 'x')} 
          className="bg-black text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95"
        >
          <Twitter size={20} /> Postear en X
        </button>
      </div>

      <div className="pt-4">
        <Link href="/editor" className="text-slate-400 hover:text-[#5D737E] font-bold flex items-center justify-center gap-2 transition-colors">
          <ArrowLeft size={16}/> Volver al editor
        </Link>
      </div>
    </div>
  );
}

// 2. La página principal exporta el contenido envuelto en Suspense
export default function PublishSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6">
      <Suspense fallback={
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D737E] mx-auto"></div>
          <p className="text-slate-400 font-bold">Preparando tus versiones sociales...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}