import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp, fmtDate, fmtTime } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 75 * 60 * 1000).toISOString();

  const { data: appointments, error } = await admin
    .from("appointments")
    .select(`
      id, scheduled_at,
      services ( name ),
      profiles!appointments_client_id_fkey ( full_name, phone ),
      barbers ( profiles!barbers_profile_id_fkey ( full_name ) )
    `)
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd)
    .in("status", ["pending", "confirmed"])
    .eq("reminder_sent", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const apts = appointments ?? [];
  let sent = 0;

  for (const apt of apts) {
    const clientP = apt.profiles as { full_name: string; phone: string | null } | null;
    const barberP = (apt.barbers as { profiles: { full_name: string } | null } | null)?.profiles;
    const svcName = (apt.services as { name: string } | null)?.name ?? "Serviço";
    const time = fmtTime(apt.scheduled_at);

    if (clientP?.phone) {
      await sendWhatsApp(
        clientP.phone,
        `⏰ *Lembrete de agendamento*\n\nSeu horário é em 1 hora!\n\n📋 ${svcName} com ${barberP?.full_name ?? "barbeiro"}\n⏰ ${time}\n\nBarbearia Santorini 💈`
      );
      sent++;
    }

    await admin
      .from("appointments")
      .update({ reminder_sent: true })
      .eq("id", apt.id);
  }

  return NextResponse.json({ ok: true, processed: apts.length, sent });
}
