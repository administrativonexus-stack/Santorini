"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface BarberRow {
  id: string;
  bio: string | null;
  commission_rate: number;
  is_active: boolean;
  profile_id: string;
  profiles: { full_name: string; phone: string | null } | null;
}

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [commission, setCommission] = useState("50");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteMode, setInviteMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ name: string; email: string; tempPassword: string } | null>(null);

  const fetchBarbers = useCallback(async () => {
    const res = await fetch("/api/admin/barbers");
    if (!res.ok) return;
    const { barbers: data } = await res.json();
    setBarbers((data as BarberRow[]) ?? []);
  }, []);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  function openEdit(b: BarberRow) {
    setEditingId(b.id);
    setBio(b.bio ?? "");
    setCommission(String(b.commission_rate));
    setInviteMode(false);
    setError("");
    setOpen(true);
  }

  function openInvite() {
    setEditingId(null);
    setInviteEmail("");
    setInviteName("");
    setBio("");
    setCommission("50");
    setInviteMode(true);
    setError("");
    setOpen(true);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/barbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        full_name: inviteName.trim(),
        bio: bio.trim() || undefined,
        commission_rate: parseFloat(commission),
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Erro ao cadastrar barbeiro.");
      setLoading(false);
      return;
    }

    const json = await res.json();
    setLoading(false);
    setOpen(false);
    setSuccessInfo({ name: inviteName.trim(), email: inviteEmail, tempPassword: json.tempPassword });
    fetchBarbers();
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/barbers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, bio: bio.trim() || null, commission_rate: parseFloat(commission) }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Erro ao atualizar."); setLoading(false); return; }
    setLoading(false);
    setOpen(false);
    fetchBarbers();
  }

  async function toggleActive(b: BarberRow) {
    await fetch("/api/admin/barbers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, is_active: !b.is_active }),
    });
    fetchBarbers();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Barbeiros</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a equipe da barbearia.
          </p>
        </div>
        <Button onClick={openInvite}>+ Convidar barbeiro</Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {barbers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum barbeiro cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {barbers.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {b.profiles?.full_name ?? "—"}
                    </p>
                    <Badge variant={b.is_active ? "default" : "secondary"}>
                      {b.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Comissão: {b.commission_rate}%
                    {b.profiles?.phone ? ` · ${b.profiles.phone}` : ""}
                  </p>
                  {b.bio && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                      {b.bio}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive(b)}
                    className="text-xs text-muted-foreground"
                  >
                    {b.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {inviteMode ? "Convidar barbeiro" : "Editar barbeiro"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={inviteMode ? handleInvite : handleUpdate}
            className="space-y-4 mt-2"
          >
            {inviteMode && (
              <>
                <div className="space-y-1.5">
                  <Label>Nome completo</Label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email do barbeiro</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha temporária será gerada e exibida após o cadastro.
                  </p>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Bio (opcional)</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Especialidades, experiência..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Comissão (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : inviteMode ? "Convidar" : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success dialog — shows temp password to admin */}
      <Dialog open={!!successInfo} onOpenChange={() => setSuccessInfo(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Barbeiro cadastrado!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Compartilhe as credenciais abaixo com <span className="text-foreground font-medium">{successInfo?.name}</span> para o primeiro acesso.
            </p>
            <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-mono text-foreground">{successInfo?.email}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-muted-foreground">Senha</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-primary font-semibold">{successInfo?.tempPassword}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => navigator.clipboard.writeText(successInfo?.tempPassword ?? "")}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O barbeiro pode trocar a senha após o primeiro acesso nas configurações de perfil.
            </p>
            <Button className="w-full" onClick={() => setSuccessInfo(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
