import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ subscription: null });

  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("status, plan_name, current_period_end")
    .eq("client_id", session.user.id)
    .maybeSingle();

  return NextResponse.json({ subscription: subscription ?? null });
}
