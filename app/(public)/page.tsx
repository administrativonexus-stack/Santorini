"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Agendamento Inteligente",
    description:
      "Escolha seu barbeiro, serviço e horário em segundos. Interface fluida e sem burocracia.",
  },
  {
    title: "Plano VIP — R$ 89,90/mês",
    description:
      "Cortes ilimitados com assinatura recorrente. Um único agendamento ativo por vez.",
  },
  {
    title: "Barbeiros Premium",
    description:
      "Profissionais selecionados da Barbearia Santorini. Avaliações reais de clientes.",
  },
  {
    title: "Confirmação Instantânea",
    description:
      "Receba confirmação via WhatsApp com lembretes automáticos do seu agendamento.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.0, 0.0, 0.2, 1] as [number, number, number, number] },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="font-heading text-xl font-bold tracking-widest text-primary">
          BARBERFLIX
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Cadastrar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6 max-w-2xl w-full"
        >
          <p className="text-xs tracking-[0.4em] text-muted-foreground uppercase">
            Barbearia Santorini
          </p>
          <h1 className="font-heading text-4xl sm:text-6xl md:text-8xl font-bold tracking-[0.15em] text-foreground">
            BARBER
            <span className="text-primary">FLIX</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            A experiência premium de agendamento e assinatura para quem valoriza
            estilo e tempo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto sm:px-8")}
            >
              Começar agora
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto sm:px-8")}
            >
              Já tenho conta
            </Link>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="mt-20 w-px h-16 bg-gradient-to-b from-primary/60 to-transparent mx-auto"
        />
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="rounded-xl border border-border bg-card p-6 space-y-2"
            >
              <h3 className="font-heading text-base font-semibold text-primary">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-border py-16 px-6 text-center space-y-5"
      >
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          Seu próximo corte a um clique de distância.
        </h2>
        <Link
          href="/register"
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto sm:px-10")}
        >
          Assinar Plano VIP
        </Link>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center">
        <p className="text-xs text-muted-foreground tracking-widest">
          © {new Date().getFullYear()} BARBERFLIX · Barbearia Santorini
        </p>
      </footer>
    </div>
  );
}
