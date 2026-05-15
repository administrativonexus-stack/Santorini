import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BENEFITS = [
  "Cortes ilimitados ao longo do mês",
  "Agendamento com qualquer barbeiro disponível",
  "Prioridade no atendimento",
  "Acesso exclusivo a horários premium",
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
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Plano VIP</h1>
        <p className="text-muted-foreground mt-1">Assinatura recorrente BARBERFLIX.</p>
      </div>

      <div className="rounded-xl border-2 border-primary/30 bg-card p-6 space-y-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading text-xl font-bold text-primary tracking-wider">VIP BARBERFLIX</p>
            <p className="text-sm text-muted-foreground mt-0.5">Barbearia Santorini</p>
          </div>
          {isActive && (
            <Badge className="bg-primary/20 text-primary border-primary/30">Ativo</Badge>
          )}
        </div>

        <div>
          <span className="font-heading text-4xl font-bold text-foreground">R$ 89,90</span>
          <span className="text-muted-foreground text-sm">/mês</span>
        </div>

        <ul className="space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm text-foreground">
              <span className="text-primary text-base">✓</span>
              {b}
            </li>
          ))}
        </ul>

        {isActive ? (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Próxima cobrança:{" "}
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                : "—"}
            </p>
            <Button variant="outline" className="w-full" disabled>
              Assinatura ativa
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-muted-foreground">
              Integração com Stripe em breve. Entre em contato para ativar manualmente.
            </p>
            <Link
              href="https://wa.me/"
              target="_blank"
              className={cn(buttonVariants(), "w-full justify-center")}
            >
              Falar no WhatsApp
            </Link>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Cancele quando quiser. Sem multa ou taxa de falta.
      </p>
    </div>
  );
}
