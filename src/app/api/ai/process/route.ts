import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Definimos el diccionario de instrucciones de longitud con tipos estrictos
const lengthInstructions: { [key: string]: string } = {
  corto: "Sé conciso, ve al grano, estilo 'Atomic Essay'. Máximo 300 palabras.",
  medio: "Desarrolla los puntos con fluidez y profundidad estándar. Unas 600 palabras.",
  largo: "Crea una pieza de autoridad profunda, con subtítulos detallados, análisis extenso y conclusiones robustas. Más de 1,000 palabras."
};

export async function POST(req: Request) {
  try {
    const { 
      content, 
      mode, 
      goal, 
      userStyleContext, 
      length 
    } = await req.json();

    // 1. Validar la instrucción de longitud (por defecto 'medio')
    const selectedLength = lengthInstructions[length] || lengthInstructions['medio'];

    // 2. Configurar el System Prompt según el ADN del usuario
    const systemInstruction = `
      Eres el Ghostwriter de élite del autor. Tu misión es redactar o pulir contenido para construir autoridad.
      
      INSTRUCCIONES DE ESTILO (ADN DEL AUTOR):
      ${userStyleContext || "Escribe de forma profesional, clara y directa."}

      OBJETIVO ESTRATÉGICO: 
      El contenido debe estar diseñado para ${goal.toUpperCase()}.

      REGLAS DE EXTENSIÓN:
      ${selectedLength}

      REGLA DE FORMATO OBLIGATORIA:
      DEBES responder ÚNICAMENTE con un objeto JSON válido. No incluyas texto extra, ni bloques de código markdown.
      
      Estructura del JSON:
      {
        "blog": "El artículo completo aquí",
        "linkedIn": "Una versión optimizada para post de LinkedIn (máximo 2500 caracteres)",
        "twitter": "Un hilo de Twitter (X) de 3 a 5 tweets"
      }
    `;

    // 3. Determinar el User Prompt según el modo (Generar o Corregir)
    const userPrompt = mode === 'generate' 
      ? `Genera un artículo completo desde cero basado en esta idea: ${content}`
      : `Por favor, toma el siguiente texto y púlelo usando mi ADN de escritura, manteniendo la estructura JSON: ${content}`;

    // 4. Llamada a OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // O usa "gpt-4-turbo" si tienes límites de cuenta
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiResponse = response.choices[0].message.content;

    if (!aiResponse) {
      throw new Error("La IA no devolvió una respuesta válida.");
    }

    // Retornamos el JSON directamente al frontend
    return NextResponse.json(JSON.parse(aiResponse));

  } catch (error: any) {
    console.error("Error en el proceso de IA:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar el contenido con IA" }, 
      { status: 500 }
    );
  }
}