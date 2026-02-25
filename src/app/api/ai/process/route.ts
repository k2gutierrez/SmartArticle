import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { content, mode, userStyleContext } = await req.json();

    // 1. Definimos el ADN de la respuesta según el modo
    let systemInstruction = `
      Eres el Ghostwriter premium de OMNIA. Tu objetivo es procesar el texto del autor para maximizar su autoridad.
      
      DEBES responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
      {
        "blog": "El texto corregido y elegante para la web",
        "linkedIn": "Un post de LinkedIn con hook, 3 bullets y CTA",
        "twitter": "Un hilo de 5 tweets numerados",
        "styleNote": "Una breve explicación de qué se mejoró"
      }

      CONTEXTO DE ESTILO DEL AUTOR:
      ${userStyleContext || "Profesional, sobrio y líder de opinión."}

      INSTRUCCIONES DE MODO:
      ${mode === 'correct' ? 'Enfócate en corregir gramática y elevar el vocabulario.' : 'Enfócate en imitar perfectamente el estilo del autor.'}
    `;

    if (mode === 'generate') {
      systemInstruction = `
    Eres el Ghostwriter de élite del autor. Tu misión es redactar un artículo completo partiendo de una idea simple.
    
    PERFIL LINGÜÍSTICO DEL AUTOR (ADN):
    ${userStyleContext}

    REGLAS DE ORO:
    1. Escribe como si fueras él/ella. Usa sus muletillas, su nivel de complejidad y su tono.
    2. Si el ADN es directo y ejecutivo, no uses introducciones largas.
    3. Entrega el resultado en el JSON estructurado (blog, linkedIn, twitter).
  `;
    }

    // 2. Llamada a OpenAI con 'json_mode' activado
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Procesa este artículo: ${content}` }
      ],
      response_format: { type: "json_object" }, // Crucial para que no falle el JSON.parse
      temperature: 0.7,
    });

    const aiResult = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json(aiResult);
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Error en la matriz de IA" }, { status: 500 });
  }
}