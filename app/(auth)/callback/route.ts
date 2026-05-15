// app/auth/callback/route.ts
// Supabase email doğrulama ve OAuth (Google vb.) sonrası buraya döner.
// Supabase Dashboard > Authentication > URL Configuration'da
// "Redirect URL" olarak: https://siten.com/auth/callback ekle

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Login sayfasından gelen "nereye dönelim" parametresi
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Başarılı — hedef sayfaya yönlendir
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Hata durumunda login sayfasına geri dön
  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_failed`
  );
}