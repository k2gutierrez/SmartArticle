'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Camera,
  Save,
  Loader2,
  CheckCircle2,
  Dna,
  Globe,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function ProfileSettings() {

  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados del perfil
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dna, setDna] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    const init = async () => {
      await getProfile();
    };
    init();
  }, []);

  const getProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("No se encontró usuario en la sesión");
        return;
      }

      // Hacemos la consulta
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, bio, avatar_url, writing_style_context, profile_slug')
        .eq('id', user.id)
        .maybeSingle(); // Usamos maybeSingle para evitar errores si no hay fila

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setDna(data.writing_style_context || '');
        setSlug(data.profile_slug || '');
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa");

      // Generamos un slug simple a partir del nombre
      const generatedSlug = fullName.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '') // Quita caracteres especiales
        .replace(/[\s_-]+/g, '-') // Cambia espacios por guiones
        .replace(/^-+|-+$/g, ''); // Limpia guiones al inicio/final

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          bio: bio,
          profile_slug: generatedSlug, // Guardamos el slug generado
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) throw error;

      setSlug(generatedSlug); // Actualizamos el estado local para que el link se vea
      alert("¡Perfil y Enlace de Autoridad actualizados!");
      await getProfile();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      // 1. Subida
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obtener URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Actualizar tabla
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      alert("Imagen actualizada");
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const publicUrl = typeof window !== 'undefined' && slug
    ? `${window.location.origin}/perfil/${slug}`
    : '';

  const copyPublicLink = () => {
    if (!slug) return alert("Aún no tienes un enlace público generado.");
    navigator.clipboard.writeText(publicUrl);
    alert("¡Enlace copiado!");
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-slate-300" size={40} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black text-[#2D3436]">Configuración de Autor</h1>
        <p className="text-slate-400 text-lg font-medium">Gestiona tu identidad y ADN digital.</p>
      </header>

      {/* BLOQUE: URL PÚBLICA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#F4F5F2] rounded-2xl text-[#5D737E]">
            <Globe size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Enlace de Autoridad</p>
            <p className="font-mono text-sm text-[#5D737E] break-all">
              {slug ? publicUrl : "Configura tu nombre para generar tu enlace..."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyPublicLink}
            disabled={!slug}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold transition-all text-slate-600 disabled:opacity-50"
          >
            <Copy size={16} /> Copiar
          </button>
          {slug && (
            <a
              href={publicUrl}
              target="_blank"
              className="p-2.5 bg-[#5D737E] text-white rounded-xl hover:bg-[#2D3436] transition-all"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4 h-fit">
          <div className="relative group">
            <div className="w-36 h-36 rounded-full overflow-hidden bg-slate-50 border-4 border-white shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50 italic text-xs text-center p-4">Sube tu foto profesional</div>
              )}
            </div>
            <label className="absolute bottom-1 right-1 p-3 bg-[#2D3436] text-white rounded-full cursor-pointer hover:bg-[#5D737E] transition-all shadow-lg">
              {uploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
              <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-2 p-4 bg-slate-50 border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-[#5D737E]/20 font-bold text-[#2D3436]"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Biografía Ejecutiva</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full mt-2 p-4 bg-slate-50 border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-[#5D737E]/20 h-32 resize-none leading-relaxed"
                placeholder="Ej. Estratega de negocios con 20 años de experiencia..."
              />
            </div>
          </div>

          <button
            onClick={updateProfile}
            disabled={saving}
            className="flex items-center gap-2 bg-[#2D3436] text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#5D737E] transition-all shadow-xl active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Guardar Perfil
          </button>
        </div>
      </div>

      <div className="bg-[#E9EDEC] p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 border border-white">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm text-[#5D737E]"><Dna size={32} /></div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#2D3436]">ADN de Escritura</h3>
            <p className="text-sm text-slate-600 max-w-sm font-medium">
              {dna ? "Tu voz única está activa." : "Ve a Entrenamiento para configurar tu voz IA."}
            </p>
          </div>
        </div>
        <div>
          {dna ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-green-600 font-bold text-xs uppercase tracking-widest shadow-sm">
              <CheckCircle2 size={16} /> Activo
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-400 font-bold text-xs uppercase tracking-widest">
              Pendiente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}