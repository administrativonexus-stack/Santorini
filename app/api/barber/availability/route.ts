import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DayOfWeek } from "@/types/database";

async function getBarberIdForSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { barberId: null, error: "Unauthorized", status: 401 };

  const admin = createAdminClient();
  const { data: barber } = await admin
    .from("barbers")
    .select("id")
    .eq("profile_id", session.user.id)
    .single();

  if (!barber) return { barberId: null, error: "Perfil de barbeiro não encontrado", status: 404 };
  return { barberId: barber.id, error: null, status: 200 };
}

export async function GET() {
  const { barberId, error, status } = await getBarberIdForSession();
  if (!barberId) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const { data: workingHours } = await admin
    .from("working_hours")
    .select("*")
    .eq("barber_id", barberId);

  const { data: timeBlocks } = await admin
    .from("time_blocks")
    .select("*")
    .eq("barber_id", barberId)
    .gte("end_at", new Date().toISOString())
    .order("start_at");

  return NextResponse.json({ workingHours: workingHours ?? [], timeBlocks: timeBlocks ?? [] });
}

export async function POST(req: NextRequest) {
  const { barberId, error, status } = await getBarberIdForSession();
  if (!barberId) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const body = await req.json();

  // Save working hours
  if (body.hours) {
    const hours = body.hours as Record<DayOfWeek, { start_time: string; end_time: string; is_active: boolean }>;

    for (const [day, val] of Object.entries(hours) as [DayOfWeek, typeof hours[DayOfWeek]][]) {
      if (val.is_active) {
        const { error: upsertErr } = await admin.from("working_hours").upsert({
          barber_id: barberId,
          day,
          start_time: val.start_time,
          end_time: val.end_time,
          is_active: true,
        }, { onConflict: "barber_id,day" });
        if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      } else {
        // Remove the record if it exists for inactive days
        await admin.from("working_hours").delete().eq("barber_id", barberId).eq("day", day);
      }
    }
  }

  // Add time block
  if (body.block) {
    const { start_at, end_at, reason } = body.block as { start_at: string; end_at: string; reason: string | null };
    const { error: blockErr } = await admin.from("time_blocks").insert({
      barber_id: barberId,
      start_at,
      end_at,
      reason: reason || null,
    });
    if (blockErr) return NextResponse.json({ error: blockErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { barberId, error, status } = await getBarberIdForSession();
  if (!barberId) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(req.url);
  const blockId = searchParams.get("blockId");
  if (!blockId) return NextResponse.json({ error: "blockId obrigatório" }, { status: 400 });

  const admin = createAdminClient();
  const { error: delErr } = await admin
    .from("time_blocks")
    .delete()
    .eq("id", blockId)
    .eq("barber_id", barberId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
