import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-primary/15 text-primary border-primary/30",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  no_show: "bg-destructive/15 text-destructive border-destructive/30",
};

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const admin = createAdminClient();

  const [{ data: profile }, { data: activeAppointment }, { data: subscription }] =
    await Promise.all([
      admin.from("profiles").select("full_name").eq("id", user.id).single(),
      admin
        .from("appointments")
        .select(`id, scheduled_at, ends_at, status,
           barbers ( profiles ( full_name ) ),
           services ( name, duration_minutes, price )`)
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
  const barberName = (activeAppointment?.barbers as { profiles: { full_name: string } | null } | null)?.profiles?.full_name;
  const serviceName = (activeAppointment?.services as { name: string } | null)?.name;

  return (
    <div className="space-y-5 max-w-lg mx-auto">

      {/* Hero greeting */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-1">
          Barbearia Santorini
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Olá, {firstName}
          </h1>
          {subscription ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-primary/40 text-primary bg-primary/10 glow-gold-xs">
              ♛ VIP
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground">
              Cliente
            </span>
          )}
        </div>
      </div>

      {/* Next appointment card */}
      <div className={cn(
        "rounded-2xl border p-5 space-y-4 relative overflow-hidden",
        activeAppointment
          ? "border-primary/30 bg-card glow-gold-sm"
          : "border-border bg-card"
      )}>
        {/* Top gradient line */}
        {activeAppointment && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        )}

        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">
          {activeAppointment ? "Próximo agendamento" : "Sem agendamento ativo"}
        </p>

        {activeAppointment ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-xl font-bold text-foreground">
                  {serviceName}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  com <span className="text-foreground">{barberName ?? "Barbeiro"}</span>
                </p>
              </div>
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border shrink-0",
                STATUS_COLOR[activeAppointment.status] ?? ""
              )}>
                {STATUS_LABEL[activeAppointment.status]}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-foreground">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span className="font-medium">
                  {new Date(activeAppointment.scheduled_at).toLocaleDateString("pt-BR", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/>
                </svg>
                <span className="font-medium">
                  {new Date(activeAppointment.scheduled_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <Link
              href="/client/history"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
            >
              Ver detalhes
            </Link>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Agende seu próximo corte agora mesmo.
            </p>
            <Link href="/client/schedule" className={cn(buttonVariants(), "w-full justify-center h-11")}>
              Agendar agora
            </Link>
          </div>
        )}
      </div>

      {/* VIP card */}
      <div className={cn(
        "rounded-2xl border p-5 relative overflow-hidden",
        subscription ? "border-primary/20 bg-card" : "border-border bg-card"
      )}>
        {subscription && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-1">Assinatura</p>
            {subscription ? (
              <>
                <p className="font-heading text-base font-bold text-primary">{subscription.plan_name}</p>
                {subscription.current_period_end && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Válido até {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-medium text-foreground text-sm">Plano gratuito</p>
                <p className="text-xs text-muted-foreground mt-0.5">Assine o VIP e tenha cortes ilimitados</p>
              </>
            )}
          </div>
          {subscription ? (
            <span className="text-2xl">♛</span>
          ) : (
            <Link
              href="/client/subscription"
              className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
            >
              Assinar
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions — only when no active appointment */}
      {!activeAppointment && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/client/schedule"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-5 min-h-[88px] hover:border-primary/40 transition-colors active:scale-95"
          >
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span className="text-sm font-medium text-foreground">Agendar</span>
          </Link>
          <Link
            href="/client/history"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-5 min-h-[88px] hover:border-primary/40 transition-colors active:scale-95"
          >
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-medium text-foreground">Histórico</span>
          </Link>
        </div>
      )}
    </div>
  );
}
