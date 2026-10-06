export type PortfolioId =
  | "joint-private-real-estate"
  | "leeuw-vastgoed"
  | "l3-capital"
  | "llpi-leovari"
  | "d-leeuw-private-real-estate"
  | "d-leeuw-private-real-estate-spain";

export const PORTFOLIO_OPTIONS: Array<{ id: PortfolioId; label: string }> = [
  {
    id: "joint-private-real-estate",
    label: "D. Leeuw e/o F. Berden Private Real Estate",
  },
  {
    id: "leeuw-vastgoed",
    label: "Leeuw Vastgoed B.V. (100%)",
  },
  {
    id: "l3-capital",
    label: "L3 Capital B.V. (100%)",
  },
  {
    id: "llpi-leovari",
    label: "LLPI S.L. / Leovari developments",
  },
  {
    id: "d-leeuw-private-real-estate",
    label: "D. Leeuw Private Real Estate",
  },
  {
    id: "d-leeuw-private-real-estate-spain",
    label: "D. Leeuw Private Real Estate Spain",
  },
];


function normalizeText(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getPortfolioId(value: string): PortfolioId | null {
  const text = normalizeText(value);

  if (text.includes("f berden") || text.includes("private real estate 50")) {
    return "joint-private-real-estate";
  }

  if (text.includes("leeuw vastgoed")) return "leeuw-vastgoed";
  if (text.includes("l3 capital")) return "l3-capital";

  if (text.includes("llpi") || text.includes("leovari")) {
    return "llpi-leovari";
  }

  if (
    text.includes("d leeuw private real estate spain") ||
    text.includes("d leeuw private real estate spanje")
  ) {
    return "d-leeuw-private-real-estate-spain";
  }

  if (text.includes("d leeuw private real estate")) {
    return "d-leeuw-private-real-estate";
  }

  return null;
}

