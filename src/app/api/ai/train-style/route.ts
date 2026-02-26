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

    // 4. OBTENER LOS TEXTOS DEL USUARIO
    // Extraemos los artículos publicados del autor para analizarlos
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('content_original')
      .eq('user_id', user.id)
      .not('content_original', 'is', null) // Aseguramos que tengan texto
      .limit(15); // Límite razonable para no sobrecargar

    if (articlesError || !articles || articles.length === 0) {
      return NextResponse.json({ 
        error: "No hay suficientes artículos redactados para clonar tu voz. Escribe algunos primero." 
      }, { status: 400 });
    }

    // Unimos los textos y los limitamos a ~12,000 caracteres para evitar Timeouts
    const allTexts = articles.map(a => a.content_original).join('\n\n').substring(0, 12000);

    // 5. LLAMADA A OPENAI (ULTRA-RÁPIDA)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fundamental para que AWS no corte la petición por tiempo
      messages: [
        { 
          role: "system", 
          content: "Eres un experto lingüista. Analiza los textos del usuario y define su ADN de escritura (tono, muletillas, estructura de oraciones, nivel de formalidad, ritmo). Responde de forma concisa, directa y estructurada en viñetas." 
        },
        { 
          role: "user", 
          content: `Analiza el estilo de los siguientes textos para clonar la voz del autor:\n\n${allTexts}` 
        }
      ],
      temperature: 0.3, // Temperatura baja para que sea analítico y no creativo
    });

    const styleDna = response.choices[0].message.content;

    if (!styleDna) {
      throw new Error("OpenAI no logró procesar el estilo.");
    }

    // 6. GUARDAR EL RESULTADO EN LA BASE DE DATOS
    // NOTA: Revisa que la columna en tu tabla 'profiles' se llame exactamente 'style_dna'
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