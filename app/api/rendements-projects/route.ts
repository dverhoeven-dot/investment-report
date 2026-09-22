import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ProjectPayload = {
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

function makeToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Deze GET-route is bedoeld voor de interne projectdropdown.
 * Zorg dat de bestaande toegangssleutel/middleware van de site ook /api/rendements-projects beschermt.
 */
export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("rendements_projects")
      .select("id,name,created_at,updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      projects: (data ?? []).map((project) => ({
        id: project.id,
        name: project.name,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })),
    });
  } catch (error) {
    console.error("Projectlijst laden mislukt", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Projectlijst laden mislukt." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProjectPayload;
    const name = String(body.name ?? "Naamloos project").trim() || "Naamloos project";

    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json(
        { error: "Projectgegevens ontbreken." },
        { status: 400 }
      );
    }

    const viewToken = makeToken();
    const editToken = makeToken();
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("rendements_projects")
      .insert({
        name,
        data: body.data,
        view_token_hash: hashToken(viewToken),
        edit_token_hash: hashToken(editToken),
      })
      .select("id,name,created_at,updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      viewToken,
      editToken,
    });
  } catch (error) {
    console.error("Project aanmaken mislukt", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project aanmaken mislukt." },
      { status: 500 }
    );
  }
}
