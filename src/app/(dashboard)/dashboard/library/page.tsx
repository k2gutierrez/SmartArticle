'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  BookOpen, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Loader2, 
  FileText,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Traer perfil para el slug
    const { data: prof } = await supabase
      .from('profiles')
      .select('profile_slug')
      .eq('id', user.id)
      .single();
    setProfile(prof);

    // 2. Traer artículos
    const { data: arts } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (arts) setArticles(arts);
    setLoading(false);
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("¿Seguro que quieres borrar este artículo?")) return;
    setDeletingId(id);
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) {
      setArticles(articles.filter(a => a.id !== id));
    }
    setDeletingId(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-slate-300" size={40} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[#2D3436] flex items-center gap-3">
            <BookOpen className="text-[#5D737E]" size={36} /> Mi Biblioteca
          </h1>
          <p className="text-slate-400 font-medium">Gestiona tus piezas de autoridad publicadas.</p>
        </div>
        <Link href="/editor">
          <button className="bg-[#2D3436] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#5D737E] transition-all shadow-lg">
            Nuevo Artículo
          </button>
        </Link>
      </header>

      <div className="grid gap-6">
        {articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-300 font-bold">Aún no has publicado nada.</p>
          </div>
        ) : (
          articles.map((article) => ( // Aquí definimos 'article' para el map
            <div key={article.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6 overflow-hidden w-full">
                <div className="p-4 bg-[#F4F5F2] rounded-2xl text-[#5D737E] shrink-0">
                  <FileText size={24} />
                </div>
                <div className="truncate">
                  <h3 className="text-xl font-black text-[#2D3436] truncate">{article.title}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Publicado: {new Date(article.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* BOTÓN VER (PÚBLICO) */}
                <Link 
                  href={`/perfil/${profile?.profile_slug}/${article.article_slug}`}
                  target="_blank"
                  className="p-3 text-slate-400 hover:text-[#5D737E] hover:bg-slate-50 rounded-xl transition-all"
                >
                  <ExternalLink size={20} />
                </Link>

                {/* BOTÓN EDITAR (ESTO ARREGLA TU ERROR) */}
                <Link href={`/editor?id=${article.id}`}>
                  <button className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                    <Edit3 size={20} />
                  </button>
                </Link>

                {/* BOTÓN BORRAR */}
                <button 
                  onClick={() => deleteArticle(article.id)}
                  className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  {deletingId === article.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}