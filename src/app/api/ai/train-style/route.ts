import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    // 1. Esperamos a que las cookies se resuelvan
    const cookieStore = await cookies();
    
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
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `Actúa como un experto en Branding Personal y Lingüística Forense. 
          Tu objetivo es crear un 'Manual de Identidad Verbal' basado en los textos del autor. 
          Define: 
          1. Tono predominante (Ej: Ejecutivo, Mentor, Académico).
          2. Estructura de oraciones (cortas vs largas).
          3. Vocabulario recurrente.
          4. Uso de storytelling.
          
          Redacta este ADN en SEGUNDA PERSONA (ej: 'Tú escribes de forma...') para que el Ghostwriter lo use como instrucción.` 
        },
        { role: "user", content: `Analiza este material y genera mi ADN de escritura: ${allTexts}` }
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
    console.error("Error en Train Style:", error);
    return NextResponse.json({ error: error.message || "Error analizando estilo" }, { status: 500 });
  }
}