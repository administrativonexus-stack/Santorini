"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";

const BENEFITS = [
  { icon: "✂", label: "Cortes ilimitados", desc: "Venha quantas vezes quiser no mês" },
  { icon: "⚡", label: "Prioridade total", desc: "Acesso aos melhores horários" },
  { icon: "⭐", label: "Horários exclusivos", desc: "Janelas reservadas para membros VIP" },
  { icon: "♛", label: "Experiência premium", desc: "Atendimento diferenciado e prioritário" },
];

const TESTIMONIALS = [
  { name: "Ricardo M.", text: "Melhor custo-benefício da cidade. Vale muito a pena!", stars: 5 },
  { name: "Felipe S.", text: "Agenda sempre garantida. Nunca mais fiquei sem horário.", stars: 5 },
];

interface Subscription {
  status: string;
  plan_name: string;
  current_period_end: string | null;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/subscription")
      .then(r => r.json())
      .then(({ subscription: sub }) => {
        setSubscription(sub ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isActive = subscription?.status === "active";

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="h-64 rounded-2xl bg-card border border-white/[0.06] animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-lg mx-auto space-y-5"
      variants={stagger(0.1)}
      initial="hidden"
      animate="show"
    >
      {/* Hero card */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-primary/25 bg-card relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.08) 0%, rgba(10,10,10,0) 60%)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute top-4 right-4 opacity-10">
          <svg viewBox="0 0 80 80" className="w-20 h-20 text-primary" fill="currentColor">
            <path d="M40 5L10 20v20l30 15 30-15V20L40 5z" opacity={0.5}/>
          </svg>
        </div>

        <div className="p-6 relative space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-primary/70 uppercase tracking-[0.2em] font-medium mb-1">Plano</p>
              <h1 className="font-heading text-2xl font-bold text-primary tracking-wider">VIP BARBERFLIX</h1>
              <p className="text-sm text-white/40 mt-0.5">Barbearia Santorini</p>
            </div>
            <span className="text-4xl">♛</span>
          </div>

          <div className="flex items-end gap-0.5">
            <span className="font-heading text-5xl font-bold text-foreground leading-none">89</span>
            <div className="mb-1.5">
              <span className="text-xl font-bold text-foreground">,90</span>
              <span className="text-sm text-white/40 block leading-none">/mês</span>
            </div>
          </div>

          {isActive ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Status</span>
                <span className="text-primary font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Ativa
                </span>
              </div>
              {subscription?.current_period_end && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Próxima cobrança</span>
                  <span className="text-foreground font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled
                className="w-full h-11 rounded-xl border border-primary/20 bg-primary/10 text-primary font-semibold text-sm opacity-70 cursor-not-allowed"
              >
                ♛ Assinatura ativa
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-white/30">Integração com pagamento em breve. Entre em contato para ativar.</p>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Link
                  href="https://wa.me/"
                  target="_blank"
                  className={cn(buttonVariants(), "w-full justify-center h-11 font-bold tracking-wide")}
                >
                  ♛ ASSINAR AGORA
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Benefits grid */}
      <motion.div variants={fadeUp}>
        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Benefícios inclusos
        </p>
        <motion.div
          className="grid grid-cols-2 gap-3"
          variants={stagger(0.07)}
          initial="hidden"
          animate="show"
        >
          {BENEFITS.map((b) => (
            <motion.div
              key={b.label}
              variants={fadeUp}
              className="rounded-2xl border border-white/[0.06] bg-card p-4 space-y-2"
            >
              <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-base">
                {b.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{b.label}</p>
                <p className="text-xs text-white/30 mt-0.5 leading-snug">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Social proof */}
      <motion.div variants={fadeUp} className="space-y-3">
        <p className="text-sm font-semibold text-foreground">O que nossos clientes dizem</p>
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="rounded-2xl border border-white/[0.06] bg-card p-4 space-y-2">
            <div className="flex gap-0.5">
              {Array.from({ length: t.stars }).map((_, i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-sm text-white/70 italic">"{t.text}"</p>
            <p className="text-xs text-white/30 font-medium">— {t.name}</p>
          </div>
        ))}
      </motion.div>

      <motion.p variants={fadeUp} className="text-center text-xs text-white/25 pb-2">
        Cancele quando quiser · Sem multa ou taxa
      </motion.p>
    </motion.div>
  );
}
