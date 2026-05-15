import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyOwner() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, status: 401, error: "Unauthorized" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, status: 200, error: null };
}

export async function GET() {
  const { ok, status, error } = await verifyOwner();
  if (!ok) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from("services")
    .select("*")
    .order("name");

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { ok, status, error } = await verifyOwner();
  if (!ok) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from("services")
    .insert({
      name: body.name,
      description: body.description || null,
      price: body.price,
      duration_minutes: body.duration_minutes,
      category: body.category || null,
    })
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ service: data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { ok, status, error } = await verifyOwner();
  if (!ok) return NextResponse.json({ error }, { status });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from("services")
    .update({
      name: body.name,
      description: body.description || null,
      price: body.price,
      duration_minutes: body.duration_minutes,
      category: body.category || null,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

export async function PATCH(req: NextRequest) {
  const { ok, status, error } = await verifyOwner();
  if (!ok) return NextResponse.json({ error }, { status });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const admin = createAdminClient();
  const { error: dbErr } = await admin
    .from("services")
    .update({ is_active: body.is_active })
    .eq("id", body.id);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { ok, status, error } = await verifyOwner();
  if (!ok) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const admin = createAdminClient();
  const { error: dbErr } = await admin.from("services").delete().eq("id", id);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
