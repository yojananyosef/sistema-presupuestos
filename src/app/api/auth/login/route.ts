import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // Preparar response donde se escribirán las cookies
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          console.log('[LOGIN] setAll called with cookies:', cookiesToSet.map(c => ({ name: c.name, hasValue: !!c.value, options: c.options })));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.log('[LOGIN] Auth error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  console.log('[LOGIN] Success, user:', data.user?.email);
  console.log('[LOGIN] Session exists:', !!data.session);
  console.log('[LOGIN] Response cookies:', response.cookies.getAll().map(c => c.name));

  return response;
}
