import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

const staffPrefixes = [
  "/dashboard",
  "/schedule",
  "/patients",
  "/billing",
  "/tasks",
] as const;

function isStaffPath(path: string) {
  return staffPrefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const requiresAuth = isStaffPath(path) || path.startsWith("/portal");
  if (!user && requiresAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role;
    if (path === "/login") {
      return NextResponse.redirect(
        new URL(role === "patient" ? "/portal" : "/dashboard", request.url)
      );
    }
    if (path.startsWith("/portal") && role && role !== "patient") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (role === "patient" && isStaffPath(path)) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }
  return supabaseResponse;
}
