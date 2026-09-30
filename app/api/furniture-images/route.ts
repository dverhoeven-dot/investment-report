import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "furniture-images";
const MAX_FILE_SIZE = 15 * 1024 * 1024;

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

function safeExtension(file: File) {
  const typeToExtension: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };

  return typeToExtension[file.type] ?? "img";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Geen foto ontvangen." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Alleen afbeeldingsbestanden zijn toegestaan." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Foto is te groot. Maximaal 15 MB." },
        { status: 413 }
      );
    }

    const extension = safeExtension(file);
    const path = `standalone/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const supabase = getAdminClient();

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) throw error;

    return NextResponse.json({
      path,
      url: `/api/furniture-images?path=${encodeURIComponent(path)}`,
    });
  } catch (error) {
    console.error("Furniture foto upload mislukt", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Foto uploaden is mislukt.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";

    if (
      !path ||
      path.startsWith("/") ||
      path.includes("..") ||
      path.includes("\\") ||
      path.length > 500
    ) {
      return new Response("Ongeldige afbeelding.", { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(path);

    if (error || !data) {
      return new Response("Afbeelding niet gevonden.", { status: 404 });
    }

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Furniture foto laden mislukt", error);
    return new Response("Afbeelding kon niet worden geladen.", { status: 500 });
  }
}
