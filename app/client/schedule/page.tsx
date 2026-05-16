"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ["Barbeiro", "Serviço", "Data", "Horário", "Confirmar"];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center gap-1.5">
        {([1, 2, 3, 4, 5] as Step[]).map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 rounded-full flex-1 transition-all duration-300",
              s < current ? "bg-primary" : s === current ? "bg-primary glow-gold-xs" : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Passo {current} de 5 — <span className="text-primary font-medium">{STEP_LABELS[current - 1]}</span>
      </p>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function SchedulePage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<BarberOption | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  const loadBarbers = useCallback(async () => {
    const res = await fetch("/api/client/barbers");
    if (!res.ok) return;
    const { barbers: data } = await res.json();
    setBarbers(data ?? []);
  }, []);

  useEffect(() => { loadBarbers(); }, [loadBarbers]);

  async function selectBarber(b: BarberOption) {
    setSelectedBarber(b);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setServices([]);
    setStep(2);
    const res = await fetch(`/api/client/services?barberId=${b.id}`);
    if (!res.ok) return;
    const { services: data, isVip: vip } = await res.json();
    setServices(data ?? []);
    setIsVip(vip);
  }

  function selectService(s: ServiceOption) {
    setSelectedService(s);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep(3);
  }

  async function selectDate(d: Date) {
    setSelectedDate(d);
    setSelectedTime(null);
    setLoadingSlots(true);
    setSlots([]);
    setStep(4);
    const dateStr = d.toISOString().split("T")[0];
    const res = await fetch(
      `/api/client/slots?barberId=${selectedBarber!.id}&date=${dateStr}&duration=${selectedService!.duration_minutes}`
    );
    if (res.ok) {
      const { slots: data } = await res.json();
      setSlots(data ?? []);
    }
    setLoadingSlots(false);
  }

  function selectTime(t: string) {
    setSelectedTime(t);
    setStep(5);
  }

  async function confirm() {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) return;
    setBooking(true);
    setError("");
    const [h, m] = selectedTime.split(":").map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(h, m, 0, 0);
    const endsAt = new Date(scheduledAt.getTime() + selectedService.duration_minutes * 60000);
    const res = await fetch("/api/client/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
        scheduledAt: scheduledAt.toISOString(),
        endsAt: endsAt.toISOString(),
        isVip,
        servicePrice: selectedService.price,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao confirmar agendamento.");
      setBooking(false);
      return;
    }
    router.push("/client/dashboard");
    router.refresh();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOptions: Date[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Agendar</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {step === 1 && "Escolha seu barbeiro"}
          {step === 2 && "Escolha o serviço"}
          {step === 3 && "Escolha a data"}
          {step === 4 && "Escolha o horário"}
          {step === 5 && "Confirme seu agendamento"}
        </p>
      </div>

      <StepIndicator current={step} />

      {/* Step 1 — Barber */}
      {step === 1 && (
        <div className="space-y-3">
          {barbers.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum barbeiro disponível no momento.
            </div>
          ) : (
            barbers.map((b) => {
              const name = b.profiles?.full_name ?? "Barbeiro";
              return (
                <button
                  key={b.id}
                  onClick={() => selectBarber(b)}
                  className="w-full text-left rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/50 active:scale-[0.98] transition-all flex items-center gap-4 min-h-[72px]"
                >
                  {b.profiles?.avatar_url ? (
                    <img src={b.profiles.avatar_url} alt={name} className="h-12 w-12 rounded-full object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-base shrink-0">
                      {getInitials(name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{name}</p>
                    {b.bio && <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.bio}</p>}
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Step 2 — Service */}
      {step === 2 && (
        <div className="space-y-3">
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum serviço disponível.</p>
          ) : (
            services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s)}
                className="w-full text-left rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/50 active:scale-[0.98] transition-all min-h-[72px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.duration_minutes} min{s.description ? ` · ${s.description}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {isVip ? (
                      <div>
                        <span className="text-xs line-through text-muted-foreground">
                          R$ {s.price.toFixed(2)}
                        </span>
                        <p className="text-sm font-bold text-primary">Grátis ♛</p>
                      </div>
                    ) : (
                      <p className="text-base font-bold text-primary">R$ {s.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
          <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar
          </button>
        </div>
      )}

      {/* Step 3 — Date */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {dateOptions.map((d) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => selectDate(d)}
                  className={cn(
                    "rounded-xl border px-2 py-3 text-center transition-all active:scale-95 min-h-[72px] flex flex-col items-center justify-center",
                    isToday
                      ? "border-primary/40 bg-primary/10 glow-gold-xs"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </p>
                  <p className={cn("text-lg font-bold mt-0.5", isToday ? "text-primary" : "text-foreground")}>
                    {d.getDate()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {d.toLocaleDateString("pt-BR", { month: "short" })}
                  </p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar
          </button>
        </div>
      )}

      {/* Step 4 — Time */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">
            {selectedDate?.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card/50 h-12 animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sem horários disponíveis nesta data.
              </p>
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                Escolher outra data
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => selectTime(t)}
                  className="rounded-xl border border-border bg-card h-12 text-sm font-semibold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setStep(3)} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar
          </button>
        </div>
      )}

      {/* Step 5 — Confirm */}
      {step === 5 && selectedBarber && selectedService && selectedDate && selectedTime && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4 relative overflow-hidden glow-gold-sm">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Resumo</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-sm shrink-0">
                  {getInitials(selectedBarber.profiles?.full_name ?? "B")}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedBarber.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedService.name}</p>
                </div>
              </div>
              <div className="border-t border-border/50 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium text-foreground">
                    {selectedDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium text-foreground">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração</span>
                  <span className="font-medium text-foreground">{selectedService.duration_minutes} min</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-bold text-primary text-base">
                    {isVip ? "Grátis ♛" : `R$ ${selectedService.price.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={confirm}
            disabled={booking}
          >
            {booking ? "Confirmando..." : "Confirmar agendamento"}
          </Button>
          <button onClick={() => setStep(4)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar
          </button>
        </div>
      )}
    </div>
  );
}
