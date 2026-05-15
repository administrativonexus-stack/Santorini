import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const admin = createAdminClient();
  const { data: clients } = await admin
    .from("profiles")
    .select(`id, full_name, phone, created_at, subscriptions ( status, plan_name )`)
    .eq("role", "client")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground mt-1">
          {clients?.length ?? 0} cliente(s) cadastrado(s).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {!clients || clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum cliente cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => {
              const subs = client.subscriptions as { status: string; plan_name: string }[] | null;
              const activeSub = subs?.find((s) => s.status === "active");
              return (
                <div key={client.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="font-medium text-foreground">{client.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.phone ?? "Sem telefone"} · Desde{" "}
                      {new Date(client.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    {activeSub ? (
                      <span className="text-xs font-medium text-primary">{activeSub.plan_name}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem assinatura</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
