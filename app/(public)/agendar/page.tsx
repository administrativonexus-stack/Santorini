"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BarberOption {
  id: string;
  bio: string | null;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

interface ServiceOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
}

type Step = 1 | 2 | 3;

const STEP_CONFIG = [
  { label: "BARBEIRO & SERVIÇO", sub: "Escolha" },
  { label: "DATA & HORA",        sub: "Selecione" },
  { label: "SEUS DADOS",         sub: "Confirme" },
];

const TIMEZONE = "America/Sao_Paulo";

function getNext14Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push(new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(d));
  }
  return days;
}

function dayLabel(dateStr: string): { short: string; num: string } {
  const d = new Date(dateStr + "T12:00:00");
  return {
    short: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3).toUpperCase(),
    num: String(d.getDate()),
  };
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1 scrollbar-hide">
      {STEP_CONFIG.map((s, i) => {
        const num = (i + 1) as Step;
        const isActive = num === current;
        const isDone = num < current;
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[72px]">
              <div className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                isActive && "border-primary bg-primary/15 text-primary",
                isDone && "border-primary/40 bg-primary/5 text-primary/60",
                !isActive && !isDone && "border-white/10 text-white/20"
              )}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : num}
              </div>
              <span className={cn("text-[9px] font-bold tracking-wider uppercase text-center leading-tight max-w-[64px]",
                isActive ? "text-primary" : "text-white/25")}>{s.label}</span>
            </div>
            {i < 2 && <div className={cn("w-6 h-px mx-0.5 border-t border-dashed mb-5 shrink-0",
              isDone ? "border-primary/30" : "border-white/10")} />}
          </div>
        );
      })}
    </div>
  );
}

