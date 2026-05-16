"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

const STEP_CONFIG = [
  { label: "BARBEIRO", sub: "Escolha" },
  { label: "SERVIÇO", sub: "Selecione" },
  { label: "DATA", sub: "Escolha o dia" },
  { label: "HORÁRIO", sub: "Escolha o horário" },
  { label: "CONFIRMAR", sub: "Confirme" },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1 scrollbar-hide">
      {STEP_CONFIG.map((s, i) => {
        const num = (i + 1) as Step;
        const isActive = num === current;
        const isDone = num < current;
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <div className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300",
                isActive && "border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(201,169,110,0.3)]",
                isDone && "border-primary/40 bg-primary/5 text-primary/50",
                !isActive && !isDone && "border-white/10 bg-transparent text-white/20"
              )}>
                {isDone ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : num}
              </div>
              <span className={cn(
                "text-[9px] font-bold tracking-wider uppercase leading-none text-center",
                isActive ? "text-primary" : "text-white/25"
              )}>
                {s.label}
              </span>
            </div>
            {i < 4 && (
              <div className={cn(
                "w-6 h-px mx-0.5 border-t border-dashed mb-5 flex-shrink-0",
                isDone ? "border-primary/50" : "border-white/10"
              )} />
            )}
          </div>
        );
      })}
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
    const res = await fetch(`/api/client/slots?barberId=${selectedBarber!.id}&date=${dateStr}&duration=${selectedService!.duration_minutes}`);
    if (res.ok) { const { slots: data } = await res.json(); setSlots(data ?? []); }
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
      body: JSON.stringify({ barberId: selectedBarber.id, serviceId: selectedService.id, scheduledAt: scheduledAt.toISOString(), endsAt: endsAt.toISOString(), isVip, servicePrice: selectedService.price }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Erro ao confirmar."); setBooking(false); return; }
    router.push("/client/dashboard");
    router.refresh();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOptions: Date[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i); return d;
  });

  const slideVariants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-[26px] font-bold text-foreground">Agende seu horário</h1>
        <p className="text-sm text-white/40 mt-0.5">Escolha seu barbeiro e personalize sua experiência.</p>
      </div>

      <StepIndicator current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: "easeInOut" }}
        >

          {/* Step 1 — Barber */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-base font-semibold text-foreground flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>
                    Escolha seu barbeiro
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">Nossos profissionais estão prontos para te atender.</p>
                </div>
              </div>
              {barbers.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-card p-10 text-center text-sm text-white/30">
                  Nenhum barbeiro disponível no momento.
                </div>
              ) : (
                barbers.map((b) => {
                  const name = b.profiles?.full_name ?? "Barbeiro";
                  return (
                    <motion.button
                      key={b.id}
                      onClick={() => selectBarber(b)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left rounded-2xl border border-white/[0.07] bg-card p-5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {b.profiles?.avatar_url ? (
                          <img src={b.profiles.avatar_url} alt={name} className="h-16 w-16 rounded-full object-cover border-2 border-primary/30 shrink-0" />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-primary/15 border-2 border-primary/25 flex items-center justify-center text-primary font-heading font-bold text-lg shrink-0">
                            {getInitials(name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{name}</p>
                            <span className="flex items-center gap-0.5 text-xs text-amber-400 font-medium">
                              ★ 4.9
                            </span>
                          </div>
                          {b.bio && <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{b.bio}</p>}
                          <p className="text-[11px] text-white/30 mt-1.5">✓ Especialista em Degradê e Barba</p>
                        </div>
                        <svg className="w-4 h-4 text-white/20 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          )}

          {/* Step 2 — Service */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="mb-1">
                <p className="text-base font-semibold text-foreground">Escolha o serviço</p>
                <p className="text-xs text-white/30 mt-0.5">Selecione o que deseja realizar.</p>
              </div>
              {services.length === 0 ? (
                <p className="text-sm text-white/30">Nenhum serviço disponível.</p>
              ) : (
                services.map((s) => (
                  <motion.button
                    key={s.id}
                    onClick={() => selectService(s)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left rounded-2xl border border-white/[0.07] bg-card px-5 py-4 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{s.name}</p>
                        <p className="text-xs text-white/40 mt-0.5">{s.duration_minutes} min{s.description ? ` · ${s.description}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {isVip ? (
                          <div>
                            <span className="text-xs line-through text-white/30">R$ {s.price.toFixed(2)}</span>
                            <p className="text-sm font-bold text-primary">GRÁTIS ♛</p>
                          </div>
                        ) : (
                          <p className="text-lg font-heading font-bold text-primary">R$ {s.price.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors mt-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                Voltar
              </button>
            </div>
          )}

          {/* Step 3 — Date */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-semibold text-foreground">Escolha a data</p>
                <p className="text-xs text-white/30 mt-0.5">Selecione o melhor dia para você.</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {dateOptions.map((d) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <motion.button
                      key={d.toISOString()}
                      onClick={() => selectDate(d)}
                      whileTap={{ scale: 0.93 }}
                      className={cn(
                        "rounded-xl border px-2 py-3 flex flex-col items-center justify-center min-h-[72px] transition-all",
                        isToday
                          ? "border-primary/40 bg-primary/10 shadow-[0_0_12px_rgba(201,169,110,0.15)]"
                          : "border-white/[0.07] bg-card hover:border-primary/30"
                      )}
                    >
                      <span className="text-[10px] text-white/30 uppercase tracking-wide">
                        {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                      </span>
                      <span className={cn("text-xl font-heading font-bold mt-0.5", isToday ? "text-primary" : "text-foreground")}>
                        {d.getDate()}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {d.toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                Voltar
              </button>
            </div>
          )}

          {/* Step 4 — Time */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-semibold text-foreground">Escolha o horário</p>
                <p className="text-xs text-white/40 mt-0.5 capitalize">
                  {selectedDate?.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-card/50 h-11 animate-pulse" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-white/30">Sem horários disponíveis nesta data.</p>
                  <button onClick={() => setStep(3)} className="text-sm text-primary font-medium">← Escolher outra data</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((t) => (
                    <motion.button
                      key={t}
                      onClick={() => selectTime(t)}
                      whileTap={{ scale: 0.93 }}
                      className="rounded-xl border border-white/[0.07] bg-card h-11 text-sm font-semibold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      {t}
                    </motion.button>
                  ))}
                </div>
              )}
              <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                Voltar
              </button>
            </div>
          )}

          {/* Step 5 — Confirm */}
          {step === 5 && selectedBarber && selectedService && selectedDate && selectedTime && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-semibold text-foreground">Confirme seu agendamento</p>
                <p className="text-xs text-white/30 mt-0.5">Revise os detalhes antes de confirmar.</p>
              </div>

              <div className="rounded-2xl border border-primary/25 bg-card relative overflow-hidden shadow-[0_0_24px_rgba(201,169,110,0.08)]">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                    <div className="h-12 w-12 rounded-full bg-primary/15 border-2 border-primary/25 flex items-center justify-center text-primary font-heading font-bold shrink-0">
                      {getInitials(selectedBarber.profiles?.full_name ?? "B")}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedBarber.profiles?.full_name}</p>
                      <p className="text-xs text-white/40">{selectedService.name}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    {[
                      ["Data", selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })],
                      ["Horário", selectedTime],
                      ["Duração", `${selectedService.duration_minutes} min`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-white/40">{label}</span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2.5 border-t border-white/[0.06]">
                      <span className="text-white/40">Valor</span>
                      <span className="font-heading text-lg font-bold text-primary">
                        {isVip ? "Grátis ♛" : `R$ ${selectedService.price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <motion.button
                onClick={confirm}
                disabled={booking}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 rounded-xl bg-primary text-background font-bold text-sm tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {booking ? "Confirmando..." : "CONFIRMAR AGENDAMENTO"}
              </motion.button>
              <button onClick={() => setStep(4)} className="w-full flex items-center justify-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                Voltar
              </button>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
