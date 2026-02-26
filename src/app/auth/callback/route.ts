import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  // 1. Obtenemos la URL completa y extraemos los parámetros
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Si envías un parámetro "next" (ej. a dónde ir después), lo usamos. 
  // Si no, mandamos al usuario directamente al editor por defecto.
  const next = searchParams.get('next') ?? '/editor';

  if (code) {
    // 2. Creamos el cliente de servidor (¡Asegúrate de que este archivo ya tenga el await cookies() que arreglamos antes!)
    const supabase = await createClient();
    
    // 3. Intercambiamos el código del correo por una sesión válida
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // ÉXITO: El usuario confirmó su correo y ya tiene la cookie de sesión.
      // Lo redirigimos a la ruta protegida (ej: https://tudominio.com/editor)
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Error al validar el código de registro:", error.message);
    }
  }

  // FALLO: Si no hay código o el código ya expiró, lo mandamos de vuelta al login con un error
  return NextResponse.redirect(`${origin}/login?error=invalid-auth-code`);
}