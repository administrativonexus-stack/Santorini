"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

const STATUS_LABEL: Record<string, string> = {
  pending: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  confirmed: "bg-primary/15 text-primary border-primary/20",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  completed: "bg-white/5 text-white/40 border-white/10",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  no_show: "bg-red-500/15 text-red-400 border-red-500/20",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-blue-400",
  confirmed: "bg-primary",
  in_progress: "bg-blue-400",
  completed: "bg-white/20",
  cancelled: "bg-red-400",
  no_show: "bg-red-400",
};

interface AptRow {
  id: string;
  scheduled_at: string;
  ends_at: string;
  status: string;
  price_paid: number | null;
  barbers: { profiles: { full_name: string } | null } | null;
  services: { name: string; duration_minutes: number } | null;
}

function isPast(apt: AptRow) {
  return apt.status === "completed" || apt.status === "no_show" || new Date(apt.ends_at) < new Date();
}

function displayLabel(apt: AptRow) {
  if (!["cancelled", "completed", "no_show"].includes(apt.status) && new Date(apt.ends_at) < new Date()) return "Concluído";
  return STATUS_LABEL[apt.status] ?? apt.status;
}

function displayStyle(apt: AptRow) {
  if (!["cancelled", "completed", "no_show"].includes(apt.status) && new Date(apt.ends_at) < new Date()) return "bg-white/5 text-white/40 border-white/10";
  return STATUS_STYLE[apt.status] ?? "bg-white/5 text-white/40 border-white/10";
}

function displayDot(apt: AptRow) {
  if (!["cancelled", "completed", "no_show"].includes(apt.status) && new Date(apt.ends_at) < new Date()) return "bg-white/20";
  return STATUS_DOT[apt.status] ?? "bg-white/20";
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function HistoryPage() {
  const [appointments, setAppointments] = useState<AptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "previous">("upcoming");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/client/appointments");
    if (!res.ok) { setLoading(false); return; }
    const { appointments: data } = await res.json();
    setAppointments(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function cancel(id: string) {
    if (!confirm("Cancelar este agendamento?")) return;
    setCancelling(id);
    setError("");
    const res = await fetch("/api/client/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    setCancelling(null);
    if (!res.ok) { setError(json.error ?? "Erro ao cancelar."); return; }
    load();
  }

  function canCancel(apt: AptRow) {
    if (!["pending", "confirmed"].includes(apt.status)) return false;
    return new Date(apt.scheduled_at).getTime() - Date.now() > 2 * 60 * 60 * 1000;
  }

  const visible = appointments.filter((a) => a.status !== "cancelled");
  const upcoming = visible.filter((a) => !isPast(a));
  const previous = visible.filter((a) => isPast(a));
  const list = tab === "upcoming" ? upcoming : previous;
  const totalVisits = visible.filter((a) => isPast(a)).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="h-8 w-40 rounded-xl bg-card animate-pulse" />
        <div className="h-12 rounded-xl bg-card animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <h1 className="font-heading text-[26px] font-bold text-foreground">Histórico</h1>
        {totalVisits > 0 && (
          <p className="text-sm text-white/40 mt-0.5">
            {totalVisits} {totalVisits === 1 ? "visita" : "visitas"} na Sua Barbearia
          </p>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.08 }}
        className="flex p-1 bg-card border border-white/[0.06] rounded-xl gap-1"
      >
        {(["upcoming", "previous"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              tab === t
                ? "bg-primary text-background font-semibold"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {t === "upcoming" ? "Agendamentos" : "Anteriores"}
            {t === "upcoming" && upcoming.length > 0 && (
              <span className={cn(
                "text-[10px] rounded-full w-[18px] h-[18px] flex items-center justify-center font-bold",
                tab === "upcoming" ? "bg-background/25 text-background" : "bg-primary/20 text-primary"
              )}>
                {upcoming.length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {list.length === 0 ? (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="rounded-2xl border border-white/[0.06] bg-card p-12 text-center space-y-3"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  {tab === "upcoming" ? (
                    <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>
                  ) : (
                    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>
                  )}
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">
                {tab === "upcoming" ? "Nenhum agendamento ativo" : "Nenhuma visita anterior"}
              </p>
              <p className="text-xs text-white/30">
                {tab === "upcoming" ? "Que tal agendar agora?" : "Suas visitas aparecerão aqui"}
              </p>
              {tab === "upcoming" && (
                <Link href="/client/schedule" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mt-2">
                  Agendar agora →
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {list.map((apt, i) => {
                const bName = (apt.barbers?.profiles as { full_name: string } | null)?.full_name ?? "Barbeiro";
                const sName = apt.services?.name ?? "Serviço";
                const isActive = tab === "upcoming";
                return (
                  <motion.div
                    key={apt.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "rounded-2xl border bg-card px-5 py-4 space-y-3 relative overflow-hidden",
                      isActive ? "border-white/[0.07] hover:border-primary/20" : "border-white/[0.04] opacity-80"
                    )}
                  >
                    <div className={cn("absolute left-0 top-4 bottom-4 w-0.5 rounded-full", displayDot(apt))} />

                    <div className="flex items-center gap-3 pl-3">
                      <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-xs shrink-0">
                        {getInitials(bName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{sName}</p>
                        <p className="text-xs text-white/40 truncate">com {bName}</p>
                      </div>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0", displayStyle(apt))}>
                        {displayLabel(apt)}
                      </span>
                    </div>

                    <div className="pl-3 flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                        {new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="pl-3 flex items-center gap-3">
                      {!isActive && (
                        <Link href="/client/schedule" className="text-xs text-primary font-medium hover:text-primary/80 transition-colors">
                          Reagendar →
                        </Link>
                      )}
                      {isActive && canCancel(apt) && (
                        <button
                          onClick={() => cancel(apt.id)}
                          disabled={cancelling === apt.id}
                          className="text-xs text-white/25 hover:text-red-400 transition-colors"
                        >
                          {cancelling === apt.id ? "Cancelando..." : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
