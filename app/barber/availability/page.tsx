"use client";

import { useState, useEffect, useCallback } from "react";
import type { DayOfWeek } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

type HoursState = Record<DayOfWeek, { start_time: string; end_time: string; is_active: boolean }>;

const DEFAULT_HOURS: HoursState = Object.fromEntries(
  DAYS.map(({ key }) => [key, { start_time: "09:00", end_time: "18:00", is_active: false }])
) as HoursState;

interface TimeBlock {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

export default function AvailabilityPage() {
  const [hours, setHours] = useState<HoursState>(DEFAULT_HOURS);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/barber/availability");
    if (!res.ok) return;
    const { workingHours, timeBlocks: blocks } = await res.json();

    if (workingHours && workingHours.length > 0) {
      const next = { ...DEFAULT_HOURS };
      for (const row of workingHours) {
        next[row.day as DayOfWeek] = {
          start_time: row.start_time,
          end_time: row.end_time,
          is_active: row.is_active,
        };
      }
      setHours(next);
    }
    setTimeBlocks(blocks ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateDay(day: DayOfWeek, field: "start_time" | "end_time" | "is_active", value: string | boolean) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function saveHours() {
    setSaving(true);
    setSaved(false);
    setError("");

    const res = await fetch("/api/barber/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours }),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar horários.");
      return;
    }

    setSaved(true);
    load();
  }

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/barber/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        block: { start_at: blockStart, end_at: blockEnd, reason: blockReason.trim() || null },
      }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Erro ao adicionar bloqueio."); return; }

    setBlockStart("");
    setBlockEnd("");
    setBlockReason("");
    load();
  }

  async function removeBlock(blockId: string) {
    await fetch(`/api/barber/availability?blockId=${blockId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Disponibilidade</h1>
        <p className="text-muted-foreground mt-1">Configure seus horários de trabalho e bloqueios.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Working hours */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-medium text-foreground">Horários semanais</p>
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const val = hours[key];
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <label className="flex items-center gap-2 sm:w-24 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={val.is_active}
                    onChange={(e) => updateDay(key, "is_active", e.target.checked)}
                    className="accent-primary"
                  />
                  <span className={`text-sm ${val.is_active ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </label>
                <Input
                  type="time"
                  value={val.start_time}
                  onChange={(e) => updateDay(key, "start_time", e.target.value)}
                  disabled={!val.is_active}
                  className="w-full sm:w-28 text-xs"
                />
                <span className="text-muted-foreground text-xs">até</span>
                <Input
                  type="time"
                  value={val.end_time}
                  onChange={(e) => updateDay(key, "end_time", e.target.value)}
                  disabled={!val.is_active}
                  className="w-full sm:w-28 text-xs"
                />
              </div>
            );
          })}
        </div>
        {saved && <p className="text-xs text-primary">Horários salvos com sucesso.</p>}
        <Button onClick={saveHours} disabled={saving}>
          {saving ? "Salvando..." : "Salvar horários"}
        </Button>
      </div>

      {/* Time blocks */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-medium text-foreground">Adicionar bloqueio</p>
        <form onSubmit={addBlock} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início</Label>
              <Input type="datetime-local" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Fim</Label>
              <Input type="datetime-local" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Input placeholder="Férias, almoço, compromisso..." value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
          </div>
          <Button type="submit" variant="outline">Adicionar bloqueio</Button>
        </form>

        {timeBlocks.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Bloqueios ativos</p>
            {timeBlocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-foreground">
                    {new Date(b.start_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(b.end_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {b.reason && <span className="text-muted-foreground ml-2">· {b.reason}</span>}
                </div>
                <Button size="sm" variant="ghost" className="text-xs text-destructive h-6 px-2" onClick={() => removeBlock(b.id)}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
