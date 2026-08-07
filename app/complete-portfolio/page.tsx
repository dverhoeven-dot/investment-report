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
  sourceKey?: string;
  sourceProject?: string;
  sourceAddress?: string;
  reportCategory?: SoldCategoryId;
  reportStatus?: PortfolioAssetStatus;
  customPhotoUrl?: string;
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

type SoldCategoryId = "office" | "residential" | "industrial";
type PortfolioAssetStatus = "current" | "sold";

type PortfolioAssetSetting = {
  reportName?: string;
  category?: SoldCategoryId;
};

type PortfolioAssetSettings = Record<string, PortfolioAssetSetting>;

type SoldCategoryDefinition = {
  id: SoldCategoryId;
  title: string;
  subtitle: string;
};

type SoldCategoryOverrides = Record<string, SoldCategoryId>;

type SoldAssetEdit = {
  project?: string;
  address?: string;
};

type SoldAssetEdits = Record<string, SoldAssetEdit>;

const SOLD_CATEGORY_STORAGE_KEY =
  "complete-portfolio-report-sold-categories-v2";

const SOLD_ASSET_EDITS_STORAGE_KEY =
  "complete-portfolio-report-sold-asset-edits-v1";

const PORTFOLIO_MANAGER_STORAGE_KEY =
  "complete-portfolio-report-manager-v1";
const PORTFOLIO_MANAGER_COLLAPSED_STORAGE_KEY =
  "complete-portfolio-report-manager-collapsed-v1";
const PORTFOLIO_MANAGER_HIDDEN_STORAGE_KEY =
  "complete-portfolio-report-manager-hidden-rows-v1";
const PORTFOLIO_PHOTO_DB_NAME = "complete-portfolio-report-photos";
const PORTFOLIO_PHOTO_STORE_NAME = "project-photos";

const SOLD_CATEGORY_LABELS: Record<SoldCategoryId, string> = {
  office: "Kantoorpanden",
  residential: "Residentieel vastgoed",
  industrial: "Bedrijfsruimtes",
};

const SOLD_CATEGORY_DEFINITIONS: SoldCategoryDefinition[] = [
  {
    id: "office",
    title: "Offices",
    subtitle: "Realized office portfolio",
  },
  {
    id: "residential",
    title: "Residential Real Estate",
    subtitle: "Realized residential portfolio",
  },
  {
    id: "industrial",
    title: "Commercial Real Estate",
    subtitle: "Realized commercial real estate portfolio",
  },
];

// Door de gebruiker bevestigde standaardindeling van het verkochte
// Nederlandse trackrecord. Deze regels hebben voorrang op de algemene
// herkenning verderop in de code.
const SOLD_CATEGORY_DEFAULT_RULES: Array<{
  match: RegExp;
  category: SoldCategoryId;
}> = [
  // Residentieel vastgoed
  { match: /berg en terblijt valkenburgerstraat 74/, category: "residential" },
  { match: /blerick alberdick.*thijmstraat 47/, category: "residential" },
  { match: /blerick baarlosestraat 55/, category: "residential" },
  {
    match: /blerick baarlosestraat vliegenkampstraat 126/,
    category: "residential",
  },
  { match: /blerick hoekstraat 6/, category: "residential" },
  { match: /venlo dokter blumenkampstraat 3/, category: "residential" },
  { match: /venlo eindhovenseweg 8/, category: "residential" },
  { match: /venlo kaldenkerkerweg 57 a/, category: "residential" },
  { match: /venlo kaldenkerkerweg 57 b/, category: "residential" },
  { match: /venlo parade 10 12/, category: "residential" },
  { match: /venlo prins.*singel 18 58/, category: "residential" },
  { match: /venlo prins.*singel 30/, category: "residential" },
  { match: /venlo spoorstraat 52/, category: "residential" },
  { match: /venlo stalbergweg/, category: "residential" },
  { match: /venray kennedyplein 24/, category: "residential" },

  // Kantoorpanden
  { match: /blerick parlevinkerweg 1/, category: "office" },
  { match: /blerick tjalkkade 10/, category: "office" },
  { match: /geleen transportlaan 1 151/, category: "office" },
  { match: /heerlen snellius 1/, category: "office" },
  { match: /roermond kap.*laan 15/, category: "office" },
  { match: /roermond noordhoven 19/, category: "office" },
  { match: /sittard stationsplein 1/, category: "office" },
  { match: /venlo declarantenweg 29$/, category: "office" },
  { match: /venlo kaldenkerkerweg 20/, category: "office" },
  { match: /venlo kaldenkerkerweg 28/, category: "office" },
  { match: /venlo kaldenkerkerweg 57$/, category: "office" },
  { match: /venlo prins.*singel 10 13/, category: "office" },
  { match: /venray keizersveld 71/, category: "office" },

  // Bedrijfsruimtes
  { match: /beek middelweg 25/, category: "industrial" },
  { match: /blerick groot bollerweg 10/, category: "industrial" },
  { match: /blerick groot egtenrayseweg 36/, category: "industrial" },
  { match: /blerick groot egtenrayseweg 38/, category: "industrial" },
  { match: /blerick groot egtenrayseweg 42/, category: "industrial" },
  { match: /blerick groot egtenrayseweg 67 82/, category: "industrial" },
  { match: /blerick horsterweg 31/, category: "industrial" },
  { match: /blerick horsterweg 180/, category: "industrial" },
  { match: /blerick jacob roggeveenweg 8/, category: "industrial" },
  { match: /blerick marinus dammeweg 55/, category: "industrial" },
  { match: /blerick rudolf dieselweg 2 6/, category: "industrial" },
  { match: /blerick rudolf dieselweg 34 36/, category: "industrial" },
  { match: /blerick steegstraat 21/, category: "industrial" },
  { match: /blerick van heemskerckweg/, category: "industrial" },
  { match: /blerick voltastraat wattstraat/, category: "industrial" },
  { match: /haarlem conradweg 20/, category: "industrial" },
  { match: /heerlen beersdalweg 108/, category: "industrial" },
  { match: /heerlen economiestraat 39/, category: "industrial" },
  { match: /heerlen sourethweg/, category: "industrial" },
  { match: /raalte schoenerstraat 3/, category: "industrial" },
  { match: /roermond mijnheerkensweg 22/, category: "industrial" },
  { match: /roermond noordhoven 2/, category: "industrial" },
  { match: /sittard dr nolenslaan 155/, category: "industrial" },
  { match: /sittard dr nolenslaan 157/, category: "industrial" },
  { match: /sittard nusterweg 63/, category: "industrial" },
  { match: /sittard nusterweg 65/, category: "industrial" },
  { match: /venlo ankerkade 15/, category: "industrial" },
  { match: /venlo ankerkade 18/, category: "industrial" },
  { match: /venlo bevrijdingsweg 39 41/, category: "industrial" },
  { match: /venlo burgemeester conraetzstraat 21/, category: "industrial" },
  { match: /venlo declarantenweg 28/, category: "industrial" },
  { match: /venlo declarantenweg 29a/, category: "industrial" },
  { match: /venlo groethofstraat 34/, category: "industrial" },
  { match: /venlo groethofstraat 52/, category: "industrial" },
  {
    match: /venlo groethofstraat 111 buys ballotstraat 9/,
    category: "industrial",
  },
  { match: /venlo rudolf dieselweg 34 36/, category: "industrial" },
  { match: /venlo winkelveldstraat 14/, category: "industrial" },
  { match: /venlo winkelveldstraat 21/, category: "industrial" },
  { match: /venlo winkelveldstraat 24a/, category: "industrial" },
];

// Algemene fallbackregels voor nieuwe verkochte objecten die nog niet
// expliciet in de standaardindeling hierboven staan.
const SOLD_CATEGORY_ADDRESS_RULES: Record<SoldCategoryId, RegExp[]> = {
  office: [
    /declarantenweg/,
    /keizersveld/,
    /kaldenkerkerweg/,
    /dokter blumenkampstraat/,
    /dr blumenkampstraat/,
    /buys ballotstraat/,
  ],
  residential: [
    /groethofstraat/,
    /goethofstraat/,
    /horsterweg/,
    /kazernestraat/,
    /leeuwerikstraat/,
    /noordhoven/,
    /prinsessesingel/,
    /prinsessensingel/,
    /princessesingel/,
    /spoorstraat/,
    /steegstraat/,
    /zonneveld/,
  ],
  industrial: [
    /bevrijdingsweg/,
    /magalhaesweg/,
    /magelhaesweg/,
    /middelweg/,
    /nusterweg/,
    /parlevinkerstraat/,
    /rudolf dieselweg/,
    /schoenenstraat/,
    /smakterweg/,
    /snellius/,
    /tajikade/,
    /transportlaan/,
    /winkelveldstraat/,
  ],
};

// Deze adressen worden, wanneer ze in de betreffende categorie voorkomen,
// als de twee uitgelichte foto's gebruikt. Ontbreekt een voorkeursobject,
// dan kiest de code automatisch een ander object met een gekoppelde foto.
const SOLD_FEATURED_PROJECT_RULES: Record<SoldCategoryId, RegExp[]> = {
  office: [
    /declarantenweg 29 a|declarantenweg 29a/,
    /snellius 1/,
  ],
  residential: [
    /dokter blumenkampstraat 3|dr blumenkampstraat 3/,
    /prins.*singel 30/,
  ],
  industrial: [
    /buys ballotstraat 9/,
    /noordhoven 2/,
    /nusterweg 63/,
    /horsterweg 31/,
  ],
};

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

function getLegacyPortfolioAssetKey(asset: Asset): string {
  const stableLocation = asset.address.trim() || asset.project.trim();

  return [
    asset.entity,
    stableLocation,
    asset.purchaseDate,
    asset.country,
  ]
    .map(normalizeText)
    .join("|");
}

function getPreviousPortfolioAssetKey(asset: Asset): string {
  const stableLocation = asset.address.trim() || asset.project.trim();

  return [asset.country, stableLocation]
    .map(normalizeText)
    .join("|");
}

function normalizePortfolioLocation(value: string): string {
  const ignoredTokens = new Set([
    "current",
    "sold",
    "realized",
    "realised",
    "project",
    "projects",
    "object",
    "objects",
  ]);

  const tokens = normalizeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !ignoredTokens.has(token));

  // Door unieke tokens alfabetisch/numeriek te sorteren worden bijvoorbeeld
  // “Venlo Groethofstraat 34” en “Groethofstraat 34, Venlo” dezelfde locatie.
  return Array.from(new Set(tokens))
    .sort((left, right) =>
      left.localeCompare(right, "nl", {
        numeric: true,
        sensitivity: "base",
      }),
    )
    .join(" ");
}

function getAddressFirstPortfolioAssetKey(asset: Asset): string {
  const candidates = [asset.address, asset.project]
    .map((value) => normalizePortfolioLocation(value))
    .filter(Boolean);

  const stableLocation =
    candidates.find((candidate) => /\d/.test(candidate)) ??
    candidates[0] ??
    normalizePortfolioLocation(asset.entity);

  return `${normalizeText(asset.country)}|${stableLocation}`;
}

function getPortfolioAssetKey(asset: Asset): string {
  // De projectnaam uit Overview is leidend voor de identiteit van een pand.
  // Hierdoor worden regels met dezelfde Overview-naam maar een afwijkend of
  // leeg adresveld niet meer als twee verschillende panden behandeld.
  const candidates = [asset.project, asset.address]
    .map((value) => normalizePortfolioLocation(value))
    .filter(Boolean);

  const stableLocation =
    candidates.find((candidate) => /\d/.test(candidate)) ??
    candidates[0] ??
    normalizePortfolioLocation(asset.entity);

  return `${normalizeText(asset.country)}|${stableLocation}`;
}

function getPortfolioManagerRowKey(asset: Asset): string {
  // Deze sleutel is bewust specifieker dan getPortfolioAssetKey().
  // Daardoor kan één foutieve dubbele bronregel worden verborgen zonder
  // automatisch de andere versie van hetzelfde fysieke pand te verwijderen.
  return [
    asset.entity,
    asset.project,
    asset.address,
    asset.status,
    asset.purchaseDate,
    asset.salesDate,
    asset.country,
  ]
    .map(normalizeText)
    .join("|");
}

