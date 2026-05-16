import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { icon: "✂", text: "Cortes ilimitados ao longo do mês" },
  { icon: "⚡", text: "Agendamento com qualquer barbeiro" },
  { icon: "⭐", text: "Prioridade no atendimento" },
  { icon: "🕐", text: "Acesso a horários premium exclusivos" },
];

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("*")
    .eq("client_id", session.user.id)
    .maybeSingle();

  const isActive = subscription?.status === "active";

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Assinatura VIP</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Experiência premium sem limites.</p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-primary/30 bg-card relative overflow-hidden glow-gold-sm">
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="p-6 space-y-6 relative">
          {/* Plan header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-1">Plano</p>
              <p className="font-heading text-2xl font-bold text-primary tracking-wider">VIP BARBERFLIX</p>
              <p className="text-xs text-muted-foreground mt-0.5">Barbearia Santorini</p>
            </div>
            <div className="text-3xl">♛</div>
          </div>

          {/* Price */}
          <div className="flex items-end gap-1">
            <span className="font-heading text-5xl font-bold text-foreground leading-none">89</span>
            <div className="mb-1">
              <span className="text-xl font-bold text-foreground">,90</span>
              <span className="text-muted-foreground text-sm block leading-tight">/mês</span>
            </div>
          </div>

          {/* Benefits */}
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-sm text-foreground">
                <span className="h-7 w-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs shrink-0">
                  {b.icon}
                </span>
                {b.text}
              </li>
            ))}
          </ul>

          {/* CTA */}
          {isActive ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-primary/20 text-primary border-primary/30 glow-gold-xs">♛ Ativo</Badge>
              </div>
              {subscription?.current_period_end && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Próxima cobrança</span>
                  <span className="font-medium text-foreground">
                    {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              <Button variant="outline" className="w-full h-11 mt-2" disabled>
                Assinatura ativa
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-muted-foreground text-center">
                Integração com pagamento em breve. Entre em contato para ativar.
              </p>
              <Link
                href="https://wa.me/"
                target="_blank"
                className={cn(buttonVariants(), "w-full justify-center h-11")}
              >
                Falar no WhatsApp
              </Link>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Cancele quando quiser · Sem multa ou taxa
      </p>
    </div>
  );
}
