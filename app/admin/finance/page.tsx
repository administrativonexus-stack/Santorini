"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Summary {
  totalRevenue: number;
  appointmentCount: number;
  avgTicket: number;
  vipCount: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface ServiceRank {
  name: string;
  count: number;
  revenue: number;
}

interface BarberRank {
  name: string;
  count: number;
  revenue: number;
  commissionRate: number;
  commission: number;
  repasse: number;
  avgTicket: number;
}

type Period = "month" | "lastmonth" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Este mês",
  lastmonth: "Mês anterior",
  year: "Este ano",
};

export default function FinancePage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("month");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [serviceRanking, setServiceRanking] = useState<ServiceRank[]>([]);
  const [barberRanking, setBarberRanking] = useState<BarberRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/finance?period=${period}`);
    if (res.status === 403) { router.push("/admin/dashboard"); return; }
    if (!res.ok) { setError("Erro ao carregar dados."); setLoading(false); return; }
    const data = await res.json();
    setSummary(data.summary);
    setDailyRevenue(data.dailyRevenue);
    setServiceRanking(data.serviceRanking);
    setBarberRanking(data.barberRanking);
    setLoading(false);
  }, [period, router]);

  useEffect(() => { load(); }, [load]);

  const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  const formatDate = (iso: string) => {
    const [, , day] = iso.split("-");
    return `${day}`;
  };

  const initials = (name: string) =>
    name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1 text-sm">Receitas, serviços e demonstrativo de barbeiros.</p>
        </div>
        <div className="flex gap-1.5">
          {(["month", "lastmonth", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-primary text-background"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Receita total</p>
              <p className="font-heading text-2xl font-bold text-primary mt-1">{BRL(summary.totalRevenue)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Agendamentos</p>
              <p className="font-heading text-2xl font-bold text-foreground mt-1">{summary.appointmentCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Ticket médio</p>
              <p className="font-heading text-2xl font-bold text-foreground mt-1">{BRL(summary.avgTicket)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">VIP Ativos</p>
              <p className="font-heading text-2xl font-bold text-foreground mt-1">{summary.vipCount}</p>
            </div>
          </div>

          {/* Daily Revenue Chart */}
          {dailyRevenue.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground mb-4">Faturamento diário</p>
              <div className="flex items-end gap-1 h-28">
                {dailyRevenue.map((d) => {
                  const heightPct = Math.max((d.revenue / maxDailyRevenue) * 100, 2);
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-1 group relative"
                      title={`${d.date}: ${BRL(d.revenue)}`}
                    >
                      <div
                        className="w-full rounded-t bg-primary/60 group-hover:bg-primary transition-colors"
                        style={{ height: `${heightPct}%` }}
                      />
                      {dailyRevenue.length <= 31 && (
                        <span className="text-[9px] text-muted-foreground">{formatDate(d.date)}</span>
                      )}
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-card border border-border rounded px-2 py-1 text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {BRL(d.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Services + Barber Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Services */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground mb-3">Serviços mais vendidos</p>
              {serviceRanking.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum dado no período.</p>
              ) : (
                <div className="space-y-2">
                  {serviceRanking.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                        <span className="text-foreground truncate">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">{s.count}x</span>
                        <span className="text-primary font-medium">{BRL(s.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Barber Ranking */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground mb-3">Ranking de barbeiros</p>
              {barberRanking.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum dado no período.</p>
              ) : (
                <div className="space-y-2">
                  {barberRanking.map((b, i) => (
                    <div key={b.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                        <span className="text-foreground truncate">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">{b.count} atend.</span>
                        <span className="text-primary font-medium">{BRL(b.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Barber Breakdown */}
          {barberRanking.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Demonstrativo por barbeiro</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barberRanking.map((b) => (
                  <div key={b.name} className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 border border-border flex items-center justify-center text-primary font-heading font-bold text-sm shrink-0">
                        {initials(b.name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.count} atendimento{b.count !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Receita gerada</p>
                        <p className="font-medium text-foreground">{BRL(b.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ticket médio</p>
                        <p className="font-medium text-foreground">{BRL(b.avgTicket)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Comissão ({b.commissionRate}%)</p>
                        <p className="font-medium text-foreground">{BRL(b.commission)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Repasse (barbearia)</p>
                        <p className="font-medium text-primary">{BRL(b.repasse)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.appointmentCount === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum agendamento registrado neste período.
            </div>
          )}
        </>
      )}
    </div>
  );
}
