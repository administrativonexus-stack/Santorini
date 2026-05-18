"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AptRow {
  id: string;
  scheduled_at: string;
  ends_at: string;
  status: string;
  price_paid: number | null;
  notes: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  profiles: { full_name: string; phone: string | null } | null;
  services: { name: string; duration_minutes: number } | null;
}

type Tab = "upcoming" | "completed" | "cancelled";

const STATUS_OPTIONS = [
  { value: "confirmed",   label: "Confirmado" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed",   label: "Concluído" },
  { value: "no_show",     label: "Não compareceu" },
  { value: "cancelled",   label: "Cancelado" },
];

const STATUS_COLOR: Record<string, string> = {
  pending:     "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed:   "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed:   "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled:   "bg-destructive/20 text-destructive border-destructive/30",
  no_show:     "bg-destructive/20 text-destructive border-destructive/30",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Agendado",
  confirmed:   "Confirmado",
  in_progress: "Em andamento",
  completed:   "Concluído",
  cancelled:   "Cancelado",
  no_show:     "Falta",
};

const EMPTY: Record<Tab, string> = {
  upcoming:  "Nenhum agendamento futuro neste dia.",
  completed: "Nenhum atendimento concluído neste dia.",
  cancelled: "Nenhum agendamento cancelado neste dia.",
};

function getDayRange(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start: d, end };
}

export default function BarberSchedulePage() {
  const [appointments, setAppointments] = useState<AptRow[]>([]);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [selected, setSelected] = useState<AptRow | null>(null);
  const [newStatus, setNewStatus] = useState("confirmed");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { start, end } = getDayRange(dayOffset);
    const res = await fetch(
      `/api/barber/schedule?start=${start.toISOString()}&end=${end.toISOString()}`
    );
    if (!res.ok) return;
    const { appointments: data } = await res.json();
    setAppointments(data ?? []);
  }, [dayOffset]);

  useEffect(() => { load(); }, [load]);

  function openDetail(apt: AptRow) {
    setSelected(apt);
    setNewStatus(apt.status);
    setNotes(apt.notes ?? "");
    setError("");
  }

  async function saveUpdate() {
    if (!selected) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/barber/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, newStatus, notes }),
    });

    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Erro ao salvar."); return; }
    setSelected(null);
    load();
  }

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => ["pending", "confirmed", "in_progress"].includes(a.status) && new Date(a.scheduled_at) >= now
  );
  const completed = appointments.filter(
    (a) => a.status === "completed" || (!["cancelled", "no_show"].includes(a.status) && new Date(a.ends_at) < now)
  );
  const cancelled = appointments.filter((a) => ["cancelled", "no_show"].includes(a.status));
  const list = tab === "upcoming" ? upcoming : tab === "completed" ? completed : cancelled;

  const { start } = getDayRange(dayOffset);
  const dayLabel =
    dayOffset === 0  ? "Hoje" :
    dayOffset === 1  ? "Amanhã" :
    dayOffset === -1 ? "Ontem" :
    start.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Agenda</h1>
        <p className="text-muted-foreground mt-1">Seus agendamentos do dia.</p>
      </div>

      {/* Day navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setDayOffset((o) => o - 1)}>‹</Button>
        <span className="text-sm font-medium text-foreground capitalize min-w-[180px] text-center">
          {dayLabel}
        </span>
        <Button variant="outline" size="sm" onClick={() => setDayOffset((o) => o + 1)}>›</Button>
        {dayOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setDayOffset(0)}>Hoje</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl">
        {([
          { key: "upcoming",  label: "Próximos",   count: upcoming.length },
          { key: "completed", label: "Concluídos", count: completed.length },
          { key: "cancelled", label: "Cancelados", count: cancelled.length },
        ] as { key: Tab; label: string; count: number }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key
                ? "bg-primary text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                "text-[10px] rounded-full w-[18px] h-[18px] flex items-center justify-center font-bold",
                tab === t.key ? "bg-background/25 text-background" : "bg-white/10 text-white/50"
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {EMPTY[tab]}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((apt) => {
            const effectiveStatus = !["cancelled", "no_show", "completed"].includes(apt.status) && new Date(apt.ends_at) < now
              ? "completed"
              : apt.status;
            return (
              <button
                key={apt.id}
                onClick={() => openDetail(apt)}
                className="w-full text-left rounded-xl border border-border bg-card px-5 py-3.5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {(apt.profiles as { full_name: string } | null)?.full_name ?? apt.guest_name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {apt.services?.name} ·{" "}
                      {new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(apt.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", {
                        weekday: "long", day: "numeric", month: "short",
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${STATUS_COLOR[effectiveStatus] ?? ""}`}>
                    {STATUS_LABEL[effectiveStatus] ?? apt.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {(selected?.profiles as { full_name: string } | null)?.full_name ?? selected?.guest_name ?? "—"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-1">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Serviço: <span className="text-foreground">{selected.services?.name}</span></p>
                <p>Horário: <span className="text-foreground">{new Date(selected.scheduled_at).toLocaleString("pt-BR")}</span></p>
                {(selected.profiles as { phone?: string | null } | null)?.phone && (
                  <p>Telefone: <span className="text-foreground">{(selected.profiles as { phone: string }).phone}</span></p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(v) => v && setNewStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Notas do atendimento..."
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
                <Button onClick={saveUpdate} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
