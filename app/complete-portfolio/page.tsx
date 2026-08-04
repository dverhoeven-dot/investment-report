/* eslint-disable @next/next/no-img-element */
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSy5ruI_t2bZHex5vWNhI2txiYS6Dph1r5oSvW19omhO6aTbP9H-21qsqjpztO4Rg/pub?gid=215029047&single=true&output=csv";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type Country = "Nederland" | "Spanje" | "Overig";

type Asset = {
  entity: string;
  project: string;
  address: string;
  country: Country;
  ownership: number;
  status: string;
  sold: boolean;
  builtArea: number;
  plotSize: number;
  purchaseDate: string;
  salesDate: string;
  purchasePrice: number;
  investedValue: number;
  salesValue: number;
  explicitProfit: number;
  hasExplicitProfit: boolean;
  annualRent: number;
  rentYield: number;
  mortgage: number;
  stillToInvest: number;
  irr: number;
};

type FinancingRow = {
  name: string;
  entity: string;
  country: Country;
  ownership: number;
  mortgage: number;
};

type FinancialRow = {
  label: string;
  tag: string;
  value: number;
};

type FinancialOverview = {
  summary: FinancialRow[];
  capital: FinancialRow[];
  results: FinancialRow[];
  currentAccounts: FinancialRow[];
};

type PortfolioData = {
  assets: Asset[];
  financingRows: FinancingRow[];
  financialOverview: FinancialOverview;
};

type NormalizedRow = Record<string, string>;

type PortfolioId =
  | "joint-private-real-estate"
  | "leeuw-vastgoed"
  | "l3-capital"
  | "llpi-leovari"
  | "d-leeuw-private-real-estate"
  | "d-leeuw-private-real-estate-spain";

