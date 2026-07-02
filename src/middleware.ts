/**
 * Middleware: refresca la sesión de Supabase en cada request para que el token
 * no expire mientras el usuario navega. Solo actúa en modo `supabase`; en demo
 * (cookie propia) es un paso vacío.
 *
 * Patrón oficial de @supabase/ssr: leer/escribir cookies tanto en el request
 * (para los Server Components de esta petición) como en la response (navegador).
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if ((process.env.DATA_MODE ?? "demo") !== "supabase") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesAEstablecer: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[],
        ) {
          for (const { name, value } of cookiesAEstablecer) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesAEstablecer) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Dispara el refresco de sesión si el token está por vencer.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Excluye estáticos, la API y el propio login del refresco.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api).*)"],
};
