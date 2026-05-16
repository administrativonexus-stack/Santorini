"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  confirmed: "default",
  in_progress: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
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
  ) {
    return "Concluído";
  }
  return STATUS_LABEL[apt.status] ?? apt.status;
}

function displayVariant(apt: AptRow): "default" | "secondary" | "destructive" | "outline" {
  if (
    apt.status !== "cancelled" &&
    apt.status !== "completed" &&
    apt.status !== "no_show" &&
    new Date(apt.ends_at) < new Date()
  ) {
    return "outline";
  }
  return STATUS_VARIANT[apt.status] ?? "secondary";
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Histórico</h1>
        <p className="text-muted-foreground mt-1">Seus agendamentos.</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 border border-border rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("upcoming")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "upcoming"
              ? "bg-primary text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Agendamentos
          {upcoming.length > 0 && (
            <span className={cn(
              "ml-1.5 text-xs rounded-full px-1.5 py-0.5",
              tab === "upcoming" ? "bg-background/20" : "bg-primary/20 text-primary"
            )}>
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("previous")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "previous"
              ? "bg-primary text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Anteriores
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {tab === "upcoming"
              ? "Nenhum agendamento ativo."
              : "Nenhum agendamento anterior."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((apt) => {
            const barberName =
              (apt.barbers?.profiles as { full_name: string } | null)?.full_name ?? "—";
            return (
              <div key={apt.id} className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{apt.services?.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">com {barberName}</p>
                  </div>
                  <Badge variant={displayVariant(apt)}>
                    {displayLabel(apt)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-5 text-xs text-muted-foreground">
                  <span>
                    {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                  <span>
                    {new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  {apt.price_paid !== null && (
                    <span className="text-primary font-medium">
                      {apt.price_paid === 0 ? "Grátis (VIP)" : `R$ ${Number(apt.price_paid).toFixed(2)}`}
                    </span>
                  )}
                </div>
                {tab === "upcoming" && canCancel(apt) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancel(apt.id)}
                    disabled={cancelling === apt.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                  >
                    {cancelling === apt.id ? "Cancelando..." : "Cancelar"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
