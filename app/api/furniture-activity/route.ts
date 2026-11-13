import { authorizeApi } from "@/lib/portal/api";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { writeActivity } from "./activityLog";
import { currentPortalActor } from "./currentPortalActor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error("Supabase is not configured.");
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fromRow(row: Record<string, any>) {
  return {
    id: row.id,
    itemId: row.furniture_item_id ?? null,
    itemName: row.item_name ?? "Unnamed item",
    action: row.action ?? "updated",
    fieldName: row.field_name ?? "",
    oldValue: row.old_value ?? "",
    newValue: row.new_value ?? "",
    actorName: row.actor_name ?? "Unknown user",
    createdAt: row.created_at ?? "",
  };
}

export async function GET() {
  const access = await authorizeApi("furniture", false, undefined);
  if (access.response) return access.response;

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("furniture_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) throw error;
    const currentUser = await currentPortalActor();
    return NextResponse.json({ entries: (data ?? []).map(fromRow), currentUser });
  } catch (error) {
    console.error("Failed to load furniture activity log", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Activity log could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const access = await authorizeApi("furniture", true, request);
  if (access.response) return access.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      itemName?: string;
    };

    if (body.action !== "property_added" || !body.itemName?.trim()) {
      return NextResponse.json({ error: "Invalid activity entry." }, { status: 400 });
    }

    const supabase = getAdminClient();
    const actor = await currentPortalActor();
    await writeActivity(supabase, {
      itemName: body.itemName,
      action: "property_added",
      actorName: actor.name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save furniture activity", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Activity could not be saved." },
      { status: 500 }
    );
  }
}
