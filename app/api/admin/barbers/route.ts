import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: caller } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (!caller || !["owner", "admin"].includes(caller.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: barbers } = await admin
    .from("barbers")
    .select("id, bio, commission_rate, is_active, profile_id, profiles ( full_name, phone )")
    .order("created_at");

  return NextResponse.json({ barbers: barbers ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: caller } = await admin
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!caller || !["owner", "admin"].includes(caller.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, full_name, bio, commission_rate } = body as {
    email: string;
    full_name: string;
    bio?: string;
    commission_rate?: number;
  };

  if (!email || !full_name) {
    return NextResponse.json({ error: "email e full_name são obrigatórios" }, { status: 400 });
  }

  const tempPassword = "Barber@" + Math.random().toString(36).slice(-8);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? "Erro ao criar usuário" }, { status: 400 });
  }

  const userId = created.user.id;

  // Upsert profile with barber role — works even if the trigger didn't fire
  const { error: profileErr } = await admin.from("profiles").upsert({
    id: userId,
    full_name,
    role: "barber",
  });
  if (profileErr) {
    return NextResponse.json({ error: "Perfil não criado: " + profileErr.message }, { status: 500 });
  }

  // Insert barber record
  const { data: barber, error: barberErr } = await admin.from("barbers").insert({
    profile_id: userId,
    bio: bio?.trim() || null,
    commission_rate: commission_rate ?? 50,
  }).select("id").single();

  if (barberErr) {
    return NextResponse.json({ error: barberErr.message }, { status: 500 });
  }

  return NextResponse.json({ barberId: barber.id, tempPassword }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: caller } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (!caller || !["owner", "admin"].includes(caller.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.bio !== undefined) update.bio = body.bio || null;
  if (body.commission_rate !== undefined) update.commission_rate = body.commission_rate;
  if (body.is_active !== undefined) update.is_active = body.is_active;

  const { error: dbErr } = await admin.from("barbers").update(update).eq("id", body.id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
