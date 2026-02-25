import Link from 'next/link';
import { Layers, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#2D3436]">
      {/* Navegación Simple */}
      <nav className="max-w-7xl mx-auto px-8 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2 text-2xl font-black text-[#5D737E]">
          <Layers size={32} /> OMNIA
        </div>
        <Link href="/login" className="font-bold text-[#5D737E] hover:text-[#2D3436] transition-colors">
          Iniciar Sesión
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-8 py-20 md:py-32 text-center space-y-10">
        <div className="inline-block px-6 py-2 bg-[#E9EDEC] rounded-full text-[#5D737E] font-bold text-sm tracking-widest uppercase">
          Escribe una vez. Publica en todo.
        </div>
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] text-[#1A1D1E]">
          Tu voz merece <br />
          <span className="text-[#5D737E]">más impacto.</span>
        </h1>
        <p className="text-2xl md:text-3xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
          La plataforma All-in-One para autores mayores de 40 que quieren construir autoridad sin complicaciones técnicas.
        </p>
        
        <div className="pt-10 flex flex-col md:flex-row justify-center gap-6">
          <Link 
            href="/login"
            className="bg-[#2D3436] text-white px-12 py-6 rounded-3xl text-2xl font-bold shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-4"
          >
            Empezar Ahora <ArrowRight size={28} />
          </Link>
        </div>

        {/* Mini Features */}
        <div className="pt-32 grid md:grid-cols-3 gap-12 text-left border-t border-slate-100">
          <Feature 
            icon={<ShieldCheck className="text-[#5D737E]" />} 
            title="Autoridad Real" 
            desc="Tus artículos viven en tu propio perfil de OMNIA, listos para ser compartidos." 
          />
          <Feature 
            icon={<Zap className="text-[#A2AD91]" />} 
            title="IA con tu Estilo" 
            desc="Entrenamos a la IA con tus textos previos para que escriba exactamente como tú." 
          />
          <Feature 
            icon={<Globe className="text-[#5D737E]" />} 
            title="Distribución Total" 
            desc="LinkedIn, X, Medium e Instagram en un solo clic." 
          />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-50">
        {icon}
      </div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}