function getPortfolioAssetSourceScore(asset: Asset): number {
  let score = 0;

  // Wanneer hetzelfde pand zowel als current als sold uit de bron wordt
  // ingelezen, is de sold-regel leidend.
  if (isSoldAsset(asset)) score += 10_000;
  else if (isCurrentAsset(asset)) score += 5_000;

  if (asset.salesValue > 0) score += 100;
  if (asset.hasExplicitProfit) score += 80;
  if (asset.investedValue > 0) score += 40;
  if (asset.purchasePrice > 0) score += 30;
  if (asset.mortgage > 0) score += 20;
  if (asset.builtArea > 0) score += 10;
  if (asset.plotSize > 0) score += 10;
  if (asset.purchaseDate) score += 5;
  if (asset.salesDate) score += 5;
  if (asset.address.trim()) score += 3;

  return score;
}

function deduplicatePortfolioAssets(assets: Asset[]): Asset[] {
  const uniqueAssets = new Map<string, Asset>();

  for (const asset of assets) {
    const key = getPortfolioAssetKey(asset);
    const existing = uniqueAssets.get(key);

    if (!existing) {
      uniqueAssets.set(key, asset);
      continue;
    }

    if (
      getPortfolioAssetSourceScore(asset) >
      getPortfolioAssetSourceScore(existing)
    ) {
      uniqueAssets.set(key, asset);
    }
  }

  return Array.from(uniqueAssets.values());
}

function getDefaultPortfolioCategory(asset: Asset): SoldCategoryId {
  if (asset.country === "Spanje") return "residential";
  return getSoldCategory(asset);
}

function getDefaultPortfolioStatus(asset: Asset): PortfolioAssetStatus {
  return isSoldAsset(asset) ? "sold" : "current";
}

function getPortfolioAssetSetting(
  asset: Asset,
  settings: PortfolioAssetSettings,
): Required<PortfolioAssetSetting> {
  const stored =
    settings[getPortfolioAssetKey(asset)] ??
    settings[getAddressFirstPortfolioAssetKey(asset)] ??
    settings[getPreviousPortfolioAssetKey(asset)] ??
    settings[getLegacyPortfolioAssetKey(asset)] ??
    {};

  return {
    reportName: stored.reportName ?? asset.project,
    category: stored.category ?? getDefaultPortfolioCategory(asset),
  };
}

function applyPortfolioAssetSetting(
  asset: Asset,
  settings: PortfolioAssetSettings,
  photoUrls: Record<string, string>,
): Asset {
  const key = getPortfolioAssetKey(asset);
  const setting = getPortfolioAssetSetting(asset, settings);

  return {
    ...asset,
    sourceKey: key,
    sourceProject: asset.sourceProject ?? asset.project,
    sourceAddress: asset.sourceAddress ?? asset.address,
    project: setting.reportName.trim() || asset.project,
    reportCategory: setting.category,
    // Current/Sold is read-only and always comes from the live Overview data.
    reportStatus: getDefaultPortfolioStatus(asset),
    customPhotoUrl:
      photoUrls[key] ??
      photoUrls[getAddressFirstPortfolioAssetKey(asset)] ??
      photoUrls[getPreviousPortfolioAssetKey(asset)] ??
      photoUrls[getLegacyPortfolioAssetKey(asset)] ??
      "",
  };
}

function hasProjectPhoto(asset: Asset): boolean {
  return Boolean(
    asset.customPhotoUrl ||
      getImageSource(
        asset.project,
        asset.address,
        asset.sourceProject,
        asset.sourceAddress,
      ),
  );
}

function openPortfolioPhotoDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(PORTFOLIO_PHOTO_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PORTFOLIO_PHOTO_STORE_NAME)) {
        database.createObjectStore(PORTFOLIO_PHOTO_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePortfolioPhoto(
  assetKey: string,
  file: File,
): Promise<void> {
  const database = await openPortfolioPhotoDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      PORTFOLIO_PHOTO_STORE_NAME,
      "readwrite",
    );
    transaction.objectStore(PORTFOLIO_PHOTO_STORE_NAME).put(file, assetKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
}

async function removePortfolioPhoto(assetKey: string): Promise<void> {
  const database = await openPortfolioPhotoDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      PORTFOLIO_PHOTO_STORE_NAME,
      "readwrite",
    );
    transaction.objectStore(PORTFOLIO_PHOTO_STORE_NAME).delete(assetKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
}

async function loadPortfolioPhoto(assetKey: string): Promise<Blob | null> {
  const database = await openPortfolioPhotoDatabase();

  const result = await new Promise<Blob | null>((resolve, reject) => {
    const transaction = database.transaction(
      PORTFOLIO_PHOTO_STORE_NAME,
      "readonly",
    );
    const request = transaction.objectStore(PORTFOLIO_PHOTO_STORE_NAME).get(assetKey);

    request.onsuccess = () =>
      resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return result;
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
    statusText === "realized" ||
    statusText === "realised" ||
    statusText === "realized project" ||
    statusText === "realised project" ||
    statusText === "realized projects" ||
    statusText === "realised projects" ||
    statusText.includes("sold") ||
    statusText.includes("verkocht") ||
    statusText.includes("realized project") ||
    statusText.includes("realised project") ||
    entityText.includes("sold objects") ||
    entityText.includes("verkochte objecten") ||
    entityText.includes("realized projects") ||
    entityText.includes("realised projects")
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

function isCalderonAsset(asset: Asset): boolean {
  const text = normalizeText(`${asset.project} ${asset.address}`);
  return text.includes("calderon") || text.includes("de la barca");
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
    country === "es" ||
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
    country === "nl" ||
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

function getImageSource(
  project: string,
  address = "",
  sourceProject = "",
  sourceAddress = "",
): string | null {
  const normalized = normalizeText(
    `${project} ${address} ${sourceProject} ${sourceAddress}`,
  );

  return IMAGE_RULES.find(({ match }) => match.test(normalized))?.src ?? null;
}

function isSoldCategoryId(value: unknown): value is SoldCategoryId {
  return (
    value === "office" ||
    value === "residential" ||
    value === "industrial"
  );
}

function getSoldAssetKey(asset: Asset): string {
  if (asset.sourceKey) return asset.sourceKey;

  return [
    asset.country,
    asset.project,
    asset.address,
    asset.salesDate,
  ]
    .map(normalizeText)
    .join("|");
}

function getSoldAssetEdit(
  asset: Asset,
  edits: SoldAssetEdits,
): SoldAssetEdit | undefined {
  return edits[getSoldAssetKey(asset)];
}

function applySoldAssetEdit(
  asset: Asset,
  edits: SoldAssetEdits,
): Asset {
  const edit = getSoldAssetEdit(asset, edits);

  if (!edit) return asset;

  return {
    ...asset,
    sourceKey: getSoldAssetKey(asset),
    sourceProject: asset.sourceProject ?? asset.project,
    sourceAddress: asset.sourceAddress ?? asset.address,
    project: edit.project ?? asset.project,
    address: edit.address ?? asset.address,
  };
}

function hasManualSoldAssetEdit(
  asset: Asset,
  edits: SoldAssetEdits,
): boolean {
  const edit = getSoldAssetEdit(asset, edits);
  if (!edit) return false;

  return (
    (edit.project !== undefined && edit.project !== asset.project) ||
    (edit.address !== undefined && edit.address !== asset.address)
  );
}

function getSoldCategory(asset: Asset): SoldCategoryId {
  const text = normalizeText(
    `${asset.project} ${asset.address} ${asset.entity}`,
  );

  const confirmedDefault = SOLD_CATEGORY_DEFAULT_RULES.find(({ match }) =>
    match.test(text),
  );

  if (confirmedDefault) return confirmedDefault.category;

  if (
    text.includes("office") ||
    text.includes("kantoor")
  ) {
    return "office";
  }

  if (
    text.includes("residential") ||
    text.includes("residentieel") ||
    text.includes("woning") ||
    text.includes("appartement")
  ) {
    return "residential";
  }

  if (
    text.includes("industrial") ||
    text.includes("bedrijfshal") ||
    text.includes("bedrijfshallen") ||
    text.includes("warehouse") ||
    text.includes("logistics") ||
    text.includes("logistiek")
  ) {
    return "industrial";
  }

  for (const definition of SOLD_CATEGORY_DEFINITIONS) {
    if (
      SOLD_CATEGORY_ADDRESS_RULES[definition.id].some((rule) =>
        rule.test(text),
      )
    ) {
      return definition.id;
    }
  }

  // Niet-herkende Nederlandse bedrijfsobjecten komen standaard bij
  // Bedrijfsruimtes, zodat geen verkocht object uit het overzicht verdwijnt.
  return "industrial";
}

function getEffectiveSoldCategory(
  asset: Asset,
  overrides: SoldCategoryOverrides,
): SoldCategoryId {
  const defaultCategory = getSoldCategory(asset);
  const override = overrides[getSoldAssetKey(asset)];

  return override && override !== defaultCategory
    ? override
    : defaultCategory;
}

function hasManualSoldCategory(
  asset: Asset,
  overrides: SoldCategoryOverrides,
): boolean {
  const override = overrides[getSoldAssetKey(asset)];

  return Boolean(
    override && override !== getSoldCategory(asset),
  );
}

function hasManualSoldAsset(
  asset: Asset,
  overrides: SoldCategoryOverrides,
  edits: SoldAssetEdits,
): boolean {
  return (
    hasManualSoldCategory(asset, overrides) ||
    hasManualSoldAssetEdit(asset, edits)
  );
}

function getSoldDisplayAddress(asset: Asset): string {
  return asset.address.trim() || asset.project.trim() || asset.entity.trim();
}

function getSoldDisplayArea(asset: Asset): {
  value: number;
  suffix: string;
} {
  if (asset.builtArea > 0) {
    return { value: asset.builtArea, suffix: "m²" };
  }

  if (asset.plotSize > 0) {
    return { value: asset.plotSize, suffix: "m² plot" };
  }

  return { value: 0, suffix: "" };
}

function sortSoldAssetsByAddress(assets: Asset[]): Asset[] {
  return [...assets].sort((left, right) =>
    getSoldDisplayAddress(left).localeCompare(
      getSoldDisplayAddress(right),
      "nl",
      { numeric: true, sensitivity: "base" },
    ),
  );
}

function splitCommercialAssetsAcrossPages(
  assets: Asset[],
): [Asset[], Asset[]] {
  const sortedAssets = sortSoldAssetsByAddress(assets);
  const pages: [Asset[], Asset[]] = [[], []];

  const hasPhoto = (asset: Asset) => hasProjectPhoto(asset);

  const preferredRules = SOLD_FEATURED_PROJECT_RULES.industrial;
  const preferredPhotoAssets = preferredRules
    .map((rule) =>
      sortedAssets.find((asset) => {
        const text = normalizeText(
          `${asset.project} ${asset.address} ${asset.sourceProject ?? ""} ${
            asset.sourceAddress ?? ""
          }`,
        );
        return rule.test(text) && hasPhoto(asset);
      }),
    )
    .filter((asset): asset is Asset => Boolean(asset));

  // Zet de vier gewenste uitgelichte panden vast op 2 pagina's:
  // pagina 1: eerste twee, pagina 2: volgende twee.
  preferredPhotoAssets.slice(0, 2).forEach((asset) => {
    if (!pages[0].includes(asset)) pages[0].push(asset);
  });

  preferredPhotoAssets.slice(2, 4).forEach((asset) => {
    if (!pages[1].includes(asset)) pages[1].push(asset);
  });

  const alreadyAssigned = new Set<Asset>([
    ...pages[0],
    ...pages[1],
  ]);

  const fallbackPhotoAssets = sortedAssets.filter(
    (asset) => hasPhoto(asset) && !alreadyAssigned.has(asset),
  );

  for (const asset of fallbackPhotoAssets) {
    if (pages[0].length < 2) {
      pages[0].push(asset);
      alreadyAssigned.add(asset);
      continue;
    }

    if (pages[1].length < 2) {
      pages[1].push(asset);
      alreadyAssigned.add(asset);
    }

    if (pages[0].length >= 2 && pages[1].length >= 2) break;
  }

  const remainingAssets = sortedAssets.filter(
    (asset) => !alreadyAssigned.has(asset),
  );

  remainingAssets.forEach((asset) => {
    const targetPage = pages[0].length <= pages[1].length ? 0 : 1;
    pages[targetPage].push(asset);
  });

  return [
    sortSoldAssetsByAddress(pages[0]),
    sortSoldAssetsByAddress(pages[1]),
  ];
}

function getFeaturedSoldAssets(
  assets: Asset[],
  category: SoldCategoryId,
): Asset[] {
  const selected: Asset[] = [];
  const preferredRules = SOLD_FEATURED_PROJECT_RULES[category];

  for (const rule of preferredRules) {
    const preferredAsset = assets.find((asset) => {
      const text = normalizeText(
        `${asset.project} ${asset.address} ${asset.sourceProject ?? ""} ${
          asset.sourceAddress ?? ""
        }`,
      );
      return rule.test(text) && hasProjectPhoto(asset);
    });

    if (preferredAsset && !selected.includes(preferredAsset)) {
      selected.push(preferredAsset);
    }
  }

  const fallbackAssets = [...assets]
    .filter(
      (asset) =>
        !selected.includes(asset) && hasProjectPhoto(asset),
    )
    .sort((left, right) => {
      const areaDifference =
        Math.max(right.builtArea, right.plotSize) -
        Math.max(left.builtArea, left.plotSize);

      if (areaDifference !== 0) return areaDifference;
      return getSoldInformationScore(right) - getSoldInformationScore(left);
    });

  for (const asset of fallbackAssets) {
    if (selected.length >= 2) break;
    selected.push(asset);
  }

  for (const asset of assets) {
    if (selected.length >= 2) break;
    if (!selected.includes(asset)) selected.push(asset);
  }

  return selected.slice(0, 2);
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

function getSpanishAssetOrder(asset: Asset): number {
  const text = normalizeText(`${asset.project} ${asset.address}`);

  if (text.includes("carolina") || text.includes("margarita")) return 0;
  if (text.includes("los naranjos")) return 1;
  if (text.includes("lomas rio verde")) return 2;
  if (text.includes("calderon") || text.includes("de la barca")) return 3;

  return 99;
}

function sortSpanishAssets(assets: Asset[]): Asset[] {
  return [...assets].sort((left, right) => {
    const orderDifference =
      getSpanishAssetOrder(left) - getSpanishAssetOrder(right);

    if (orderDifference !== 0) return orderDifference;

    return left.project.localeCompare(right.project, "en", {
      numeric: true,
      sensitivity: "base",
    });
  });
}

function sortSpanishSoldAssets(assets: Asset[]): Asset[] {
  const getOrder = (asset: Asset) => {
    const text = normalizeText(`${asset.project} ${asset.address}`);
    if (text.includes("mona lisa")) return 0;
    if (text.includes("haven") || text.includes("benabola")) return 1;
    return 99;
  };

  return [...assets].sort((left, right) => {
    const orderDifference = getOrder(left) - getOrder(right);
    if (orderDifference !== 0) return orderDifference;

    return left.project.localeCompare(right.project, "en", {
      numeric: true,
      sensitivity: "base",
    });
  });
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
  const [portfolioAssetSettings, setPortfolioAssetSettings] =
    useState<PortfolioAssetSettings>({});
  const [portfolioAssetSettingsReady, setPortfolioAssetSettingsReady] =
    useState(false);
  const [portfolioPhotoUrls, setPortfolioPhotoUrls] = useState<
    Record<string, string>
  >({});
  const [portfolioHiddenAssetKeys, setPortfolioHiddenAssetKeys] = useState<
    string[]
  >([]);
  const [portfolioHiddenAssetKeysReady, setPortfolioHiddenAssetKeysReady] =
    useState(false);

  const selectedPortfolioSet = useMemo(
    () => new Set<PortfolioId>(selectedPortfolioIds),
    [selectedPortfolioIds],
  );

  const spanishOnlyMode = useMemo(
    () =>
      selectedPortfolioIds.length === 2 &&
      selectedPortfolioSet.has("llpi-leovari") &&
      selectedPortfolioSet.has("d-leeuw-private-real-estate-spain"),
    [selectedPortfolioIds, selectedPortfolioSet],
  );

  const portfolioAssets = useMemo(
    () => deduplicatePortfolioAssets(data.assets),
    [data.assets],
  );

  const portfolioHiddenAssetKeySet = useMemo(
    () => new Set(portfolioHiddenAssetKeys),
    [portfolioHiddenAssetKeys],
  );

  const visiblePortfolioAssets = useMemo(
    () =>
      portfolioAssets.filter(
        (asset) =>
          !portfolioHiddenAssetKeySet.has(getPortfolioManagerRowKey(asset)),
      ),
    [portfolioAssets, portfolioHiddenAssetKeySet],
  );

  const togglePortfolio = (portfolioId: PortfolioId) => {
    setSelectedPortfolioIds((current) =>
      current.includes(portfolioId)
        ? current.filter((id) => id !== portfolioId)
        : [...current, portfolioId],
    );
  };

  const updatePortfolioAssetSetting = (
    asset: Asset,
    patch: Partial<PortfolioAssetSetting>,
  ) => {
    const assetKey = getPortfolioAssetKey(asset);

    setPortfolioAssetSettings((current) => ({
      ...current,
      [assetKey]: {
        ...(current[assetKey] ?? {}),
        ...patch,
      },
    }));
  };

  const removePortfolioManagerAsset = (asset: Asset) => {
    const rowKey = getPortfolioManagerRowKey(asset);

    setPortfolioHiddenAssetKeys((current) =>
      current.includes(rowKey) ? current : [...current, rowKey],
    );
  };

  const restorePortfolioManagerAssets = () => {
    setPortfolioHiddenAssetKeys([]);
  };

  const updatePortfolioAssetPhoto = async (
    asset: Asset,
    file: File,
  ) => {
    if (!file.type.startsWith("image/")) return;

    const assetKey = getPortfolioAssetKey(asset);
    await savePortfolioPhoto(assetKey, file);

    const objectUrl = URL.createObjectURL(file);
    setPortfolioPhotoUrls((current) => {
      const previousUrl = current[assetKey];
      if (previousUrl?.startsWith("blob:")) URL.revokeObjectURL(previousUrl);

      return {
        ...current,
        [assetKey]: objectUrl,
      };
    });
  };

  const deletePortfolioAssetPhoto = async (asset: Asset) => {
    const assetKey = getPortfolioAssetKey(asset);
    const addressFirstAssetKey = getAddressFirstPortfolioAssetKey(asset);
    const previousAssetKey = getPreviousPortfolioAssetKey(asset);
    const legacyAssetKey = getLegacyPortfolioAssetKey(asset);

    const photoKeys = Array.from(
      new Set([
        assetKey,
        addressFirstAssetKey,
        previousAssetKey,
        legacyAssetKey,
      ]),
    );

    await Promise.all(
      photoKeys.map((photoKey) => removePortfolioPhoto(photoKey)),
    );

    setPortfolioPhotoUrls((current) => {
      const next = { ...current };
      const previousUrl = next[assetKey];
      if (previousUrl?.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
      delete next[assetKey];
      return next;
    });
  };

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(
        PORTFOLIO_MANAGER_STORAGE_KEY,
      );

      if (storedValue) {
        const parsedValue = JSON.parse(storedValue) as Record<
          string,
          PortfolioAssetSetting
        >;

        const validSettings = Object.fromEntries(
          Object.entries(parsedValue).map(([key, value]) => {
            const setting: PortfolioAssetSetting = {};

            if (typeof value?.reportName === "string") {
              setting.reportName = value.reportName;
            }
            if (isSoldCategoryId(value?.category)) {
              setting.category = value.category;
            }

            // Oude opgeslagen Current/Sold-overrides worden bewust genegeerd.
            // De status komt uitsluitend uit de live Overview-data.
            return [key, setting];
          }),
        ) as PortfolioAssetSettings;

        setPortfolioAssetSettings(validSettings);
      }
    } catch {
      setPortfolioAssetSettings({});
    } finally {
      setPortfolioAssetSettingsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!portfolioAssetSettingsReady) return;

    window.localStorage.setItem(
      PORTFOLIO_MANAGER_STORAGE_KEY,
      JSON.stringify(portfolioAssetSettings),
    );
  }, [portfolioAssetSettings, portfolioAssetSettingsReady]);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(
        PORTFOLIO_MANAGER_HIDDEN_STORAGE_KEY,
      );

      if (storedValue) {
        const parsedValue = JSON.parse(storedValue) as unknown;
        if (Array.isArray(parsedValue)) {
          setPortfolioHiddenAssetKeys(
            parsedValue.filter(
              (value): value is string => typeof value === "string",
            ),
          );
        }
      }
    } catch {
      setPortfolioHiddenAssetKeys([]);
    } finally {
      setPortfolioHiddenAssetKeysReady(true);
    }
  }, []);

  useEffect(() => {
    if (!portfolioHiddenAssetKeysReady) return;

    window.localStorage.setItem(
      PORTFOLIO_MANAGER_HIDDEN_STORAGE_KEY,
      JSON.stringify(portfolioHiddenAssetKeys),
    );
  }, [portfolioHiddenAssetKeys, portfolioHiddenAssetKeysReady]);

  useEffect(() => {
    if (portfolioAssets.length === 0) return;

    let active = true;
    const createdUrls: string[] = [];

    async function loadSavedPhotos() {
      const entries = await Promise.all(
        portfolioAssets.map(async (asset) => {
          const assetKey = getPortfolioAssetKey(asset);
          const addressFirstAssetKey = getAddressFirstPortfolioAssetKey(asset);
          const previousAssetKey = getPreviousPortfolioAssetKey(asset);
          const legacyAssetKey = getLegacyPortfolioAssetKey(asset);

          try {
            const blob =
              (await loadPortfolioPhoto(assetKey)) ??
              (await loadPortfolioPhoto(addressFirstAssetKey)) ??
              (await loadPortfolioPhoto(previousAssetKey)) ??
              (await loadPortfolioPhoto(legacyAssetKey));
            if (!blob) return null;

            const url = URL.createObjectURL(blob);
            createdUrls.push(url);
            return [assetKey, url] as const;
          } catch {
            return null;
          }
        }),
      );

      if (!active) return;

      setPortfolioPhotoUrls(
        Object.fromEntries(
          entries.filter(
            (entry): entry is readonly [string, string] => Boolean(entry),
          ),
        ),
      );
    }

    void loadSavedPhotos();

    return () => {
      active = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [portfolioAssets]);

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
    const managedAssets = visiblePortfolioAssets.map((asset) =>
      applyPortfolioAssetSetting(
        asset,
        portfolioAssetSettings,
        portfolioPhotoUrls,
      ),
    );

    const currentAssets = managedAssets.filter(
      (asset) =>
        asset.reportStatus === "current" &&
        matchesPortfolioSelection(asset.entity, selectedPortfolioSet),
    );

    // Sold assets blijven als volledig trackrecord zichtbaar, onafhankelijk
    // van de current-portfolio selectie bovenaan.
    const soldAssets = sortSoldAssetsByInformation(
      managedAssets.filter((asset) => asset.reportStatus === "sold"),
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
  }, [
    data,
    selectedPortfolioSet,
    portfolioAssetSettings,
    portfolioPhotoUrls,
  ]);

  const financialOverview = data.financialOverview;
  const showFinancialOverview = hasFinancialRows(financialOverview);
  const financialPageCount = showFinancialOverview ? 1 : 0;
  const jointPageOffset = metrics.sharedAssets.length > 0 ? 1 : 0;
  const whollyOwnedStartNumber = 2 + financialPageCount + jointPageOffset;

  const soldCategoryPages = SOLD_CATEGORY_DEFINITIONS.flatMap(
    (definition) => {
      const assets = sortSoldAssetsByAddress(
        metrics.soldAssets.filter(
          (asset) =>
            asset.country !== "Spanje" &&
            (asset.reportCategory ?? getDefaultPortfolioCategory(asset)) ===
              definition.id,
        ),
      );

      if (assets.length === 0) return [];

      if (definition.id !== "industrial") {
        return [
          {
            ...definition,
            assets,
            pageIndex: 0,
            pageCount: 1,
            pageKey: definition.id,
          },
        ];
      }

      const commercialPages = splitCommercialAssetsAcrossPages(assets);

      return commercialPages.map((pageAssets, pageIndex) => ({
        ...definition,
        assets: pageAssets,
        pageIndex,
        pageCount: 2,
        pageKey: `${definition.id}-${pageIndex + 1}`,
      }));
    },
  );

  const spanishSoldPages = chunk(
    metrics.soldAssets.filter((asset) => asset.country === "Spanje"),
    2,
  );

  const trackRecordStartNumber =
    whollyOwnedStartNumber + metrics.whollyOwnedAssets.length;

  const spanishCurrentAssets = sortSpanishAssets(
    metrics.currentAssets.filter((asset) => asset.country === "Spanje"),
  );

  const spanishSoldAssets = sortSpanishSoldAssets(
    metrics.soldAssets.filter((asset) => asset.country === "Spanje"),
  );

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
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa]">
        <div className="rounded-none bg-white px-10 py-8 shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#64748b]">Live portfolio</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#0f172a]">Gegevens laden…</h1>
        </div>
      </main>
    );
  }

  if (error && data.assets.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] p-6">
        <div className="max-w-xl rounded-none bg-white p-8 shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#64748b]">Dataprobleem</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#0f172a]">CSV kon niet worden verwerkt</h1>
          <p className="mt-4 text-sm leading-6 text-[#64748b]">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey(Date.now())}
            className="mt-6 rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white"
          >
            Opnieuw proberen
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] py-8 print:bg-white print:py-0">
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

      <div className="no-print sticky top-4 z-50 mx-auto mb-6 flex w-fit items-center gap-3 rounded-none bg-[#0f172a] px-4 py-3 text-white shadow-xl">
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
            <div className="absolute left-0 top-full mt-2 w-[390px] rounded-none border border-[#cbd5e1] bg-[#f5f7fa] p-4 text-[#0f172a] shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-[#cbd5e1] pb-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">
                    Selecteer portefeuilles
                  </p>
                  <p className="mt-1 text-[10px] text-[#64748b]">
                    Alleen de geselecteerde huidige panden worden opgenomen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPortfolioSelectorOpen(false)}
                  className="rounded-full border border-[#cbd5e1] px-2.5 py-1 text-[10px] font-semibold"
                >
                  Sluiten
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                {PORTFOLIO_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-start gap-3 rounded-none px-2 py-2 hover:bg-[#cbd5e1]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPortfolioSet.has(option.id)}
                      onChange={() => togglePortfolio(option.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#64748b]"
                    />
                    <span className="text-[11px] font-medium leading-4">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[#cbd5e1] pt-3">
                <p className="text-[9px] text-[#64748b]">
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
                    className="rounded-full bg-[#0f172a] px-3 py-1.5 text-[9px] font-semibold text-white"
                  >
                    Alles
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPortfolioIds([])}
                    className="rounded-full border border-[#cbd5e1] px-3 py-1.5 text-[9px] font-semibold"
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
          className="rounded-full bg-[#64748b] px-4 py-2 text-xs font-semibold hover:bg-[#94a3b8]"
        >
          Opslaan als PDF
        </button>
      </div>

      <PortfolioManager
        assets={portfolioAssets}
        hiddenAssetKeys={portfolioHiddenAssetKeys}
        settings={portfolioAssetSettings}
        photoUrls={portfolioPhotoUrls}
        onSettingChange={updatePortfolioAssetSetting}
        onPhotoChange={updatePortfolioAssetPhoto}
        onPhotoRemove={deletePortfolioAssetPhoto}
        onAssetRemove={removePortfolioManagerAsset}
        onRestoreRemoved={restorePortfolioManagerAssets}
      />

      {spanishOnlyMode ? (
        <SpanishPortfolioReport
          currentAssets={spanishCurrentAssets}
          soldAssets={spanishSoldAssets}
          totalMortgages={metrics.totalMortgages}
        />
      ) : (
        <>
      <PageFrame>
        <ReportHeader
          number="01"
          label="Portfolio overview"
          title="Capital Structure"
          subtitle="By expected end value"
        />

        <div className="mt-7 grid grid-cols-[1.05fr_1.4fr] gap-7">
          <section className="rounded-none border border-[#cbd5e1] bg-white/80 p-6">
            <SectionLabel>Geographic allocation</SectionLabel>
            <div className="mt-5 grid grid-cols-[180px_1fr] items-center gap-7">
              <DonutChart spain={metrics.spainShare} />
              <div className="space-y-5">
                <AllocationRow
                  color="#0f172a"
                  label="Spain"
                  value={metrics.spainValue}
                  percentage={metrics.spainShare}
                />
                <AllocationRow
                  color="#94a3b8"
                  label="The Netherlands"
                  value={metrics.netherlandsValue}
                  percentage={metrics.netherlandsShare}
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Invested value to date"
              value={formatCurrency(metrics.investedValueToDate)}
              description="Current capital deployed · ownership adjusted"
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

        <section className="mt-7 rounded-none border border-[#cbd5e1] bg-white/80 p-6">
          <div className="grid grid-cols-[0.82fr_1.58fr] items-center gap-8">
            <div>
              <SectionLabel>Portfolio LTV</SectionLabel>
              <div className="mt-3 flex items-end justify-between gap-6">
                <div>
                  <p className="text-[11px] text-[#64748b]">Mortgages</p>
                  <p className="mt-1 text-2xl font-semibold text-[#0f172a]">
                    {formatCurrency(metrics.totalMortgages)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#64748b]">
                    Expected end value
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(metrics.portfolioEndValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[110px_1fr] items-center gap-5">
              <div className="text-center">
                <p className="text-[9px] text-[#64748b]">LTV</p>
                <p className="mt-1 text-2xl font-semibold text-[#94a3b8]">
                  {formatPercent(metrics.ltv)}
                </p>
              </div>

              <CapitalStack
                mortgage={metrics.ltv}
                mortgageLabel="Mortgages"
                equityLabel="Expected end value"
              />
            </div>
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
                className="overflow-hidden rounded-none border border-[#cfd6e0] bg-white"
              >
                <div className="grid grid-cols-[1.55fr_.8fr_.8fr_.45fr] bg-[#1e293b] px-3.5 py-3 text-[9px] font-semibold uppercase tracking-[0.13em] text-white">
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
                      className={`grid min-h-[38px] grid-cols-[1.55fr_.8fr_.8fr_.45fr] items-center px-3.5 py-2.5 text-[11px] leading-tight ${
                        index !== assetGroup.length - 1
                          ? "border-b border-[#e2e8f0]"
                          : ""
                      }`}
                    >
                      <p className="truncate pr-2 font-semibold text-[#0f172a]">
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

          <section className="mt-4 rounded-none border border-[#cbd5e1] bg-white/80 px-5 py-4">
            <div className="grid grid-cols-[1.08fr_0.92fr] items-center gap-5">
              <div>
                <SectionLabel>Capital structure</SectionLabel>
                <div className="mt-2 grid grid-cols-3 items-end gap-5">
                  <div>
                    <p className="text-[9px] text-[#64748b]">Total mortgage</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-semibold text-[#0f172a]">
                      {formatCurrency(metrics.sharedTotalMortgage)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-[#64748b]">Total value</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-semibold text-[#0f172a]">
                      {formatCurrency(metrics.sharedTotalValue)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] text-[#64748b]">Joint portfolio LTV</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-semibold text-[#94a3b8]">
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
              customSrc={asset.customPhotoUrl}
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

              <section className="rounded-none border border-[#cfd6e0] bg-white p-4">
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

      {soldCategoryPages.map((category, pageIndex) => (
        <SoldCategoryOverviewPage
          key={category.pageKey}
          number={String(trackRecordStartNumber + pageIndex).padStart(2, "0")}
          category={category}
          updated={lastUpdated}
        />
      ))}

      {spanishSoldPages.map((pair, pageIndex) => (
        <PageFrame key={`sold-spain-${pageIndex}`}>
          <ReportHeader
            number={String(
              trackRecordStartNumber +
                soldCategoryPages.length +
                pageIndex,
            ).padStart(2, "0")}
            label="Sold track record"
            title="Realized Projects"
            subtitle="Spanish realized assets"
          />
          <div className="mt-7 grid grid-cols-2 gap-6">
            {pair.map((asset) => (
              <SoldProjectCard
                key={`${asset.entity}-${asset.project}`}
                asset={asset}
              />
            ))}
          </div>
          <ReportFooter updated={lastUpdated} />
        </PageFrame>
      ))}
        </>
      )}
    </main>
  );
}

function SpanishPortfolioReport({
  currentAssets,
  soldAssets,
  totalMortgages,
}: {
  currentAssets: Asset[];
  soldAssets: Asset[];
  totalMortgages: number;
}) {
  const portfolioValue = currentAssets.reduce(
    (sum, asset) => sum + getEndValue(asset),
    0,
  );
  const expectedProfit = currentAssets.reduce(
    (sum, asset) => sum + getProfit(asset),
    0,
  );
  const trackRecordRevenue = soldAssets.reduce(
    (sum, asset) => sum + asset.salesValue,
    0,
  );
  const realizedGrossProfit = soldAssets.reduce(
    (sum, asset) => sum + getProfit(asset),
    0,
  );
  const netEquity = portfolioValue - totalMortgages;
  const ltv = portfolioValue > 0
    ? totalMortgages / portfolioValue
    : 0;

  return (
    <>
      <SpanishOverviewPage
        currentAssets={currentAssets}
        soldAssets={soldAssets}
        portfolioValue={portfolioValue}
        expectedProfit={expectedProfit}
        trackRecordRevenue={trackRecordRevenue}
        realizedGrossProfit={realizedGrossProfit}
        totalMortgages={totalMortgages}
        netEquity={netEquity}
        ltv={ltv}
      />

      {currentAssets.map((asset, index) => (
        <SpanishCurrentProjectPage
          key={`spanish-current-${asset.entity}-${asset.project}`}
          asset={asset}
          index={index}
          total={currentAssets.length}
        />
      ))}

      {chunk(soldAssets, 2).map((assets, pageIndex) => (
        <SpanishSoldPage
          key={`spanish-sold-${pageIndex}`}
          assets={assets}
          pageIndex={pageIndex}
        />
      ))}
    </>
  );
}

function SpanishPage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section className="report-page relative mx-auto mb-8 min-h-[210mm] w-[297mm] overflow-hidden bg-[#f7f4ec] px-[9mm] py-[8mm] shadow-2xl print:mb-0">
      {children}
    </section>
  );
}

function SpanishLogo() {
  return (
    <img
      src="/leovari-logo.png"
      alt="Leovari Developments"
      className="h-[11mm] w-auto object-contain"
    />
  );
}

function SpanishFooter() {
  return (
    <footer className="absolute bottom-[6mm] left-[9mm] right-[9mm] flex justify-between border-t border-[#d8c8ae] pt-3 text-[8px] text-[#68736d]">
      <span>Confidential · Not for distribution</span>
      <span>All values in EUR</span>
    </footer>
  );
}

function SpanishHeading({
  number,
  label,
  title,
}: {
  number: string;
  label: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.38em] text-[#263b32]">
        {number} · {label}
      </p>
      <h2 className="mt-2 text-[24px] font-semibold leading-none text-[#151917]">
        {title}
      </h2>
    </div>
  );
}

function SpanishOverviewPage({
  currentAssets,
  soldAssets,
  portfolioValue,
  expectedProfit,
  trackRecordRevenue,
  realizedGrossProfit,
  totalMortgages,
  netEquity,
  ltv,
}: {
  currentAssets: Asset[];
  soldAssets: Asset[];
  portfolioValue: number;
  expectedProfit: number;
  trackRecordRevenue: number;
  realizedGrossProfit: number;
  totalMortgages: number;
  netEquity: number;
  ltv: number;
}) {
  return (
    <SpanishPage>
      <header className="flex items-start justify-between border-b border-[#d8c8ae] pb-5">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.44em] text-[#263b32]">
            Confidential Portfolio Report
          </p>
          <h1 className="mt-3 text-[34px] font-semibold leading-none text-[#263b32]">
            Spanish Real Estate Portfolio
          </h1>
          <p className="mt-4 text-[11px] text-[#202722]">
            Leovari <span className="mx-2">·</span> Live Google Sheets data
          </p>
        </div>
        <SpanishLogo />
      </header>

      <div className="mt-5 grid grid-cols-[1.12fr_.88fr] gap-5">
        <div>
          <SpanishHeading
            number="01"
            label="Overview"
            title="Portfolio Metrics"
          />

          <div className="mt-2 grid grid-cols-12 gap-2">
            <SpanishMetric
              label="Portfolio value"
              value={formatCurrency(portfolioValue)}
              className="col-span-3"
            />
            <SpanishMetric
              label="Expected profit"
              value={formatCurrency(expectedProfit)}
              className="col-span-3"
            />
            <SpanishMetric
              label="Sold projects"
              value={String(soldAssets.length)}
              className="col-span-3"
            />
            <SpanishMetric
              label="Current projects"
              value={String(currentAssets.length)}
              className="col-span-3"
            />

            <SpanishMetric
              label="Track record revenue"
              value={formatCurrency(trackRecordRevenue)}
              className="col-span-4"
            />
            <SpanishMetric
              label="Realized gross profit"
              value={formatCurrency(realizedGrossProfit)}
              className="col-span-4"
            />
            <SpanishMetric
              label="Total mortgages"
              value={formatCurrency(totalMortgages)}
              className="col-span-4"
            />
          </div>

          <div className="mt-3">
            <SpanishHeading
              number="03"
              label="Capital Stack"
              title="Mortgage vs Equity"
            />

            <section className="mt-2 rounded-[15px] border border-[#d8c8ae] bg-white px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-[#9a784a]">
                    Net equity in portfolio
                  </p>
                  <p className="mt-2 text-[25px] font-semibold text-[#263b32]">
                    {formatCurrency(netEquity)}
                  </p>
                  <p className="mt-1 text-[9px] text-[#6e7974]">
                    Expected End Value - Mortgages
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-[#7f879d]">
                    Portfolio LTV
                  </p>
                  <p className="mt-2 text-[25px] font-semibold text-[#9a784a]">
                    {formatPercent(ltv)}
                  </p>
                  <p className="mt-1 text-[9px] text-[#6e7974]">
                    Mortgage / End Value
                  </p>
                </div>
              </div>

              <SpanishLtvBar ltv={ltv} />
            </section>
          </div>
        </div>

        <div>
          <SpanishHeading
            number="02"
            label="Portfolio Allocation"
            title="Allocation by Expected Exit Value"
          />

          <SpanishAllocation
            assets={currentAssets}
            portfolioValue={portfolioValue}
          />
        </div>
      </div>

      <SpanishFooter />
    </SpanishPage>
  );
}

function SpanishMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`${className} min-h-[26mm] rounded-[12px] border border-[#d8c8ae] bg-white px-3.5 py-3`}
    >
      <p className="min-h-[26px] max-w-full text-[9px] font-semibold uppercase leading-[1.35] tracking-[0.16em] text-[#7f879d]">
        {label}
      </p>
      <p className="mt-1.5 whitespace-nowrap text-[17px] font-semibold text-[#151917]">
        {value}
      </p>
    </div>
  );
}

function SpanishAllocation({
  assets,
  portfolioValue,
}: {
  assets: Asset[];
  portfolioValue: number;
}) {
  const colors = [
    "#263d34",
    "#84aaa5",
    "#9b7b49",
    "#b8c8bd",
    "#627d72",
    "#c7a36d",
    "#566b82",
    "#a98885",
  ];

  const chartWidth = 600;
  const chartHeight = 350;
  const centerX = chartWidth / 2;
  const centerY = chartHeight / 2;
  const radius = 82;
  const strokeWidth = 48;
  const circumference = 2 * Math.PI * radius;

  let cumulativeShare = 0;
  const allocations = assets.map((asset, index) => {
    const value = getEndValue(asset);
    const share = portfolioValue > 0
      ? value / portfolioValue
      : 0;
    const startShare = cumulativeShare;
    cumulativeShare += share;

    const midpointShare = startShare + share / 2;
    const angle = midpointShare * Math.PI * 2 - Math.PI / 2;

    return {
      asset,
      share,
      startShare,
      angle,
      color: colors[index % colors.length],
    };
  });

  type AllocationLabel = (typeof allocations)[number] & {
    side: "left" | "right";
    anchorX: number;
    anchorY: number;
    elbowX: number;
    labelY: number;
  };

  const createLabelsForSide = (
    side: "left" | "right",
  ): AllocationLabel[] => {
    const anchorRadius = radius + strokeWidth / 2;
    const elbowRadius = anchorRadius + 18;

    const sideItems = allocations
      .filter(({ angle }) =>
        side === "right"
          ? Math.cos(angle) >= 0
          : Math.cos(angle) < 0,
      )
      .map((allocation) => ({
        ...allocation,
        side,
        anchorX:
          centerX + Math.cos(allocation.angle) * anchorRadius,
        anchorY:
          centerY + Math.sin(allocation.angle) * anchorRadius,
        elbowX:
          centerX +
          Math.cos(allocation.angle) * elbowRadius,
        labelY:
          centerY + Math.sin(allocation.angle) * 122,
      }))
      .sort((left, right) => left.labelY - right.labelY);

    if (sideItems.length === 0) return [];

    const minY = 34;
    const maxY = chartHeight - 34;
    const availableHeight = maxY - minY;
    const minimumGap =
      sideItems.length > 1
        ? Math.min(52, availableHeight / (sideItems.length - 1))
        : 0;

    sideItems.forEach((item, index) => {
      item.labelY = Math.max(
        item.labelY,
        minY + index * minimumGap,
      );
    });

    for (let index = sideItems.length - 1; index >= 0; index -= 1) {
      const maximumY =
        maxY - (sideItems.length - 1 - index) * minimumGap;

      sideItems[index].labelY = Math.min(
        sideItems[index].labelY,
        maximumY,
      );
    }

    return sideItems;
  };

  const labels = [
    ...createLabelsForSide("left"),
    ...createLabelsForSide("right"),
  ];

  const shortenProjectName = (value: string): string =>
    value.length > 25
      ? `${value.slice(0, 24).trimEnd()}…`
      : value;

  return (
    <section className="mt-2 h-[124mm] rounded-[15px] border border-[#d8c8ae] bg-white px-2 py-2">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Allocation by expected exit value"
        className="h-full w-full overflow-visible"
      >
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#ebe6de"
          strokeWidth={strokeWidth}
        />

        {allocations.map(
          ({
            asset,
            share,
            startShare,
            color,
          }) => (
            <circle
              key={`spanish-allocation-segment-${asset.entity}-${asset.project}`}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${share * circumference} ${circumference}`}
              strokeDashoffset={-startShare * circumference}
              transform={`rotate(-90 ${centerX} ${centerY})`}
            />
          ),
        )}

        <circle
          cx={centerX}
          cy={centerY}
          r={radius - strokeWidth / 2}
          fill="#ffffff"
        />

        {labels.map((label) => {
          const horizontalEndX =
            label.side === "right"
              ? chartWidth - 22
              : 22;
          const textX =
            label.side === "right"
              ? horizontalEndX - 2
              : horizontalEndX + 2;
          const textAnchor =
            label.side === "right" ? "end" : "start";

          return (
            <g
              key={`spanish-allocation-label-${label.asset.entity}-${label.asset.project}`}
            >
              <line
                x1={label.anchorX}
                y1={label.anchorY}
                x2={label.elbowX}
                y2={label.labelY}
                stroke={label.color}
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              <line
                x1={label.elbowX}
                y1={label.labelY}
                x2={horizontalEndX}
                y2={label.labelY}
                stroke={label.color}
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              <circle
                cx={label.anchorX}
                cy={label.anchorY}
                r="3.4"
                fill={label.color}
              />

              <text
                x={textX}
                y={label.labelY - 5}
                textAnchor={textAnchor}
                fill="#151917"
                fontSize="16"
                fontWeight="700"
              >
                {shortenProjectName(label.asset.project)}
              </text>

              <text
                x={textX}
                y={label.labelY + 15}
                textAnchor={textAnchor}
                fill={label.color}
                fontSize="15"
                fontWeight="700"
              >
                {formatPercent(label.share)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function SpanishLtvBar({ ltv }: { ltv: number }) {
  const mortgageShare = Math.max(0, Math.min(1, ltv));
  const equityShare = 1 - mortgageShare;

  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-[9px] font-semibold">
        <span className="text-[#9a784a]">
          Mortgage {formatPercent(mortgageShare)}
        </span>
        <span className="text-[#263b32]">
          Equity {formatPercent(equityShare)}
        </span>
      </div>

      <div className="flex h-12 overflow-hidden rounded-full bg-[#84aaa5]">
        <div
          className="bg-[#263d34]"
          style={{
            width: `${mortgageShare * 100}%`,
            minWidth: mortgageShare > 0 ? "14px" : "0",
          }}
        />
        <div className="flex flex-1 items-center justify-center text-[9px] font-semibold text-white">
          Equity
        </div>
      </div>
    </div>
  );
}

function SpanishCurrentProjectPage({
  asset,
  index,
  total,
}: {
  asset: Asset;
  index: number;
  total: number;
}) {
  return (
    <SpanishPage>
      <header className="flex items-start justify-between border-b border-[#d8c8ae] pb-5">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.38em] text-[#263b32]">
            04 · Current Portfolio
          </p>
          <h1 className="mt-3 text-[27px] font-semibold leading-none text-[#151917]">
            {asset.project}
          </h1>
          <p className="mt-3 max-w-[720px] text-[10px] text-[#65706b]">
            {asset.address || asset.entity}
          </p>
        </div>

        <div className="flex flex-col items-end gap-5">
          <SpanishLogo />
          <p className="text-[9px] text-[#737d78]">
            Project {index + 1} of {total}
          </p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-[1.15fr_1fr] gap-5">
        <SpanishProjectImage
          project={asset.project}
          address={asset.address}
          sourceProject={asset.sourceProject}
          sourceAddress={asset.sourceAddress}
          customSrc={asset.customPhotoUrl}
          className="h-[114mm] rounded-[20px]"
        />

        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-3">
            <SpanishMetricCard
              label="Expected end value"
              value={formatCurrency(getEndValue(asset))}
              description={`At ${asset.salesDate || "—"}`}
              dark
              compact
              dense
            />
            <SpanishMetricCard
              label="Expected profit"
              value={formatCurrency(getProfit(asset))}
              description="Before tax"
              accent
              compact
              dense
            />
            <SpanishMetricCard
              label="Return"
              value={formatPercent(getReturn(asset))}
              description={getReturnType(asset)}
              compact
              dense
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SpanishMetricCard
              label="Invested value to date"
              value={formatCurrency(asset.investedValue)}
              description="Invested to date"
              compact
              dense
            />
            <SpanishMetricCard
              label="Still to invest"
              value={formatCurrency(asset.stillToInvest)}
              description="Remaining investment"
              compact
              dense
            />
          </div>

          <SpanishValueCreation asset={asset} />

          <section className="rounded-[20px] border border-[#d8d0c1] bg-white/85 p-4">
            <SpanishSectionLabel>Project metrics</SpanishSectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-x-7 gap-y-2 text-sm">
              {asset.mortgage > 0 && (
                <>
                  <SpanishDetail
                    label="Mortgage"
                    value={formatCurrency(asset.mortgage)}
                  />
                  <SpanishDetail
                    label="Loan to value"
                    value={
                      getEndValue(asset) > 0
                        ? formatPercent(
                            asset.mortgage / getEndValue(asset),
                          )
                        : "—"
                    }
                  />
                </>
              )}

              <SpanishDetail
                label="Built area"
                value={
                  asset.builtArea > 0
                    ? `${formatNumber(asset.builtArea)} m²`
                    : "—"
                }
              />
              <SpanishDetail
                label="Plot size"
                value={
                  asset.plotSize > 0
                    ? `${formatNumber(asset.plotSize)} m²`
                    : "—"
                }
              />
              <SpanishDetail
                label="Purchase date"
                value={asset.purchaseDate || "—"}
              />
              <SpanishDetail
                label="Expected exit"
                value={asset.salesDate || "—"}
              />

              {asset.rentYield > 0 && (
                <>
                  <SpanishDetail
                    label="Annual rent"
                    value={formatCurrency(asset.annualRent)}
                  />
                  <SpanishDetail
                    label="Rent yield"
                    value={formatPercent(asset.rentYield)}
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      <SpanishFooter />
    </SpanishPage>
  );
}

function SpanishDataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[9px] text-[#3f4743]">
        {label}
      </span>
      <span className="text-right text-[10px] font-semibold text-[#151917]">
        {value}
      </span>
    </div>
  );
}

function SpanishSoldPage({
  assets,
  pageIndex,
}: {
  assets: Asset[];
  pageIndex: number;
}) {
  return (
    <SpanishPage>
      <header className="flex items-start justify-between border-b border-[#d8c8ae] pb-5">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.38em] text-[#263b32]">
            {String(5 + pageIndex).padStart(2, "0")} · Sold Track Record
          </p>
          <h1 className="mt-3 text-[27px] font-semibold leading-none text-[#151917]">
            Realized Projects
          </h1>
        </div>
        <SpanishLogo />
      </header>

      <div className="mt-5 grid grid-cols-2 gap-5">
        {assets.map((asset) => (
          <SpanishSoldCard
            key={`spanish-realized-${asset.entity}-${asset.project}`}
            asset={asset}
          />
        ))}
      </div>

      <SpanishFooter />
    </SpanishPage>
  );
}

function SpanishSoldCard({ asset }: { asset: Asset }) {
  const renovation = Math.max(
    0,
    asset.investedValue - asset.purchasePrice,
  );

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#d8c8ae] bg-white">
      <SpanishProjectImage
        project={asset.project}
        address={asset.address}
        sourceProject={asset.sourceProject}
        sourceAddress={asset.sourceAddress}
        customSrc={asset.customPhotoUrl}
        className="h-[54mm] rounded-none"
      />

      <div className="p-4">
        <SpanishSectionLabel>Realized project</SpanishSectionLabel>
        <h2 className="mt-2 text-[21px] font-semibold text-[#151917]">
          {asset.project}
        </h2>
        <p className="mt-2 min-h-[25px] text-[9px] leading-4 text-[#68736d]">
          {asset.address || asset.entity}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <SpanishSmallMetric
            label="Sale price"
            value={formatCurrency(asset.salesValue)}
            dark
          />
          <SpanishSmallMetric
            label="Profit"
            value={formatCurrency(getProfit(asset))}
            accent
          />
          <SpanishSmallMetric
            label={getReturnType(asset)}
            value={formatPercent(getReturn(asset))}
          />
        </div>

        <section className="mt-4 rounded-[14px] border border-[#ded5c7] p-4">
          <SpanishSectionLabel>Deal summary</SpanishSectionLabel>

          <div className="mt-3 grid grid-cols-2 gap-x-5">
            <div className="space-y-2">
              <SpanishDataRow
                label="Purchase"
                value={formatCurrency(asset.purchasePrice)}
              />
              <SpanishDataRow
                label="Renovation"
                value={formatCurrency(renovation)}
              />
              <SpanishDataRow
                label="Total Investment"
                value={formatCurrency(asset.investedValue)}
              />
              <SpanishDataRow
                label="Realized Profit"
                value={formatCurrency(getProfit(asset))}
              />
            </div>

            <div className="space-y-2">
              <SpanishDataRow
                label="Plot Size"
                value={
                  asset.plotSize > 0
                    ? `${formatNumber(asset.plotSize)} m²`
                    : "—"
                }
              />
              <SpanishDataRow
                label="Built Area"
                value={
                  asset.builtArea > 0
                    ? `${formatNumber(asset.builtArea)} m²`
                    : "—"
                }
              />
              <SpanishDataRow
                label="Purchase Date"
                value={asset.purchaseDate || "—"}
              />
              <SpanishDataRow
                label="Sale Date"
                value={asset.salesDate || "—"}
              />
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

function SpanishSectionLabel({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
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

function SpanishMetricCard({
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

function SpanishProjectImage({
  project,
  address = "",
  sourceProject = "",
  sourceAddress = "",
  customSrc = "",
  className = "",
}: {
  project: string;
  address?: string;
  sourceProject?: string;
  sourceAddress?: string;
  customSrc?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source =
    customSrc ||
    getImageSource(
      project,
      address,
      sourceProject,
      sourceAddress,
    );

  useEffect(() => {
    setFailed(false);
  }, [source]);

  if (!source || failed) {
    return (
      <div
        className={`relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#243d33] via-[#597066] to-[#b2854b] ${className}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_42%)]" />
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">
            Real Estate Asset
          </p>
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

function SpanishValueCreation({ asset }: { asset: Asset }) {
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
      <SpanishSectionLabel>Value creation</SpanishSectionLabel>

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
        <SpanishValueLegend color="#243d33" label="Purchase" value={purchase} />
        <SpanishValueLegend color="#96784d" label="Renovation" value={renovation} />
        <SpanishValueLegend color="#86aaa5" label="Profit" value={profit} />
      </div>
    </section>
  );
}

function SpanishValueLegend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[7px] uppercase tracking-[0.14em] text-[#777f7b]">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold">
        {formatCurrencyWithCents(value)}
      </p>
    </div>
  );
}

function SpanishDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#e2ddd3] pb-1.5">
      <span className="text-[10px] text-[#727b76]">{label}</span>
      <span className="text-right text-[11px] font-semibold text-[#243d33]">
        {value}
      </span>
    </div>
  );
}

function SpanishSmallMetric({
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
      <p className="text-[7px] uppercase tracking-[0.18em] opacity-65">
        {label}
      </p>
      <p className="mt-2 whitespace-nowrap text-[15px] font-semibold">
        {value}
      </p>
    </div>
  );
}


function PageFrame({ children }: { children: ReactNode }) {
  return (
    <section className="report-page relative mx-auto mb-8 min-h-[210mm] w-[297mm] overflow-hidden bg-[#f5f7fa] px-[11mm] py-[9mm] shadow-2xl print:mb-0">
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
    <header className="flex items-start justify-between border-b border-[#c7ced8] pb-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-[#64748b]">
          {number} · {label}
        </p>
        <h1 className="mt-3 text-[29px] font-semibold leading-none text-[#111827]">{title}</h1>
        <p className="mt-3 text-[12px] text-[#667085]">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-[#64748b]">Confidential</p>
        <p className="mt-2 text-[18px] font-semibold text-[#111827]">Portfolio Report</p>
      </div>
    </header>
  );
}

function ReportFooter({ updated }: { updated: Date | null }) {
  return (
    <footer className="absolute bottom-[6mm] left-[11mm] right-[11mm] flex justify-between border-t border-[#c7ced8] pt-3 text-[9px] text-[#667085]">
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
        light ? "text-white/80" : "text-[#7a8699]"
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
  const background = "border border-[#cbd5e1] bg-white text-[#111827]";

  return (
    <div
      className={`${
        dense
          ? "rounded-none px-3.5 py-3"
          : compact
            ? "rounded-none p-4"
            : "rounded-none p-5"
      } ${background}`}
    >
      <p
        className={`${dense ? "text-[7px]" : "text-[8px]"} uppercase tracking-[0.2em] text-[#64748b]`}
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
        } text-[#64748b]`}
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
    <section className="overflow-hidden rounded-none border border-[#cbd5e1] bg-white">
      <div
        className={`flex items-end justify-between border-b border-[#1e293b] bg-[#1e293b] text-white ${
          compact ? "px-4 py-2.5" : "px-4 py-3"
        }`}
      >
        <div>
          <p
            className={`font-semibold uppercase tracking-[0.22em] text-white ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
          >
            {title}
          </p>
          <p
            className={`${
              compact ? "mt-1 text-[9px]" : "mt-1 text-[10px]"
            } leading-snug text-white/70`}
          >
            {description}
          </p>
        </div>
        <p
          className={`font-semibold uppercase tracking-[0.2em] text-white/75 ${
            compact ? "text-[8px]" : "text-[9px]"
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
                  ? "min-h-[31px] grid-cols-[1fr_48px_122px] gap-2 px-4 py-1.5 text-[10px]"
                  : "min-h-[37px] grid-cols-[1fr_58px_136px] gap-3 px-4 py-2 text-[11px]"
              } ${index !== rows.length - 1 ? "border-b border-[#e2e8f0]" : ""}`}
            >
              <p className="leading-snug text-[#334155]">{row.label}</p>
              <div className="text-center">
                {row.tag ? (
                  <span
                    className={`inline-flex rounded-full bg-[#e2e8f0] font-semibold uppercase tracking-[0.12em] text-[#475569] ${
                      compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[9px]"
                    }`}
                  >
                    {row.tag}
                  </span>
                ) : null}
              </div>
              <p
                className={`whitespace-nowrap text-right font-semibold ${
                  row.value < 0 ? "text-[#b42318]" : "text-[#0f172a]"
                }`}
              >
                {formatFinancialCurrency(row.value)}
              </p>
            </div>
          ))
        ) : (
          <p
            className={`${
              compact ? "px-4 py-3 text-[10px]" : "px-4 py-5 text-[11px]"
            } text-[#64748b]`}
          >
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
        background: `conic-gradient(#0f172a 0deg ${degrees}deg, #94a3b8 ${degrees}deg 360deg)`,
      }}
    >
      <div className="absolute inset-[45px] rounded-full bg-[#f5f7fa]" />
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
        <p className="text-sm font-semibold text-[#0f172a]">{label}</p>
        <p className="mt-1 text-[10px] text-[#64748b]">{formatCurrency(value)}</p>
      </div>
      <p className="text-sm font-semibold text-[#0f172a]">{formatPercent(percentage)}</p>
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
        <span className="text-[#64748b]">
          {mortgageLabel} {formatPercent(share)}
        </span>
        <span className="text-[#0f172a]">
          {equityLabel} {formatPercent(1 - share)}
        </span>
      </div>
      <div className="flex h-12 overflow-hidden rounded-full bg-[#0f172a]">
        <div
          className="flex items-center justify-center bg-[#94a3b8] px-3 text-center text-[9px] font-semibold text-white"
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
  sourceProject = "",
  sourceAddress = "",
  customSrc = "",
  className = "",
}: {
  project: string;
  address?: string;
  sourceProject?: string;
  sourceAddress?: string;
  customSrc?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source =
    customSrc ||
    getImageSource(
      project,
      address,
      sourceProject,
      sourceAddress,
    );

  useEffect(() => {
    setFailed(false);
  }, [source]);

  if (!source || failed) {
    return (
      <div className={`relative overflow-hidden rounded-none bg-[#0f172a] ${className}`}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#667085]">Real Estate Asset</p>
          <p className="mt-3 text-3xl font-semibold text-white">{project}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-none bg-[#e5e7eb] ${className}`}>
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
    <section className="rounded-none border border-[#cfd6e0] bg-white p-4">
      <SectionLabel>Value creation</SectionLabel>

      <div className="mt-3 flex h-9 overflow-hidden rounded-none bg-[#eef2f6]">
        <div
          className="bg-[#0f172a]"
          style={{ width: `${purchaseShare}%` }}
          title={`Purchase: ${formatCurrency(purchase)}`}
        />
        <div
          className="bg-[#94a3b8]"
          style={{ width: `${renovationShare}%` }}
          title={`Renovation: ${formatCurrency(renovation)}`}
        />
        <div
          className="bg-[#475569]"
          style={{ width: `${profitShare}%` }}
          title={`Profit: ${formatCurrency(profit)}`}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <ValueLegend color="#0f172a" label="Purchase" value={purchase} />
        <ValueLegend color="#94a3b8" label="Renovation" value={renovation} />
        <ValueLegend color="#475569" label="Profit" value={profit} />
      </div>
    </section>
  );
}

function ValueLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[7px] uppercase tracking-[0.14em] text-[#667085]">{label}</p>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold">{formatCurrencyWithCents(value)}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#e4e7ec] pb-1.5">
      <span className="text-[10px] text-[#667085]">{label}</span>
      <span className="text-right text-[11px] font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function PortfolioManager({
  assets,
  hiddenAssetKeys,
  settings,
  photoUrls,
  onSettingChange,
  onPhotoChange,
  onPhotoRemove,
  onAssetRemove,
  onRestoreRemoved,
}: {
  assets: Asset[];
  hiddenAssetKeys: string[];
  settings: PortfolioAssetSettings;
  photoUrls: Record<string, string>;
  onSettingChange: (
    asset: Asset,
    patch: Partial<PortfolioAssetSetting>,
  ) => void;
  onPhotoChange: (asset: Asset, file: File) => Promise<void>;
  onPhotoRemove: (asset: Asset) => Promise<void>;
  onAssetRemove: (asset: Asset) => void;
  onRestoreRemoved: () => void;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(
        PORTFOLIO_MANAGER_COLLAPSED_STORAGE_KEY,
      );

      // Standaard dicht. Alleen openen wanneer de gebruiker hem de vorige
      // keer expliciet open heeft gelaten.
      setIsOpen(storedValue === "open");
    } catch {
      setIsOpen(false);
    }
  }, []);

  const toggleManager = () => {
    setIsOpen((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(
          PORTFOLIO_MANAGER_COLLAPSED_STORAGE_KEY,
          next ? "open" : "closed",
        );
      } catch {
        // Een geblokkeerde browseropslag mag de manager niet blokkeren.
      }

      return next;
    });
  };

  const normalizedSearch = normalizeText(searchValue);
  const hiddenAssetKeySet = useMemo(
    () => new Set(hiddenAssetKeys),
    [hiddenAssetKeys],
  );

  const activeAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          !hiddenAssetKeySet.has(getPortfolioManagerRowKey(asset)),
      ),
    [assets, hiddenAssetKeySet],
  );

  const sortedAssets = useMemo(
    () =>
      [...activeAssets].sort((left, right) =>
        left.project.localeCompare(right.project, "nl", {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    [activeAssets],
  );

  const visibleAssets = normalizedSearch
    ? sortedAssets.filter((asset) => {
        const setting = getPortfolioAssetSetting(asset, settings);
        return normalizeText(
          `${asset.project} ${setting.reportName} ${asset.address} ${asset.entity} ${asset.country}`,
        ).includes(normalizedSearch);
      })
    : sortedAssets;

  const currentCount = activeAssets.filter(
    (asset) => getDefaultPortfolioStatus(asset) === "current",
  ).length;
  const soldCount = activeAssets.filter(
    (asset) => getDefaultPortfolioStatus(asset) === "sold",
  ).length;

  return (
    <section className="no-print mx-auto mb-8 w-[min(1220px,calc(100%-32px))] border border-[#cbd5e1] bg-[#f5f7fa] shadow-xl">
      <div className="bg-[#0f172a] px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={toggleManager}
            aria-expanded={isOpen}
            className="flex min-w-0 flex-1 items-center gap-4 text-left"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/20 text-[17px] font-medium leading-none text-white">
              {isOpen ? "−" : "+"}
            </span>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase tracking-[0.26em] text-[#94a3b8]">
                Live invoersheet
              </p>
              <h2 className="mt-1 text-[19px] font-semibold leading-none">
                Portfolio Manager
              </h2>
              {isOpen && (
                <p className="mt-2 max-w-3xl text-[10px] leading-4 text-white/65">
                  De eerste kolom is de originele naam uit Overview. Alleen de
                  rapportnaam, categorie en foto zijn bewerkbaar en worden
                  automatisch in deze browser opgeslagen. Current/Sold wordt
                  uitsluitend uit de live Overview-data gelezen.
                </p>
              )}
            </div>
          </button>

          <div className="grid shrink-0 grid-cols-3 border border-white/15 text-center">
            <div className="min-w-[82px] px-3 py-2">
              <p className="text-[7px] uppercase tracking-[0.18em] text-white/50">
                Total
              </p>
              <p className="mt-1 text-[15px] font-semibold">{activeAssets.length}</p>
            </div>
            <div className="min-w-[82px] border-l border-white/15 px-3 py-2">
              <p className="text-[7px] uppercase tracking-[0.18em] text-white/50">
                Current
              </p>
              <p className="mt-1 text-[15px] font-semibold">{currentCount}</p>
            </div>
            <div className="min-w-[82px] border-l border-white/15 px-3 py-2">
              <p className="text-[7px] uppercase tracking-[0.18em] text-white/50">
                Sold
              </p>
              <p className="mt-1 text-[15px] font-semibold">{soldCount}</p>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="flex items-center justify-between border-b border-[#cbd5e1] px-6 py-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                Alle panden
              </p>
              <p className="mt-1 text-[10px] text-[#64748b]">
                {visibleAssets.length} van {activeAssets.length} zichtbaar
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hiddenAssetKeys.length > 0 && (
                <button
                  type="button"
                  onClick={onRestoreRemoved}
                  className="border border-[#cbd5e1] bg-white px-3 py-2 text-[9px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                >
                  Verwijderde regels herstellen ({hiddenAssetKeys.length})
                </button>
              )}

              <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Zoek op Overview-naam, rapportnaam, adres of entiteit"
              className="w-[390px] border border-[#cbd5e1] bg-white px-4 py-2.5 text-[11px] text-[#111827] outline-none placeholder:text-[#94a3b8] focus:border-[#64748b]"
              />
            </div>
          </div>

          <div className="mx-6 mb-6 mt-4 max-h-[590px] overflow-auto border border-[#cbd5e1] bg-white">
            <div className="sticky top-0 z-20 grid grid-cols-[1.25fr_1.25fr_.82fr_1fr_.58fr_.55fr] gap-3 border-b border-[#cbd5e1] bg-[#eef2f6] px-4 py-3 text-[8px] font-semibold uppercase tracking-[0.15em] text-[#475569]">
              <span>Naam uit Overview</span>
              <span>Naam in report</span>
              <span>Categorie</span>
              <span>Foto</span>
              <span>Status</span>
              <span>Actie</span>
            </div>

            {visibleAssets.map((asset, index) => {
              const setting = getPortfolioAssetSetting(asset, settings);
              const assetKey = getPortfolioAssetKey(asset);
              const uploadedPhoto = photoUrls[assetKey] ?? "";
              const existingPhoto = getImageSource(
                asset.project,
                asset.address,
                asset.project,
                asset.address,
              );
              const previewPhoto = uploadedPhoto || existingPhoto || "";
              const status = getDefaultPortfolioStatus(asset);

              return (
                <div
                  key={assetKey}
                  className={`grid min-h-[68px] grid-cols-[1.25fr_1.25fr_.82fr_1fr_.58fr_.55fr] items-center gap-3 px-4 py-2.5 text-[10px] ${
                    index !== visibleAssets.length - 1
                      ? "border-b border-[#e4e7ec]"
                      : ""
                  }`}
                >
                  <p
                    className="truncate font-semibold text-[#111827]"
                    title={asset.project || ""}
                  >
                    {asset.project || "—"}
                  </p>

                  <input
                    type="text"
                    value={setting.reportName}
                    onChange={(event) =>
                      onSettingChange(asset, {
                        reportName: event.target.value,
                      })
                    }
                    aria-label={`Rapportnaam voor ${asset.project}`}
                    className="min-w-0 border border-[#cbd5e1] bg-white px-3 py-2 text-[10px] font-medium text-[#111827] outline-none focus:border-[#64748b]"
                  />

                  <select
                    value={setting.category}
                    onChange={(event) =>
                      onSettingChange(asset, {
                        category: event.target.value as SoldCategoryId,
                      })
                    }
                    aria-label={`Categorie voor ${asset.project}`}
                    className="w-full border border-[#cbd5e1] bg-white px-2.5 py-2 text-[9px] font-semibold text-[#111827] outline-none focus:border-[#64748b]"
                  >
                    <option value="office">Offices</option>
                    <option value="residential">Residential</option>
                    <option value="industrial">Commercial Real Estate</option>
                  </select>

                  <PortfolioPhotoDropZone
                    asset={asset}
                    previewPhoto={previewPhoto}
                    hasUploadedPhoto={Boolean(uploadedPhoto)}
                    onPhotoChange={onPhotoChange}
                    onPhotoRemove={onPhotoRemove}
                  />

                  <div className="flex items-center">
                    <span
                      className={`inline-flex min-w-[68px] items-center justify-center border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                        status === "sold"
                          ? "border-[#cbd5e1] bg-[#eef2f6] text-[#475569]"
                          : "border-[#cbd5e1] bg-white text-[#111827]"
                      }`}
                      title="Status wordt rechtstreeks uit Overview gelezen en kan hier niet worden aangepast"
                    >
                      {status === "sold" ? "Sold" : "Current"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAssetRemove(asset)}
                    className="border border-[#f0b4b4] bg-white px-2 py-2 text-[9px] font-semibold text-[#b42318] hover:bg-[#fff5f5]"
                    title="Verberg deze bronregel uit de Portfolio Manager en het rapport"
                  >
                    Verwijder
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function PortfolioPhotoDropZone({
  asset,
  previewPhoto,
  hasUploadedPhoto,
  onPhotoChange,
  onPhotoRemove,
}: {
  asset: Asset;
  previewPhoto: string;
  hasUploadedPhoto: boolean;
  onPhotoChange: (asset: Asset, file: File) => Promise<void>;
  onPhotoRemove: (asset: Asset) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);
  const inputId = `portfolio-photo-${getPortfolioAssetKey(asset).replace(
    /[^a-z0-9]+/g,
    "-",
  )}`;

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    void onPhotoChange(asset, file);
  };

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={`grid min-h-[52px] grid-cols-[52px_1fr] items-center border ${
        dragging
          ? "border-[#475569] bg-[#eef2f6]"
          : "border-[#cbd5e1] bg-white"
      }`}
    >
      <div className="h-[50px] w-[52px] overflow-hidden border-r border-[#cbd5e1] bg-[#eef2f6]">
        {previewPhoto ? (
          <img
            src={previewPhoto}
            alt="Project preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[7px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
            Foto
          </div>
        )}
      </div>

      <div className="min-w-0 px-2 py-1.5">
        <label
          htmlFor={inputId}
          className="block cursor-pointer truncate text-[8px] font-semibold text-[#475569]"
        >
          Sleep of kies foto
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        {hasUploadedPhoto && (
          <button
            type="button"
            onClick={() => void onPhotoRemove(asset)}
            className="mt-1 text-[7px] font-medium text-[#b42318] hover:underline"
          >
            Verwijder upload
          </button>
        )}
      </div>
    </div>
  );
}

function SoldCategoryEditor({
  soldAssets,
  overrides,
  edits,
  onCategoryChange,
  onTextChange,
  onReset,
}: {
  soldAssets: Asset[];
  overrides: SoldCategoryOverrides;
  edits: SoldAssetEdits;
  onCategoryChange: (
    asset: Asset,
    category: SoldCategoryId,
  ) => void;
  onTextChange: (
    asset: Asset,
    field: "project" | "address",
    value: string,
  ) => void;
  onReset: () => void;
}) {
  const [searchValue, setSearchValue] = useState("");

  const sortedAssets = useMemo(
    () =>
      [...soldAssets].sort((left, right) => {
        if (left.country !== right.country) {
          return left.country.localeCompare(right.country, "nl");
        }

        const effectiveLeft = applySoldAssetEdit(left, edits);
        const effectiveRight = applySoldAssetEdit(right, edits);

        return getSoldDisplayAddress(effectiveLeft).localeCompare(
          getSoldDisplayAddress(effectiveRight),
          "nl",
          { numeric: true, sensitivity: "base" },
        );
      }),
    [soldAssets, edits],
  );

  const normalizedSearch = normalizeText(searchValue);
  const visibleAssets = normalizedSearch
    ? sortedAssets.filter((asset) => {
        const effectiveAsset = applySoldAssetEdit(asset, edits);

        return normalizeText(
          `${effectiveAsset.project} ${effectiveAsset.address} ${asset.entity} ${asset.country}`,
        ).includes(normalizedSearch);
      })
    : sortedAssets;

  const dutchSoldAssets = soldAssets.filter(
    (asset) => asset.country !== "Spanje",
  );

  const categoryCounts = SOLD_CATEGORY_DEFINITIONS.map(
    (definition) => ({
      ...definition,
      count: dutchSoldAssets.filter(
        (asset) =>
          getEffectiveSoldCategory(asset, overrides) === definition.id,
      ).length,
    }),
  );

  const manualCount = soldAssets.filter((asset) =>
    hasManualSoldAsset(asset, overrides, edits),
  ).length;

  return (
    <section className="no-print mx-auto mb-8 w-[min(1180px,calc(100%-32px))] overflow-hidden rounded-none border border-[#cbd5e1] bg-[#f5f7fa] shadow-xl">
      <div className="flex items-start justify-between gap-6 bg-[#0f172a] px-6 py-5 text-white">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#94a3b8]">
            Live invoersheet
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Trackrecord categoriseren
          </h2>
          <p className="mt-2 max-w-2xl text-[11px] leading-5 text-white/65">
            De indeling uit je screenshots is de standaard. Je kunt
            daarnaast de projectnaam en het adres rechtstreeks aanpassen.
            Iedere afwijking van de standaard krijgt de status en
            wordt direct in het rapport verwerkt. Met de resetknop herstel je
            zowel de categorieën als de oorspronkelijke teksten.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-semibold">
            {manualCount} handmatig aangepast
          </div>
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/25 px-4 py-2 text-[10px] font-semibold hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 border-b border-[#cbd5e1] px-6 py-4">
        <div className="rounded-none bg-white px-4 py-3">
          <p className="text-[8px] uppercase tracking-[0.18em] text-[#8a7160]">
            Alle verkochte panden
          </p>
          <p className="mt-1 text-xl font-semibold text-[#0f172a]">
            {soldAssets.length}
          </p>
        </div>

        {categoryCounts.map((category) => (
          <div
            key={category.id}
            className="rounded-none bg-white px-4 py-3"
          >
            <p className="text-[8px] uppercase tracking-[0.18em] text-[#8a7160]">
              {SOLD_CATEGORY_LABELS[category.id]}
            </p>
            <p className="mt-1 text-xl font-semibold text-[#0f172a]">
              {category.count}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
            Verkochte objecten
          </p>
          <p className="mt-1 text-[10px] text-[#64748b]">
            {visibleAssets.length} van {soldAssets.length} objecten zichtbaar
          </p>
        </div>

        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Zoek op project, adres of land"
          className="w-[340px] rounded-full border border-[#cbd5e1] bg-white px-4 py-2.5 text-[11px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#64748b]"
        />
      </div>

      <div className="mx-6 mb-6 max-h-[520px] overflow-auto rounded-none border border-[#cbd5e1] bg-white">
        <div className="sticky top-0 z-10 grid grid-cols-[1.2fr_1.7fr_.55fr_.65fr_1fr_.55fr] gap-3 bg-[#eee8dd] px-4 py-3 text-[8px] font-semibold uppercase tracking-[0.15em] text-[#64748b]">
          <span>Project</span>
          <span>Adres</span>
          <span>Land</span>
          <span className="text-right">Oppervlakte</span>
          <span>Categorie</span>
          <span>Status</span>
        </div>

        {visibleAssets.map((asset, index) => {
          const effectiveAsset = applySoldAssetEdit(asset, edits);
          const area = getSoldDisplayArea(effectiveAsset);
          const assetKey = getSoldAssetKey(asset);
          const hasManualChanges = hasManualSoldAsset(
            asset,
            overrides,
            edits,
          );
          const isSpanishAsset = asset.country === "Spanje";
          const category = getEffectiveSoldCategory(asset, overrides);

          return (
            <div
              key={assetKey}
              className={`grid min-h-[48px] grid-cols-[1.2fr_1.7fr_.55fr_.65fr_1fr_.55fr] items-center gap-3 px-4 py-2.5 text-[10px] ${
                index !== visibleAssets.length - 1
                  ? "border-b border-[#f5f7fa]"
                  : ""
              }`}
            >
              <input
                type="text"
                value={effectiveAsset.project}
                onChange={(event) =>
                  onTextChange(
                    asset,
                    "project",
                    event.target.value,
                  )
                }
                aria-label={`Projectnaam van ${getSoldDisplayAddress(asset)}`}
                className="min-w-0 rounded-none border border-transparent bg-transparent px-2 py-1.5 font-semibold text-[#0f172a] outline-none hover:border-[#cbd5e1] hover:bg-[#f8fafc] focus:border-[#94a3b8] focus:bg-white"
              />
              <input
                type="text"
                value={effectiveAsset.address}
                onChange={(event) =>
                  onTextChange(
                    asset,
                    "address",
                    event.target.value,
                  )
                }
                aria-label={`Adres van ${asset.project}`}
                className="min-w-0 rounded-none border border-transparent bg-transparent px-2 py-1.5 text-[#64748b] outline-none hover:border-[#cbd5e1] hover:bg-[#f8fafc] focus:border-[#94a3b8] focus:bg-white"
              />
              <p className="text-[#64748b]">
                {asset.country}
              </p>
              <p className="whitespace-nowrap text-right font-semibold text-[#0f172a]">
                {area.value > 0
                  ? `${formatNumber(area.value)} ${area.suffix}`
                  : "—"}
              </p>

              {isSpanishAsset ? (
                <div className="rounded-none border border-[#cbd5e1] bg-[#f5f7fa] px-3 py-2 text-[9px] font-semibold text-[#64748b]">
                  Spanje · detailpagina
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(event) =>
                    onCategoryChange(
                      asset,
                      event.target.value as SoldCategoryId,
                    )
                  }
                  className="w-full rounded-none border border-[#cbd5e1] bg-white px-3 py-2 text-[10px] font-semibold text-[#0f172a] outline-none focus:border-[#64748b]"
                >
                  {SOLD_CATEGORY_DEFINITIONS.map((definition) => (
                    <option
                      key={definition.id}
                      value={definition.id}
                    >
                      {SOLD_CATEGORY_LABELS[definition.id]}
                    </option>
                  ))}
                </select>
              )}

              <span
                className={`w-fit rounded-full px-2.5 py-1 text-[8px] font-semibold ${
                  hasManualChanges
                    ? "bg-[#cbd5e1] text-[#64748b]"
                    : isSpanishAsset
                      ? "bg-[#f5f7fa] text-[#475569]"
                      : "bg-[#f5f7fa] text-[#64748b]"
                }`}
              >
                {hasManualChanges
                  ? "Handmatig"
                  : isSpanishAsset
                    ? "Vast"
                    : "Standaard"}
              </span>
            </div>
          );
        })}

        {visibleAssets.length === 0 && (
          <p className="px-5 py-10 text-center text-[11px] text-[#64748b]">
            Geen verkochte objecten gevonden voor deze zoekopdracht.
          </p>
        )}
      </div>
    </section>
  );
}

function SoldCategoryOverviewPage({
  number,
  category,
  updated,
}: {
  number: string;
  category: SoldCategoryDefinition & {
    assets: Asset[];
    pageIndex: number;
    pageCount: number;
    pageKey: string;
  };
  updated: Date | null;
}) {
  const featuredAssets = getFeaturedSoldAssets(
    category.assets,
    category.id,
  );
  const listMidpoint = Math.ceil(category.assets.length / 2);
  const assetColumns = [
    category.assets.slice(0, listMidpoint),
    category.assets.slice(listMidpoint),
  ];
  const totalBuiltArea = category.assets.reduce(
    (sum, asset) => sum + asset.builtArea,
    0,
  );

  return (
    <PageFrame>
      <ReportHeader
        number={number}
        label="Sold track record"
        title={category.title}
        subtitle={`${category.subtitle}${
          category.pageCount > 1
            ? ` · Page ${category.pageIndex + 1} of ${category.pageCount}`
            : ""
        } · ${category.assets.length} realized assets`}
      />

      <div className="mt-5 grid grid-cols-[0.82fr_1.38fr] gap-5">
        <div className="space-y-4">
          {featuredAssets.map((asset, index) => (
            <FeaturedSoldAsset
              key={`${category.id}-featured-${asset.project}-${index}`}
              asset={asset}
            />
          ))}
        </div>

        <section className="overflow-hidden rounded-none border border-[#cbd5e1] bg-white/85">
          <div className="flex items-end justify-between bg-[#0f172a] px-4 py-3 text-white">
            <div>
              <SectionLabel light>Realized assets</SectionLabel>
              <p className="mt-1 text-[9px] text-[#667085]">
                Address and surface overview
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.18em] text-[#98a2b3]">
                Total built area
              </p>
              <p className="mt-1 text-[13px] font-semibold">
                {totalBuiltArea > 0
                  ? `${formatNumber(totalBuiltArea)} m²`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-[#f5f7fa]">
            {assetColumns.map((assets, columnIndex) => (
              <SoldAssetAddressList
                key={`${category.id}-column-${columnIndex}`}
                assets={assets}
              />
            ))}
          </div>
        </section>
      </div>

      <ReportFooter updated={updated} />
    </PageFrame>
  );
}

function FeaturedSoldAsset({ asset }: { asset: Asset }) {
  const area = getSoldDisplayArea(asset);

  return (
    <article className="overflow-hidden rounded-none border border-[#cbd5e1] bg-white/85">
      <ProjectImage
        project={asset.project}
        address={asset.address}
        sourceProject={asset.sourceProject}
        sourceAddress={asset.sourceAddress}
        customSrc={asset.customPhotoUrl}
        className="h-[47mm] rounded-none"
      />
      <div className="flex items-end justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[7px] uppercase tracking-[0.18em] text-[#64748b]">
            Featured realized asset
          </p>
          <h2 className="mt-1 truncate text-[15px] font-semibold text-[#0f172a]">
            {asset.project}
          </h2>
          <p className="mt-1 truncate text-[9px] text-[#64748b]">
            {getSoldDisplayAddress(asset)}
          </p>
        </div>
        <p className="shrink-0 text-[12px] font-semibold text-[#0f172a]">
          {area.value > 0
            ? `${formatNumber(area.value)} ${area.suffix}`
            : "—"}
        </p>
      </div>
    </article>
  );
}

function SoldAssetAddressList({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return <div className="min-h-[20px]" />;
  }

  return (
    <div>
      {assets.map((asset, index) => {
        const area = getSoldDisplayArea(asset);

        return (
          <div
            key={`${asset.entity}-${asset.project}-${index}`}
            className={`grid min-h-[27px] grid-cols-[1fr_86px] items-center gap-3 px-3.5 py-1.5 text-[9px] ${
              index !== assets.length - 1
                ? "border-b border-[#e4e7ec]"
                : ""
            }`}
          >
            <p className="truncate font-medium text-[#475467]">
              {getSoldDisplayAddress(asset)}
            </p>
            <p className="whitespace-nowrap text-right font-semibold text-[#0f172a]">
              {area.value > 0
                ? `${formatNumber(area.value)} ${area.suffix}`
                : "—"}
            </p>
          </div>
        );
      })}
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
    <article className="overflow-hidden rounded-none border border-[#cbd5e1] bg-white/85">
      <ProjectImage
        project={asset.project}
        address={asset.address}
        sourceProject={asset.sourceProject}
        sourceAddress={asset.sourceAddress}
        customSrc={asset.customPhotoUrl}
        className="h-[62mm] rounded-none"
      />
      <div className="p-5">
        <SectionLabel>Realized project</SectionLabel>
        <h2 className="mt-3 text-2xl font-semibold text-[#0f172a]">{asset.project}</h2>
        <p className="mt-2 text-[10px] text-[#64748b]">{asset.address || asset.entity}</p>

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

        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 rounded-none border border-[#f5f7fa] p-4">
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
    ? "bg-[#0f172a] text-white"
    : accent
      ? "bg-[#94a3b8] text-white"
      : "bg-[#f5f7fa] text-[#0f172a]";

  return (
    <div className={`rounded-none p-4 ${background}`}>
      <p className="text-[7px] uppercase tracking-[0.18em] opacity-65">{label}</p>
      <p className="mt-2 whitespace-nowrap text-[15px] font-semibold">{value}</p>
    </div>
  );
}