import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// TEMPORARY — delete this file after running once in dev/staging
// POST /api/seed-test-users

const TEST_USERS = [
  { email: "admin@barberflix.test",    password: "Test@admin123",  full_name: "Admin Teste",    role: "owner"  },
  { email: "barbeiro@barberflix.test", password: "Test@barber123", full_name: "Barbeiro Teste", role: "barber" },
  { email: "cliente@barberflix.test",  password: "Test@client123", full_name: "Cliente Teste",  role: "client" },
] as const;

export async function POST() {
  const admin = createAdminClient();
  const results: Record<string, unknown>[] = [];

  for (const u of TEST_USERS) {
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });

    if (authErr) {
      results.push({ email: u.email, status: "error", message: authErr.message });
      continue;
    }

    const userId = authData.user.id;

    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role: u.role, full_name: u.full_name })
      .eq("id", userId);

    results.push({ email: u.email, id: userId, status: roleErr ? "role_error" : "ok", roleError: roleErr?.message });
  }

  // Create barbers row for the barber test user
  const { data: barberProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("full_name", "Barbeiro Teste")
    .single();

  if (barberProfile) {
    const { error: bErr } = await admin
      .from("barbers")
      .upsert({ profile_id: barberProfile.id, bio: "Barbeiro de teste", is_active: true });
    results.push({ barber_row: bErr ? bErr.message : "ok" });
  }

  return NextResponse.json({ results });
}
