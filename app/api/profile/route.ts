import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("full_name, phone, avatar_url, role")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let bio: string | null = null;
  if (profile.role === "barber") {
    const { data: barber } = await admin
      .from("barbers")
      .select("bio")
      .eq("profile_id", session.user.id)
      .single();
    bio = barber?.bio ?? null;
  }

  return NextResponse.json({ profile, bio });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { full_name, phone, bio, avatar_url } = body as {
    full_name?: string;
    phone?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  };

  const admin = createAdminClient();

  const profileUpdate: { full_name?: string; phone?: string | null; avatar_url?: string | null } = {};
  if (full_name !== undefined) profileUpdate.full_name = full_name;
  if (phone !== undefined) profileUpdate.phone = phone || null;
  if (avatar_url !== undefined) profileUpdate.avatar_url = avatar_url;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", session.user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (bio !== undefined) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role === "barber") {
      const { error: bioError } = await admin
        .from("barbers")
        .update({ bio: bio || null })
        .eq("profile_id", session.user.id);
      if (bioError) return NextResponse.json({ error: bioError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
