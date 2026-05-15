import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppSidebar } from "@/components/shared/app-sidebar";

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
    <div className="flex h-screen bg-background">
      <AppSidebar role={profile.role} fullName={profile.full_name} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
