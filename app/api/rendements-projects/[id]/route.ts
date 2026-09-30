import {authorizeApi} from "@/lib/portal/api";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdatePayload = {
  editToken?: string;
  internal?: boolean;
  name?: string;
  data?: unknown;
};


function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error(
      "Supabase is niet geconfigureerd. Controleer NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SECRET_KEY in .env.local."
    );
  }

  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: Request, context: RouteContext) {
 const access=await authorizeApi("returns",false,request);
 if(access.response) return access.response;

  try {
    const { id } = await context.params;
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("rendements_projects")
      .select("id,name,data,created_at,updated_at,view_token_hash,edit_token_hash")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Project niet gevonden." }, { status: 404 });
    }

    const internalAccess = access.user!.role === "employee";
    const canEdit = internalAccess;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      data: data.data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      canEdit,
      internalAccess,
    });
  } catch (error) {
    console.error("Project laden mislukt", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project laden mislukt." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
 const access=await authorizeApi("returns",true,request);
 if(access.response) return access.response;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdatePayload;

    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json(
        { error: "Projectgegevens ontbreken." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from("rendements_projects")
      .select("id,name,edit_token_hash")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Project niet gevonden." }, { status: 404 });
    }


    const name = String(body.name ?? existing.name).trim() || existing.name;
    const { data, error } = await supabase
      .from("rendements_projects")
      .update({
        name,
        data: body.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,name,updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error("Project opslaan mislukt", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project opslaan mislukt." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
 const access=await authorizeApi("returns",true,request);
 if(access.response) return access.response;

  try {
    const { id } = await context.params;
    const supabase = getAdminClient();

    const { data: existing, error: existingError } = await supabase
      .from("rendements_projects")
      .select("id,edit_token_hash")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Project niet gevonden." }, { status: 404 });
    }


    const { error } = await supabase
      .from("rendements_projects")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Project verwijderen mislukt", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project verwijderen mislukt." },
      { status: 500 }
    );
  }
}