const PORTFOLIO_OPTIONS: Array<{ id: PortfolioId; label: string }> = [
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

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const currencyFormatterWithCents = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("nl-NL", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("nl-NL", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const IMAGE_RULES: Array<{ match: RegExp; src: string }> = [
  // Spain
  {
    match: /margarita|la carolina|carolina/,
    src: "/portfolio-photos-nl-es/la-carolina.jpg",
  },
  {
    match: /los naranjos/,
    src: "/portfolio-photos-nl-es/los-naranjos.jpg",
  },
  {
    match: /lomas de rio verde/,
    src: "/portfolio-photos-nl-es/lomas-de-rio-verde.jpeg",
  },
  {
    match: /lomas rio verde/,
    src: "/portfolio-photos-nl-es/lomas-rio-verde.jpg",
  },
  {
    match: /calderon|de la barca/,
    src: "/portfolio-photos-nl-es/calderon-de-la-barca.jpg",
  },
  {
    match: /benabola|haven appartment|haven apartment|haven/,
    src: "/portfolio-photos-nl-es/haven-appartment.jpg",
  },
  {
    match: /mona lisa/,
    src: "/portfolio-photos-nl-es/mona-lisa.jpg",
  },

  // The Netherlands — exact addresses first
  {
    match: /bevrijdingsweg 39/,
    src: "/portfolio-photos-nl-es/bevrijdingsweg-39.jpg",
  },
  {
    match: /buys ballotstraat 9/,
    src: "/portfolio-photos-nl-es/buys-ballotstraat-9.jpg",
  },
  {
    match: /declarantenweg 29 a|declarantenweg 29a/,
    src: "/portfolio-photos-nl-es/declarantenweg-29A.jpg",
  },
  {
    match: /declarantenweg 29/,
    src: "/portfolio-photos-nl-es/declarantenweg-29.jpg",
  },
  {
    match: /declarantenweg 28/,
    src: "/portfolio-photos-nl-es/declarantenweg-28.jpg",
  },
  {
    match: /dokter blumenkampstraat 3|dr blumenkampstraat 3/,
    src: "/portfolio-photos-nl-es/dokter-blumenkampstraat-3.jpg",
  },
  {
    match: /(?:groethofstraat|goethofstraat) 103/,
    src: "/portfolio-photos-nl-es/groethofstraat-103.jpeg",
  },
  {
    match: /(?:groethofstraat|goethofstraat) 99/,
    src: "/portfolio-photos-nl-es/groethofstraat-99.png",
  },
  {
    match: /(?:groethofstraat|goethofstraat) 52/,
    src: "/portfolio-photos-nl-es/goethofstraat-52.jpg",
  },
  {
    match: /(?:groethofstraat|goethofstraat) 34/,
    src: "/portfolio-photos-nl-es/groethofstraat-34.jpg",
  },
  {
    match: /horsterweg 180/,
    src: "/portfolio-photos-nl-es/horsterweg-180.jpg",
  },
  {
    match: /horsterweg 31/,
    src: "/portfolio-photos-nl-es/horsterweg-31.jpg",
  },
  {
    match: /kaldenkerkerweg 28/,
    src: "/portfolio-photos-nl-es/kaldenkerkerweg-28.jpg",
  },
  {
    match: /kazernestraat 10/,
    src: "/portfolio-photos-nl-es/kazernestraat-10.jpeg",
  },
  {
    match: /keizersveld 71/,
    src: "/portfolio-photos-nl-es/keizersveld-71.jpg",
  },
  {
    match: /leeuwerikstraat 1/,
    src: "/portfolio-photos-nl-es/leeuwerikstraat-1.jpeg",
  },
  {
    match: /magalhaesweg 4|magelhaesweg 4/,
    src: "/portfolio-photos-nl-es/magalhaesweg-4.png",
  },
  {
    match: /middelweg 25/,
    src: "/portfolio-photos-nl-es/middelweg-25.jpg",
  },
  {
    match: /noordhoven 19/,
    src: "/portfolio-photos-nl-es/noordhoven-19.jpg",
  },
  {
    match: /noordhoven 2/,
    src: "/portfolio-photos-nl-es/noordhoven-2.jpg",
  },
  {
    match: /nusterweg 63/,
    src: "/portfolio-photos-nl-es/nusterweg-63.jpg",
  },
  {
    match: /parlevinkerstraat 1/,
    src: "/portfolio-photos-nl-es/parlevinkerstraat-1.jpg",
  },
  {
    match: /prinsessesingel 30|princessesingel 30/,
    src: "/portfolio-photos-nl-es/princessesingel-30.jpg",
  },
  {
    match: /prinsessesingel 13|princessesingel 13/,
    src: "/portfolio-photos-nl-es/Princessesingel-13.jpg",
  },
  {
    match: /rudolf dieselweg 34/,
    src: "/portfolio-photos-nl-es/rudolf-dieselweg-34.jpg",
  },
  {
    match: /rudolf dieselweg 2 6|rudolf dieselweg 2-6/,
    src: "/portfolio-photos-nl-es/rudolf-dieselweg-2-6.jpg",
  },
  {
    match: /schoenenstraat 3/,
    src: "/portfolio-photos-nl-es/schoenenstraat-3.jpg",
  },
  {
    match: /smakterweg 23/,
    src: "/portfolio-photos-nl-es/smakterweg-23.jpg",
  },
  {
    match: /snelliusweg 1|snellius 1/,
    src: "/portfolio-photos-nl-es/snellius-1.jpg",
  },
  {
    match: /spoorstraat 52/,
    src: "/portfolio-photos-nl-es/spoorstraat-52.jpg",
  },
  {
    match: /steegstraat 21/,
    src: "/portfolio-photos-nl-es/steegstraat-21.png",
  },
  {
    match: /tajikade 10/,
    src: "/portfolio-photos-nl-es/tajikade-10.jpg",
  },
  {
    match: /transportlaan 1/,
    src: "/portfolio-photos-nl-es/transportlaan-1.jpg",
  },
  {
    match: /winkelveldstraat 24/,
    src: "/portfolio-photos-nl-es/winkelveldstraat-24.jpg",
  },
  {
    match: /winkelveldstraat 21/,
    src: "/portfolio-photos-nl-es/winkelveldstraat-21.jpg",
  },
  {
    match: /zonneveld 7/,
    src: "/portfolio-photos-nl-es/zonneveld-7.jpeg",
  },

  // Less specific fallbacks
  {
    match: /groethofstraat|goethofstraat/,
    src: "/portfolio-photos-nl-es/groethofstraat-99.png",
  },
  {
    match: /leeuwerikstraat/,
    src: "/portfolio-photos-nl-es/leeuwerikstraat-1.jpeg",
  },
  {
    match: /zonneveld/,
    src: "/portfolio-photos-nl-es/zonneveld-7.jpeg",
  },
  {
    match: /magalhaesweg|magelhaesweg/,
    src: "/portfolio-photos-nl-es/magalhaesweg-4.png",
  },
  {
    match: /steegstraat/,
    src: "/portfolio-photos-nl-es/steegstraat-21.png",
  },
  {
    match: /kazernestraat/,
    src: "/portfolio-photos-nl-es/kazernestraat-10.jpeg",
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

function normalizeHeader(value: string): string {
  return normalizeText(value).replace(/\s+/g, "");
}

function getPortfolioId(value: string): PortfolioId | null {
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

function matchesPortfolioSelection(
  value: string,
  selectedPortfolioIds: Set<PortfolioId>,
): boolean {
  const portfolioId = getPortfolioId(value);

  // Onbekende entiteitsnamen blijven zichtbaar wanneer alle zes portfolio's
  // geselecteerd zijn. Bij een actieve selectie worden ze niet meegenomen.
  if (!portfolioId) {
    return selectedPortfolioIds.size === PORTFOLIO_OPTIONS.length;
  }

  return selectedPortfolioIds.has(portfolioId);
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatCurrencyWithCents(value: number): string {
  return currencyFormatterWithCents.format(Number.isFinite(value) ? value : 0);
}

function formatFinancialCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = formatCurrencyWithCents(Math.abs(safeValue));
  return safeValue < 0 ? `(${formatted})` : formatted;
}

function formatNumber(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value: number): string {
  return percentFormatter.format(Number.isFinite(value) ? value : 0);
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;

  let cleaned = value
    .trim()
    .replace(/\u00a0/g, "")
    .replace(/[€£$%\s]/g, "");

  if (!cleaned || cleaned === "-") return 0;

  const negativeByBrackets = cleaned.startsWith("(") && cleaned.endsWith(")");
  cleaned = cleaned.replace(/[()]/g, "").replace(/[^\d,.\-]/g, "");

  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");

  if (commaIndex >= 0 && dotIndex >= 0) {
    if (commaIndex > dotIndex) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (commaIndex >= 0) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    const dots = (cleaned.match(/\./g) || []).length;
    if (dots > 1 || /^-?\d{1,3}\.\d{3}$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, "");
    }
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return 0;
  return negativeByBrackets ? -Math.abs(parsed) : parsed;
}

function parsePercentage(value: string | undefined): number {
  if (!value) return 0;
  const parsed = parseNumber(value);
  if (value.includes("%") || Math.abs(parsed) > 1) return parsed / 100;
  return parsed;
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function createEmptyFinancialOverview(): FinancialOverview {
  return {
    summary: [],
    capital: [],
    results: [],
    currentAccounts: [],
  };
}

function extractFinancialOverview(csv: string): FinancialOverview {
  const matrix = parseCsv(csv);
  const overview = createEmptyFinancialOverview();

  const startIndex = matrix.findIndex((row) =>
    normalizeText(row[0] ?? "").includes("financieel overzicht organigram"),
  );

  if (startIndex < 0) return overview;

  let section: keyof FinancialOverview = "summary";

  for (
    let index = startIndex + 1;
    index < Math.min(matrix.length, startIndex + 45);
    index += 1
  ) {
    const sourceRow = matrix[index] ?? [];
    const sourceLabel = (sourceRow[0] ?? "").trim();
    const tag = (sourceRow[1] ?? "").trim();
    const sourceValue = (sourceRow[2] ?? "").trim();

    const normalizedLabel = normalizeText(sourceLabel);
    const normalizedTag = normalizeText(tag);

    if (normalizedLabel.includes("uitsluiten op projectnaam")) break;

    if (normalizedLabel === "identity" && normalizedTag === "liquidity") {
      section = "results";
      continue;
    }

    if (
      normalizedLabel.startsWith("total invested capital") ||
      normalizedLabel.startsWith("total borrowed")
    ) {
      section = "capital";
    }

    if (normalizedTag === "rc") {
      section = "currentAccounts";
    }

    if (!sourceLabel && !tag && !sourceValue) continue;

    const label =
      sourceLabel ||
      (section === "capital" ? "Total capital position" : "Total");

    overview[section].push({
      label,
      tag,
      value: parseNumber(sourceValue),
    });
  }

  return overview;
}

function getFinancialValue(rows: FinancialRow[], labelPart: string): number {
  const search = normalizeText(labelPart);
  return (
    rows.find((row) => normalizeText(row.label).includes(search))?.value ?? 0
  );
}

function hasFinancialRows(overview: FinancialOverview): boolean {
  return (
    overview.summary.length +
      overview.capital.length +
      overview.results.length +
      overview.currentAccounts.length >
    0
  );
}

const RESERVED_PROJECT_CONTROL_TERMS = new Set([
  "mortgage",
  "hypotheek",
  "to invest",
  "still to invest",
  "nog te investeren",
]);

function extractProjectExclusions(csv: string): string[] {
  const matrix = parseCsv(csv);

  let headerRowIndex = -1;
  let headerColumnIndex = -1;

  matrix.some((row, rowIndex) =>
    row.some((cell, columnIndex) => {
      if (normalizeText(cell).includes("uitsluiten op projectnaam")) {
        headerRowIndex = rowIndex;
        headerColumnIndex = columnIndex;
        return true;
      }
      return false;
    }),
  );

  if (headerRowIndex < 0 || headerColumnIndex < 0) return [];

  const exclusions: string[] = [];
  let consecutiveBlankRows = 0;

  for (
    let rowIndex = headerRowIndex + 1;
    rowIndex < Math.min(matrix.length, headerRowIndex + 50);
    rowIndex += 1
  ) {
    const rawValue = (matrix[rowIndex]?.[headerColumnIndex] ?? "").trim();

    if (!rawValue) {
      consecutiveBlankRows += 1;
      if (consecutiveBlankRows >= 2 && exclusions.length > 0) break;
      continue;
    }

    consecutiveBlankRows = 0;

    const normalizedValue = normalizeText(rawValue);

    // Deze regels worden elders in de code functioneel verwerkt en mogen
    // daarom niet als algemene uitsluitwoorden worden toegepast.
    if (
      !normalizedValue ||
      RESERVED_PROJECT_CONTROL_TERMS.has(normalizedValue)
    ) {
      continue;
    }

    if (!exclusions.includes(normalizedValue)) {
      exclusions.push(normalizedValue);
    }
  }

  return exclusions;
}

const HEADER_GROUPS = {
  entity: ["entity", "entiteit", "company", "portfolio", "vennootschap", "owner"],
  project: [
    "projectobject",
    "project",
    "object",
    "property",
    "pand",
    "asset",
    "address",
    "adres",
  ],
  status: ["portfoliostatus", "status", "category", "categorie"],
  value: [
    "salesvalue",
    "expectedexitvalue",
    "endvalue",
    "currentvalue",
    "saleprice",
    "investedvalue",
    "totalinvestment",
  ],
  area: ["builtarea", "builtaream2", "plotsize", "plotsizem2"],
};

function rowHeaderScore(row: string[]): number {
  const headers = row.map(normalizeHeader);
  let score = 0;

  for (const aliases of Object.values(HEADER_GROUPS)) {
    if (headers.some((header) => aliases.includes(header))) score += 1;
  }

  return score;
}

function csvToRows(csv: string): NormalizedRow[] {
  const matrix = parseCsv(csv);
  if (matrix.length < 2) throw new Error("De CSV bevat geen bruikbare gegevens.");

  let bestIndex = -1;
  let bestScore = -1;

  matrix.forEach((row, index) => {
    const score = rowHeaderScore(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (bestIndex < 0 || bestScore < 2) {
    throw new Error(
      "De rij met kolomkoppen kon niet worden gevonden. Controleer of de CSV het juiste tabblad publiceert.",
    );
  }

  const duplicateCounter = new Map<string, number>();
  const headers = matrix[bestIndex].map((header, index) => {
    const base = normalizeHeader(header) || `column${index}`;
    const count = (duplicateCounter.get(base) ?? 0) + 1;
    duplicateCounter.set(base, count);
    return count === 1 ? base : `${base}${count}`;
  });

  const rowsAfterHeader = matrix.slice(bestIndex + 1);
  const financialStartIndex = rowsAfterHeader.findIndex((values) =>
    normalizeText(values[0] ?? "").includes("financieel overzicht organigram"),
  );
  const assetRows =
    financialStartIndex >= 0
      ? rowsAfterHeader.slice(0, financialStartIndex)
      : rowsAfterHeader;

  return assetRows
    .filter((values) => values.some((value) => value.trim() !== ""))
    .map((values) => {
      const row: NormalizedRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? "";
      });
      return row;
    });
}

function getCell(row: NormalizedRow, aliases: string[]): string {
  const normalizedAliases = aliases.map(normalizeHeader);

  for (const alias of normalizedAliases) {
    const exact = row[alias];
    if (exact !== undefined && exact !== "") return exact;
  }

  for (const alias of normalizedAliases) {
    const key = Object.keys(row).find(
      (candidate) => candidate === alias || candidate.startsWith(`${alias}2`),
    );
    if (key && row[key] !== "") return row[key];
  }

  return "";
}

function sheetDate(value: string): string {
  if (!value) return "";
  const serial = Number(value);
  if (Number.isFinite(serial) && serial > 20000 && serial < 100000) {
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return date.toLocaleDateString("nl-NL");
  }
  return value;
}

type PortfolioStage = "current" | "sold" | "pipeline" | "unknown";

function getPortfolioStage(status: string, entity = ""): PortfolioStage {
  const statusText = normalizeText(status);
  const entityText = normalizeText(entity);

  if (
    statusText === "sold" ||
    statusText === "verkocht" ||
    statusText.includes("sold") ||
    statusText.includes("verkocht") ||
    entityText.includes("sold objects") ||
    entityText.includes("verkochte objecten")
  ) {
    return "sold";
  }

  if (
    statusText === "pipeline" ||
    statusText.includes("pipeline") ||
    statusText.includes("upcoming")
  ) {
    return "pipeline";
  }

  if (
    statusText === "current" ||
    statusText === "portefeuille" ||
    statusText === "active" ||
    statusText === "actief" ||
    statusText.includes("current") ||
    statusText.includes("portefeuille")
  ) {
    return "current";
  }

  return "unknown";
}

function isSoldStatus(status: string, entity = ""): boolean {
  return getPortfolioStage(status, entity) === "sold";
}

function isSoldAsset(asset: Asset): boolean {
  return getPortfolioStage(asset.status, asset.entity) === "sold";
}

function isCurrentAsset(asset: Asset): boolean {
  return getPortfolioStage(asset.status, asset.entity) === "current";
}

function isJointPortfolioAsset(asset: Asset): boolean {
  const entityText = normalizeText(asset.entity);

  return (
    isCurrentAsset(asset) &&
    asset.ownership === 0.5 &&
    (entityText.includes("f berden") || entityText.includes("50"))
  );
}

function getCountry(entity: string, project: string, explicitCountry: string): Country {
  const country = normalizeText(explicitCountry);
  const text = normalizeText(`${entity} ${project} ${explicitCountry}`);

  if (
    country.includes("spain") ||
    country.includes("spanje") ||
    text.includes("marbella") ||
    text.includes("malaga") ||
    text.includes("private real estate spain") ||
    text.includes("llpi") ||
    text.includes("leovari")
  ) {
    return "Spanje";
  }

  if (
    country.includes("netherlands") ||
    country.includes("nederland") ||
    text.includes("leeuw vastgoed") ||
    text.includes("l3 capital") ||
    text.includes("f berden") ||
    text.includes("private real estate")
  ) {
    return "Nederland";
  }

  return "Overig";
}

function inferEntity(params: {
  sourceEntity: string;
  project: string;
  address: string;
  country: Country;
  status: string;
}): string {
  const { sourceEntity, project, address, country, status } = params;
  if (sourceEntity.trim()) return sourceEntity.trim();

  const text = normalizeText(`${project} ${address}`);

  if (isSoldStatus(status, sourceEntity)) {
    return "Sold Objects";
  }

  if (country === "Spanje") {
    if (text.includes("calderon") || text.includes("lomas rio verde")) {
      return "LLPI S.L. / Leovari developments";
    }
    return "D. Leeuw Private Real Estate Spain";
  }

  if (text.includes("zonneveld")) return "Leeuw Vastgoed B.V. (100%)";

  if (
    text.includes("magalhaesweg") ||
    text.includes("magelhaesweg") ||
    text.includes("smakterweg")
  ) {
    return "L3 Capital B.V. (100%)";
  }

  if (
    text.includes("kazernestraat") ||
    text.includes("leeuwerikstraat") ||
    text.includes("pontanusstraat") ||
    text.includes("groethofstraat")
  ) {
    return "D. Leeuw Private Real Estate";
  }

  return "D. Leeuw e/o F. Berden private real estate (50%)";
}

function getOwnership(entity: string, status: string): number {
  const text = normalizeText(entity);

  if (isSoldStatus(status, entity)) {
    return 1;
  }

  if (text.includes("f berden") || text.includes("50")) return 0.5;
  return 1;
}

function isIgnoredProject(
  project: string,
  exclusionTerms: string[] = [],
): boolean {
  const text = normalizeText(project);

  if (!text) return true;

  const defaultExclusions = [
    "equity",
    "company inventory",
    "range rover",
  ];

  return [...defaultExclusions, ...exclusionTerms].some((term) => {
    const normalizedTerm = normalizeText(term);

    if (
      !normalizedTerm ||
      RESERVED_PROJECT_CONTROL_TERMS.has(normalizedTerm)
    ) {
      return false;
    }

    // Een algemeen enkel woord zoals "Project" moet alleen een volledige
    // celwaarde uitsluiten. Meer specifieke termen mogen als tekstdeel matchen.
    const isSingleWord = !normalizedTerm.includes(" ");
    return isSingleWord
      ? text === normalizedTerm
      : text.includes(normalizedTerm);
  });
}

function getDisplayProject(project: string, address: string): string {
  if (project.trim()) return project.trim();
  return address.split(",")[0]?.trim() ?? "";
}

function transformRows(
  rows: NormalizedRow[],
  exclusionTerms: string[] = [],
): PortfolioData {
  const assets: Asset[] = [];
  const financingRows: FinancingRow[] = [];
  const pendingInvestments: Array<{ target: string; value: number }> = [];

  for (const row of rows) {
    const sourceEntity = getCell(row, [
      "Entity",
      "Entiteit",
      "Company",
      "Portfolio",
      "Vennootschap",
      "Owner",
    ]);

    const address = getCell(row, ["Address", "Adres", "Location", "Locatie"]);
    const rawProject = getCell(row, [
      "Project / object",
      "Project",
      "Object",
      "Property",
      "Pand",
      "Asset",
    ]);
    const project = getDisplayProject(rawProject, address);
    const status = getCell(row, [
      "Portfolio Status",
      "Status",
      "Category",
      "Categorie",
    ]);
    const explicitCountry = getCell(row, ["Country", "Land"]);
    const country = getCountry(sourceEntity, `${project} ${address}`, explicitCountry);
    const entity = inferEntity({ sourceEntity, project, address, country, status });
    const ownership = getOwnership(entity, status);

    const projectText = normalizeText(project);
    const sold = isSoldStatus(status, `${sourceEntity} ${entity}`);

    const explicitMortgage = Math.abs(
      parseNumber(getCell(row, ["Mortgage (€)", "Mortgage", "Mortgages", "Hypotheek", "Loan"])),
    );

    const purchasePrice = Math.abs(
      parseNumber(
        getCell(row, [
          "Purchase Price (€)",
          "Purchase Price",
          "Purchase price",
          "Purchase Value",
          "Aankoopprijs",
          "Aankoopwaarde",
          "Purchase",
        ]),
      ),
    );

    const investedValue = Math.abs(
      parseNumber(
        getCell(row, [
          "Total Investment (€)",
          "Investment to Date (€)",
          "Invested Value",
          "Investment",
          "Invested",
        ]),
      ),
    );

    const salesValue = Math.abs(
      parseNumber(
        sold
          ? getCell(row, [
              "Sale Price (€)",
              "Sale Price",
              "Sales Value",
              "Sales Value (€)",
              "Expected Exit Value (€)",
              "Expected Exit Value",
              "Current Value (€)",
              "Current Value",
              "End Value",
            ])
          : getCell(row, [
              "Expected Exit Value (€)",
              "Expected Exit Value",
              "Sales Value",
              "Sales Value (€)",
              "Current Value (€)",
              "Current Value",
              "End Value",
              "Sale Price (€)",
              "Sale Price",
            ]),
      ),
    );

    const rawProfit = getCell(row, [
      "Profit",
      "Profit (€)",
      "Gross Profit",
      "Gross profit",
      "Winst",
      "Result",
    ]);
    const explicitProfit = parseNumber(rawProfit);
    const hasExplicitProfit =
      rawProfit.trim() !== "" &&
      rawProfit.trim() !== "-" &&
      Number.isFinite(explicitProfit);

    const explicitStillToInvest = Math.abs(
      parseNumber(
        getCell(row, [
          "Still to invest",
          "StillToInvest",
          "Remaining investment",
          "Nog te investeren",
        ]),
      ),
    );

    const builtArea = Math.abs(
      parseNumber(
        getCell(row, [
          "Built Area (m²)",
          "Built Area",
          "BuiltArea",
          "Built m2",
          "Bebouwd oppervlak",
          "Bebouwd",
        ]),
      ),
    );

    const plotSize = Math.abs(
      parseNumber(
        getCell(row, [
          "Plot Size (m²)",
          "Plot Size",
          "PlotSize",
          "Plot m2",
          "Perceel",
          "Perceeloppervlak",
        ]),
      ),
    );

    const annualRent = Math.abs(
      parseNumber(
        getCell(row, [
          "Net yearly Rental income (€)",
          "Rent annually",
          "Annual Rent",
          "Rental income",
          "Jaarhuur",
        ]),
      ),
    );

    const explicitRentYield = parsePercentage(
      getCell(row, ["Yield Rent", "Rent Yield", "Rental Yield", "Huurrendement"]),
    );

    const rentYield = explicitRentYield;
    // Lees uitsluitend een expliciete IRR uit de IRR-/IRR sale-kolom.
    // Wanneer deze ontbreekt, wordt later een ROI berekend uit de projectwaarden.
    const irr = parsePercentage(
      getCell(row, ["IRR sale", "IRR", "IRR (%)", "Expected IRR"]),
    );

    const mortgageOnlyRow = projectText.includes("mortgage") || projectText.includes("hypotheek");

    if (mortgageOnlyRow) {
      const mortgageAmount =
        explicitMortgage || salesValue || investedValue || purchasePrice || explicitStillToInvest;
      if (mortgageAmount > 0) {
        financingRows.push({
          name: project,
          entity,
          country,
          ownership,
          mortgage: mortgageAmount,
        });
      }
      continue;
    }

    if (projectText.startsWith("still to invest")) {
      const target = projectText.replace(/^still to invest\s*/, "").trim();
      const value =
        explicitStillToInvest || salesValue || investedValue || purchasePrice || explicitMortgage;
      if (target && value > 0) pendingInvestments.push({ target, value });
      continue;
    }

    const isStandaloneLaCarolinaInvestment =
      projectText === "la carolina" &&
      explicitStillToInvest > 0 &&
      purchasePrice === 0 &&
      investedValue === 0 &&
      salesValue === 0 &&
      builtArea === 0 &&
      plotSize === 0;

    if (isStandaloneLaCarolinaInvestment) {
      pendingInvestments.push({ target: "la carolina", value: explicitStillToInvest });
      continue;
    }

    if (
      isIgnoredProject(project, exclusionTerms) ||
      (!project && !address)
    ) {
      continue;
    }

    assets.push({
      entity,
      project,
      address,
      country,
      ownership,
      status,
      sold,
      builtArea,
      plotSize,
      purchaseDate: sheetDate(
        getCell(row, ["Purchase Date", "PurchaseDate", "Aankoopdatum"]),
      ),
      salesDate: sheetDate(
        getCell(row, [
          "Sales Date",
          "Sale Date",
          "SalesDate",
          "Verkoopdatum",
          "Target Completion2",
          "Target Completion",
        ]),
      ),
      purchasePrice,
      investedValue,
      salesValue,
      explicitProfit,
      hasExplicitProfit,
      annualRent,
      rentYield,
      mortgage: explicitMortgage,
      stillToInvest: explicitStillToInvest,
      irr,
    });
  }

  for (const pending of pendingInvestments) {
    const target = normalizeText(pending.target);
    let match = assets.find((asset) => {
      const assetName = normalizeText(asset.project);
      return assetName.includes(target) || target.includes(assetName);
    });

    if (!match && target.includes("la carolina")) {
      match = assets.find((asset) => {
        const assetName = normalizeText(asset.project);
        return assetName.includes("margarita") || assetName.includes("la carolina");
      });
    }

    if (match) match.stillToInvest += pending.value;
  }

  return { assets, financingRows, financialOverview: createEmptyFinancialOverview() };
}

function getEndValue(asset: Asset): number {
  return asset.salesValue;
}

function getTotalCost(asset: Asset): number {
  return asset.investedValue + asset.stillToInvest;
}

function getProfit(asset: Asset): number {
  if (asset.hasExplicitProfit) return asset.explicitProfit;
  return getEndValue(asset) - getTotalCost(asset);
}

function getReturnCost(asset: Asset): number {
  const investedCost = asset.investedValue + asset.stillToInvest;
  if (investedCost > 0) return investedCost;

  const purchaseCost = asset.purchasePrice + asset.stillToInvest;
  if (purchaseCost > 0) return purchaseCost;

  if (asset.hasExplicitProfit && asset.salesValue > asset.explicitProfit) {
    return asset.salesValue - asset.explicitProfit;
  }

  return 0;
}

function hasExplicitIrr(asset: Asset): boolean {
  return Number.isFinite(asset.irr) && asset.irr !== 0;
}

function getCalculatedRoi(asset: Asset): number {
  const cost = getReturnCost(asset);
  return cost ? getProfit(asset) / cost : 0;
}

function getReturn(asset: Asset): number {
  return hasExplicitIrr(asset) ? asset.irr : getCalculatedRoi(asset);
}

function getReturnType(asset: Asset): "IRR" | "ROI" {
  return hasExplicitIrr(asset) ? "IRR" : "ROI";
}

function getImageSource(project: string, address = ""): string | null {
  const normalized = normalizeText(`${project} ${address}`);
  return IMAGE_RULES.find(({ match }) => match.test(normalized))?.src ?? null;
}

function getSoldInformationScore(asset: Asset): number {
  let score = 0;

  if (asset.salesValue > 0) score += 4;
  if (asset.hasExplicitProfit) score += 4;
  if (hasExplicitIrr(asset)) score += 3;
  if (getReturnCost(asset) > 0) score += 2;

  if (asset.investedValue > 0) score += 1;
  if (asset.purchasePrice > 0) score += 1;
  if (asset.purchaseDate) score += 1;
  if (asset.salesDate) score += 1;
  if (asset.builtArea > 0) score += 1;
  if (asset.plotSize > 0) score += 1;
  if (asset.annualRent > 0) score += 1;
  if (asset.rentYield > 0) score += 1;
  if (asset.mortgage > 0) score += 1;

  return score;
}

function sortSoldAssetsByInformation(assets: Asset[]): Asset[] {
  return assets
    .map((asset, originalIndex) => ({
      asset,
      originalIndex,
      score: getSoldInformationScore(asset),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.originalIndex - right.originalIndex;
    })
    .map(({ asset }) => asset);
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export default function CompletePortfolioPage() {
  const [data, setData] = useState<PortfolioData>({
    assets: [],
    financingRows: [],
    financialOverview: createEmptyFinancialOverview(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [portfolioSelectorOpen, setPortfolioSelectorOpen] = useState(false);
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<PortfolioId[]>(
    () => PORTFOLIO_OPTIONS.map((option) => option.id),
  );

  const selectedPortfolioSet = useMemo(
    () => new Set<PortfolioId>(selectedPortfolioIds),
    [selectedPortfolioIds],
  );

  const togglePortfolio = (portfolioId: PortfolioId) => {
    setSelectedPortfolioIds((current) =>
      current.includes(portfolioId)
        ? current.filter((id) => id !== portfolioId)
        : [...current, portfolioId],
    );
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const separator = CSV_URL.includes("?") ? "&" : "?";
        const response = await fetch(`${CSV_URL}${separator}_=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "text/csv,text/plain,*/*" },
        });

        if (!response.ok) throw new Error(`Google Sheets gaf foutcode ${response.status}.`);

        const csv = await response.text();
        const rows = csvToRows(csv);
        const projectExclusions = extractProjectExclusions(csv);
        const transformed = transformRows(rows, projectExclusions);
        const financialOverview = extractFinancialOverview(csv);

        if (!transformed.assets.length) {
          throw new Error(
            "Er zijn geen objecten gevonden. Open de browserconsole om de CSV te controleren of publiceer het juiste tabblad opnieuw als CSV.",
          );
        }

        setData({ ...transformed, financialOverview });
        setLastUpdated(new Date());
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "De live portefeuillegegevens konden niet worden geladen.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const interval = window.setInterval(() => setRefreshKey(Date.now()), REFRESH_INTERVAL_MS);
    const onFocus = () => setRefreshKey(Date.now());
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const metrics = useMemo(() => {
    // Alleen regels die expliciet als Current/Portefeuille zijn gemarkeerd
    // mogen in de actuele portefeuille terechtkomen. "Niet verkocht" is
    // onvoldoende, omdat Pipeline of een onbekende status dan ook meekomen.
    const currentAssets = data.assets.filter(
      (asset) =>
        isCurrentAsset(asset) &&
        matchesPortfolioSelection(asset.entity, selectedPortfolioSet),
    );

    // Het volledige trackrecord blijft altijd zichtbaar, onafhankelijk van
    // de gekozen huidige portfolio's.
    const soldAssets = sortSoldAssetsByInformation(
      data.assets.filter(isSoldAsset),
    );

    const sharedAssets = currentAssets.filter(isJointPortfolioAsset);
    const whollyOwnedAssets = currentAssets.filter((asset) => asset.ownership === 1);
    const selectedFinancingRows = data.financingRows.filter((row) =>
      matchesPortfolioSelection(`${row.entity} ${row.name}`, selectedPortfolioSet),
    );

    const portfolioEndValue = currentAssets.reduce(
      (sum, asset) => sum + getEndValue(asset) * asset.ownership,
      0,
    );

    const investedValueToDate = currentAssets.reduce(
      (sum, asset) => sum + asset.investedValue * asset.ownership,
      0,
    );

    const assetMortgages = currentAssets.reduce(
      (sum, asset) => sum + asset.mortgage * asset.ownership,
      0,
    );

    const separateMortgages = selectedFinancingRows.reduce(
      (sum, row) => sum + row.mortgage * row.ownership,
      0,
    );

    const totalMortgages = assetMortgages + separateMortgages;
    const ltv = portfolioEndValue ? totalMortgages / portfolioEndValue : 0;

    const netherlandsValue = currentAssets
      .filter((asset) => asset.country === "Nederland")
      .reduce((sum, asset) => sum + getEndValue(asset) * asset.ownership, 0);

    const spainValue = currentAssets
      .filter((asset) => asset.country === "Spanje")
      .reduce((sum, asset) => sum + getEndValue(asset) * asset.ownership, 0);

    const geographicTotal = netherlandsValue + spainValue;
    const netherlandsShare = geographicTotal ? netherlandsValue / geographicTotal : 0;
    const spainShare = geographicTotal ? spainValue / geographicTotal : 0;

    const visibleAreaAssets = [...currentAssets, ...soldAssets];
    const totalBuiltArea = visibleAreaAssets.reduce(
      (sum, asset) => sum + asset.builtArea,
      0,
    );
    const totalPlotSize = visibleAreaAssets.reduce(
      (sum, asset) => sum + asset.plotSize,
      0,
    );
    const soldRevenue = soldAssets.reduce(
      (sum, asset) => sum + getEndValue(asset) * asset.ownership,
      0,
    );
    const realizedProfit = soldAssets.reduce(
      (sum, asset) => sum + getProfit(asset) * asset.ownership,
      0,
    );

    const sharedTotalValue = sharedAssets.reduce(
      (sum, asset) => sum + getEndValue(asset),
      0,
    );
    const sharedEndValue = sharedTotalValue * 0.5;
    const sharedInvestment = sharedAssets.reduce(
      (sum, asset) => sum + getTotalCost(asset) * 0.5,
      0,
    );
    const sharedMortgageFromAssets = sharedAssets.reduce(
      (sum, asset) => sum + asset.mortgage * 0.5,
      0,
    );

    // De totale hypotheek staat als losse financieringsregel in de CSV:
    // “D. Leeuw e/o F. Berden mortgage / financing”.
    // Voor de adjusted metrics en LTV telt deze voor 50% mee.
    const sharedTotalMortgageFromFinancingRow = selectedFinancingRows
      .filter((row) => {
        const rowText = normalizeText(`${row.name} ${row.entity}`);
        return (
          rowText.includes("f berden") &&
          (rowText.includes("mortgage") || rowText.includes("financing"))
        );
      })
      .reduce((sum, row) => sum + row.mortgage, 0);

    // Fallback voor het geval de naam van de financieringsregel later wijzigt.
    const sharedMortgageFromRowsFallback = selectedFinancingRows
      .filter((row) => row.ownership === 0.5)
      .reduce((sum, row) => sum + row.mortgage * 0.5, 0);

    const sharedMortgageFromRows = sharedTotalMortgageFromFinancingRow
      ? sharedTotalMortgageFromFinancingRow * 0.5
      : sharedMortgageFromRowsFallback;

    const sharedMortgage = sharedMortgageFromAssets + sharedMortgageFromRows;
    const sharedTotalMortgage = sharedTotalMortgageFromFinancingRow
      ? sharedTotalMortgageFromFinancingRow
      : sharedMortgage * 2;

    return {
      currentAssets,
      soldAssets,
      sharedAssets,
      whollyOwnedAssets,
      portfolioEndValue,
      investedValueToDate,
      totalMortgages,
      ltv,
      netherlandsValue,
      spainValue,
      netherlandsShare,
      spainShare,
      totalBuiltArea,
      totalPlotSize,
      soldRevenue,
      realizedProfit,
      sharedEndValue,
      sharedTotalValue,
      sharedInvestment,
      sharedMortgage,
      sharedTotalMortgage,
    };
  }, [data, selectedPortfolioSet]);

  const financialOverview = data.financialOverview;
  const showFinancialOverview = hasFinancialRows(financialOverview);
  const financialPageCount = showFinancialOverview ? 1 : 0;
  const jointPageOffset = metrics.sharedAssets.length > 0 ? 1 : 0;
  const whollyOwnedStartNumber = 2 + financialPageCount + jointPageOffset;

  const financialTotalValue = getFinancialValue(
    financialOverview.summary,
    "total value real estate and invest",
  );
  const financialBankBalance = getFinancialValue(
    financialOverview.summary,
    "bank balance",
  );
  const financialRentalIncome = getFinancialValue(
    financialOverview.summary,
    "net rental income",
  );
  const financialEquity = getFinancialValue(
    financialOverview.summary,
    "equity",
  );

  const removeLtvTag = (row: FinancialRow): FinancialRow => ({
    ...row,
    tag: normalizeText(row.tag) === "ltv" ? "" : row.tag,
  });

  const financialPortfolioBalanceRows = financialOverview.summary
    .filter((row) => !normalizeText(row.label).includes("net rental income"))
    .map(removeLtvTag);

  const financialCapitalRows = financialOverview.capital.map(removeLtvTag);

  if (loading && data.assets.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ece8df]">
        <div className="rounded-3xl bg-white px-10 py-8 shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a6f37]">Live portfolio</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#20382f]">Gegevens laden…</h1>
        </div>
      </main>
    );
  }

  if (error && data.assets.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ece8df] p-6">
        <div className="max-w-xl rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a6f37]">Dataprobleem</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#20382f]">CSV kon niet worden verwerkt</h1>
          <p className="mt-4 text-sm leading-6 text-[#5e6863]">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey(Date.now())}
            className="mt-6 rounded-full bg-[#20382f] px-5 py-3 text-sm font-semibold text-white"
          >
            Opnieuw proberen
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#dedbd4] py-8 print:bg-white print:py-0">
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }
        body {
          margin: 0;
        }
        .report-page {
          page-break-after: always;
          break-after: page;
        }
        .report-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .report-page {
            margin: 0 !important;
            box-shadow: none !important;
          }
          html,
          body {
            background: white !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="no-print sticky top-4 z-50 mx-auto mb-6 flex w-fit items-center gap-3 rounded-[24px] bg-[#20382f] px-4 py-3 text-white shadow-xl">
        <div className="relative">
          <button
            type="button"
            onClick={() => setPortfolioSelectorOpen((open) => !open)}
            aria-expanded={portfolioSelectorOpen}
            className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold hover:bg-white/25"
          >
            <span>Portefeuilles</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
              {selectedPortfolioIds.length}/{PORTFOLIO_OPTIONS.length}
            </span>
            <span aria-hidden="true" className="text-[10px]">
              {portfolioSelectorOpen ? "▲" : "▼"}
            </span>
          </button>

          {portfolioSelectorOpen && (
            <div className="absolute left-0 top-full mt-2 w-[390px] rounded-[20px] border border-[#d8d0c1] bg-[#f7f4ec] p-4 text-[#20382f] shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-[#d8d0c1] pb-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#9a6f37]">
                    Selecteer portefeuilles
                  </p>
                  <p className="mt-1 text-[10px] text-[#68736d]">
                    Alleen de geselecteerde huidige panden worden opgenomen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPortfolioSelectorOpen(false)}
                  className="rounded-full border border-[#d8d0c1] px-2.5 py-1 text-[10px] font-semibold"
                >
                  Sluiten
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                {PORTFOLIO_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-[#ece6da]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPortfolioSet.has(option.id)}
                      onChange={() => togglePortfolio(option.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#ae8148]"
                    />
                    <span className="text-[11px] font-medium leading-4">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[#d8d0c1] pt-3">
                <p className="text-[9px] text-[#68736d]">
                  Het volledige trackrecord blijft zichtbaar.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPortfolioIds(
                        PORTFOLIO_OPTIONS.map((option) => option.id),
                      )
                    }
                    className="rounded-full bg-[#20382f] px-3 py-1.5 text-[9px] font-semibold text-white"
                  >
                    Alles
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPortfolioIds([])}
                    className="rounded-full border border-[#cfc5b4] px-3 py-1.5 text-[9px] font-semibold"
                  >
                    Geen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <span className="text-xs">
          {error
            ? error
            : lastUpdated
              ? `Live bijgewerkt om ${lastUpdated.toLocaleTimeString("nl-NL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Live gegevens"}
        </span>
        <button
          type="button"
          onClick={() => setRefreshKey(Date.now())}
          disabled={loading}
          className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold hover:bg-white/25 disabled:opacity-50"
        >
          {loading ? "Vernieuwen…" : "Data vernieuwen"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-[#ae8148] px-4 py-2 text-xs font-semibold hover:bg-[#be9158]"
        >
          Opslaan als PDF
        </button>
      </div>

      <PageFrame>
        <ReportHeader
          number="01"
          label="Portfolio overview"
          title="Complete Real Estate Portfolio"
          subtitle="The Netherlands & Spain"
        />

        <div className="mt-7 grid grid-cols-[1.05fr_1.4fr] gap-7">
          <section className="rounded-[24px] border border-[#d8d0c1] bg-white/80 p-6">
            <SectionLabel>Geographic allocation</SectionLabel>
            <div className="mt-5 grid grid-cols-[180px_1fr] items-center gap-7">
              <DonutChart spain={metrics.spainShare} />
              <div className="space-y-5">
                <AllocationRow
                  color="#2d473c"
                  label="Spain"
                  value={metrics.spainValue}
                  percentage={metrics.spainShare}
                />
                <AllocationRow
                  color="#80968d"
                  label="The Netherlands"
                  value={metrics.netherlandsValue}
                  percentage={metrics.netherlandsShare}
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Current projects end value"
              value={formatCurrency(metrics.portfolioEndValue)}
              description="Expected end values · ownership adjusted"
              dark
            />
            <MetricCard
              label="Current assets"
              value={String(metrics.currentAssets.length)}
              description="Active portfolio"
            />
            <MetricCard
              label="Track record"
              value={String(metrics.soldAssets.length)}
              description="Realized projects"
            />
            <MetricCard
              label="Built area"
              value={`${formatNumber(metrics.totalBuiltArea)} m²`}
              description="Current and realized"
            />
          </section>
        </div>

        <section className="mt-7 rounded-[24px] border border-[#d8d0c1] bg-white/80 p-6">
          <div className="grid grid-cols-[0.8fr_1.6fr] items-center gap-8">
            <div>
              <SectionLabel>Projected capital structure</SectionLabel>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-[#69736e]">Total project mortgages</p>
                  <p className="mt-1 text-2xl font-semibold text-[#243d33]">
                    {formatCurrency(metrics.totalMortgages)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#69736e]">Invested value to date</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(metrics.investedValueToDate)}
                  </p>
                </div>
              </div>
            </div>
            <CapitalStack
              mortgage={metrics.ltv}
              mortgageLabel="Project mortgages"
              equityLabel="Projected equity"
            />
          </div>
        </section>

        <ReportFooter updated={lastUpdated} />
      </PageFrame>

      {showFinancialOverview && (
        <PageFrame>
          <ReportHeader
            number="02"
            label="Financial overview"
            title="Financial Position"
            subtitle="Real estate, investments, liquidity, forecasts and intercompany positions"
          />

          <div className="mt-4 grid grid-cols-4 gap-3">
            <MetricCard
              label="Total real estate & investments"
              value={formatFinancialCurrency(financialTotalValue)}
              description="Value from the financial overview"
              dense
              dark
            />
            <MetricCard
              label="Equity"
              value={formatFinancialCurrency(financialEquity)}
              description="Equity position"
              dense
              accent
            />
            <MetricCard
              label="Net rental income"
              value={formatFinancialCurrency(financialRentalIncome)}
              description="Own portfolio"
              dense
            />
            <MetricCard
              label="Bank balance"
              value={formatFinancialCurrency(financialBankBalance)}
              description="Available cash balance"
              dense
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <FinancialSection
              title="Portfolio balance"
              description="Assets, liquidity, liabilities and equity"
              rows={financialPortfolioBalanceRows}
              compact
            />
            <FinancialSection
              title="Capital position"
              description="Spain and the Netherlands"
              rows={financialCapitalRows}
              compact
            />
            <FinancialSection
              title="Profit and forecasts"
              description="Results and forecast positions"
              rows={financialOverview.results}
              compact
            />
            <FinancialSection
              title="Current accounts"
              description="Intercompany RC positions"
              rows={financialOverview.currentAccounts}
              compact
            />
          </div>

          <ReportFooter updated={lastUpdated} />
        </PageFrame>
      )}

      {metrics.sharedAssets.length > 0 && (
        <PageFrame>
          <ReportHeader
            number={String(2 + financialPageCount).padStart(2, "0")}
            label="Joint portfolio"
            title="D. Leeuw e/o F. Berden Private Real Estate"
            subtitle="Jointly owned investment portfolio"
          />

          <div className="mt-5 grid grid-cols-4 gap-3">
            <MetricCard
              label="Ownership share"
              value="50%"
              description="Economic ownership interest"
              accent
              compact
            />
            <MetricCard
              label="Adjusted end value"
              value={formatCurrency(metrics.sharedEndValue)}
              description="End value consolidated at 50%"
              compact
            />
            <MetricCard
              label="Adjusted mortgage"
              value={formatCurrency(metrics.sharedMortgage)}
              description="Mortgage consolidated at 50%"
              compact
            />
            <MetricCard
              label="Adjusted net equity"
              value={formatCurrency(metrics.sharedEndValue - metrics.sharedMortgage)}
              description="Adjusted end value minus debt"
              compact
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {chunk<Asset>(
              metrics.sharedAssets,
              Math.ceil(metrics.sharedAssets.length / 2),
            ).map((assetGroup, groupIndex) => (
              <section
                key={`shared-column-${groupIndex}`}
                className="overflow-hidden rounded-[18px] border border-[#d8d0c1] bg-white/85"
              >
                <div className="grid grid-cols-[1.55fr_.8fr_.8fr_.45fr] bg-[#243d33] px-3 py-2.5 text-[8px] uppercase tracking-[0.12em] text-white">
                  <span>Object</span>
                  <span className="text-right">End value</span>
                  <span className="text-right">Annual rent</span>
                  <span className="text-right">Yield</span>
                </div>

                {assetGroup.map((asset, index) => {
                  const endValue = getEndValue(asset);
                  const calculatedYield = endValue > 0 ? asset.annualRent / endValue : 0;

                  return (
                    <div
                      key={`${asset.entity}-${asset.project}`}
                      className={`grid min-h-[34px] grid-cols-[1.55fr_.8fr_.8fr_.45fr] items-center px-3 py-2 text-[10px] leading-tight ${
                        index !== assetGroup.length - 1
                          ? "border-b border-[#ded8cc]"
                          : ""
                      }`}
                    >
                      <p className="truncate pr-2 font-semibold text-[#243d33]">
                        {asset.project}
                      </p>
                      <p className="whitespace-nowrap text-right font-semibold">
                        {formatCurrency(endValue)}
                      </p>
                      <p className="whitespace-nowrap text-right">
                        {formatCurrency(asset.annualRent)}
                      </p>
                      <p className="whitespace-nowrap text-right font-semibold">
                        {calculatedYield > 0 ? formatPercent(calculatedYield) : "—"}
                      </p>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>

          <section className="mt-4 rounded-[18px] border border-[#d8d0c1] bg-white/80 px-5 py-4">
            <div className="grid grid-cols-[1.08fr_0.92fr] items-center gap-5">
              <div>
                <SectionLabel>Capital structure</SectionLabel>
                <div className="mt-2 grid grid-cols-3 items-end gap-5">
                  <div>
                    <p className="text-[9px] text-[#69736e]">Total mortgage</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-semibold text-[#243d33]">
                      {formatCurrency(metrics.sharedTotalMortgage)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-[#69736e]">Total value</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-semibold text-[#243d33]">
                      {formatCurrency(metrics.sharedTotalValue)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] text-[#69736e]">Joint portfolio LTV</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-semibold text-[#b2854b]">
                      {formatPercent(
                        metrics.sharedTotalValue
                          ? metrics.sharedTotalMortgage / metrics.sharedTotalValue
                          : 0,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <CapitalStack
                mortgage={
                  metrics.sharedTotalValue
                    ? metrics.sharedTotalMortgage / metrics.sharedTotalValue
                    : 0
                }
              />
            </div>
          </section>

          <ReportFooter updated={lastUpdated} />
        </PageFrame>
      )}

      {metrics.whollyOwnedAssets.map((asset, index) => (
        <PageFrame key={`${asset.entity}-${asset.project}`}>
          <ReportHeader
            number={String(index + whollyOwnedStartNumber).padStart(2, "0")}
            label="Wholly owned portfolio"
            title={asset.project}
            subtitle={asset.entity}
          />

          <div className="mt-5 grid grid-cols-[1.15fr_1fr] gap-5">
            <ProjectImage
              project={asset.project}
              address={asset.address}
              className="h-[114mm]"
            />
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Expected end value"
                  value={formatCurrency(getEndValue(asset))}
                  description={`At ${asset.salesDate || "—"}`}
                  dark
                  compact
                  dense
                />
                <MetricCard
                  label="Expected profit"
                  value={formatCurrency(getProfit(asset))}
                  description="Before tax"
                  accent
                  compact
                  dense
                />
                <MetricCard
                  label="Return"
                  value={formatPercent(getReturn(asset))}
                  description={getReturnType(asset)}
                  compact
                  dense
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Invested value to date"
                  value={formatCurrency(asset.investedValue)}
                  description="Invested to date"
                  compact
                  dense
                />
                <MetricCard
                  label="Still to invest"
                  value={formatCurrency(asset.stillToInvest)}
                  description="Remaining investment"
                  compact
                  dense
                />
              </div>

              <ValueCreation asset={asset} />

              <section className="rounded-[20px] border border-[#d8d0c1] bg-white/85 p-4">
                <SectionLabel>Project metrics</SectionLabel>
                <div className="mt-3 grid grid-cols-2 gap-x-7 gap-y-2 text-sm">
                  {asset.mortgage > 0 && (
                    <>
                      <Detail label="Mortgage" value={formatCurrency(asset.mortgage)} />
                      <Detail
                        label="Loan to value"
                        value={
                          getEndValue(asset) > 0
                            ? formatPercent(asset.mortgage / getEndValue(asset))
                            : "—"
                        }
                      />
                    </>
                  )}
                  <Detail
                    label="Built area"
                    value={asset.builtArea ? `${formatNumber(asset.builtArea)} m²` : "—"}
                  />
                  <Detail
                    label="Plot size"
                    value={asset.plotSize ? `${formatNumber(asset.plotSize)} m²` : "—"}
                  />
                  <Detail label="Purchase date" value={asset.purchaseDate || "—"} />
                  <Detail label="Expected exit" value={asset.salesDate || "—"} />
                  {asset.rentYield > 0 && (
                    <>
                      <Detail
                        label="Annual rent"
                        value={formatCurrency(asset.annualRent)}
                      />
                      <Detail
                        label="Rent yield"
                        value={formatPercent(asset.rentYield)}
                      />
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>

          <ReportFooter updated={lastUpdated} />
        </PageFrame>
      ))}

      {chunk(metrics.soldAssets, 2).map((pair, pageIndex) => (
        <PageFrame key={`sold-${pageIndex}`}>
          <ReportHeader
            number={String(
              metrics.whollyOwnedAssets.length + pageIndex + whollyOwnedStartNumber,
            ).padStart(2, "0")}
            label="Sold track record"
            title="Realized Projects"
            subtitle="Two realized assets per page"
          />
          <div className="mt-7 grid grid-cols-2 gap-6">
            {pair.map((asset) => (
              <SoldProjectCard key={`${asset.entity}-${asset.project}`} asset={asset} />
            ))}
          </div>
          <ReportFooter updated={lastUpdated} />
        </PageFrame>
      ))}
    </main>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <section className="report-page relative mx-auto mb-8 min-h-[210mm] w-[297mm] overflow-hidden bg-[#f7f4ec] px-[9mm] py-[8mm] shadow-2xl print:mb-0">
      {children}
    </section>
  );
}

function ReportHeader({
  number,
  label,
  title,
  subtitle,
}: {
  number: string;
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="flex items-start justify-between border-b border-[#d2c8b6] pb-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.42em] text-[#9a6f37]">
          {number} · {label}
        </p>
        <h1 className="mt-3 text-[31px] font-semibold leading-none text-[#1f332b]">{title}</h1>
        <p className="mt-3 text-[12px] text-[#68736d]">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#9a6f37]">Confidential</p>
        <p className="mt-2 text-lg font-semibold text-[#1f332b]">Portfolio Report</p>
      </div>
    </header>
  );
}

function ReportFooter({ updated }: { updated: Date | null }) {
  return (
    <footer className="absolute bottom-[6mm] left-[9mm] right-[9mm] flex justify-between border-t border-[#d2c8b6] pt-3 text-[9px] text-[#737c77]">
      <span>Confidential · Not for distribution</span>
      <span>
        Live Google Sheets data
        {updated ? ` · ${updated.toLocaleDateString("nl-NL")}` : ""}
      </span>
      <span>All values in EUR</span>
    </footer>
  );
}

function SectionLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`text-[9px] font-semibold uppercase tracking-[0.28em] ${
        light ? "text-white/75" : "text-[#9a6f37]"
      }`}
    >
      {children}
    </p>
  );
}

function MetricCard({
  label,
  value,
  description,
  accent = false,
  dark = false,
  compact = false,
  dense = false,
}: {
  label: string;
  value: string;
  description: ReactNode;
  accent?: boolean;
  dark?: boolean;
  compact?: boolean;
  dense?: boolean;
}) {
  const background = dark
    ? "bg-[#1f332b] text-white"
    : accent
      ? "bg-[#829b91] text-white"
      : "border border-[#d8d0c1] bg-white/80 text-[#1f332b]";

  return (
    <div
      className={`${
        dense
          ? "rounded-[15px] px-3.5 py-3"
          : compact
            ? "rounded-[16px] p-4"
            : "rounded-[20px] p-5"
      } ${background}`}
    >
      <p
        className={`${dense ? "text-[7px]" : "text-[8px]"} uppercase tracking-[0.2em] ${
          dark || accent ? "text-white/70" : "text-[#8a7160]"
        }`}
      >
        {label}
      </p>
      <p
        className={`${
          dense
            ? "mt-1.5 text-[17px]"
            : compact
              ? "mt-2 text-[18px]"
              : "mt-3 text-[21px]"
        } whitespace-nowrap font-semibold leading-none`}
      >
        {value}
      </p>
      <div
        className={`${
          dense ? "mt-1.5 text-[7px]" : compact ? "mt-2 text-[8px]" : "mt-3 text-[9px]"
        } ${dark || accent ? "text-white/70" : "text-[#7a827e]"}`}
      >
        {description}
      </div>
    </div>
  );
}

function FinancialSection({
  title,
  description,
  rows,
  compact = false,
}: {
  title: string;
  description: string;
  rows: FinancialRow[];
  compact?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#d8d0c1] bg-white/85">
      <div
        className={`flex items-end justify-between bg-[#243d33] text-white ${
          compact ? "px-3.5 py-2" : "px-4 py-3"
        }`}
      >
        <div>
          <SectionLabel light>{title}</SectionLabel>
          <p className={`${compact ? "mt-0.5 text-[8px]" : "mt-1 text-[9px]"} text-white/60`}>
            {description}
          </p>
        </div>
        <p
          className={`uppercase tracking-[0.2em] text-white/55 ${
            compact ? "text-[7px]" : "text-[8px]"
          }`}
        >
          Amount
        </p>
      </div>

      <div>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <div
              key={`${title}-${row.label}-${index}`}
              className={`grid items-center ${
                compact
                  ? "min-h-[28px] grid-cols-[1fr_48px_118px] gap-2 px-3.5 py-1.5 text-[9px]"
                  : "min-h-[34px] grid-cols-[1fr_58px_132px] gap-3 px-4 py-2 text-[10px]"
              } ${index !== rows.length - 1 ? "border-b border-[#e2ddd3]" : ""}`}
            >
              <p className="leading-snug text-[#52615b]">{row.label}</p>
              <div className="text-center">
                {row.tag ? (
                  <span
                    className={`inline-flex rounded-full bg-[#eee8dd] font-semibold uppercase tracking-[0.12em] text-[#8b6840] ${
                      compact ? "px-1.5 py-0.5 text-[7px]" : "px-2 py-1 text-[8px]"
                    }`}
                  >
                    {row.tag}
                  </span>
                ) : null}
              </div>
              <p
                className={`whitespace-nowrap text-right font-semibold ${
                  row.value < 0 ? "text-[#b42318]" : "text-[#243d33]"
                }`}
              >
                {formatFinancialCurrency(row.value)}
              </p>
            </div>
          ))
        ) : (
          <p className={`${compact ? "px-3.5 py-3 text-[9px]" : "px-4 py-5 text-[10px]"} text-[#7a827e]`}>
            No values found in the published table.
          </p>
        )}
      </div>
    </section>
  );
}

function DonutChart({ spain }: { spain: number }) {
  const degrees = Math.max(0, Math.min(360, spain * 360));
  return (
    <div
      className="relative mx-auto h-[170px] w-[170px] rounded-full"
      style={{
        background: `conic-gradient(#2d473c 0deg ${degrees}deg, #80968d ${degrees}deg 360deg)`,
      }}
    >
      <div className="absolute inset-[45px] rounded-full bg-[#f7f4ec]" />
    </div>
  );
}

function AllocationRow({
  color,
  label,
  value,
  percentage,
}: {
  color: string;
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <div className="grid grid-cols-[12px_1fr_auto] items-center gap-3">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <div>
        <p className="text-sm font-semibold text-[#243d33]">{label}</p>
        <p className="mt-1 text-[10px] text-[#7a817d]">{formatCurrency(value)}</p>
      </div>
      <p className="text-sm font-semibold text-[#243d33]">{formatPercent(percentage)}</p>
    </div>
  );
}

function CapitalStack({
  mortgage,
  mortgageLabel = "Mortgage",
  equityLabel = "Equity",
}: {
  mortgage: number;
  mortgageLabel?: string;
  equityLabel?: string;
}) {
  const share = Math.max(0, Math.min(1, mortgage));

  return (
    <div>
      <div className="mb-2 flex justify-between text-[9px] font-semibold">
        <span className="text-[#9a6f37]">
          {mortgageLabel} {formatPercent(share)}
        </span>
        <span className="text-[#243d33]">
          {equityLabel} {formatPercent(1 - share)}
        </span>
      </div>
      <div className="flex h-12 overflow-hidden rounded-full bg-[#243d33]">
        <div
          className="flex items-center justify-center bg-[#b2854b] px-3 text-center text-[9px] font-semibold text-white"
          style={{ width: `${share * 100}%`, minWidth: share > 0 ? "72px" : "0" }}
        >
          {mortgageLabel}
        </div>
        <div className="flex flex-1 items-center justify-center px-3 text-center text-[9px] font-semibold text-white">
          {equityLabel}
        </div>
      </div>
    </div>
  );
}

function ProjectImage({
  project,
  address = "",
  className = "",
}: {
  project: string;
  address?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = getImageSource(project, address);

  if (!source || failed) {
    return (
      <div className={`relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#243d33] via-[#597066] to-[#b2854b] ${className}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_42%)]" />
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">Real Estate Asset</p>
          <p className="mt-3 text-3xl font-semibold text-white">{project}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[26px] bg-[#d8d4ca] ${className}`}>
      <img
        src={source}
        alt={project}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function ValueCreation({ asset }: { asset: Asset }) {
  const purchase = Math.max(0, asset.purchasePrice || 0);
  const totalProjectCost = Math.max(
    0,
    (asset.investedValue || 0) + (asset.stillToInvest || 0),
  );
  const renovation = Math.max(0, totalProjectCost - purchase);
  const profit = Math.max(0, getProfit(asset));
  const totalValueCreation = purchase + renovation + profit;

  const purchaseShare = totalValueCreation
    ? (purchase / totalValueCreation) * 100
    : 0;
  const renovationShare = totalValueCreation
    ? (renovation / totalValueCreation) * 100
    : 0;
  const profitShare = totalValueCreation
    ? (profit / totalValueCreation) * 100
    : 0;

  return (
    <section className="rounded-[20px] border border-[#d8d0c1] bg-white/85 p-4">
      <SectionLabel>Value creation</SectionLabel>

      <div className="mt-3 flex h-9 overflow-hidden rounded-full bg-[#e8e4dc]">
        <div
          className="bg-[#243d33]"
          style={{ width: `${purchaseShare}%` }}
          title={`Purchase: ${formatCurrency(purchase)}`}
        />
        <div
          className="bg-[#96784d]"
          style={{ width: `${renovationShare}%` }}
          title={`Renovation: ${formatCurrency(renovation)}`}
        />
        <div
          className="bg-[#86aaa5]"
          style={{ width: `${profitShare}%` }}
          title={`Profit: ${formatCurrency(profit)}`}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <ValueLegend color="#243d33" label="Purchase" value={purchase} />
        <ValueLegend color="#96784d" label="Renovation" value={renovation} />
        <ValueLegend color="#86aaa5" label="Profit" value={profit} />
      </div>
    </section>
  );
}

function ValueLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[7px] uppercase tracking-[0.14em] text-[#777f7b]">{label}</p>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold">{formatCurrencyWithCents(value)}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#e2ddd3] pb-1.5">
      <span className="text-[10px] text-[#727b76]">{label}</span>
      <span className="text-right text-[11px] font-semibold text-[#243d33]">{value}</span>
    </div>
  );
}

function SoldProjectCard({ asset }: { asset: Asset }) {
  const salePriceAvailable = Number.isFinite(asset.salesValue) && asset.salesValue > 0;
  const returnCost = getReturnCost(asset);
  const costAvailable = Number.isFinite(returnCost) && returnCost > 0;
  const profitAvailable =
    asset.hasExplicitProfit || (salePriceAvailable && costAvailable);
  const returnAvailable =
    hasExplicitIrr(asset) || (profitAvailable && costAvailable);
  const investmentAvailable = Number.isFinite(asset.investedValue) && asset.investedValue > 0;
  const saleDateAvailable = asset.salesDate.trim().length > 0;

  const visibleMetricCount = [salePriceAvailable, profitAvailable, returnAvailable].filter(
    Boolean,
  ).length;

  const metricGridColumns =
    visibleMetricCount === 1
      ? "grid-cols-1"
      : visibleMetricCount === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#d8d0c1] bg-white/85">
      <ProjectImage
        project={asset.project}
        address={asset.address}
        className="h-[62mm] rounded-none"
      />
      <div className="p-5">
        <SectionLabel>Realized project</SectionLabel>
        <h2 className="mt-3 text-2xl font-semibold text-[#243d33]">{asset.project}</h2>
        <p className="mt-2 text-[10px] text-[#747d78]">{asset.address || asset.entity}</p>

        {visibleMetricCount > 0 && (
          <div className={`mt-5 grid gap-3 ${metricGridColumns}`}>
            {salePriceAvailable && (
              <SmallMetric label="Sale price" value={formatCurrency(asset.salesValue)} dark />
            )}
            {profitAvailable && (
              <SmallMetric
                label="Profit"
                value={formatCurrency(getProfit(asset))}
                accent
              />
            )}
            {returnAvailable && (
              <SmallMetric label={getReturnType(asset)} value={formatPercent(getReturn(asset))} />
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 rounded-[18px] border border-[#ddd6ca] p-4">
          {investmentAvailable && (
            <Detail label="Investment" value={formatCurrency(asset.investedValue)} />
          )}
          {saleDateAvailable && <Detail label="Sale date" value={asset.salesDate} />}
          <Detail
            label="Built area"
            value={asset.builtArea ? `${formatNumber(asset.builtArea)} m²` : "—"}
          />
          <Detail
            label="Plot size"
            value={asset.plotSize ? `${formatNumber(asset.plotSize)} m²` : "—"}
          />
        </div>
      </div>
    </article>
  );
}

function SmallMetric({
  label,
  value,
  dark = false,
  accent = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
  accent?: boolean;
}) {
  const background = dark
    ? "bg-[#202e29] text-white"
    : accent
      ? "bg-[#829b91] text-white"
      : "bg-[#f4f0e8] text-[#243d33]";

  return (
    <div className={`rounded-[16px] p-4 ${background}`}>
      <p className="text-[7px] uppercase tracking-[0.18em] opacity-65">{label}</p>
      <p className="mt-2 whitespace-nowrap text-[15px] font-semibold">{value}</p>
    </div>
  );
}