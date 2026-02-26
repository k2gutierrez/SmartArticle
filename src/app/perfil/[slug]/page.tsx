import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Linkedin, Twitter, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Definimos la interfaz para los params
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicProfile({ params }: PageProps) {
  // 1. DESENVOLVER PARAMS (Vital en Next.js 15)
  const { slug } = await params;
  
  const supabase = await createClient();

  // 2. Obtener los datos del autor por su slug
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('profile_slug', slug)
    .single();

  if (!profile) {
    console.error("No se encontró el perfil para el slug:", slug);
    notFound();
  }

  // 3. Obtener los artículos publicados
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#2D3436] font-sans">
      {/* Hero del Autor */}
      <header className="bg-white border-b border-slate-100 pt-20 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-28 h-28 rounded-full overflow-hidden mx-auto border-4 border-[#F4F5F2] shadow-sm">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
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
        </div>
      </header>

      {/* Feed de Artículos */}
      <main className="max-w-3xl mx-auto py-16 px-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-10 text-center">
          Pensamientos Publicados
        </h2>

        <div className="space-y-12">
          {articles?.map((article) => (
            <article key={article.id} className="group">
              {/* IMPORTANTE: Usamos el article_slug para la URL */}
              <Link href={`/perfil/${slug}/${article.article_slug}`}>
                <div className="space-y-3 cursor-pointer">
                  <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                    <span>{new Date(article.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
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
    </div>
  );
}