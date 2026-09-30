import {authorizeApi} from "@/lib/portal/api";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HTML_BYTES = 2_500_000;
const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 10_000;

class ImportError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ImportError";
    this.status = status;
  }
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [a, b, c] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string) {
  const value = address.toLowerCase();

  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(value)) return true;
  if (value.startsWith("ff")) return true;
  if (value.startsWith("2001:db8:")) return true;

  if (value.startsWith("::ffff:")) {
    const mapped = value.slice("::ffff:".length);
    return isIP(mapped) === 4 ? isPrivateIpv4(mapped) : true;
  }

  return false;
}

function isPrivateIp(address: string) {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

async function assertSafeUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ImportError("Gebruik een http- of https-productlink.");
  }

  if (url.username || url.password) {
    throw new ImportError("Productlinks met gebruikersgegevens worden niet ondersteund.");
  }

  if (url.port && !['80', '443'].includes(url.port)) {
    throw new ImportError("Deze productlink gebruikt een niet-ondersteunde poort.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new ImportError("Deze URL kan niet worden opgehaald.");
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new ImportError("Deze URL kan niet worden opgehaald.");
    }
    return;
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ImportError("De website kon niet worden gevonden.", 422);
  }

  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new ImportError("Deze URL kan niet worden opgehaald.");
  }
}

async function readLimitedHtml(response: Response) {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_HTML_BYTES) {
    throw new ImportError("De productpagina is te groot om automatisch uit te lezen.", 413);
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let html = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new ImportError("De productpagina is te groot om automatisch uit te lezen.", 413);
    }

    html += decoder.decode(value, { stream: true });
  }

  html += decoder.decode();
  return html;
}

async function fetchProductPage(input: URL) {
  let current = new URL(input.toString());

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertSafeUrl(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.7",
          "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.7",
          "User-Agent":
            "Mozilla/5.0 (compatible; FurnitureProcurement/1.0; +https://example.invalid)",
        },
      });
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof Error && error.name === "AbortError") {
        throw new ImportError("De webshop reageerde niet op tijd.", 504);
      }
      throw new ImportError("De productpagina kon niet worden opgehaald.", 502);
    }

    if (response.status >= 300 && response.status < 400) {
      clearTimeout(timer);
      const location = response.headers.get("location");
      if (!location) {
        throw new ImportError("De webshop gaf een ongeldige doorverwijzing terug.", 502);
      }
      current = new URL(location, current);
      continue;
    }

    if (!response.ok) {
      clearTimeout(timer);
      throw new ImportError(
        response.status === 403 || response.status === 401
          ? "Deze webshop blokkeert automatisch uitlezen. Vul de gegevens handmatig in."
          : `De webshop gaf foutcode ${response.status}.`,
        422
      );
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      clearTimeout(timer);
      throw new ImportError("De link verwijst niet naar een normale productpagina.", 422);
    }

    try {
      const html = await readLimitedHtml(response);
      clearTimeout(timer);
      return { html, finalUrl: current };
    } catch (error) {
      clearTimeout(timer);
      throw error;
    }
  }

  throw new ImportError("De productlink bevat te veel doorverwijzingen.", 422);
}

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
    euro: "€",
  };

  return value
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, token: string) => {
      const lower = token.toLowerCase();
      if (lower.startsWith("#x")) {
        const code = Number.parseInt(lower.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      if (lower.startsWith("#")) {
        const code = Number.parseInt(lower.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return named[lower] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function parseAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  const attrRegex = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(tag))) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attrs[key] = decodeHtml(value);
  }

  return attrs;
}

function getMeta(html: string, ...keys: string[]) {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  const tags = html.match(/<meta\b[^>]*>/gi) || [];

  for (const tag of tags) {
    const attrs = parseAttributes(tag);
    const key = (attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();
    if (wanted.has(key) && attrs.content) return attrs.content.trim();
  }

  return "";
}

function getTitle(html: string) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : "";
}

function firstString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    for (const entry of value) {
      const result = firstString(entry);
      if (result) return result;
    }
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return firstString(record.url ?? record.contentUrl ?? record.name ?? record.value);
  }
  return "";
}

function numericPrice(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  let raw = value.replace(/[^0-9,.-]/g, "").trim();
  if (!raw) return null;

  const comma = raw.lastIndexOf(",");
  const dot = raw.lastIndexOf(".");

  if (comma >= 0 && dot >= 0) {
    if (comma > dot) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else {
      raw = raw.replace(/,/g, "");
    }
  } else if (comma >= 0) {
    const decimals = raw.length - comma - 1;
    raw = decimals > 0 && decimals <= 2 ? raw.replace(",", ".") : raw.replace(/,/g, "");
  }

  const result = Number(raw);
  return Number.isFinite(result) ? result : null;
}

