"use server";

import { createClient } from "@/lib/supabase/server";

const ROLE_HOME: Record<string, string> = {
  client: "/client/dashboard",
  barber: "/barber/dashboard",
  owner: "/admin/dashboard",
  admin: "/admin/dashboard",
};

export async function loginAction(
  _prev: { error: string; redirectTo?: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou senha incorretos." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Erro de autenticação." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const destination = ROLE_HOME[profile?.role ?? "client"] ?? "/client/dashboard";
  return { error: "", redirectTo: destination };
}
