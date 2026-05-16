"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";

interface ProfileData {
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0",
        checked ? "bg-primary" : "bg-white/10"
      )}
      type="button"
    >
      <span className={cn(
        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-[18px]" : "translate-x-0.5"
      )} />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cutCount, setCutCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    const [profileRes, aptsRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/client/appointments"),
    ]);
    if (profileRes.ok) {
      const { profile: p } = await profileRes.json();
      if (p) {
        setProfile(p);
        setFullName(p.full_name ?? "");
        setPhone(p.phone ?? "");
        setAvatarUrl(p.avatar_url ?? null);
      }
    }
    if (aptsRes.ok) {
      const { appointments } = await aptsRes.json();
      const completed = (appointments ?? []).filter((a: { status: string; ends_at: string }) =>
        a.status === "completed" || new Date(a.ends_at) < new Date()
      );
      setCutCount(completed.length);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Erro ao salvar."); }
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setLoading(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Erro ao enviar foto."); }
    else { setAvatarUrl(json.avatar_url); }
    setUploading(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-5"
      variants={stagger(0.09)}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="font-heading text-[26px] font-bold text-foreground">Meu Perfil</h1>
        <p className="text-sm text-white/40 mt-0.5">Gerencie suas informações e preferências.</p>
      </motion.div>

      {/* Profile hero card */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="h-24 w-24 rounded-full object-cover border-2 border-primary/40 shadow-[0_0_16px_rgba(201,169,110,0.25)]" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary font-heading font-bold text-2xl shadow-[0_0_16px_rgba(201,169,110,0.2)]">
                {initials || "?"}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              aria-label="Trocar foto"
            >
              {uploading ? (
                <div className="h-3.5 w-3.5 border-2 border-background/40 border-t-background rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-xl font-bold text-foreground">{fullName || "Seu nome"}</h2>
              <span className="text-[10px] font-bold tracking-wider text-primary bg-primary/15 border border-primary/25 px-2 py-0.5 rounded">
                CLIENTE
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>
                {cutCount} cortes realizados
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Personal info */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            Informações pessoais
          </p>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs text-white/40 uppercase tracking-wider">Nome completo</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11 bg-white/[0.03] border-white/[0.08] focus-visible:border-primary/50" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs text-white/40 uppercase tracking-wider">WhatsApp</Label>
            <Input id="phone" type="tel" placeholder="+55 37 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 bg-white/[0.03] border-white/[0.08] focus-visible:border-primary/50" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {saved && (
            <p className="text-xs text-primary flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              Perfil atualizado
            </p>
          )}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full h-11 rounded-xl bg-primary text-background font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </motion.button>
        </form>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            Preferências
          </p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {[
            { label: "Notificações WhatsApp", sub: "Receber confirmações de agendamento", value: notifWhatsApp, onChange: setNotifWhatsApp },
            { label: "Lembrete 1h antes", sub: "Aviso antes do horário agendado", value: notifReminder, onChange: setNotifReminder },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
              </div>
              <Toggle checked={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Conta
          </p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <a
            href="/client/subscription"
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-foreground">Minha assinatura</p>
              <p className="text-xs text-white/30 mt-0.5">Gerenciar plano VIP</p>
            </div>
            <svg className="w-4 h-4 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-between px-5 py-4 w-full hover:bg-red-500/5 transition-colors group"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-foreground group-hover:text-red-400 transition-colors">Sair da conta</p>
              <p className="text-xs text-white/30 mt-0.5">Encerrar sessão</p>
            </div>
            <svg className="w-4 h-4 text-white/20 group-hover:text-red-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
