/* eslint-disable @typescript-eslint/no-unused-vars */
import "server-only";




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



export function parsePortfolioSheet(csv:string) { const transformed=transformRows(csvToRows(csv),extractProjectExclusions(csv)); return {...transformed,financialOverview:extractFinancialOverview(csv)}; }
export const overviewSourceUrl=CSV_URL;
