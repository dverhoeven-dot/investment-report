import {authorizeApi} from "@/lib/portal/api";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type FurnitureItemInput = {
  itemNo?: string;
  name?: string;
  category?: string;
  location?: string;
  purchasePrice?: number;
  normalPrice?: number;
  quantity?: number;
  status?: string;
  paymentStatus?: string;
  supplier?: string;
  productUrl?: string;
  expectedDelivery?: string;
  notes?: string;
  images?: string[];
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error(
      "Supabase is niet geconfigureerd. Controleer NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SECRET_KEY."
    );
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fromRow(row: Record<string, any>) {
  return {
    id: row.id,
    itemNo: row.item_no ?? "",
    name: row.name ?? "",
    category: row.category ?? "Furniture",
    location: row.location ?? "",
    purchasePrice: Number(row.purchase_price ?? 0),
    normalPrice: Number(row.normal_price ?? 0),
    quantity: Number(row.quantity ?? 1),
    status: row.status ?? "Geselecteerd",
    paymentStatus: row.payment_status ?? "Niet betaald",
    supplier: row.supplier ?? "",
    productUrl: row.product_url ?? "",
    expectedDelivery: row.expected_delivery ?? "",
    notes: row.notes ?? "",
    images: Array.isArray(row.images) ? row.images : [],
    sourceRow: row.source_row ?? undefined,
  };
}

function buildUpdate(body: FurnitureItemInput) {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.itemNo !== undefined) update.item_no = String(body.itemNo).trim();
  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.category !== undefined) update.category = String(body.category).trim();
  if (body.location !== undefined) update.location = String(body.location).trim();
  if (body.purchasePrice !== undefined)
    update.purchase_price = Number(body.purchasePrice) || 0;
  if (body.normalPrice !== undefined)
    update.normal_price = Number(body.normalPrice) || 0;
  if (body.quantity !== undefined)
    update.quantity = Math.max(1, Math.round(Number(body.quantity) || 1));
  if (body.status !== undefined) update.status = String(body.status).trim();
  if (body.paymentStatus !== undefined)
    update.payment_status = String(body.paymentStatus).trim();
  if (body.supplier !== undefined) update.supplier = String(body.supplier).trim();
  if (body.productUrl !== undefined)
    update.product_url = String(body.productUrl).trim();
  if (body.expectedDelivery !== undefined)
    update.expected_delivery = body.expectedDelivery
      ? String(body.expectedDelivery)
      : null;
  if (body.notes !== undefined) update.notes = String(body.notes).trim();
  if (body.images !== undefined)
    update.images = Array.isArray(body.images)
      ? body.images.filter((value): value is string => typeof value === "string")
      : [];

  return update;
}

async function updateItem(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as FurnitureItemInput;
    const update = buildUpdate(body);

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("furniture_items")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ item: fromRow(data) });
  } catch (error) {
    console.error("Furniture item wijzigen mislukt", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Furniture item wijzigen mislukt.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
 const access=await authorizeApi("furniture",true,request);
 if(access.response) return access.response;

  return updateItem(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
 const access=await authorizeApi("furniture",true,request);
 if(access.response) return access.response;

  return updateItem(request, context);
}

export async function DELETE(_request: Request, context: RouteContext) {
 const access=await authorizeApi("furniture",true,_request);
 if(access.response) return access.response;

  try {
    const { id } = await context.params;
    const supabase = getAdminClient();

    const { error } = await supabase.from("furniture_items").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Furniture item verwijderen mislukt", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Furniture item verwijderen mislukt.",
      },
      { status: 500 }
    );
  }
}
