import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const cfg = getSupabaseConfig();
  if (!cfg) return res;

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: { headers: req.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && req.nextUrl.pathname.startsWith("/dashboard")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("reason", "session_expired");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
