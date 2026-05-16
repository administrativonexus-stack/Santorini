import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardContent } from "@/components/client/dashboard-content";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const admin = createAdminClient();

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [
    { data: profile },
    { data: activeAppointment },
    { data: recentAppointments },
    { data: subscription },
    { count: appointmentCount },
  ] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).single(),
    admin
      .from("appointments")
      .select(`id, scheduled_at, ends_at, status,
        barbers ( profiles ( full_name ) ),
        services ( name )`)
      .eq("client_id", user.id)
      .in("status", ["pending", "confirmed", "in_progress"])
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from("appointments")
      .select(`id, scheduled_at, ends_at, status,
        barbers ( profiles ( full_name ) ),
        services ( name )`)
      .eq("client_id", user.id)
      .order("scheduled_at", { ascending: false })
      .limit(8),
    admin
      .from("subscriptions")
      .select("status, plan_name, current_period_end")
      .eq("client_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    admin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id)
      .gte("scheduled_at", startOfMonth)
      .not("status", "in", '("cancelled","no_show")'),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Cliente";

  return (
    <DashboardContent
      firstName={firstName}
      activeAppointment={activeAppointment ?? null}
      recentAppointments={recentAppointments ?? []}
      subscription={subscription ?? null}
      appointmentCount={appointmentCount ?? 0}
    />
  );
}
