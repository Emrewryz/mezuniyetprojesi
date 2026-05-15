// lib/supabase-server.ts
// Middleware ve Server Component'lerde kullanılır.
// NOT: Bu dosya "@supabase/ssr" paketini kullanır.
// Kurulum: npm install @supabase/ssr

import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";

type CookieStore = ReturnType<typeof cookies>;

/**
 * Server Components ve Route Handlers için Supabase client.
 * Kullanım:
 *   const cookieStore = cookies();
 *   const supabase = createSupabaseServerClient(cookieStore);
 */
export function createSupabaseServerClient(cookieStore: Awaited<CookieStore>) {
  return createServerClient(
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
            // Server Component içinde set edilemez, middleware halleder.
          }
        },
      },
    }
  );
}