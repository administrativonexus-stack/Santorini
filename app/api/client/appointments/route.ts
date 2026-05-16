import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp, fmtDate, fmtTime } from "@/lib/whatsapp";

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select(
      `id, scheduled_at, ends_at, status, price_paid,
       barbers ( profiles ( full_name ) ),
       services ( name, duration_minutes )`
    )
    .eq("client_id", session.user.id)
    .order("scheduled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appointments: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const admin = createAdminClient();

  // Fetch full details for ownership check + WhatsApp notification
  const { data: apt } = await admin
    .from("appointments")
    .select(`
      client_id, status, scheduled_at,
      services ( name ),
      profiles!appointments_client_id_fkey ( full_name, phone ),
      barbers ( profiles!barbers_profile_id_fkey ( full_name, phone ) )
    `)
    .eq("id", id)
    .single();

  if (!apt || apt.client_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["pending", "confirmed"].includes(apt.status)) {
    return NextResponse.json({ error: "Agendamento não pode ser cancelado." }, { status: 400 });
  }
  const diffMs = new Date(apt.scheduled_at).getTime() - Date.now();
  if (diffMs < 2 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "Cancelamento só é permitido com mais de 2h de antecedência." }, { status: 400 });
  }

  const { error: upErr } = await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // WhatsApp notifications (fire and forget)
  const svcName = (apt.services as { name: string } | null)?.name ?? "Serviço";
  const date = fmtDate(apt.scheduled_at);
  const time = fmtTime(apt.scheduled_at);
  const clientProfile = apt.profiles as { full_name: string; phone: string | null } | null;
  const barberProfile = (apt.barbers as { profiles: { full_name: string; phone: string | null } | null } | null)?.profiles;

  if (clientProfile?.phone) {
    sendWhatsApp(
      clientProfile.phone,
      `❌ *Agendamento cancelado*\n\nSeu agendamento de *${svcName}* em ${date} às ${time} foi cancelado.\n\nPara reagendar acesse o app. Barbearia Santorini 💈`
    );
  }
  if (barberProfile?.phone) {
    sendWhatsApp(
      barberProfile.phone,
      `❌ *Agendamento cancelado*\n\nO cliente *${clientProfile?.full_name ?? "—"}* cancelou o agendamento de ${svcName} em ${date} às ${time}.`
    );
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { barberId, serviceId, scheduledAt, endsAt, isVip, servicePrice } = body as {
    barberId: string;
    serviceId: string;
    scheduledAt: string;
    endsAt: string;
    isVip: boolean;
    servicePrice: number;
  };

  if (!barberId || !serviceId || !scheduledAt || !endsAt) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Auto-complete past active appointments so the unique constraint doesn't block new bookings
  await admin
    .from("appointments")
    .update({ status: "completed" })
    .eq("client_id", session.user.id)
    .in("status", ["pending", "confirmed", "in_progress"])
    .lt("ends_at", new Date().toISOString());

  // Verify VIP server-side to prevent price manipulation
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("client_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();
  const pricePaid = sub ? 0 : servicePrice;

  const { error } = await admin.from("appointments").insert({
    client_id: session.user.id,
    barber_id: barberId,
    service_id: serviceId,
    scheduled_at: scheduledAt,
    ends_at: endsAt,
    status: "pending",
    price_paid: pricePaid,
  });

  if (error) {
    if (error.code === "23505") {
      const isBarberConflict =
        error.message.includes("one_slot_per_barber") ||
        (error.details ?? "").includes("barber_id");
      return NextResponse.json(
        {
          error: isBarberConflict
            ? "Este horário acabou de ser reservado. Escolha outro horário."
            : "Você já tem um agendamento ativo. Cancele-o antes de criar um novo.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch full details for WhatsApp notification
  const { data: full } = await admin
    .from("appointments")
    .select(`
      scheduled_at,
      services ( name ),
      profiles!appointments_client_id_fkey ( full_name, phone ),
      barbers ( profiles!barbers_profile_id_fkey ( full_name, phone ) )
    `)
    .eq("client_id", session.user.id)
    .eq("barber_id", barberId)
    .eq("scheduled_at", scheduledAt)
    .single();

  if (full) {
    const svcName = (full.services as { name: string } | null)?.name ?? "Serviço";
    const date = fmtDate(full.scheduled_at);
    const time = fmtTime(full.scheduled_at);
    const clientP = full.profiles as { full_name: string; phone: string | null } | null;
    const barberP = (full.barbers as { profiles: { full_name: string; phone: string | null } | null } | null)?.profiles;

    if (clientP?.phone) {
      sendWhatsApp(
        clientP.phone,
        `✅ *Agendamento confirmado!*\n\n📋 Serviço: ${svcName}\n✂️ Barbeiro: ${barberP?.full_name ?? "—"}\n📅 ${date}\n⏰ ${time}\n\nBarbearia Santorini 💈`
      );
    }
    if (barberP?.phone) {
      sendWhatsApp(
        barberP.phone,
        `📅 *Novo agendamento!*\n\n👤 Cliente: ${clientP?.full_name ?? "—"}\n📋 Serviço: ${svcName}\n📅 ${date}\n⏰ ${time}`
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
