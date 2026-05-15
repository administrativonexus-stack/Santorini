import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const barberId = searchParams.get("barberId");
  if (!barberId) return NextResponse.json({ error: "barberId obrigatório" }, { status: 400 });

  const admin = createAdminClient();

  // Check VIP status for the logged-in client
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("client_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();
  const isVip = !!sub;

  // Get services assigned to this barber, fallback to all active services
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

  return NextResponse.json({ services: services ?? [], isVip });
}
