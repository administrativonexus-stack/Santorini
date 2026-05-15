import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();

  if (!profile || !["barber", "owner", "admin"].includes(profile.role)) {
    redirect("/client/dashboard");
  }

  return (
    <DashboardShell role={profile.role} fullName={profile.full_name}>
      {children}
    </DashboardShell>
  );
}
