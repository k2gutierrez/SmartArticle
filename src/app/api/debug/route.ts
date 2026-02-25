import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const diagnostics = {
    openai: { status: 'unknown', details: '' },
    supabase: { status: 'unknown', details: '' },
    env: { 
      has_openai_key: !!process.env.OPENAI_API_KEY,
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    }
  };

  try {
    // 1. Probar OpenAI
    if (!process.env.OPENAI_API_KEY) throw new Error("Falta la API KEY en el servidor");
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const models = await openai.models.list();
    diagnostics.openai.status = 'success';
    diagnostics.openai.details = `Conectado. Modelos disponibles: ${models.data.length}`;
  } catch (e: any) {
    diagnostics.openai.status = 'error';
    diagnostics.openai.details = e.message;
  }

  try {
    // 2. Probar Supabase
    const supabase = await createClient();
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    diagnostics.supabase.status = 'success';
    diagnostics.supabase.details = 'Conexión a base de datos establecida.';
  } catch (e: any) {
    diagnostics.supabase.status = 'error';
    diagnostics.supabase.details = e.message;
  }

  return NextResponse.json(diagnostics);
}