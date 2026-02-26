import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ChevronLeft, Calendar, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ 
    slug: string; 
    articleSlug: string; 
  }>;
}

export default async function ArticlePage({ params }: PageProps) {
  // 1. DESENVOLVER PARAMS
  const { slug, articleSlug } = await params;
  const supabase = await createClient();

  // 2. CONSULTA ROBUSTA
  // Intentamos traer el artículo filtrando por su slug y el slug del perfil asociado
  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      profiles!user_id (
        full_name,
        avatar_url,
        bio,
        profile_slug
      )
    `)
    .eq('article_slug', articleSlug)
    .eq('profiles.profile_slug', slug)
    .single();

  // 3. DIAGNÓSTICO DE ERRORES (Míralo en tu terminal)
  if (error || !article) {
    console.log("--- DEBUG ERROR OMNIA ---");
    console.log("Buscando Slug de Perfil:", slug);
    console.log("Buscando Slug de Artículo:", articleSlug);
    console.log("Error de Supabase:", error?.message);
    console.log("--------------------------");
    notFound();
  }

  const author = article.profiles;

  return (
    <div className="min-h-screen bg-white text-[#2D3436] font-sans">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link 
            href={`/perfil/${slug}`}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#5D737E] transition-colors"
          >
            <ChevronLeft size={16} /> Volver al perfil
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">OMNIA AI</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-20 px-6">
        <header className="space-y-8 mb-16">
          <h1 className="text-4xl md:text-5xl font-black leading-tight text-[#2D3436]">
            {article.title}
          </h1>

          <div className="flex items-center justify-between py-6 border-y border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-100">
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt={author.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
                    {author.full_name?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-[#2D3436]">{author.full_name}</p>
                <p className="text-xs text-slate-400 font-medium">
                  {new Date(article.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button className="p-3 text-slate-300 hover:text-[#5D737E] transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </header>

        <article className="max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed text-slate-700 text-lg md:text-xl space-y-6">
            {article.content_original}
          </div>
        </article>

        <footer className="mt-24 pt-12 border-t border-slate-100">
          <div className="bg-[#FBFBFA] p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-sm">
              {author.avatar_url && <img src={author.avatar_url} alt={author.full_name} className="w-full h-full object-cover" />}
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black">Escrito por {author.full_name}</h4>
              <p className="text-slate-500 text-sm">{author.bio}</p>
              <Link href={`/perfil/${slug}`} className="inline-block pt-2 text-[#5D737E] font-bold text-sm hover:underline">
                Ver más artículos →
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}