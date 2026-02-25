import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Linkedin, Twitter, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function PublicProfile({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  // 1. Obtener los datos del autor por su slug
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('profile_slug', params.slug)
    .single();

  if (!profile) notFound();

  // 2. Obtener los artículos publicados de este autor
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#2D3436] font-sans">
      {/* Header / Hero del Autor */}
      <header className="bg-white border-b border-slate-100 pt-20 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-28 h-28 rounded-full overflow-hidden mx-auto border-4 border-[#F4F5F2] shadow-sm">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                {profile.full_name?.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">{profile.full_name}</h1>
            <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
              {profile.bio || "Autor de pensamiento original y estrategia en OMNIA."}
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <Linkedin size={20} className="text-[#0077B5]" />
            </button>
            <button className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <Twitter size={20} className="text-black" />
            </button>
          </div>
        </div>
      </header>

      {/* Feed de Artículos */}
      <main className="max-w-3xl mx-auto py-16 px-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-10 text-center">
          Pensamientos Publicados
        </h2>

        <div className="space-y-12">
          {articles?.map((article) => (
            <article key={article.id} className="group cursor-pointer">
              <Link href={`/perfil/${params.slug}/${article.id}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                    <span>{new Date(article.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>5 min lectura</span>
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-[#5D737E] transition-colors leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 line-clamp-3 leading-relaxed">
                    {article.content_original?.substring(0, 200)}...
                  </p>
                  <div className="flex items-center gap-2 text-[#5D737E] font-bold text-sm pt-2">
                    Leer más <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            </article>
          ))}

          {articles?.length === 0 && (
            <p className="text-center text-slate-400 italic py-10">
              Este autor aún no ha publicado reflexiones.
            </p>
          )}
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="py-20 text-center border-t border-slate-100 mt-20">
        <p className="text-sm text-slate-300 font-bold tracking-widest uppercase">
          Creado con <span className="text-[#5D737E]">OMNIA</span> — El ADN de los líderes.
        </p>
      </footer>
    </div>
  );
}