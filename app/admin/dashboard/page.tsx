import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppointmentsTabs } from "@/components/admin/appointments-tabs";

interface Stat {
  label: string;
  value: string | number;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const admin = createAdminClient();

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [
    { count: totalActiveSubscriptions },
    { count: todayAppointments },
    { count: monthAppointments },
    { data: recentAppointments },
  ] = await Promise.all([
    admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_at", startOfDay).not("status", "in", '("cancelled","no_show")'),
    admin.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_at", startOfMonth).not("status", "in", '("cancelled","no_show")'),
    admin.from("appointments").select(
      `id, scheduled_at, ends_at, status, guest_name,
       profiles!appointments_client_id_fkey ( full_name ),
       services ( name ),
       barbers ( profiles ( full_name ) )`
    ).order("scheduled_at", { ascending: false }).limit(30),
  ]);

  const stats: Stat[] = [
    { label: "Assinaturas VIP ativas", value: totalActiveSubscriptions ?? 0 },
    { label: "Agendamentos hoje", value: todayAppointments ?? 0 },
    { label: "Agendamentos este mês", value: monthAppointments ?? 0 },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da Barbearia Santorini.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <AppointmentsTabs appointments={(recentAppointments ?? []) as Parameters<typeof AppointmentsTabs>[0]["appointments"]} />
    </div>
  );
}
