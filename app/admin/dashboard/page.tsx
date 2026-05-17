import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface Stat {
  label: string;
  value: string | number;
}

const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  confirmed:   "bg-primary/15 text-primary border border-primary/20",
  in_progress: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  completed:   "bg-green-500/15 text-green-400 border border-green-500/20",
  cancelled:   "bg-red-500/15 text-red-400 border border-red-500/20",
  no_show:     "bg-red-500/15 text-red-400 border border-red-500/20",
};

const STATUS_DOT: Record<string, string> = {
  pending:     "bg-blue-400",
  confirmed:   "bg-primary",
  in_progress: "bg-blue-400",
  completed:   "bg-green-400",
  cancelled:   "bg-red-400",
  no_show:     "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Agendado",
  confirmed:   "Confirmado",
  in_progress: "Em andamento",
  completed:   "Concluído",
  cancelled:   "Cancelado",
  no_show:     "Falta",
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
    ).order("scheduled_at", { ascending: false }).limit(10),
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
                <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5 relative overflow-hidden">
                  <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${STATUS_DOT[apt.status] ?? "bg-white/20"}`} />
                  <div className="min-w-0 flex-1 pl-3">
                    <p className="text-sm font-medium text-foreground truncate">{client?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{service?.name} · {barberProfile?.full_name}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(apt.scheduled_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[apt.status] ?? "bg-white/5 text-white/40 border border-white/10"}`}>
                      {STATUS_LABEL[apt.status] ?? apt.status}
                    </span>
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
