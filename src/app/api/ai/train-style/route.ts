export const maxDuration = 60; // Forzar a Vercel/Amplify a esperar hasta 60s (si lo permiten)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js'; // Usa el cliente directo para evitar problemas de middleware

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // DIAGNÓSTICO PREVENTIVO
    if (!apiKey || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: "Faltan configuraciones en el servidor",
        debug: { 
          hasOpenAI: !!apiKey, 
          hasUrl: !!supabaseUrl, 
          hasKey: !!supabaseKey 
        }
      }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    // 2. Inicializamos el cliente de Supabase para Servidor
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // 3. Obtener los textos de entrenamiento
    const { data: trainingData } = await supabase
      .from('training_data')
      .select('content')
      .eq('user_id', user.id);

    if (!trainingData || trainingData.length < 3) {
      return NextResponse.json({ 
        error: "Sube al menos 3 textos para que OMNIA pueda detectar un patrón de voz real." 
      }, { status: 400 });
    }

    const allTexts = trainingData.map(d => d.content).join("\n\n---\n\n");

    // 4. Generar el Perfil de ADN
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cambia a gpt-4o-mini para probar; es 10 veces más rápido
      messages: [
        { role: "system", content: "Analiza el estilo de forma ultra-concisa y rápida." },
        { role: "user", content: `Analiza: ${allTexts.substring(0, 4000)}` } // Limitamos texto para velocidad
      ]
    });
    const styleDna = response.choices[0].message.content;

    // 5. Guardar en la tabla profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ writing_style_context: styleDna })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, dna: styleDna });
  } catch (error: any) {
    // ESTO ES VITAL: Enviamos el error como JSON para que el frontend lo lea
    return new Response(JSON.stringify({ 
      error: error.message || "Error interno desconocido",
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}