function isProductType(value: unknown) {
  if (typeof value === "string") return value.toLowerCase() === "product";
  if (Array.isArray(value)) return value.some(isProductType);
  return false;
}

function findProductNode(value: unknown): Record<string, unknown> | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findProductNode(entry);
      if (found) return found;
    }
    return null;
  }

  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (isProductType(record["@type"])) return record;

  for (const child of Object.values(record)) {
    const found = findProductNode(child);
    if (found) return found;
  }

  return null;
}

function extractJsonLdProduct(html: string) {
  const scriptRegex = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html))) {
    const raw = match[1]
      .trim()
      .replace(/^<!--/, "")
      .replace(/-->$/, "")
      .replace(/^\/\*<!\[CDATA\[\*\//, "")
      .replace(/\/\*\]\]>\*\/$/, "")
      .trim();

    try {
      const parsed = JSON.parse(raw);
      const product = findProductNode(parsed);
      if (product) return product;
    } catch {
      // Veel webshops publiceren één ongeldige JSON-LD-tag. Probeer de volgende.
    }
  }

  return null;
}

function getOfferData(product: Record<string, unknown> | null) {
  if (!product) return { price: null as number | null, currency: "" };

  const rawOffers = product.offers;
  const offers = Array.isArray(rawOffers) ? rawOffers : rawOffers ? [rawOffers] : [];

  for (const rawOffer of offers) {
    if (!rawOffer || typeof rawOffer !== "object") continue;
    const offer = rawOffer as Record<string, unknown>;
    const priceSpec =
      offer.priceSpecification && typeof offer.priceSpecification === "object"
        ? (offer.priceSpecification as Record<string, unknown>)
        : null;

    const price = numericPrice(
      offer.price ?? offer.lowPrice ?? offer.highPrice ?? priceSpec?.price
    );
    const currency = firstString(
      offer.priceCurrency ?? priceSpec?.priceCurrency
    ).toUpperCase();

    if (price !== null || currency) return { price, currency };
  }

  return { price: null as number | null, currency: "" };
}

function absoluteHttpUrl(value: string, base: URL) {
  if (!value) return "";
  try {
    const url = new URL(value, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function extractProductData(html: string, finalUrl: URL) {
  const product = extractJsonLdProduct(html);
  const offer = getOfferData(product);

  const brand = product
    ? firstString(product.brand ?? product.manufacturer)
    : "";

  const name =
    firstString(product?.name) ||
    getMeta(html, "og:title", "twitter:title") ||
    getTitle(html);

  const description = stripTags(
    firstString(product?.description) ||
      getMeta(html, "og:description", "description", "twitter:description")
  );

  const imageRaw =
    firstString(product?.image) ||
    getMeta(html, "og:image", "og:image:secure_url", "twitter:image");

  const supplier =
    brand ||
    getMeta(html, "product:brand", "og:site_name", "application-name");

  const metaPrice = numericPrice(
    getMeta(html, "product:price:amount", "og:price:amount", "price")
  );

  const price = offer.price ?? metaPrice;
  const currency =
    offer.currency ||
    getMeta(html, "product:price:currency", "og:price:currency").toUpperCase();

  const sku =
    firstString(product?.sku ?? product?.mpn ?? product?.productID) ||
    getMeta(html, "product:retailer_item_id", "sku");

  return {
    url: finalUrl.toString(),
    name: decodeHtml(name).slice(0, 500),
    supplier: decodeHtml(supplier).slice(0, 250),
    description: description.slice(0, 3000),
    price,
    currency: currency.slice(0, 12),
    imageUrl: absoluteHttpUrl(imageRaw, finalUrl),
    sku: decodeHtml(sku).slice(0, 250),
  };
}

export async function POST(request: Request) {
 const access=await authorizeApi("furniture",true,request);
 if(access.response) return access.response;

  try {
    const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      throw new ImportError("Plak eerst een productlink.");
    }

    let input: URL;
    try {
      input = new URL(rawUrl);
    } catch {
      throw new ImportError("Dit lijkt geen geldige productlink.");
    }

    const { html, finalUrl } = await fetchProductPage(input);
    const data = extractProductData(html, finalUrl);

    return Response.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof ImportError ? error.status : 500;
    const message =
      error instanceof ImportError
        ? error.message
        : "Productgegevens konden niet worden opgehaald.";

    return Response.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
