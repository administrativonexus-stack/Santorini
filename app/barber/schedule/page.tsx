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

interface AptRow {
  id: string;
  scheduled_at: string;
  ends_at: string;
  status: string;
  price_paid: number | null;
  notes: string | null;
  profiles: { full_name: string; phone: string | null } | null;
  services: { name: string; duration_minutes: number } | null;
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmado" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluído" },
  { value: "no_show", label: "Não compareceu" },
  { value: "cancelled", label: "Cancelado" },
];

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  no_show: "bg-destructive/20 text-destructive border-destructive/30",
};

function getWeekRange(offset: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export default function BarberSchedulePage() {
  const [appointments, setAppointments] = useState<AptRow[]>([]);
  const [selected, setSelected] = useState<AptRow | null>(null);
  const [newStatus, setNewStatus] = useState("confirmed");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { start, end } = getWeekRange(weekOffset);
    const res = await fetch(
      `/api/barber/schedule?start=${start.toISOString()}&end=${end.toISOString()}`
    );
    if (!res.ok) return;
    const { appointments: data } = await res.json();
    setAppointments(data ?? []);
  }, [weekOffset]);

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

  const { start, end } = getWeekRange(weekOffset);
  const formatDay = (d: Date) =>
    d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Agenda</h1>
        <p className="text-muted-foreground mt-1">Seus agendamentos da semana.</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>‹</Button>
        <span className="text-sm text-foreground">
          {formatDay(start)} – {formatDay(end)}
        </span>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>›</Button>
        {weekOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Hoje</Button>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum agendamento nesta semana.
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => (
            <button
              key={apt.id}
              onClick={() => openDetail(apt)}
              className="w-full text-left rounded-xl border border-border bg-card px-5 py-3.5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {(apt.profiles as { full_name: string } | null)?.full_name ?? "—"}
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
                <span className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${STATUS_COLOR[apt.status] ?? ""}`}>
                  {STATUS_OPTIONS.find((s) => s.value === apt.status)?.label ?? apt.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {(selected?.profiles as { full_name: string } | null)?.full_name}
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
