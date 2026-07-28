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
  investedValue: number;
  salesValue: number;
  annualRent: number;
  rentYield: number;
  mortgage: number;
  stillToInvest: number;
  roi: number;
};

type FinancingRow = {
  name: string;
  entity: string;
  country: Country;
  ownership: number;
  mortgage: number;
};

type PortfolioData = {
  assets: Asset[];
  financingRows: FinancingRow[];
};

type NormalizedRow = Record<string, string>;

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
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
  {
    match: /margarita|la carolina|carolina/,
    src: "/portfolio-photos-nl-es/la-carolina.jpg",
  },
  {
    match: /los naranjos/,
    src: "/portfolio-photos-nl-es/los-naranjos.jpg",
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
    match: /groethofstraat/,
    src: "/portfolio-photos-nl-es/groethofstraat-99.png",
  },
  {
    match: /kazernestraat/,
    src: "/portfolio-photos-nl-es/kazernestraat-10.jpg",
  },
  {
    match: /benabola|haven/,
    src: "/portfolio-photos-nl-es/haven-appartment.jpg",
  },
  {
    match: /mona lisa/,
    src: "/portfolio-photos-nl-es/mona-lisa.jpg",
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

function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
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

  return matrix
    .slice(bestIndex + 1)
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

function isIgnoredProject(project: string): boolean {
  const text = normalizeText(project);
  return (
    !text ||
    text === "equity" ||
    text.includes("company inventory") ||
    text.includes("range rover")
  );
}

function getDisplayProject(project: string, address: string): string {
  if (project.trim()) return project.trim();
  return address.split(",")[0]?.trim() ?? "";
}

function transformRows(rows: NormalizedRow[]): PortfolioData {
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

    const investedValue = Math.abs(
      parseNumber(
        getCell(row, [
          "Total Investment (€)",
          "Investment to Date (€)",
          "Invested Value",
          "Investment",
          "Invested",
          "Purchase Value",
          "Aankoopwaarde",
          "Purchase Price (€)",
          "Purchase Price",
          "Purchase",
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

    const rentYield = explicitRentYield || (investedValue ? annualRent / investedValue : 0);
    const roi = parsePercentage(
      getCell(row, [
        "Expected ROI",
        "ROI (%)",
        "ROI",
        "Expected IRR",
        "IRR (%)",
        "IRR",
        "IRR sale",
        "Return",
      ]),
    );

    const mortgageOnlyRow = projectText.includes("mortgage") || projectText.includes("hypotheek");

    if (mortgageOnlyRow) {
      const mortgageAmount = explicitMortgage || salesValue || investedValue || explicitStillToInvest;
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
      const value = explicitStillToInvest || salesValue || investedValue || explicitMortgage;
      if (target && value > 0) pendingInvestments.push({ target, value });
      continue;
    }

    const isStandaloneLaCarolinaInvestment =
      projectText === "la carolina" &&
      explicitStillToInvest > 0 &&
      investedValue === 0 &&
      salesValue === 0 &&
      builtArea === 0 &&
      plotSize === 0;

    if (isStandaloneLaCarolinaInvestment) {
      pendingInvestments.push({ target: "la carolina", value: explicitStillToInvest });
      continue;
    }

    if (isIgnoredProject(project) || (!project && !address)) continue;

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
      investedValue,
      salesValue,
      annualRent,
      rentYield,
      mortgage: explicitMortgage,
      stillToInvest: explicitStillToInvest,
      roi,
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

  return { assets, financingRows };
}

function getEndValue(asset: Asset): number {
  return asset.salesValue || asset.investedValue + asset.stillToInvest;
}

function getTotalCost(asset: Asset): number {
  return asset.investedValue + asset.stillToInvest;
}

function getProfit(asset: Asset): number {
  return getEndValue(asset) - getTotalCost(asset);
}

function getReturn(asset: Asset): number {
  if (asset.roi) return asset.roi;
  const cost = getTotalCost(asset);
  return cost ? getProfit(asset) / cost : 0;
}

function getImageSource(project: string): string | null {
  const normalized = normalizeText(project);
  return IMAGE_RULES.find(({ match }) => match.test(normalized))?.src ?? null;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export default function CompletePortfolioPage() {
  const [data, setData] = useState<PortfolioData>({ assets: [], financingRows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        const transformed = transformRows(rows);

        if (!transformed.assets.length) {
          throw new Error(
            "Er zijn geen objecten gevonden. Open de browserconsole om de CSV te controleren of publiceer het juiste tabblad opnieuw als CSV.",
          );
        }

        setData(transformed);
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
    const currentAssets = data.assets.filter(isCurrentAsset);
    const soldAssets = data.assets.filter(isSoldAsset);
    const sharedAssets = data.assets.filter(isJointPortfolioAsset);
    const whollyOwnedAssets = currentAssets.filter((asset) => asset.ownership === 1);

    const portfolioEndValue = currentAssets.reduce(
      (sum, asset) => sum + getEndValue(asset) * asset.ownership,
      0,
    );

    const totalInvestment = currentAssets.reduce(
      (sum, asset) => sum + getTotalCost(asset) * asset.ownership,
      0,
    );

    const assetMortgages = currentAssets.reduce(
      (sum, asset) => sum + asset.mortgage * asset.ownership,
      0,
    );

    const separateMortgages = data.financingRows.reduce(
      (sum, row) => sum + row.mortgage * row.ownership,
      0,
    );

    const totalMortgages = assetMortgages + separateMortgages;
    const netEquity = portfolioEndValue - totalMortgages;
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

    const totalBuiltArea = data.assets.reduce((sum, asset) => sum + asset.builtArea, 0);
    const totalPlotSize = data.assets.reduce((sum, asset) => sum + asset.plotSize, 0);
    const soldRevenue = soldAssets.reduce(
      (sum, asset) => sum + getEndValue(asset) * asset.ownership,
      0,
    );
    const realizedProfit = soldAssets.reduce(
      (sum, asset) => sum + getProfit(asset) * asset.ownership,
      0,
    );

    const sharedEndValue = sharedAssets.reduce(
      (sum, asset) => sum + getEndValue(asset) * 0.5,
      0,
    );
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
    const sharedTotalMortgageFromFinancingRow = data.financingRows
      .filter((row) => {
        const rowText = normalizeText(`${row.name} ${row.entity}`);
        return (
          rowText.includes("f berden") &&
          (rowText.includes("mortgage") || rowText.includes("financing"))
        );
      })
      .reduce((sum, row) => sum + row.mortgage, 0);

    // Fallback voor het geval de naam van de financieringsregel later wijzigt.
    const sharedMortgageFromRowsFallback = data.financingRows
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
      totalInvestment,
      totalMortgages,
      netEquity,
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
      sharedInvestment,
      sharedMortgage,
      sharedTotalMortgage,
    };
  }, [data]);

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

      <div className="no-print sticky top-4 z-50 mx-auto mb-6 flex w-fit items-center gap-3 rounded-full bg-[#20382f] px-5 py-3 text-white shadow-xl">
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

          <section className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Portfolio end value"
              value={formatCurrency(metrics.portfolioEndValue)}
              description="Ownership adjusted"
            />
            <MetricCard
              label="Net equity"
              value={formatCurrency(metrics.netEquity)}
              description="End value minus mortgages"
              accent
            />
            <MetricCard
              label="Portfolio LTV"
              value={formatPercent(metrics.ltv)}
              description="Mortgage / end value"
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
              <SectionLabel>Capital structure</SectionLabel>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-[#69736e]">Total mortgages</p>
                  <p className="mt-1 text-2xl font-semibold text-[#243d33]">
                    {formatCurrency(metrics.totalMortgages)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#69736e]">Total investment</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(metrics.totalInvestment)}
                  </p>
                </div>
              </div>
            </div>
            <CapitalStack mortgage={metrics.ltv} />
          </div>
        </section>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <CompactMetric label="Sold revenue" value={formatCurrency(metrics.soldRevenue)} />
          <CompactMetric
            label="Realized gross profit"
            value={formatCurrency(metrics.realizedProfit)}
          />
          <CompactMetric
            label="Total plot size"
            value={`${formatNumber(metrics.totalPlotSize)} m²`}
          />
        </div>

        <ReportFooter updated={lastUpdated} />
      </PageFrame>

      {metrics.sharedAssets.length > 0 && (
        <PageFrame>
          <ReportHeader
            number="02"
            label="Joint portfolio"
            title="D. Leeuw e/o F. Berden Private Real Estate"
            subtitle="Portfolio metrics shown on a 50% ownership basis"
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
            <div className="grid grid-cols-[0.72fr_1.6fr] items-center gap-6">
              <div>
                <SectionLabel>Capital structure</SectionLabel>
                <div className="mt-2 flex items-end justify-between gap-5">
                  <div>
                    <p className="text-[9px] text-[#69736e]">Total mortgage</p>
                    <p className="mt-1 text-xl font-semibold text-[#243d33]">
                      {formatCurrency(metrics.sharedTotalMortgage)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-[#69736e]">Joint portfolio LTV</p>
                    <p className="mt-1 text-xl font-semibold text-[#b2854b]">
                      {formatPercent(
                        metrics.sharedEndValue
                          ? metrics.sharedMortgage / metrics.sharedEndValue
                          : 0,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <CapitalStack
                mortgage={
                  metrics.sharedEndValue
                    ? metrics.sharedMortgage / metrics.sharedEndValue
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
            number={String(index + 3).padStart(2, "0")}
            label="Wholly owned portfolio"
            title={asset.project}
            subtitle={asset.entity}
          />

          <div className="mt-7 grid grid-cols-[1.15fr_1fr] gap-7">
            <ProjectImage project={asset.project} className="h-[118mm]" />
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Expected end value"
                  value={formatCurrency(getEndValue(asset))}
                  description="100% ownership"
                  dark
                />
                <MetricCard
                  label="Expected profit"
                  value={formatCurrency(getProfit(asset))}
                  description="Before tax"
                  accent
                />
                <MetricCard
                  label="Return"
                  value={formatPercent(getReturn(asset))}
                  description="Expected ROI / IRR"
                />
              </div>

              <ValueCreation asset={asset} />

              <section className="rounded-[24px] border border-[#d8d0c1] bg-white/85 p-5">
                <SectionLabel>Project metrics</SectionLabel>
                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <Detail label="Invested value" value={formatCurrency(asset.investedValue)} />
                  <Detail
                    label="Still to invest"
                    value={asset.stillToInvest ? formatCurrency(asset.stillToInvest) : "—"}
                  />
                  <Detail
                    label="Mortgage"
                    value={asset.mortgage ? formatCurrency(asset.mortgage) : "—"}
                  />
                  <Detail
                    label="Loan to value"
                    value={
                      asset.mortgage && getEndValue(asset)
                        ? formatPercent(asset.mortgage / getEndValue(asset))
                        : "—"
                    }
                  />
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
                  <Detail
                    label="Annual rent"
                    value={asset.annualRent ? formatCurrency(asset.annualRent) : "—"}
                  />
                  <Detail
                    label="Rent yield"
                    value={asset.rentYield ? formatPercent(asset.rentYield) : "—"}
                  />
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
            number={String(metrics.whollyOwnedAssets.length + pageIndex + 3).padStart(2, "0")}
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
}: {
  label: string;
  value: string;
  description: string;
  accent?: boolean;
  dark?: boolean;
  compact?: boolean;
}) {
  const background = dark
    ? "bg-[#1f332b] text-white"
    : accent
      ? "bg-[#829b91] text-white"
      : "border border-[#d8d0c1] bg-white/80 text-[#1f332b]";

  return (
    <div
      className={`${compact ? "rounded-[16px] p-4" : "rounded-[20px] p-5"} ${background}`}
    >
      <p className={`text-[8px] uppercase tracking-[0.2em] ${dark || accent ? "text-white/70" : "text-[#8a7160]"}`}>
        {label}
      </p>
      <p
        className={`${compact ? "mt-2 text-[18px]" : "mt-3 text-[21px]"} whitespace-nowrap font-semibold leading-none`}
      >
        {value}
      </p>
      <p
        className={`${compact ? "mt-2 text-[8px]" : "mt-3 text-[9px]"} ${dark || accent ? "text-white/70" : "text-[#7a827e]"}`}
      >
        {description}
      </p>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#243d33] px-5 py-4 text-white">
      <p className="text-[8px] uppercase tracking-[0.22em] text-white/60">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
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
      <div className="absolute inset-[45px] flex flex-col items-center justify-center rounded-full bg-[#f7f4ec]">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#8b7461]">Portfolio</p>
        <p className="mt-1 text-lg font-semibold text-[#243d33]">100%</p>
      </div>
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

function CapitalStack({ mortgage }: { mortgage: number }) {
  const share = Math.max(0, Math.min(1, mortgage));
  return (
    <div>
      <div className="mb-2 flex justify-between text-[9px] font-semibold">
        <span className="text-[#9a6f37]">Mortgage {formatPercent(share)}</span>
        <span className="text-[#243d33]">Equity {formatPercent(1 - share)}</span>
      </div>
      <div className="flex h-12 overflow-hidden rounded-full bg-[#243d33]">
        <div
          className="flex items-center justify-center bg-[#b2854b] text-[9px] font-semibold text-white"
          style={{ width: `${share * 100}%`, minWidth: share > 0 ? "48px" : "0" }}
        >
          Mortgage
        </div>
        <div className="flex flex-1 items-center justify-center text-[9px] font-semibold text-white">
          Equity
        </div>
      </div>
    </div>
  );
}

function ProjectImage({ project, className = "" }: { project: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const source = getImageSource(project);

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
  const invested = asset.investedValue;
  const remaining = asset.stillToInvest;
  const profit = Math.max(0, getProfit(asset));
  const total = invested + remaining + profit;

  return (
    <section className="rounded-[24px] border border-[#d8d0c1] bg-white/85 p-5">
      <SectionLabel>Value creation</SectionLabel>
      <div className="mt-4 flex h-11 overflow-hidden rounded-full bg-[#e8e4dc]">
        <div className="bg-[#243d33]" style={{ width: `${total ? (invested / total) * 100 : 0}%` }} />
        <div className="bg-[#b2854b]" style={{ width: `${total ? (remaining / total) * 100 : 0}%` }} />
        <div className="bg-[#829b91]" style={{ width: `${total ? (profit / total) * 100 : 0}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <ValueLegend color="#243d33" label="Invested" value={invested} />
        <ValueLegend color="#b2854b" label="Still to invest" value={remaining} />
        <ValueLegend color="#829b91" label="Expected profit" value={profit} />
      </div>
    </section>
  );
}

function ValueLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[8px] uppercase tracking-[0.16em] text-[#777f7b]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold">{value ? formatCurrency(value) : "—"}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#e2ddd3] pb-2">
      <span className="text-[10px] text-[#727b76]">{label}</span>
      <span className="text-right text-[11px] font-semibold text-[#243d33]">{value}</span>
    </div>
  );
}

function SoldProjectCard({ asset }: { asset: Asset }) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-[#d8d0c1] bg-white/85">
      <ProjectImage project={asset.project} className="h-[62mm] rounded-none" />
      <div className="p-5">
        <SectionLabel>Realized project</SectionLabel>
        <h2 className="mt-3 text-2xl font-semibold text-[#243d33]">{asset.project}</h2>
        <p className="mt-2 text-[10px] text-[#747d78]">{asset.address || asset.entity}</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <SmallMetric label="Sale price" value={formatCurrency(getEndValue(asset))} dark />
          <SmallMetric label="Profit" value={formatCurrency(getProfit(asset))} accent />
          <SmallMetric label="Return" value={formatPercent(getReturn(asset))} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 rounded-[18px] border border-[#ddd6ca] p-4">
          <Detail label="Investment" value={formatCurrency(asset.investedValue)} />
          <Detail label="Sale date" value={asset.salesDate || "—"} />
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