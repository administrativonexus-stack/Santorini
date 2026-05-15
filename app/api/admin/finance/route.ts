import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "month";

  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (period === "lastmonth") {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === "year") {
    periodStart = new Date(now.getFullYear(), 0, 1);
    periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const [{ data: appointments }, { count: vipCount }] = await Promise.all([
    admin
      .from("appointments")
      .select(`
        id, price_paid, status, scheduled_at, barber_id,
        services ( name, price ),
        barbers ( commission_rate, profiles!barbers_profile_id_fkey ( full_name ) )
      `)
      .gte("scheduled_at", periodStart.toISOString())
      .lte("scheduled_at", periodEnd.toISOString())
      .not("status", "in", '("cancelled","no_show","pending")'),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const apts = appointments ?? [];

  // Summary
  const totalRevenue = apts.reduce((sum, a) => sum + (a.price_paid ?? 0), 0);
  const appointmentCount = apts.length;
  const avgTicket = appointmentCount > 0 ? totalRevenue / appointmentCount : 0;

  // Daily revenue grouped by date
  const dailyMap = new Map<string, number>();
  for (const apt of apts) {
    const date = apt.scheduled_at.split("T")[0];
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + (apt.price_paid ?? 0));
  }
  const dailyRevenue = Array.from(dailyMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Service ranking
  const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const apt of apts) {
    const svc = apt.services as { name: string; price: number } | null;
    const name = svc?.name ?? "Desconhecido";
    const prev = serviceMap.get(name) ?? { name, count: 0, revenue: 0 };
    serviceMap.set(name, {
      name,
      count: prev.count + 1,
      revenue: prev.revenue + (apt.price_paid ?? 0),
    });
  }
  const serviceRanking = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count);

  // Barber ranking
  const barberMap = new Map<string, { name: string; count: number; revenue: number; commissionRate: number }>();
  for (const apt of apts) {
    const barber = apt.barbers as { commission_rate: number; profiles: { full_name: string } | null } | null;
    if (!barber) continue;
    const name = barber.profiles?.full_name ?? "Desconhecido";
    const commissionRate = Number(barber.commission_rate) ?? 50;
    const prev = barberMap.get(apt.barber_id) ?? { name, count: 0, revenue: 0, commissionRate };
    barberMap.set(apt.barber_id, {
      name,
      count: prev.count + 1,
      revenue: prev.revenue + (apt.price_paid ?? 0),
      commissionRate,
    });
  }

  const barberRanking = Array.from(barberMap.values())
    .map((b) => ({
      name: b.name,
      count: b.count,
      revenue: Math.round(b.revenue * 100) / 100,
      commissionRate: b.commissionRate,
      commission: Math.round(b.revenue * (b.commissionRate / 100) * 100) / 100,
      repasse: Math.round(b.revenue * (1 - b.commissionRate / 100) * 100) / 100,
      avgTicket: b.count > 0 ? Math.round((b.revenue / b.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      appointmentCount,
      avgTicket: Math.round(avgTicket * 100) / 100,
      vipCount: vipCount ?? 0,
    },
    dailyRevenue,
    serviceRanking,
    barberRanking,
  });
}
