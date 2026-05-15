"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
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

export default function HistoryPage() {
  const [appointments, setAppointments] = useState<AptRow[]>([]);
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Histórico</h1>
        <p className="text-muted-foreground mt-1">Todos os seus agendamentos.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Você ainda não tem agendamentos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const barberName =
              (apt.barbers?.profiles as { full_name: string } | null)?.full_name ?? "—";
            return (
              <div key={apt.id} className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{apt.services?.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">com {barberName}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[apt.status]}>
                    {STATUS_LABEL[apt.status] ?? apt.status}
                  </Badge>
                </div>
                <div className="flex gap-5 text-xs text-muted-foreground">
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
                {canCancel(apt) && (
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
