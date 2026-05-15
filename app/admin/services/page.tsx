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

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  is_active: boolean;
}

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  category: string;
};

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  price: "",
  duration_minutes: "30",
  category: "",
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchServices = useCallback(async () => {
    const res = await fetch("/api/admin/services");
    if (!res.ok) return;
    const { services: data } = await res.json();
    setServices(data ?? []);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setOpen(true);
  }

  function openEdit(svc: ServiceRow) {
    setEditing(svc);
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      price: String(svc.price),
      duration_minutes: String(svc.duration_minutes),
      category: svc.category ?? "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      duration_minutes: parseInt(form.duration_minutes),
      category: form.category.trim() || null,
    };

    const res = await fetch("/api/admin/services", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
    });

    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Erro ao salvar serviço."); return; }

    setOpen(false);
    fetchServices();
  }

  async function toggleActive(svc: ServiceRow) {
    await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: svc.id, is_active: !svc.is_active }),
    });
    fetchServices();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
    fetchServices();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os serviços disponíveis para agendamento.
          </p>
        </div>
        <Button onClick={openCreate}>+ Novo serviço</Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {services.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum serviço cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {services.map((svc) => (
              <div key={svc.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{svc.name}</p>
                    <Badge variant={svc.is_active ? "default" : "secondary"}>
                      {svc.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    {svc.category && (
                      <Badge variant="outline" className="text-xs">{svc.category}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    R$ {svc.price.toFixed(2)} · {svc.duration_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(svc)} className="text-xs text-muted-foreground">
                    {svc.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(svc)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(svc.id)} className="text-destructive hover:text-destructive">✕</Button>
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
              {editing ? "Editar serviço" : "Novo serviço"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input type="number" min="5" step="5" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria (opcional)</Label>
              <Input placeholder="Ex: Cabelo, Barba, Combo..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
