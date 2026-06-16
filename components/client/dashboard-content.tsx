"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Crown, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";

const STATUS_LABEL: Record<string, string> = {
  pending: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  confirmed: "bg-primary/15 text-primary border-primary/20",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  completed: "bg-white/5 text-white/40 border-white/10",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  no_show: "bg-red-500/15 text-red-400 border-red-500/20",
};

interface Appointment {
  id: string;
  scheduled_at: string;
  ends_at: string;
  status: string;
  barbers: { profiles: { full_name: string } | null } | null;
  services: { name: string } | null;
}

interface DashboardContentProps {
  firstName: string;
  activeAppointment: Appointment | null;
  recentAppointments: Appointment[];
  subscription: { status: string; plan_name: string; current_period_end: string | null } | null;
  appointmentCount: number;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function isPast(apt: Appointment) {
  return apt.status === "completed" || apt.status === "no_show" || new Date(apt.ends_at) < new Date();
}

function displayStatus(apt: Appointment) {
  if (!["cancelled", "completed", "no_show"].includes(apt.status) && new Date(apt.ends_at) < new Date()) return "Concluído";
  return STATUS_LABEL[apt.status] ?? apt.status;
}

function displayStatusColor(apt: Appointment) {
  if (!["cancelled", "completed", "no_show"].includes(apt.status) && new Date(apt.ends_at) < new Date()) return "bg-white/5 text-white/40 border-white/10";
  return STATUS_COLOR[apt.status] ?? "bg-white/5 text-white/40 border-white/10";
}

export function DashboardContent({
  firstName,
  activeAppointment,
  recentAppointments,
  subscription,
  appointmentCount,
}: DashboardContentProps) {
  const barberName = (activeAppointment?.barbers as { profiles: { full_name: string } | null } | null)?.profiles?.full_name;
  const serviceName = (activeAppointment?.services as { name: string } | null)?.name;

  const upcoming = recentAppointments.filter((a) => !isPast(a) && a.status !== "cancelled");
  const previous = recentAppointments.filter((a) => isPast(a) && a.status !== "cancelled");

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-5"
      variants={stagger(0.1)}
      initial="hidden"
      animate="show"
    >
      {/* Greeting */}
      <motion.div variants={fadeUp} className="pt-1">
        <h1 className="font-heading text-[28px] font-bold text-foreground leading-tight">
          Olá, {firstName}!
        </h1>
        <p className="text-sm text-white/40 mt-0.5">Pronto para um novo visual?</p>
      </motion.div>

      {/* Stat cards grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
        {/* Next appointment */}
        <div className="rounded-2xl bg-card border border-white/[0.06] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Próximo corte</p>
          </div>
          {activeAppointment ? (
            <>
              <p className="text-sm font-bold text-foreground leading-tight">
                {new Date(activeAppointment.scheduled_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
              </p>
              <p className="text-[11px] text-white/50 leading-tight">
                {new Date(activeAppointment.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {barberName}
              </p>
              <Link href="/client/history" className="text-[10px] text-primary font-medium tracking-wide uppercase flex items-center gap-0.5">
                VER DETALHES <ChevronRight className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs text-white/30">Nenhum agendado</p>
              <Link href="/client/schedule" className="text-[10px] text-primary font-medium tracking-wide uppercase flex items-center gap-0.5">
                AGENDAR <ChevronRight className="w-3 h-3" />
              </Link>
            </>
          )}
        </div>

        {/* Subscription */}
        <div className="rounded-2xl bg-card border border-white/[0.06] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M2 17l3.5-9L10 13l3-7 4.5 11H2z"/>
              </svg>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Assinatura</p>
          </div>
          {subscription ? (
            <>
              <p className="text-sm font-bold text-primary leading-tight">{subscription.plan_name}</p>
              {subscription.current_period_end && (
                <p className="text-[11px] text-white/40">
                  Ativo até {new Date(subscription.current_period_end).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
              <Link href="/client/subscription" className="text-[10px] text-primary font-medium tracking-wide uppercase flex items-center gap-0.5">
                GERENCIAR <ChevronRight className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs text-white/30">Sem plano ativo</p>
              <Link href="/client/subscription" className="text-[10px] text-primary font-medium tracking-wide uppercase flex items-center gap-0.5">
                ASSINAR <ChevronRight className="w-3 h-3" />
              </Link>
            </>
          )}
        </div>

        {/* Cuts this month */}
        <div className="rounded-2xl bg-card border border-white/[0.06] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>
              </svg>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Cortes este mês</p>
          </div>
          <p className="text-3xl font-heading font-semibold tracking-tight text-foreground">{appointmentCount}</p>
          <p className="text-[10px] text-white/30">na Sua Barbearia</p>
        </div>

        {/* Quick action */}
        <Link
          href="/client/schedule"
          className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex flex-col justify-between hover:bg-primary/15 active:scale-[0.97] transition-all"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-primary">Novo agendamento</p>
            <p className="text-[10px] text-primary/60 mt-0.5">Agendar agora →</p>
          </div>
        </Link>
      </motion.div>

      {/* Recent appointments */}
      <motion.div variants={fadeUp} className="rounded-2xl bg-card border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Agendamentos</p>
          <Link href="/client/history" className="text-[11px] text-primary hover:text-primary/80 font-medium uppercase tracking-wide">
            Ver todos →
          </Link>
        </div>

        {recentAppointments.filter(a => a.status !== "cancelled").length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-white/30">Nenhum agendamento encontrado.</p>
            <Link href="/client/schedule" className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
              Agendar agora
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recentAppointments
              .filter(a => a.status !== "cancelled")
              .slice(0, 4)
              .map((apt) => {
                const bName = (apt.barbers as { profiles: { full_name: string } | null } | null)?.profiles?.full_name ?? "Barbeiro";
                const sName = (apt.services as { name: string } | null)?.name ?? "Serviço";
                return (
                  <div key={apt.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-xs shrink-0">
                      {getInitials(bName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{sName}</p>
                      <p className="text-xs text-white/40 truncate">com {bName}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs text-white/50">
                        {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                      </p>
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", displayStatusColor(apt))}>
                        {displayStatus(apt)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </motion.div>

      {/* VIP upsell if not subscribed */}
      {!subscription && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-heading text-base font-bold text-primary">Eleve seu estilo.</p>
              <p className="font-heading text-base font-bold text-foreground">Seja VIP.</p>
              <p className="text-xs text-white/50 mt-1">Cortes ilimitados, prioridade e benefícios exclusivos.</p>
            </div>
            <Crown className="w-7 h-7 text-primary shrink-0" />
          </div>
          <Link
            href="/client/subscription"
            className={cn(buttonVariants(), "w-full justify-center mt-4 h-11")}
          >
            ASSINAR AGORA
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
