import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Falta",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-400",
  confirmed: "text-primary",
  in_progress: "text-blue-400",
  completed: "text-muted-foreground",
  cancelled: "text-destructive",
  no_show: "text-destructive",
};

export default async function BarberDashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const admin = createAdminClient();

  const { data: barber } = await admin
    .from("barbers")
    .select("id")
    .eq("profile_id", session.user.id)
    .single();

  if (!barber) {
    return (
      <div className="p-8 text-muted-foreground text-center">
        Perfil de barbeiro não encontrado. Contate o administrador.
      </div>
    );
  }

  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data: todayApts } = await admin
    .from("appointments")
    .select(
      `id, scheduled_at, ends_at, status, notes,
       profiles!appointments_client_id_fkey ( full_name, phone ),
       services ( name, duration_minutes )`
    )
    .eq("barber_id", barber.id)
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .not("status", "in", '("cancelled","no_show")')
    .order("scheduled_at");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Agenda de Hoje
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="space-y-3">
        {!todayApts || todayApts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhum agendamento para hoje.
            </p>
          </div>
        ) : (
          todayApts.map((apt) => {
            const client = apt.profiles as { full_name: string; phone: string | null } | null;
            const service = apt.services as { name: string; duration_minutes: number } | null;
            return (
              <div
                key={apt.id}
                className="rounded-xl border border-border bg-card px-5 py-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{client?.full_name}</p>
                  <span className={`text-xs font-medium ${STATUS_COLOR[apt.status]}`}>
                    {STATUS_LABEL[apt.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {service?.name} · {service?.duration_minutes} min
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    {new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(apt.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {client?.phone && <span>{client.phone}</span>}
                </div>
                {apt.notes && (
                  <p className="text-xs text-muted-foreground italic">{apt.notes}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
