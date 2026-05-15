import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getBarberForSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { barberId: null, error: "Unauthorized", status: 401 };

  const admin = createAdminClient();
  const { data: barber } = await admin
    .from("barbers")
    .select("id")
    .eq("profile_id", session.user.id)
    .single();

  if (!barber) return { barberId: null, error: "Barbeiro não encontrado", status: 404 };
  return { barberId: barber.id, error: null, status: 200 };
}

export async function GET(req: NextRequest) {
  const { barberId, error, status } = await getBarberForSession();
  if (!barberId) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) return NextResponse.json({ error: "start e end são obrigatórios" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from("appointments")
    .select(
      `id, scheduled_at, ends_at, status, price_paid, notes,
       profiles!appointments_client_id_fkey ( full_name, phone ),
       services ( name, duration_minutes )`
    )
    .eq("barber_id", barberId)
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .order("scheduled_at");

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ appointments: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const { barberId, error, status } = await getBarberForSession();
  if (!barberId) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const { id, newStatus, notes } = body as { id: string; newStatus: string; notes: string };
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const admin = createAdminClient();

  // Verify appointment belongs to this barber
  const { data: apt } = await admin
    .from("appointments")
    .select("barber_id")
    .eq("id", id)
    .single();

  if (!apt || apt.barber_id !== barberId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: upErr } = await admin
    .from("appointments")
    .update({ status: newStatus, notes: notes?.trim() || null })
    .eq("id", id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
