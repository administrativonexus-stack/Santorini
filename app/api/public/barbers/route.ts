import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createAdminClient();
  const { data: barbers, error } = await admin
    .from("barbers")
    .select("id, bio, profiles ( full_name, avatar_url )")
    .eq("is_active", true)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ barbers: barbers ?? [] });
}
