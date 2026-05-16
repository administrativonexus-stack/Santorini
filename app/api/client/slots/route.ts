import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DayOfWeek } from "@/types/database";

const JS_TO_DB_DAY: Record<number, DayOfWeek> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

const TIMEZONE = "America/Sao_Paulo";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  return `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
}

// Converts a UTC Date to local minutes (hours*60+minutes) in the barbershop timezone.
// Avoids getHours()/getMinutes() which return UTC on a Node.js UTC server.
function toLocalMinutes(utcDate: Date): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(utcDate);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const barberId = searchParams.get("barberId");
  const dateStr = searchParams.get("date");      // "YYYY-MM-DD"
  const duration = parseInt(searchParams.get("duration") ?? "30");

  if (!barberId || !dateStr) {
    return NextResponse.json({ error: "barberId e date são obrigatórios" }, { status: 400 });
  }

  const date = new Date(dateStr + "T12:00:00"); // noon to avoid timezone issues
  const dayKey = JS_TO_DB_DAY[date.getDay()];
  const dayStart = `${dateStr}T00:00:00`;
  const dayEnd = `${dateStr}T23:59:59`;

  const admin = createAdminClient();

  const [{ data: wh }, { data: existing }, { data: blocks }] = await Promise.all([
    admin
      .from("working_hours")
      .select("start_time, end_time")
      .eq("barber_id", barberId)
      .eq("day", dayKey)
      .eq("is_active", true)
      .maybeSingle(),
    admin
      .from("appointments")
      .select("scheduled_at, ends_at")
      .eq("barber_id", barberId)
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .in("status", ["pending", "confirmed", "in_progress"]),
    admin
      .from("time_blocks")
      .select("start_at, end_at")
      .eq("barber_id", barberId)
      .gte("start_at", dayStart)
      .lte("start_at", dayEnd),
  ]);

  if (!wh) return NextResponse.json({ slots: [] });

  const startMin = timeToMinutes(wh.start_time);
  const endMin = timeToMinutes(wh.end_time);

  const busy: { start: number; end: number }[] = [];
  (existing ?? []).forEach((apt) => {
    busy.push({
      start: toLocalMinutes(new Date(apt.scheduled_at)),
      end: toLocalMinutes(new Date(apt.ends_at)),
    });
  });
  (blocks ?? []).forEach((blk) => {
    busy.push({
      start: toLocalMinutes(new Date(blk.start_at)),
      end: toLocalMinutes(new Date(blk.end_at)),
    });
  });

  const now = new Date();
  const localDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(now);
  const isToday = dateStr === localDateStr;
  const nowMin = isToday ? toLocalMinutes(now) + 30 : 0;

  const slots: string[] = [];
  for (let t = startMin; t + duration <= endMin; t += duration) {
    if (t < nowMin) continue;
    const slotEnd = t + duration;
    if (!busy.some((b) => t < b.end && slotEnd > b.start)) {
      slots.push(minutesToTime(t));
    }
  }

  return NextResponse.json({ slots });
}
