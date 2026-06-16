import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp, fmtDate, fmtTime } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { barberId, serviceId, scheduledAt, endsAt, guestName, guestPhone } = body as {
    barberId: string;
    serviceId: string;
    scheduledAt: string;
    endsAt: string;
    guestName: string;
    guestPhone: string;
  };

  if (!barberId || !serviceId || !scheduledAt || !endsAt || !guestName?.trim() || !guestPhone?.trim()) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: svcRow } = await admin.from("services").select("price").eq("id", serviceId).single();

  const { error } = await admin.from("appointments").insert({
    client_id: null,
    barber_id: barberId,
    service_id: serviceId,
    scheduled_at: scheduledAt,
    ends_at: endsAt,
    status: "pending",
    price_paid: svcRow?.price ?? 0,
    guest_name: guestName.trim(),
    guest_phone: guestPhone.trim(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este horário acabou de ser reservado. Escolha outro horário." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify barber via WhatsApp
  const [{ data: barberRow }, { data: serviceRow }] = await Promise.all([
    admin.from("barbers").select("profile_id").eq("id", barberId).single(),
    admin.from("services").select("name").eq("id", serviceId).single(),
  ]);

  const barberProfile = barberRow
    ? (await admin.from("profiles").select("full_name, phone").eq("id", barberRow.profile_id).single()).data
    : null;

  const svcName = serviceRow?.name ?? "Serviço";
  const date = fmtDate(scheduledAt);
  const time = fmtTime(scheduledAt);

  await Promise.all([
    guestPhone
      ? sendWhatsApp(guestPhone, `✅ *Agendamento confirmado!*\n\n📋 Serviço: ${svcName}\n✂️ Barbeiro: ${barberProfile?.full_name ?? "—"}\n📅 ${date}\n⏰ ${time}\n\nSua Barbearia 💈`)
      : Promise.resolve(),
    barberProfile?.phone
      ? sendWhatsApp(barberProfile.phone, `📅 *Novo agendamento!*\n\n👤 Cliente: ${guestName.trim()}\n📋 Serviço: ${svcName}\n📅 ${date}\n⏰ ${time}`)
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
