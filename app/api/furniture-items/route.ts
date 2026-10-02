import {authorizeApi} from "@/lib/portal/api";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FurnitureItemInput = {
  id?: string;
  itemNo?: string;
  name?: string;
  category?: string;
  location?: string;
  placementLocation?: string;
  dimensions?: string;
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
  sourceRow?: number;
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

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeItem(input: FurnitureItemInput) {
  return {
    item_no: String(input.itemNo ?? "").trim(),
    name: String(input.name ?? "").trim(),
    category: String(input.category ?? "Furniture").trim() || "Furniture",
    location: String(input.location ?? "").trim(),
    placement_location: String(input.placementLocation ?? "").trim(),
    dimensions: String(input.dimensions ?? "").trim(),
    purchase_price: toNumber(input.purchasePrice),
    normal_price: toNumber(input.normalPrice),
    quantity: Math.max(1, Math.round(toNumber(input.quantity, 1))),
    status: String(input.status ?? "Geselecteerd").trim() || "Geselecteerd",
    payment_status:
      String(input.paymentStatus ?? "Niet betaald").trim() || "Niet betaald",
    supplier: String(input.supplier ?? "").trim(),
    product_url: String(input.productUrl ?? "").trim(),
    expected_delivery: input.expectedDelivery
      ? String(input.expectedDelivery)
      : null,
    notes: String(input.notes ?? "").trim(),
    images: Array.isArray(input.images)
      ? input.images.filter((value): value is string => typeof value === "string")
      : [],
    source_row:
      typeof input.sourceRow === "number" && Number.isFinite(input.sourceRow)
        ? Math.round(input.sourceRow)
        : null,
  };
}

function fromRow(row: Record<string, any>) {
  return {
    id: row.id,
    itemNo: row.item_no ?? "",
    name: row.name ?? "",
    category: row.category ?? "Furniture",
    location: row.location ?? "",
    placementLocation: row.placement_location ?? "",
    dimensions: row.dimensions ?? "",
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

export async function GET() {
 const access=await authorizeApi("furniture",false,undefined);
 if(access.response) return access.response;

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("furniture_items")
      .select("*")
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ items: (data ?? []).map(fromRow) });
  } catch (error) {
    console.error("Furniture items laden mislukt", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Furniture items konden niet worden geladen.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
 const access=await authorizeApi("furniture",true,request);
 if(access.response) return access.response;

  try {
    const body = (await request.json()) as FurnitureItemInput;
    const supabase = getAdminClient();

    const normalized = normalizeItem(body);
    if (!normalized.name) {
      return NextResponse.json({ error: "Productnaam ontbreekt." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("furniture_items")
      .insert({
        ...normalized,
        sort_order: Date.now(),
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ item: fromRow(data) });
  } catch (error) {
    console.error("Furniture item opslaan mislukt", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Furniture item opslaan mislukt.",
      },
      { status: 500 }
    );
  }
}
