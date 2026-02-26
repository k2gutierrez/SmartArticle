'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layers, 
  Layout, 
  BrainCircuit, 
  Bookmark, 
  User, 
  LogOut,
  Menu, // <--- Ícono de hamburguesa
  X     // <--- Ícono para cerrar
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  
  // Estado para controlar si el menú está abierto en celular
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: <Layout size={20} />, label: 'Editor', href: '/editor' },
    { icon: <Bookmark size={20} />, label: 'Mi Biblioteca', href: '/dashboard/library' },
    { icon: <BrainCircuit size={20} />, label: 'Entrenamiento', href: '/train' },
    { icon: <User size={20} />, label: 'Mi Perfil / ADN', href: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      {/* 1. BARRA SUPERIOR MÓVIL (Solo visible en celular) */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 p-4 sticky top-0 z-20">
        <div className="flex items-center gap-2 text-xl font-black text-[#5D737E]">
          <Layers size={24} /> OMNIA
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 text-slate-500 hover:text-[#5D737E] transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 2. OVERLAY OSCURO (Para hacer clic afuera y cerrar el menú en móvil) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-30 md:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. EL MENÚ LATERAL (Escondido en móvil, fijo en PC) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Logo solo para PC (ya que en móvil está en la barra superior) */}
        <div className="p-6 hidden md:block">
          <div className="flex items-center gap-2 text-2xl font-black text-[#5D737E]">
            <Layers size={28} /> OMNIA
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 md:py-0 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)} // Cierra el menú al hacer clic (móvil)
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive 
                  ? 'bg-[#5D737E] text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-[#2D3436]'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-[#F4F5F2] p-4 rounded-2xl mb-4">
            <p className="text-[10px] font-black text-[#5D737E] uppercase tracking-widest">Suscripción</p>
            <p className="text-sm font-bold text-slate-600">Plan Authority Premium</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-sm transition-colors w-full"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}