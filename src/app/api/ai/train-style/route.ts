export const maxDuration = 60; // Forzar a Vercel/Amplify a esperar un poco más si lo permiten
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // 1. VALIDACIÓN DE VARIABLES DE ENTORNO
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Falta configurar la OPENAI_API_KEY en AWS Amplify."
      }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    // El helper asume que ya arreglaste el `await cookies()` en utils/supabase/server.ts
    const supabase = await createClient();

    // 2. EXTRACCIÓN DEL TOKEN (BYPASS PARA AWS AMPLIFY)
    // Buscamos el token explícito que mandamos desde el frontend
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user;
    let authError;

    // 3. AUTENTICACIÓN
    if (token) {
      // Si el frontend mandó el token, AWS no puede bloquearlo
      const { data, error } = await supabase.auth.getUser(token);
      user = data.user;
      authError = error;
    } else {
      // Fallback a cookies tradicionales (funciona mejor en localhost)
      const { data, error } = await supabase.auth.getUser();
      user = data.user;
      authError = error;
    }

    // Si aún así no hay usuario, rechazamos la petición
    if (authError || !user) {
      console.error("Error de Auth en Servidor:", authError);
      return NextResponse.json({
        error: "No autorizado (401)",
        detalles: "El token de sesión no es válido. Cierra sesión y vuelve a entrar."
      }, { status: 401 });
    }

    // 4. OBTENER LOS TEXTOS DEL USUARIO (Corregido a training_data)
    const { data: trainingData, error: trainingError } = await supabase
      .from('training_data')
      .select('content')
      .eq('user_id', user.id)
      .not('content', 'is', null)
      .limit(15);

    if (trainingError || !trainingData || trainingData.length === 0) {
      return NextResponse.json({
        error: "No hay suficientes textos de entrenamiento para clonar tu voz. Agrega algunos primero."
      }, { status: 400 });
    }

    // CONCATENACIÓN: Unimos los textos con un separador claro para la IA
    const allTexts = trainingData
      .map(t => t.content)
      .join('\n\n--- SIGUIENTE TEXTO DE REFERENCIA ---\n\n')
      .substring(0, 12000); // Límite de seguridad para Vercel/Amplify

    // 5. LLAMADA A OPENAI (Con Prompt ajustado)
    const systemPrompt = `
      Eres un experto lingüista. Tu tarea es analizar los textos del usuario y definir su "ADN de escritura".
      
      REGLAS:
      1. Identifica el tono, muletillas, estructura de oraciones, nivel de formalidad y ritmo.
      2. Responde de forma concisa, directa y estructurada en viñetas.
      3. IMPORTANTE (Fallback): Si consideras que los textos proporcionados son demasiado cortos o genéricos para extraer un estilo personal muy marcado, NO te disculpes ni menciones que falta información. Simplemente define un "ADN de escritura estándar, claro y profesional" basándote en lo poco que puedas deducir.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analiza el estilo de los siguientes textos para clonar la voz del autor:\n\n${allTexts}` }
      ],
      temperature: 0.3,
    });

    const styleDna = response.choices[0].message.content;

    if (!styleDna) {
      throw new Error("OpenAI no logró procesar el estilo.");
    }

    // 6. GUARDAR EL RESULTADO EN LA BASE DE DATOS
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ writing_style_context: styleDna })
      .eq('id', user.id);

    if (updateError) {
      console.error("Error en DB:", updateError);
      throw new Error("No pudimos guardar tu ADN en la base de datos.");
    }

    // 7. RESPUESTA EXITOSA
    return NextResponse.json({ success: true, dna: styleDna });

  } catch (error: any) {
    console.error("DETALLE DEL ERROR EN TRAIN-STYLE:", error);

    // EVITAR EL "Unexpected token I" EN EL FRONTEND
    // Pase lo que pase, devolvemos un JSON limpio con el mensaje de error
    return new Response(JSON.stringify({
      error: error.message || "Error interno en el servidor de Amplify."
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}