import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const barberId = searchParams.get("barberId");
  if (!barberId) return NextResponse.json({ error: "barberId obrigatório" }, { status: 400 });

  const admin = createAdminClient();

  const { data: barberServices } = await admin
    .from("barber_services")
    .select("service_id")
    .eq("barber_id", barberId);

  let services;
  if (barberServices && barberServices.length > 0) {
    const ids = barberServices.map((bs) => bs.service_id);
    const { data } = await admin
      .from("services")
      .select("id, name, description, price, duration_minutes, category")
      .in("id", ids)
      .eq("is_active", true)
      .order("name");
    services = data;
  } else {
    const { data } = await admin
      .from("services")
      .select("id, name, description, price, duration_minutes, category")
      .eq("is_active", true)
      .order("name");
    services = data;
  }

  return NextResponse.json({ services: services ?? [] });
}
