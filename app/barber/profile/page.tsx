"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BarberProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile, bio: barberBio }) => {
        if (profile) {
          setFullName(profile.full_name ?? "");
          setPhone(profile.phone ?? "");
          setAvatarUrl(profile.avatar_url ?? null);
        }
        setBio(barberBio ?? "");
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
      body: JSON.stringify({ full_name: fullName, phone, bio }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar.");
    } else {
      setSaved(true);
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

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

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
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Suas informações visíveis para os clientes.</p>
      </div>

      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-16 w-16 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary/20 border border-border flex items-center justify-center text-primary font-heading font-bold text-xl">
            {initials || "?"}
          </div>
        )}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Enviando..." : "Trocar foto"}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP. Máx 5MB.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+55 11 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Apresente-se para os clientes..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && (
            <p className="text-sm text-primary">Perfil atualizado com sucesso.</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </div>
    </div>
  );
}
