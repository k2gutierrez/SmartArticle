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
      
      DEBES responder ÚNICAMENTE con un objeto JSON válido. 
      No incluyas texto antes ni después del JSON, ni bloques de código markdown.
      
      Estructura requerida:
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

        DEBES RESPONDER ÚNICAMENTE EN FORMATO JSON. No incluyas explicaciones, no incluyas bloques de código markdown (\`\`\`json ... \`\`\`), solo el objeto puro.

        ESTRUCTURA DEL JSON REQUERIDA:
        {
          "blog": "El artículo completo y pulido",
          "linkedIn": "Post optimizado para LinkedIn",
          "twitter": "Hilo de Twitter/X"
        }

        PERFIL LINGÜÍSTICO DEL AUTOR (ADN):
        ${userStyleContext || "Profesional y autoritario."}

        REGLAS DE ORO:
        1. Escribe como si fueras él/ella. Usa sus muletillas y su tono.
        2. Si el ADN es directo y ejecutivo, no uses introducciones largas.
        3. El campo 'blog' debe tener una estructura de artículo de autoridad.
        `;

      // 2. Llamada a OpenAI con 'json_mode' activado
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // O "gpt-4-turbo" si gpt-4o te da error de cuota
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Genera contenido basado en esta idea: ${content}` }
      ],
      response_format: { type: "json_object" }, // ESTO ES VITAL
      temperature: 0.7,
    });

    const aiResult = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json(aiResult);
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