import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/client'; // Necesitarás crear este helper similar al de arriba pero para servidor

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Obtener TODOS los textos de entrenamiento del usuario
    const { data: trainingData } = await supabase
      .from('training_data')
      .select('content')
      .eq('user_id', user?.id);

    if (!trainingData || trainingData.length === 0) {
      return NextResponse.json({ error: "No hay datos suficientes" }, { status: 400 });
    }

    const allTexts = trainingData.map(d => d.content).join("\n\n---\n\n");

    // 2. Pedirle a la IA que cree el "Perfil de ADN"
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "Actúa como un analista lingüístico forense. Analiza los siguientes textos y define el 'ADN de escritura' del autor: tono (formal/informal), longitud de oraciones, uso de metáforas, palabras frecuentes, y nivel de tecnicismo. Crea un perfil de estilo detallado de 500 palabras." 
        },
        { role: "user", content: `Analiza este material: ${allTexts}` }
      ]
    });

    const styleDna = response.choices[0].message.content;

    // 3. Guardar ese ADN en el perfil del usuario para usarlo siempre
    await supabase
      .from('profiles')
      .update({ writing_style_context: styleDna })
      .eq('id', user?.id);

    return NextResponse.json({ success: true, dna: styleDna });
  } catch (error) {
    return NextResponse.json({ error: "Error analizando estilo" }, { status: 500 });
  }
}