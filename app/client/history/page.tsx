"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-primary",
  confirmed: "bg-primary",
  in_progress: "bg-blue-400",
  completed: "bg-muted-foreground",
  cancelled: "bg-destructive",
  no_show: "bg-destructive",
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

function isPast(apt: AptRow): boolean {
  return (
    apt.status === "completed" ||
    apt.status === "no_show" ||
    new Date(apt.ends_at) < new Date()
  );
}

function displayLabel(apt: AptRow): string {
  if (
    apt.status !== "cancelled" &&
    apt.status !== "completed" &&
    apt.status !== "no_show" &&
    new Date(apt.ends_at) < new Date()
  ) return "Concluído";
  return STATUS_LABEL[apt.status] ?? apt.status;
}

function displayDot(apt: AptRow): string {
  if (
    apt.status !== "cancelled" &&
    apt.status !== "completed" &&
    apt.status !== "no_show" &&
    new Date(apt.ends_at) < new Date()
  ) return "bg-muted-foreground";
  return STATUS_DOT[apt.status] ?? "bg-muted";
}

function displayVariant(apt: AptRow): "default" | "secondary" | "destructive" | "outline" {
  if (
    apt.status !== "cancelled" &&
    apt.status !== "completed" &&
    apt.status !== "no_show" &&
    new Date(apt.ends_at) < new Date()
  ) return "outline";
  if (apt.status === "pending" || apt.status === "confirmed" || apt.status === "in_progress") return "default";
  if (apt.status === "cancelled" || apt.status === "no_show") return "destructive";
  return "outline";
}

export default function HistoryPage() {
  const [appointments, setAppointments] = useState<AptRow[]>([]);
  const [tab, setTab] = useState<"upcoming" | "previous">("upcoming");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/client/appointments");
    if (!res.ok) return;
    const { appointments: data } = await res.json();
    setAppointments(data ?? []);
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

  function canCancel(apt: AptRow): boolean {
    if (!["pending", "confirmed"].includes(apt.status)) return false;
    return new Date(apt.scheduled_at).getTime() - Date.now() > 2 * 60 * 60 * 1000;
  }

  const visible = appointments.filter((a) => a.status !== "cancelled");
  const upcoming = visible.filter((a) => !isPast(a));
  const previous = visible.filter((a) => isPast(a));
  const list = tab === "upcoming" ? upcoming : previous;
  const totalVisits = visible.filter((a) => isPast(a)).length;

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Histórico</h1>
        {totalVisits > 0 && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalVisits} {totalVisits === 1 ? "visita" : "visitas"} na Barbearia Santorini
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-card border border-border rounded-xl gap-1">
        <button
          onClick={() => setTab("upcoming")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            tab === "upcoming"
              ? "bg-primary text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Agendamentos
          {upcoming.length > 0 && (
            <span className={cn(
              "text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold",
              tab === "upcoming" ? "bg-background/25 text-background" : "bg-primary/20 text-primary"
            )}>
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("previous")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            tab === "previous"
              ? "bg-primary text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Anteriores
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* List */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-2">
          <p className="text-2xl">
            {tab === "upcoming" ? "📅" : "🕐"}
          </p>
          <p className="text-sm font-medium text-foreground">
            {tab === "upcoming" ? "Nenhum agendamento ativo" : "Nenhuma visita anterior"}
          </p>
          <p className="text-xs text-muted-foreground">
            {tab === "upcoming" ? "Agende seu próximo corte" : "Suas visitas aparecerão aqui"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((apt) => {
            const barberName =
              (apt.barbers?.profiles as { full_name: string } | null)?.full_name ?? "—";
            const isActive = tab === "upcoming";
            return (
              <div
                key={apt.id}
                className={cn(
                  "rounded-2xl border bg-card px-5 py-4 space-y-3 relative overflow-hidden transition-all",
                  isActive ? "border-border hover:border-primary/30" : "border-border/50 opacity-85"
                )}
              >
                {/* Status accent line */}
                <div className={cn("absolute left-0 top-4 bottom-4 w-0.5 rounded-full", displayDot(apt))} />

                <div className="flex items-start justify-between gap-3 pl-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{apt.services?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">com {barberName}</p>
                  </div>
                  <Badge variant={displayVariant(apt)} className="shrink-0 text-xs">
                    {displayLabel(apt)}
                  </Badge>
                </div>

                <div className="pl-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", {
                      weekday: "short", day: "numeric", month: "short",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/>
                    </svg>
                    {new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>

                {isActive && canCancel(apt) && (
                  <div className="pl-3">
                    <button
                      onClick={() => cancel(apt.id)}
                      disabled={cancelling === apt.id}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      {cancelling === apt.id ? "Cancelando..." : "Cancelar agendamento"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
