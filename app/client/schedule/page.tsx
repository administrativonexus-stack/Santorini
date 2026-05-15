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

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {([1, 2, 3, 4, 5] as Step[]).map((s) => (
        <div
          key={s}
          className={cn(
            "h-1.5 rounded-full flex-1 transition-colors",
            s <= current ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
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

  // Calendar: next 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOptions: Date[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Agendar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {step === 1 && "Escolha seu barbeiro"}
          {step === 2 && "Escolha o serviço"}
          {step === 3 && "Escolha a data"}
          {step === 4 && "Escolha o horário"}
          {step === 5 && "Confirme seu agendamento"}
        </p>
      </div>

      <StepIndicator current={step} />

      {/* Step 1 — Select Barber */}
      {step === 1 && (
        <div className="space-y-3">
          {barbers.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum barbeiro disponível.</p>
          ) : (
            barbers.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBarber(b)}
                className="w-full text-left rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/50 transition-colors"
              >
                <p className="font-medium text-foreground">
                  {b.profiles?.full_name ?? "Barbeiro"}
                </p>
                {b.bio && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.bio}</p>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Step 2 — Select Service */}
      {step === 2 && (
        <div className="space-y-3">
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum serviço disponível para este barbeiro.</p>
          ) : (
            services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s)}
                className="w-full text-left rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-primary font-semibold text-sm">
                    {isVip ? (
                      <span>
                        <span className="line-through text-muted-foreground mr-1 text-xs">
                          R$ {s.price.toFixed(2)}
                        </span>
                        Grátis
                      </span>
                    ) : (
                      `R$ ${s.price.toFixed(2)}`
                    )}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.duration_minutes} min{s.description ? ` · ${s.description}` : ""}
                </p>
              </button>
            ))
          )}
          <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Voltar</Button>
        </div>
      )}

      {/* Step 3 — Select Date */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {dateOptions.map((d) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => selectDate(d)}
                  className={cn(
                    "rounded-lg border px-2 py-3 text-center transition-colors hover:border-primary/50",
                    isToday ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </p>
                  <p className="text-base font-semibold text-foreground">{d.getDate()}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleDateString("pt-BR", { month: "short" })}
                  </p>
                </button>
              );
            })}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep(2)}>← Voltar</Button>
        </div>
      )}

      {/* Step 4 — Select Time */}
      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {selectedDate?.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {loadingSlots ? (
            <p className="text-sm text-muted-foreground">Carregando horários...</p>
          ) : slots.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sem horários disponíveis nesta data. Escolha outra data.
              </p>
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                Escolher outra data
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => selectTime(t)}
                  className="rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setStep(3)}>← Voltar</Button>
        </div>
      )}

      {/* Step 5 — Confirm */}
      {step === 5 && selectedBarber && selectedService && selectedDate && selectedTime && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Resumo do agendamento
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Barbeiro</span>
                <span className="font-medium text-foreground">{selectedBarber.profiles?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium text-foreground">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium text-foreground">
                  {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário</span>
                <span className="font-medium text-foreground">{selectedTime}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-semibold text-primary">
                  {isVip ? "Grátis (Plano VIP)" : `R$ ${selectedService.price.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(4)} disabled={booking}>← Voltar</Button>
            <Button className="flex-1" onClick={confirm} disabled={booking}>
              {booking ? "Confirmando..." : "Confirmar agendamento"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
