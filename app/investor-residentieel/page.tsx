import ResidentieelStartpuntClient, {
  type ReportData,
  type StartpuntConfig,
} from "./ResidentieelStartpuntClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

<<<<<<< HEAD
type MaybeNumber = number | null;
type YesNo = "ja" | "nee";

type ExpenseItem = {
  name: string;
  amount: MaybeNumber;
  percentOfRent: MaybeNumber;
=======
const config: StartpuntConfig = {
  title: "Startpunt analyse",
  subtitle:
    "Rendementscheck voor residentieel vastgoed, inclusief rente, exploitatiekosten, vermogensbelasting en waardestijging.",
  footerLabel: "L3 Capital · Startpunt analyse residentieel",
>>>>>>> 8ecef1f94a0d7a33e4314510ef7ca14da6e26cf7
};

const initialData: ReportData = {
  objectNaam: "Voorbeeld Appartement",
  adres: "Straat 0, Venlo",
  afbeeldingUrl: "/startpunt-analyse-photos/residentieel/photo1.png",

  marktwaardeVastgoed: 300000,
  wozWaardeVastgoed: 250000,
  financiering: 10000,
  huurPerMaand: 1900,
  rentePercentage: 0.04,

  box3WozPercentage: 0.06,
  box3FinancieringPercentage: 0.027,
  box3BelastingPercentage: 0.36,
  gemiddeldeWaardestijging: 0.03,

  fiscaalPartner: false,
  heffingsvrijVermogenToepassen: false,

  exploitatiekosten: [
    {
      name: "Gemeentelijke lasten eigenaar",
      amount: 750,
      percentOfRent: null,
    },
    {
      name: "Opstalverzekering",
      amount: 450,
      percentOfRent: null,
    },
    {
      name: "Klein onderhoud",
      amount: 750,
      percentOfRent: null,
    },
    {
      name: "Reservering groot onderhoud",
      amount: 1500,
      percentOfRent: null,
    },
    {
      name: "Beheer en administratie",
      amount: 400,
      percentOfRent: null,
    },
    {
      name: "Verhuur- en mutatiekosten",
      amount: 400,
      percentOfRent: null,
    },
    {
      name: "Leegstand / wanbetaling",
      amount: 530,
      percentOfRent: null,
    },
  ],

<<<<<<< HEAD
  box3WozPercentage: MaybeNumber;
  box3WozBedrag: MaybeNumber;

  box3FinancieringPercentage: MaybeNumber;
  box3FinancieringBedrag: MaybeNumber;

  box3Grondslag: MaybeNumber;
  box3BelastingPercentage: MaybeNumber;

  exploitatiekostenTotaal: MaybeNumber;
  exploitatiekostenPercentage: MaybeNumber;

  nettoHuurinkomsten: MaybeNumber;
  nettoRendementMarktwaarde: MaybeNumber;
  rendementOpEigenInleg: MaybeNumber;

  gemiddeldeWaardestijging: MaybeNumber;
  totaalRendementInclWaardestijging: MaybeNumber;

  fiscaalPartner: YesNo;
  heffingsvrijBenut: YesNo;

  exploitatiekosten: ExpenseItem[];
  waarschuwingen: string[];
};

const STARTPUNT_CONFIG = STARTPUNT_ANALYSES.residentieel;

const INPUT_CSV_URL = STARTPUNT_CONFIG.inputCsv;
const EXPLOITATIEKOSTEN_CSV_URL = STARTPUNT_CONFIG.exploitatiekostenCsv;
const DEFAULT_PHOTO = STARTPUNT_CONFIG.photos[0];

function normalizeLabel(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeYesNo(value: unknown, fallback: YesNo): YesNo {
  const normalized = normalizeLabel(value);
  if (normalized === "ja" || normalized === "yes") return "ja";
  if (normalized === "nee" || normalized === "no") return "nee";
  return fallback;
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseCsvTable(text: string): string[][] {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);
}

function parseNumber(value: unknown): MaybeNumber {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const original = value.trim();
  if (!original) return null;

  const isNegative =
    /[-−–—]/.test(original) ||
    (original.includes("(") && original.includes(")"));

  let cleaned = original
    .replace(/[^\d,.\-−–—]/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/-/g, "");

  if (!cleaned) return null;

  if (cleaned.includes(".") && cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "");
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;

  return isNegative ? -parsed : parsed;
}

function parsePercent(value: unknown): MaybeNumber {
  const raw = parseNumber(value);

  if (raw === null) return null;
  if (Math.abs(raw) > 1) return raw / 100;

  return raw;
}

function getCellAfterLabel(row: string[]) {
  const first = row[1] ?? "";
  const second = row[2] ?? "";

  const firstValue = String(first).trim();
  const secondValue = String(second).trim();

  if (
    firstValue &&
    /^\d+$/.test(firstValue) &&
    /^\d+%?$/.test(secondValue)
  ) {
    return `${firstValue},${secondValue.replace("%", "")}%`;
  }

  return firstValue;
}

function findValue(rows: string[][], labels: string[]) {
  const normalizedLabels = labels.map(normalizeLabel);

  for (const row of rows) {
    const label = normalizeLabel(row[0] ?? "");

    if (normalizedLabels.includes(label)) {
      return getCellAfterLabel(row);
    }
  }

  return "";
}

function findLastValue(rows: string[][], labels: string[]) {
  const normalizedLabels = labels.map(normalizeLabel);

  for (const row of [...rows].reverse()) {
    const label = normalizeLabel(row[0] ?? "");

    if (normalizedLabels.includes(label)) {
      return getCellAfterLabel(row);
    }
  }

  return "";
}

function findLastRow(rows: string[][], labels: string[]) {
  const normalizedLabels = labels.map(normalizeLabel);

=======
  waarschuwingen: [],
};

export default function ResidentieelPage() {
>>>>>>> 8ecef1f94a0d7a33e4314510ef7ca14da6e26cf7
  return (
    <ResidentieelStartpuntClient
      initialData={initialData}
      config={config}
    />
  );
<<<<<<< HEAD
}

function readNumber(rows: string[][], labels: string[]) {
  return parseNumber(findValue(rows, labels));
}

function readLastNumber(rows: string[][], labels: string[]) {
  return parseNumber(findLastValue(rows, labels));
}

function readPercent(rows: string[][], labels: string[]) {
  return parsePercent(findValue(rows, labels));
}

function readLastPercent(rows: string[][], labels: string[]) {
  return parsePercent(findLastValue(rows, labels));
}

function readText(rows: string[][], labels: string[], fallback = "") {
  const value = findValue(rows, labels);

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function normalizeImagePath(value: string) {
  let cleaned = value.trim().replace(/\\/g, "/");

  if (!cleaned) return DEFAULT_PHOTO;

  cleaned = cleaned
    .replace(/^public\//i, "")
    .replace(/^photos:\s*/i, "")
    .replace(/^foto:\s*/i, "");

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  if (!cleaned.startsWith("/")) {
    cleaned = `/${cleaned}`;
  }

  return encodeURI(cleaned);
}

function addCacheBust(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_=${Date.now()}`;
}

async function fetchCsv(url: string, label: string) {
  if (!url || url.includes("PLAK_HIER")) {
    throw new Error(`${label} CSV-link ontbreekt in app/startpuntAnalyses.ts`);
  }

  const response = await fetch(addCacheBust(url), {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`${label} CSV kon niet worden geladen`);
  }

  return response.text();
}

function parseExploitatiekosten(rows: string[][]) {
  const expenses: ExpenseItem[] = [];

  let headerRowIndex = -1;
  let nameColumn = 0;
  let amountColumn = 1;
  let percentColumn = 2;

  rows.forEach((row, index) => {
    const normalizedCells = row.map(normalizeLabel);

    if (
      normalizedCells.includes("kostenpost") &&
      normalizedCells.includes("jaarbedrag")
    ) {
      headerRowIndex = index;
      nameColumn = normalizedCells.indexOf("kostenpost");
      amountColumn = normalizedCells.indexOf("jaarbedrag");
      percentColumn = normalizedCells.findIndex((cell) =>
        cell.includes("huur")
      );
    }
  });

  if (headerRowIndex === -1) {
    return {
      expenses,
      totalAmount: null as MaybeNumber,
      totalPercent: null as MaybeNumber,
    };
  }

  let totalAmount: MaybeNumber = null;
  let totalPercent: MaybeNumber = null;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];

    const name = row[nameColumn] ?? "";
    const normalizedName = normalizeLabel(name);

    if (!name) continue;

    const amount = parseNumber(row[amountColumn] ?? "");
    const percent =
      percentColumn >= 0 ? parsePercent(row[percentColumn] ?? "") : null;

    if (normalizedName.includes("totaal exploitatiekosten")) {
      totalAmount = amount;
      totalPercent = percent;
      continue;
    }

    if (normalizedName.includes("huurinkomsten")) continue;
    if (normalizedName.includes("totaal")) continue;

    if (amount !== null) {
      expenses.push({
        name,
        amount: Math.abs(amount),
        percentOfRent: percent === null ? null : Math.abs(percent),
      });
    }
  }

  return {
    expenses,
    totalAmount,
    totalPercent,
  };
}

async function readReportData(): Promise<ReportData> {
  const waarschuwingen: string[] = [];

  let inputRows: string[][] = [];
  let exploitatieRows: string[][] = [];

  try {
    const [inputCsv, exploitatieCsv] = await Promise.all([
      fetchCsv(INPUT_CSV_URL, "Input"),
      fetchCsv(EXPLOITATIEKOSTEN_CSV_URL, "Exploitatiekosten"),
    ]);

    inputRows = parseCsvTable(inputCsv);
    exploitatieRows = parseCsvTable(exploitatieCsv);
  } catch (error) {
    waarschuwingen.push(
      error instanceof Error
        ? error.message
        : "CSV-data kon niet worden geladen."
    );
  }

  const parsedCosts = parseExploitatiekosten(exploitatieRows);

  const objectNaam = readText(
    inputRows,
    ["Objectnaam"],
    STARTPUNT_CONFIG.objectFallback
  );

  const adres = readText(inputRows, ["Adres"], "Nederland");

  const fiscaalPartner = normalizeYesNo(
    readText(inputRows, ["Fiscaal partner"], "nee"),
    "nee"
  );

  const heffingsvrijBenut = normalizeYesNo(
    readText(
      inputRows,
      ["Heffingsvrij vermogen benut", "Heffingsvrije vermogen benut"],
      "ja"
    ),
    "ja"
  );

  const afbeeldingUrl = normalizeImagePath(
    readText(inputRows, ["Foto URL of bestandsnaam", "Foto"], DEFAULT_PHOTO)
  );

  const marktwaardeVastgoed = readNumber(inputRows, ["Marktwaarde vastgoed"]);

  const wozWaardeVastgoed = readNumber(inputRows, [
    "WOZ-waarde vastgoed",
    "WOZ waarde vastgoed",
  ]);

  const financiering = readNumber(inputRows, ["Financiering"]);

  const huurPerMaand = readNumber(inputRows, ["Huur per maand"]);

  const rentePercentage = readPercent(inputRows, [
    "Rentepercentage",
    "Rente percentage",
    "Rente",
  ]);

  const vermogensbelastingbasisTekst = readText(inputRows, [
    "Vermogensbelastingbasis",
    "Vermogensbelasting basis",
  ]);

  const gemiddeldeWaardestijging = readPercent(inputRows, [
    "Gemiddelde waardestijging per jaar",
    "Gemiddelde waardestijging",
  ]);

  const huurPerJaar = huurPerMaand !== null ? huurPerMaand * 12 : null;

  const brutoRendementMarktwaarde =
    huurPerJaar !== null &&
    marktwaardeVastgoed !== null &&
    marktwaardeVastgoed !== 0
      ? huurPerJaar / marktwaardeVastgoed
      : null;

  const eigenInleg =
    marktwaardeVastgoed !== null && financiering !== null
      ? marktwaardeVastgoed - financiering
      : null;

  const rentelastenPerJaar =
    financiering !== null && rentePercentage !== null
      ? -Math.abs(financiering) * rentePercentage
      : null;

  const naRenteResteert =
    huurPerJaar !== null && rentelastenPerJaar !== null
      ? huurPerJaar + rentelastenPerJaar
      : null;

  const exploitatiekostenTotaal =
    parsedCosts.expenses.length > 0
      ? parsedCosts.expenses.reduce(
          (sum, item) => sum + Math.abs(item.amount ?? 0),
          0
        )
      : parsedCosts.totalAmount;

  const exploitatiekostenPercentage =
    exploitatiekostenTotaal !== null &&
    huurPerJaar !== null &&
    huurPerJaar !== 0
      ? exploitatiekostenTotaal / huurPerJaar
      : parsedCosts.totalPercent;

  const oudeBox3WozRow = findLastRow(inputRows, [
    "Woz waarde",
    "WOZ waarde",
    "WOZ-waarde",
  ]);

  const oudeBox3FinancieringRow = findLastRow(inputRows, ["financiering"]);

  const oudeBox3BelastingRow = findLastRow(inputRows, [
    "box 3 belasting",
    "box3 belasting",
  ]);

  const box3WozPercentage =
    readLastPercent(inputRows, [
      "Vermogensbelasting percentage over WOZ",
      "Vermogenbelasting percentage over WOZ",
      "Vermogensbelastingpercentage over WOZ",
      "Vermogenbelastingpercentage over WOZ",
    ]) ?? parsePercent(oudeBox3WozRow?.[2] ?? "");

  const box3WozBedrag =
    readLastNumber(inputRows, [
      "Vermogensbelasting over WOZ",
      "Vermogenbelasting over WOZ",
    ]) ??
    parseNumber(oudeBox3WozRow?.[3] ?? "") ??
    (wozWaardeVastgoed !== null && box3WozPercentage !== null
      ? Math.abs(wozWaardeVastgoed) * box3WozPercentage
      : null);

  const box3FinancieringPercentage =
    readLastPercent(inputRows, [
      "Vermogensbelasting percentage over financiering",
      "Vermogenbelasting percentage over financiering",
      "Vermogensbelastingpercentage over financiering",
      "Vermogenbelastingpercentage over financiering",
    ]) ?? parsePercent(oudeBox3FinancieringRow?.[2] ?? "");

  const box3FinancieringBedrag =
    readLastNumber(inputRows, [
      "Vermogensbelasting over financiering",
      "Vermogenbelasting over financiering",
    ]) ??
    parseNumber(oudeBox3FinancieringRow?.[3] ?? "") ??
    (financiering !== null && box3FinancieringPercentage !== null
      ? Math.abs(financiering) * box3FinancieringPercentage
      : null);

  const box3Grondslag =
    readLastNumber(inputRows, [
      "Vermogensbelastingbasis",
      "Vermogensbelasting basis",
      "Grondslag",
      "Grondslag box 3",
    ]) ??
    (box3WozBedrag !== null && box3FinancieringBedrag !== null
      ? box3WozBedrag - box3FinancieringBedrag
      : null);

  const box3BelastingPercentage =
    readLastPercent(inputRows, [
      "Box 3 belasting percentage",
      "Box-3 belasting percentage",
      "Box 3 tarief",
      "Box-3 tarief",
    ]) ?? parsePercent(oudeBox3BelastingRow?.[2] ?? "");

  const box3BelastingBedrag = parseNumber(oudeBox3BelastingRow?.[3] ?? "");

  const vermogensbelastingPerJaarUitExcel = readNumber(inputRows, [
    "Vermogensbelasting per jaar",
  ]);

  const vermogensbelastingPercentage = box3BelastingPercentage;

  const vermogensbelastingPerJaar =
    vermogensbelastingPerJaarUitExcel !== null
      ? -Math.abs(vermogensbelastingPerJaarUitExcel)
      : box3BelastingBedrag !== null
      ? -Math.abs(box3BelastingBedrag)
      : box3Grondslag !== null && box3BelastingPercentage !== null
      ? -Math.abs(box3Grondslag) * box3BelastingPercentage
      : null;

  const nettoHuurinkomsten =
    huurPerJaar !== null &&
    rentelastenPerJaar !== null &&
    exploitatiekostenTotaal !== null &&
    vermogensbelastingPerJaar !== null
      ? huurPerJaar +
        rentelastenPerJaar -
        Math.abs(exploitatiekostenTotaal) +
        vermogensbelastingPerJaar
      : null;

  const nettoRendementMarktwaarde =
    nettoHuurinkomsten !== null &&
    marktwaardeVastgoed !== null &&
    marktwaardeVastgoed !== 0
      ? nettoHuurinkomsten / marktwaardeVastgoed
      : null;

  const rendementOpEigenInleg =
    nettoHuurinkomsten !== null &&
    eigenInleg !== null &&
    eigenInleg !== 0
      ? nettoHuurinkomsten / eigenInleg
      : null;

  const totaalRendementInclWaardestijging =
    rendementOpEigenInleg !== null &&
    gemiddeldeWaardestijging !== null
      ? rendementOpEigenInleg + gemiddeldeWaardestijging
      : null;

  return {
    objectNaam,
    adres,
    afbeeldingUrl,

    marktwaardeVastgoed,
    wozWaardeVastgoed,
    financiering,
    eigenInleg,

    huurPerMaand,
    huurPerJaar,
    brutoRendementMarktwaarde,

    rentePercentage,
    rentelastenPerJaar,
    naRenteResteert,

    vermogensbelastingPercentage,
    vermogensbelastingbasis: vermogensbelastingbasisTekst,
    vermogensbelastingPerJaar,

    box3WozPercentage,
    box3WozBedrag,

    box3FinancieringPercentage,
    box3FinancieringBedrag,

    box3Grondslag,
    box3BelastingPercentage,

    exploitatiekostenTotaal,
    exploitatiekostenPercentage,

    nettoHuurinkomsten,
    nettoRendementMarktwaarde,
    rendementOpEigenInleg,

    gemiddeldeWaardestijging,
    totaalRendementInclWaardestijging,

    fiscaalPartner,
    heffingsvrijBenut,

    exploitatiekosten: parsedCosts.expenses,
    waarschuwingen,
  };
}

export default async function ResidentieelStartpuntPage() {
  const data = await readReportData();

  return <StartpuntClient initialData={data} config={STARTPUNT_CONFIG} />;
=======
>>>>>>> 8ecef1f94a0d7a33e4314510ef7ca14da6e26cf7
}