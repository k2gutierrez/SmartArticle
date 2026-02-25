'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layers, 
  Layout, 
  BrainCircuit, 
  Bookmark, 
  User, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();

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
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 text-2xl font-black text-[#5D737E]">
          <Layers size={28} /> OMNIA
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
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
  );
}