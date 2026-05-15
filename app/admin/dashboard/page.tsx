import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface Stat {
  label: string;
  value: string | number;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-400",
  confirmed: "text-primary",
  in_progress: "text-blue-400",
  completed: "text-muted-foreground",
  cancelled: "text-destructive",
  no_show: "text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Falta",
};

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
      `id, scheduled_at, status,
       profiles!appointments_client_id_fkey ( full_name ),
       services ( name ),
       barbers ( profiles ( full_name ) )`
    ).order("scheduled_at", { ascending: false }).limit(8),
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

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-medium text-foreground">Agendamentos recentes</p>
        </div>
        <div className="divide-y divide-border">
          {recentAppointments && recentAppointments.length > 0 ? (
            recentAppointments.map((apt) => {
              const client = apt.profiles as { full_name: string } | null;
              const service = apt.services as { name: string } | null;
              const barberProfile = (apt.barbers as { profiles: { full_name: string } | null } | null)?.profiles;
              return (
                <div key={apt.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{client?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{service?.name} · {barberProfile?.full_name}</p>
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(apt.scheduled_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className={`text-xs font-medium ${STATUS_COLOR[apt.status] ?? "text-muted-foreground"}`}>
                      {STATUS_LABEL[apt.status] ?? apt.status}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhum agendamento encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
