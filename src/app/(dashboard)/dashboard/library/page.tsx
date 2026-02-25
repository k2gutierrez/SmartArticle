'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Edit3, Trash2, Eye, Share2, MoreVertical, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ArticleLibrary() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este artículo?")) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) setPosts(posts.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#2D3436]">Mi Biblioteca</h1>
            <p className="text-slate-500">Gestiona tus piezas de autoridad y consulta su impacto.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar artículo..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D737E]/10"
            />
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5D737E]" size={40} /></div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-bold text-[#2D3436] leading-tight">{post.title}</h3>
                  <div className="flex gap-6 text-sm text-slate-400 font-medium uppercase tracking-tighter">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Eye size={14}/> {post.views_count} vistas</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/editor?id=${post.id}`} className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-[#5D737E] transition-all">
                    <Edit3 size={20} />
                  </Link>
                  <button onClick={() => deletePost(post.id)} className="p-3 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all">
                    <Trash2 size={20} />
                  </button>
                  <button className="bg-[#E9EDEC] text-[#5D737E] px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                    <Share2 size={16}/> Compartir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}