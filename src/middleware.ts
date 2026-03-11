import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // For MVP, we skip Supabase middleware to avoid errors when env vars are missing
  // This allows the app to work on Vercel even without Supabase configured
  // Uncomment this when authentication is needed and env vars are properly set:

  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  //
  // if (supabaseUrl && supabaseAnonKey) {
  //   const { createServerClient } = await import('@supabase/ssr');
  //   const supabase = createServerClient(
  //     supabaseUrl,
  //     supabaseAnonKey,
  //     {
  //       cookies: {
  //         getAll() {
  //           return req.cookies.getAll();
  //         },
  //         setAll(cookiesToSet: { name: string; value: string }[]) {
  //           cookiesToSet.forEach(({ name, value }) =>
  //             res.cookies.set(name, value)
  //           );
  //         },
  //       },
  //     }
  //   );
  //
  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser();
  //
  //   // For MVP, we're not enforcing authentication
  //   // Remove this comment when authentication is needed:
  //   // if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
  //   //   return NextResponse.redirect(new URL('/login', req.url));
  //   // }
  // }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