export default function GuestSchedulePage() {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<BarberOption | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);

  // Step 2
  const [days] = useState<string[]>(getNext14Days());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 3
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/public/barbers")
      .then((r) => r.json())
      .then((d) => { setBarbers(d.barbers ?? []); setLoadingBarbers(false); });
  }, []);

  const loadServices = useCallback(async (barberId: string) => {
    setLoadingServices(true);
    setServices([]);
    setSelectedService(null);
    const res = await fetch(`/api/public/services?barberId=${barberId}`);
    const d = await res.json();
    setServices(d.services ?? []);
    setLoadingServices(false);
  }, []);

  useEffect(() => {
    if (selectedBarber) loadServices(selectedBarber.id);
  }, [selectedBarber, loadServices]);

  const loadSlots = useCallback(async (barberId: string, date: string, duration: number) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot("");
    const res = await fetch(`/api/public/slots?barberId=${barberId}&date=${date}&duration=${duration}`);
    const d = await res.json();
    setSlots(d.slots ?? []);
    setLoadingSlots(false);
  }, []);

  useEffect(() => {
    if (selectedBarber && selectedDay && selectedService) {
      loadSlots(selectedBarber.id, selectedDay, selectedService.duration_minutes);
    }
  }, [selectedBarber, selectedDay, selectedService, loadSlots]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBarber || !selectedService || !selectedDay || !selectedSlot) return;
    setSubmitting(true);
    setError("");

    const [h, m] = selectedSlot.split(":").map(Number);
    const scheduledAt = new Date(`${selectedDay}T${selectedSlot}:00`);
    const endsAt = new Date(scheduledAt.getTime() + selectedService.duration_minutes * 60 * 1000);

    const res = await fetch("/api/public/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
        scheduledAt: scheduledAt.toISOString(),
        endsAt: endsAt.toISOString(),
        guestName,
        guestPhone,
      }),
    });

    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(json.error ?? "Erro ao agendar."); return; }
    setDone(true);
    void h; void m;
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Agendado!</h1>
            <p className="text-sm text-white/50 mt-1">
              {selectedService?.name} com {selectedBarber?.profiles?.full_name}
            </p>
            <p className="text-sm text-primary mt-0.5 font-medium">
              {selectedDay && new Date(selectedDay + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às {selectedSlot}
            </p>
          </div>
          <p className="text-xs text-white/40">Você receberá uma confirmação via WhatsApp.</p>
          <Link href="/login" className="block text-sm text-primary hover:text-primary/80 font-medium">
            Criar conta para gerenciar agendamentos →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <Link href="/login" className="text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="font-heading text-lg font-bold tracking-widest text-primary">SUA BARBEARIA</span>
        <div className="w-5" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-lg mx-auto w-full">
        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Barbeiro & Serviço ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="space-y-6">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Escolha o barbeiro</p>
                {loadingBarbers ? (
                  <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {barbers.map((b) => (
                      <button key={b.id} onClick={() => setSelectedBarber(b)}
                        className={cn("w-full text-left rounded-xl border px-4 py-3 transition-all",
                          selectedBarber?.id === b.id ? "border-primary bg-primary/10" : "border-white/8 bg-card hover:border-white/20")}>
                        <p className="font-medium text-sm text-foreground">{b.profiles?.full_name ?? "—"}</p>
                        {b.bio && <p className="text-xs text-white/40 mt-0.5 truncate">{b.bio}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedBarber && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Escolha o serviço</p>
                  {loadingServices ? (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
                  ) : (
                    <div className="space-y-2">
                      {services.map((svc) => (
                        <button key={svc.id} onClick={() => setSelectedService(svc)}
                          className={cn("w-full text-left rounded-xl border px-4 py-3 transition-all",
                            selectedService?.id === svc.id ? "border-primary bg-primary/10" : "border-white/8 bg-card hover:border-white/20")}>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-foreground">{svc.name}</p>
                            <p className="text-sm text-primary font-semibold">R$ {svc.price.toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">{svc.duration_minutes} min</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full" disabled={!selectedBarber || !selectedService}
                onClick={() => { setStep(2); setSelectedDay(days[0]); }}>
                Continuar
              </Button>
            </motion.div>
          )}

          {/* ── STEP 2: Data & Hora ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="space-y-5">
              {/* Day picker */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Selecione o dia</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {days.map((d) => {
                    const lbl = dayLabel(d);
                    return (
                      <button key={d} onClick={() => setSelectedDay(d)}
                        className={cn("flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border shrink-0 transition-all min-w-[52px]",
                          selectedDay === d ? "border-primary bg-primary/15 text-primary" : "border-white/8 bg-card text-white/50 hover:border-white/20")}>
                        <span className="text-[10px] font-bold">{lbl.short}</span>
                        <span className="text-base font-heading font-bold leading-none">{lbl.num}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Horários disponíveis</p>
                {loadingSlots ? (
                  <div className="flex flex-wrap gap-2">{[...Array(8)].map((_, i) => <div key={i} className="h-9 w-16 rounded-lg bg-white/5 animate-pulse" />)}</div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-white/30 py-4 text-center">Nenhum horário disponível neste dia.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <button key={s} onClick={() => setSelectedSlot(s)}
                        className={cn("px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                          selectedSlot === s ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-card text-white/60 hover:border-white/25")}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1" disabled={!selectedSlot} onClick={() => setStep(3)}>Continuar</Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Dados & Confirmar ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
              {/* Resumo */}
              <div className="rounded-xl bg-card border border-white/8 p-4 mb-5 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-white/40">Barbeiro</span><span className="text-foreground font-medium">{selectedBarber?.profiles?.full_name}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Serviço</span><span className="text-foreground font-medium">{selectedService?.name}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Data</span><span className="text-foreground font-medium">{selectedDay && new Date(selectedDay + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Horário</span><span className="text-primary font-semibold">{selectedSlot}</span></div>
                <div className="flex justify-between border-t border-white/8 pt-1.5 mt-1"><span className="text-white/40">Valor</span><span className="text-foreground font-semibold">R$ {selectedService?.price.toFixed(2)}</span></div>
              </div>

              <form onSubmit={handleConfirm} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guestName">Nome completo</Label>
                  <Input id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Seu nome" required autoComplete="name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guestPhone">WhatsApp</Label>
                  <Input id="guestPhone" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+55 37 99999-9999" required autoComplete="tel" />
                  <p className="text-xs text-white/30">Você receberá a confirmação por WhatsApp.</p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Agendando..." : "Confirmar"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
