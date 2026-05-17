"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AptRow {
  id: string;
  scheduled_at: string;
  ends_at: string;
  status: string;
  profiles: { full_name: string } | null;
  services: { name: string } | null;
  barbers: { profiles: { full_name: string } | null } | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  confirmed:   "bg-primary/15 text-primary border border-primary/20",
  in_progress: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  completed:   "bg-green-500/15 text-green-400 border border-green-500/20",
  cancelled:   "bg-red-500/15 text-red-400 border border-red-500/20",
  no_show:     "bg-red-500/15 text-red-400 border border-red-500/20",
};

const STATUS_DOT: Record<string, string> = {
  pending:     "bg-blue-400",
  confirmed:   "bg-primary",
  in_progress: "bg-blue-400",
  completed:   "bg-green-400",
  cancelled:   "bg-red-400",
  no_show:     "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Agendado",
  confirmed:   "Confirmado",
  in_progress: "Em andamento",
  completed:   "Concluído",
  cancelled:   "Cancelado",
  no_show:     "Falta",
};

type Tab = "upcoming" | "completed" | "cancelled";

export function AppointmentsTabs({ appointments }: { appointments: AptRow[] }) {
  const [tab, setTab] = useState<Tab>("upcoming");

  const now = new Date();

  const upcoming = appointments.filter(
    (a) => ["pending", "confirmed", "in_progress"].includes(a.status) && new Date(a.scheduled_at) >= now
  );
  const completed = appointments.filter(
    (a) => a.status === "completed" || (!["cancelled", "no_show"].includes(a.status) && new Date(a.ends_at) < now)
  );
  const cancelled = appointments.filter((a) => ["cancelled", "no_show"].includes(a.status));

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "upcoming",  label: "Próximos",   count: upcoming.length },
    { key: "completed", label: "Concluídos", count: completed.length },
    { key: "cancelled", label: "Cancelados", count: cancelled.length },
  ];

  const list = tab === "upcoming" ? upcoming : tab === "completed" ? completed : cancelled;

  const EMPTY: Record<Tab, string> = {
    upcoming:  "Nenhum agendamento futuro.",
    completed: "Nenhum agendamento concluído.",
    cancelled: "Nenhum agendamento cancelado.",
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header + Tabs */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium text-foreground">Agendamentos recentes</p>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                tab === t.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {t.label}
              <span className={cn(
                "text-[10px] rounded-full px-1.5 py-0.5 font-bold",
                tab === t.key ? "bg-primary/20 text-primary" : "bg-white/8 text-white/40"
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {list.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            {EMPTY[tab]}
          </div>
        ) : (
          list.map((apt) => {
            const client = apt.profiles as { full_name: string } | null;
            const service = apt.services as { name: string } | null;
            const barberProfile = (apt.barbers as { profiles: { full_name: string } | null } | null)?.profiles;
            const effectiveStatus = !["cancelled", "no_show", "completed"].includes(apt.status) && new Date(apt.ends_at) < now
              ? "completed"
              : apt.status;
            return (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5 relative overflow-hidden">
                <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${STATUS_DOT[effectiveStatus] ?? "bg-white/20"}`} />
                <div className="min-w-0 flex-1 pl-3">
                  <p className="text-sm font-medium text-foreground truncate">{client?.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{service?.name} · {barberProfile?.full_name}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {new Date(apt.scheduled_at).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[effectiveStatus] ?? "bg-white/5 text-white/40 border border-white/10"}`}>
                    {STATUS_LABEL[effectiveStatus] ?? apt.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
