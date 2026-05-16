"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile) {
          setFullName(profile.full_name ?? "");
          setPhone(profile.phone ?? "");
          setAvatarUrl(profile.avatar_url ?? null);
        }
      });
  }, []);

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
    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
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
    if (!res.ok) {
      setError(json.error ?? "Erro ao enviar foto.");
    } else {
      setAvatarUrl(json.avatar_url);
    }
    setUploading(false);
  }

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-md mx-auto space-y-6">

      {/* Avatar section */}
      <div className="flex flex-col items-center pt-4 pb-2 space-y-3">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-24 w-24 rounded-full object-cover border-2 border-primary/40 glow-gold-sm"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary font-heading font-bold text-2xl glow-gold-xs">
              {initials || "?"}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Trocar foto"
          >
            {uploading ? (
              <div className="h-3.5 w-3.5 border-2 border-background/50 border-t-background rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="font-heading text-xl font-bold text-foreground">{fullName || "Seu nome"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Cliente · Barbearia Santorini</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-4">Informações pessoais</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs text-muted-foreground uppercase tracking-wide">
              Nome completo
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase tracking-wide">
              WhatsApp
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+55 37 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && (
            <p className="text-sm text-primary flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Perfil atualizado com sucesso
            </p>
          )}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </div>

      {/* Photo tip */}
      <p className="text-center text-xs text-muted-foreground">
        Foto aceita JPG, PNG ou WebP · Máx 5MB
      </p>
    </div>
  );
}
