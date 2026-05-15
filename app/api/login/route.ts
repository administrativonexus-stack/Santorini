import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ROLE_HOME: Record<string, string> = {
  client: "/client/dashboard",
  barber: "/barber/dashboard",
  owner: "/admin/dashboard",
  admin: "/admin/dashboard",
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const origin = request.nextUrl.origin;

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_credentials", origin),
      { status: 303 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=no_session", origin),
      { status: 303 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const destination = ROLE_HOME[profile?.role ?? "client"] ?? "/client/dashboard";

  return NextResponse.redirect(new URL(destination, origin), { status: 303 });
}
