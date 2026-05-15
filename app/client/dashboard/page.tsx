import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  in_progress: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
};

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const admin = createAdminClient();

  const [{ data: profile }, { data: activeAppointment }, { data: subscription }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single(),

      admin
        .from("appointments")
        .select(
          `id, scheduled_at, ends_at, status, price_paid,
           barbers ( profiles ( full_name ) ),
           services ( name, duration_minutes, price )`
        )
        .eq("client_id", user.id)
        .in("status", ["pending", "confirmed", "in_progress"])
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle(),

      admin
        .from("subscriptions")
        .select("status, plan_name, current_period_end")
        .eq("client_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Cliente";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Olá, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo à sua área exclusiva.
        </p>
      </div>

      {/* Subscription status */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Plano
          </p>
          {subscription ? (
            <>
              <p className="font-heading text-lg font-semibold text-primary">
                {subscription.plan_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Válido até{" "}
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-foreground">
                Sem assinatura ativa
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assine o Plano VIP e ganhe cortes ilimitados
              </p>
            </>
          )}
        </div>
        {subscription ? (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            VIP Ativo
          </Badge>
        ) : (
          <Link href="/client/subscription" className={cn(buttonVariants({ size: "sm" }))}>
            Assinar VIP
          </Link>
        )}
      </div>

      {/* Upcoming appointment */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Próximo agendamento
        </p>
        {activeAppointment ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">
                  {(activeAppointment.services as { name: string } | null)?.name}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  com{" "}
                  {(
                    (activeAppointment.barbers as { profiles: { full_name: string } | null } | null)
                      ?.profiles as { full_name: string } | null
                  )?.full_name ?? "Barbeiro"}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[activeAppointment.status]}>
                {STATUS_LABEL[activeAppointment.status]}
              </Badge>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Data: </span>
                <span className="text-foreground font-medium">
                  {new Date(activeAppointment.scheduled_at).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Hora: </span>
                <span className="text-foreground font-medium">
                  {new Date(activeAppointment.scheduled_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/client/history" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                Ver detalhes
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Você não tem agendamentos ativos.
            </p>
            <Link href="/client/schedule" className={cn(buttonVariants())}>
              Agendar agora
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {!activeAppointment && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/client/schedule"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto py-4 flex-col gap-1.5"
            )}
          >
            <span className="text-xl">📅</span>
            <span className="text-sm">Agendar</span>
          </Link>
          <Link
            href="/client/history"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto py-4 flex-col gap-1.5"
            )}
          >
            <span className="text-xl">🕐</span>
            <span className="text-sm">Histórico</span>
          </Link>
        </div>
      )}
    </div>
  );
}
