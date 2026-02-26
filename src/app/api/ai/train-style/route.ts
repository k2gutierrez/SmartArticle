export const maxDuration = 60; // Forzar a Vercel/Amplify a esperar hasta 60s (si lo permiten)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);
  try {
    // 1. Esperamos a que las cookies se resuelvan
    const cookieStore = await cookies();
    const apiKey = process.env.OPENAI_API_KEY;
    
    // VALIDACIÓN CRÍTICA: Si la API KEY no llega, respondemos JSON, no error 500
    if (!apiKey) {
      return NextResponse.json({ 
        error: "La API Key de OpenAI no está configurada en Amplify." 
      }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    // 2. Inicializamos el cliente de Supabase para Servidor
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // El middleware se encarga de esto si es necesario
            }
          },
        },
      }
    );

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
    }, { signal: controller.signal });
    clearTimeout(timeoutId);
    const styleDna = response.choices[0].message.content;

    // 5. Guardar en la tabla profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ writing_style_context: styleDna })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, dna: styleDna });
  } catch (error: any) {
    console.error("DETALLE DEL ERROR:", error);
    return NextResponse.json({ 
      error: "Error en el servidor: " + (error.name === 'AbortError' ? "Tiempo de espera agotado" : error.message)
    }, { status: 500 });
  }
}