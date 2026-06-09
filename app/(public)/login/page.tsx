"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const TEST_ACCOUNTS = [
  { role: "Admin",    email: "admin@barberflix.test",    password: "Test@admin123",  color: "text-red-400",   border: "border-red-500/20",   bg: "hover:bg-red-500/5" },
  { role: "Barbeiro", email: "barbeiro@barberflix.test", password: "Test@barber123", color: "text-blue-400",  border: "border-blue-500/20",  bg: "hover:bg-blue-500/5" },
  { role: "Cliente",  email: "cliente@barberflix.test",  password: "Test@client123", color: "text-green-400", border: "border-green-500/20", bg: "hover:bg-green-500/5" },
];

const ROLE_HOME: Record<string, string> = {
  client: "/client/dashboard",
  barber: "/barber/dashboard",
  owner: "/admin/dashboard",
  admin: "/admin/dashboard",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const dest = ROLE_HOME[profile?.role ?? "client"] ?? "/client/dashboard";
    window.location.href = dest;
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold tracking-widest text-primary">BARBERFLIX</h1>
          <p className="mt-2 text-sm tracking-widest text-muted-foreground uppercase">Barbearia Santorini</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-lg space-y-5">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">ou</span>
            <Separator className="flex-1" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </Button>
        </div>

        {/* Test accounts accordion */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/40">Contas de Teste</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20 tracking-wider">DEV</span>
            </div>
            <span className="text-white/30 text-xs">{showDemo ? "▲" : "▼"}</span>
          </button>
          {showDemo && (
            <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
              {TEST_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className={`w-full flex items-center justify-between rounded-lg border ${acc.border} ${acc.bg} px-3 py-2.5 transition-colors text-left`}
                >
                  <span className={`text-xs font-semibold ${acc.color}`}>{acc.role}</span>
                  <span className="text-[11px] text-white/30 font-mono">{acc.email}</span>
                </button>
              ))}
              <p className="text-[11px] text-white/20 text-center pt-1">Clique para preencher os campos</p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/register" className="text-primary font-medium transition-colors">Cadastre-se</Link>
        </p>

        <div className="text-center">
          <Link href="/agendar" className="text-sm text-white/50 hover:text-primary transition-colors font-medium">
            Agendar sem cadastrar →
          </Link>
        </div>
      </div>
    </div>
  );
}
