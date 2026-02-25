'use client';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Linkedin, Twitter, Copy, Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PublishSuccess() {
  const searchParams = useSearchParams();
  
  // Decodificamos los textos que vienen del editor
  const liText = searchParams.get('li') ? atob(searchParams.get('li')!) : '';
  const xText = searchParams.get('x') ? atob(searchParams.get('x')!) : '';

  const copyAndShare = (text: string, platform: 'li' | 'x') => {
    navigator.clipboard.writeText(text);
    alert("Texto copiado al portapapeles. ¡Pégalo en tu red social!");
    const url = platform === 'li' 
      ? 'https://www.linkedin.com/feed/' 
      : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.substring(0, 200) + "...")}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 text-center space-y-8">
        <CheckCircle2 size={80} className="text-[#A2AD91] mx-auto" />
        <h1 className="text-4xl font-black">¡Publicado!</h1>
        
        <div className="grid gap-4">
          <button onClick={() => copyAndShare(liText, 'li')} className="bg-[#0077B5] text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3">
            <Linkedin size={20} /> LinkedIn (Copiar y Abrir)
          </button>
          <button onClick={() => copyAndShare(xText, 'x')} className="bg-black text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3">
            <Twitter size={20} /> Postear en X
          </button>
        </div>

        <Link href="/editor" className="block text-slate-400 font-bold flex items-center justify-center gap-2">
          <ArrowLeft size={16}/> Volver al editor
        </Link>
      </div>
    </div>
  );
}