type SavePayload = {
    input?: {
      objectNaam?: unknown;
      adres?: unknown;
      marktwaardeVastgoed?: unknown;
      wozWaardeVastgoed?: unknown;
      financiering?: unknown;
      rentePercentage?: unknown;
      huurPerMaand?: unknown;
      fiscaalPartner?: unknown;
      heffingsvrijBenut?: unknown;
    };
    exploitatiekosten?: Array<{
      name?: unknown;
      amount?: unknown;
    }>;
  };
  
  function text(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }
  
  function number(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  
  export async function POST(request: Request) {
    const webAppUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
    const secret = process.env.GOOGLE_SHEETS_WEB_APP_SECRET;
  
    if (!webAppUrl || !secret) {
      return Response.json(
        {
          success: false,
          message:
            "GOOGLE_SHEETS_WEB_APP_URL of GOOGLE_SHEETS_WEB_APP_SECRET ontbreekt.",
        },
        { status: 500 }
      );
    }
  
    let body: SavePayload;
  
    try {
      body = (await request.json()) as SavePayload;
    } catch {
      return Response.json(
        { success: false, message: "De aanvraag bevat geen geldige JSON." },
        { status: 400 }
      );
    }
  
    const input = body.input ?? {};
    const expenses = Array.isArray(body.exploitatiekosten)
      ? body.exploitatiekosten
          .map((item) => ({
            name: text(item?.name),
            amount: number(item?.amount),
          }))
          .filter(
            (item): item is { name: string; amount: number } =>
              item.name.length > 0 && item.amount !== null
          )
      : [];
  
    const safePayload = {
      secret,
      input: {
        objectNaam: text(input.objectNaam),
        adres: text(input.adres),
        marktwaardeVastgoed: number(input.marktwaardeVastgoed),
        wozWaardeVastgoed: number(input.wozWaardeVastgoed),
        financiering: number(input.financiering),
        rentePercentage: number(input.rentePercentage),
        huurPerMaand: number(input.huurPerMaand),
        fiscaalPartner:
          input.fiscaalPartner === "ja" || input.fiscaalPartner === "nee"
            ? input.fiscaalPartner
            : null,
        heffingsvrijBenut:
          input.heffingsvrijBenut === "ja" ||
          input.heffingsvrijBenut === "nee"
            ? input.heffingsvrijBenut
            : null,
      },
      exploitatiekosten: expenses,
    };
  
    try {
      const response = await fetch(webAppUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(safePayload),
        cache: "no-store",
        redirect: "follow",
      });
  
      const raw = await response.text();
  
      let result: {
        success?: boolean;
        message?: string;
        skipped?: string[];
      };
  
      try {
        result = JSON.parse(raw) as typeof result;
      } catch {
        result = {
          success: false,
          message:
            "Google Apps Script gaf geen geldig JSON-antwoord. Controleer de deployment-URL.",
        };
      }
  
      if (!response.ok || !result.success) {
        return Response.json(
          {
            success: false,
            message:
              result.message ||
              `Google Apps Script gaf status ${response.status}.`,
            skipped: result.skipped ?? [],
          },
          { status: 502 }
        );
      }
  
      return Response.json({
        success: true,
        message: result.message || "Opgeslagen in Google Sheets.",
        skipped: result.skipped ?? [],
      });
    } catch (error) {
      return Response.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Google Sheets kon niet worden bereikt.",
        },
        { status: 502 }
      );
    }
  }