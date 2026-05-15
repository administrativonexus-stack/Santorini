import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ROLE_HOME: Record<string, string> = {
  client: "/client/dashboard",
  barber: "/barber/dashboard",
  owner: "/admin/dashboard",
  admin: "/admin/dashboard",
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role ?? "client";
        return NextResponse.redirect(
          new URL(ROLE_HOME[role] ?? next, origin)
        );
      }
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
}
