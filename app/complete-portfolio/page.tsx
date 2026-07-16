import { PORTFOLIO } from "../portfolio";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CsvRow = Record<string, string>;
type MetricMap = Record<string, number>;

type PortfolioSheetData = {
  metrics: MetricMap;
  projects: CsvRow[];
};

const PORTFOLIO_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSy5ruI_t2bZHex5vWNhI2txiYS6Dph1r5oSvW19omhO6aTbP9H-21qsqjpztO4Rg/pub?gid=1825706612&single=true&output=csv";

const COLORS = {
  ink: "#0E0E12",
  ivory: "#FAF7EE",
  travertine: "#E4D8C2",
  brass: "#8C6F47",
  pool: "#7FA8A4",
  cypress: "#2B3A33",
};

function clean(value: unknown) {
  return String(value ?? "")
    .replaceAll("\u00A0", " ")
    .replaceAll("\r", "")
    .trim();
}

function keyName(value: string) {
  return clean(value)
    .replaceAll("€", "")
    .replaceAll("(€)", "")
    .replaceAll("%", "")
    .replace(/[^\w]/g, "")
    .toLowerCase();
}

/**
 * Parses the complete Google Sheets tab. This parser also supports commas and
 * line breaks inside quoted cells, which is important for addresses and notes.
 */
function parseCsvMatrix(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(clean(cell));
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(clean(cell));
      cell = "";

      if (row.some((value) => hasValue(value))) rows.push(row);
      row = [];
      continue;
    }

    cell += char;
  }

  row.push(clean(cell));
  if (row.some((value) => hasValue(value))) rows.push(row);

  return rows;
}

function parseNumberOrUndefined(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (!hasValue(value)) return undefined;

  const original = clean(value);
  const hasCurrency = original.includes("€");
  const hasPercent = original.includes("%");

  let raw = original
    .replaceAll("€", "")
    .replaceAll("%", "")
    .replaceAll(" ", "")
    .replaceAll("'", "");

  const isNegative = raw.startsWith("(") && raw.endsWith(")");
  raw = raw.replace(/[()]/g, "");

  const commaIndex = raw.lastIndexOf(",");
  const dotIndex = raw.lastIndexOf(".");

  if (commaIndex >= 0 && dotIndex >= 0) {
    if (commaIndex > dotIndex) {
      raw = raw.replaceAll(".", "").replace(",", ".");
    } else {
      raw = raw.replaceAll(",", "");
    }
  } else if (commaIndex >= 0) {
    const commaCount = (raw.match(/,/g) || []).length;
    const decimalDigits = raw.length - commaIndex - 1;
    const looksLikeDecimal =
      commaCount === 1 &&
      (hasPercent || /^-?0,/.test(raw) || (decimalDigits > 0 && decimalDigits <= 2));

    raw = looksLikeDecimal
      ? raw.slice(0, commaIndex).replaceAll(",", "") + "." + raw.slice(commaIndex + 1)
      : raw.replaceAll(",", "");
  } else if (dotIndex >= 0) {
    const dotCount = (raw.match(/\./g) || []).length;
    const decimalDigits = raw.length - dotIndex - 1;
    const looksLikeThousands =
      dotCount > 1 || (dotCount === 1 && hasCurrency && decimalDigits === 3);

    if (looksLikeThousands) raw = raw.replaceAll(".", "");
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  return isNegative ? -parsed : parsed;
}

function parseNumber(value: string | number | undefined) {
  return parseNumberOrUndefined(value) ?? 0;
}

function parsePercentage(value: string | number | undefined) {
  const parsed = parseNumberOrUndefined(value) ?? 0;
  const containsPercent = typeof value === "string" && value.includes("%");
  return !containsPercent && Math.abs(parsed) <= 1 ? parsed * 100 : parsed;
}

function money(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function hasValue(value: unknown) {
  const cleaned = clean(value);
  return cleaned !== "" && cleaned !== "-" && cleaned !== "—";
}

function normalizeStatus(value: unknown) {
  return clean(value).toLowerCase();
}

function deriveProjectName(row: CsvRow) {
  if (hasValue(row.project)) return clean(row.project);

  const firstAddressPart = clean(row.address).split(",")[0]?.trim();
  return firstAddressPart || clean(row.type) || "Unnamed project";
}

function normalizeProject(row: CsvRow): CsvRow {
  const project = deriveProjectName(row);
  const expectedEndValue =
    clean(row.expectedsalesvalue) || clean(row.currentvalue) || clean(row.saleprice);

  return {
    ...row,
    project,
    address: clean(row.address),
    country: clean(row.country),
    portfoliostatus: clean(row.portfoliostatus),
    expectedendvalue: expectedEndValue,
    expectedrenovationcosts:
      clean(row.expectedrenovationcosts) || clean(row.renovationcosts),
    expectedroi: clean(row.expectedroi) || clean(row.roi),
    roi: clean(row.roi) || clean(row.expectedroi),
    location: clean(row.address),
    status: clean(row.notes),
    expectedexitstrategy: clean(row.exitstrategy),
    badgelabel: clean(row.type) || "Project",
  };
}

function projectPortfolioValue(project: CsvRow) {
  return (
    parseNumber(project.expectedsalesvalue) ||
    parseNumber(project.currentvalue) ||
    parseNumber(project.saleprice) ||
    parseNumber(project.expectedendvalue)
  );
}

function projectPurchase(project: CsvRow) {
  return parseNumber(project.purchaseprice) || parseNumber(project.expectedpurchaseprice);
}

function projectRenovation(project: CsvRow) {
  return (
    parseNumber(project.expectedrenovationcosts) || parseNumber(project.renovationcosts)
  );
}

function projectTotalCost(project: CsvRow) {
  return (
    parseNumber(project.totalexpectedcost) ||
    parseNumber(project.totalinvestment) ||
    projectPurchase(project) + projectRenovation(project)
  );
}

function countryShort(country: string) {
  const normalized = clean(country).toLowerCase();
  if (normalized.includes("netherland")) return "NL";
  if (normalized.includes("spain")) return "ES";
  return clean(country);
}

function countryLabel(country: string) {
  const normalized = clean(country).toLowerCase();

  if (normalized.includes("netherland") || normalized === "nl") {
    return "The Netherlands";
  }

  if (normalized.includes("spain") || normalized === "es") {
    return "Spain";
  }

  return clean(country) || "Other";
}

function getPhotos(name: string) {
  return (
    Object.entries(PORTFOLIO.photos).find(
      ([projectName]) =>
        projectName.toLowerCase().trim() === name.toLowerCase().trim()
    )?.[1] || []
  );
}

/**
 * Uses the Photo URL column from Google Sheets first.
 * Headers such as "Photo URL", "Image URL" and "Photo" are normalized by
 * keyName() to photourl, imageurl and photo.
 *
 * Example value:
 * /portfolio-photos-nl-es/la-carolina.jpg
 */
function projectPhoto(project: CsvRow) {
  return (
    clean(project.photourl) ||
    clean(project.imageurl) ||
    clean(project.photo) ||
    getPhotos(clean(project.project))[0] ||
    ""
  );
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

function parsePortfolioSheet(text: string): PortfolioSheetData {
  const matrix = parseCsvMatrix(text);
  const headerIndex = matrix.findIndex((row) => {
    const keys = row.map(keyName);
    return (
      keys.includes("country") &&
      keys.includes("portfoliostatus") &&
      keys.includes("address")
    );
  });

  if (headerIndex < 0) {
    throw new Error(
      "The project header row was not found. Keep the headers Country, Portfolio Status and Address in the published Portfolio tab."
    );
  }

  const metrics: MetricMap = {};
  for (const row of matrix.slice(0, headerIndex)) {
    const metricKey = keyName(row[0] || "");
    const metricValue = parseNumberOrUndefined(row[1]);
    if (metricKey && metricValue !== undefined) metrics[metricKey] = metricValue;
  }

  const headers = matrix[headerIndex].map(keyName);
  const projects = matrix
    .slice(headerIndex + 1)
    .map((values) =>
      normalizeProject(
        Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
      )
    )
    .filter((project) => {
      const status = normalizeStatus(project.portfoliostatus);
      return (
        ["current", "pipeline", "sold"].includes(status) &&
        (hasValue(project.project) || hasValue(project.address))
      );
    });

  return { metrics, projects };
}

async function fetchPortfolioSheet(): Promise<PortfolioSheetData> {
  const response = await fetch(PORTFOLIO_CSV_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Portfolio CSV could not be loaded (${response.status}).`);
  }

  return parsePortfolioSheet(await response.text());
}

function metricOr(metrics: MetricMap, key: string, fallback: number) {
  return Number.isFinite(metrics[key]) ? metrics[key] : fallback;
}


export default async function PortfolioPage() {
  const { metrics, projects } = await fetchPortfolioSheet();

  const current = projects.filter(
    (project) => normalizeStatus(project.portfoliostatus) === "current"
  );
  const pipeline = projects.filter(
    (project) => normalizeStatus(project.portfoliostatus) === "pipeline"
  );
  const sold = projects.filter(
    (project) => normalizeStatus(project.portfoliostatus) === "sold"
  );

  const calculatedSalesRevenue = sold.reduce(
    (sum, project) => sum + parseNumber(project.saleprice),
    0
  );
  const calculatedRealizedProfit = sold.reduce(
    (sum, project) => sum + parseNumber(project.realizedgrossprofit),
    0
  );
  const calculatedPortfolioValue = current.reduce(
    (sum, project) => sum + projectPortfolioValue(project),
    0
  );
  const calculatedMortgages = current.reduce(
    (sum, project) => sum + Math.abs(parseNumber(project.mortgage)),
    0
  );
  const calculatedExpectedProfit = current.reduce(
    (sum, project) => sum + parseNumber(project.expectedgrossprofit),
    0
  );

  const currentCount = Math.round(metricOr(metrics, "currentprojects", current.length));
  const pipelineCount = Math.round(
    metricOr(metrics, "pipelineprojects", pipeline.length)
  );
  const soldCount = Math.round(metricOr(metrics, "soldprojects", sold.length));

  const portfolioValue = metricOr(
    metrics,
    "currentportfoliovalue",
    calculatedPortfolioValue
  );
  const expectedProfit = metricOr(
    metrics,
    "expectedgrossprofit",
    calculatedExpectedProfit
  );
  const totalSalesRevenue = metricOr(
    metrics,
    "trackrecordrevenue",
    calculatedSalesRevenue
  );
  const realizedGrossProfit = metricOr(
    metrics,
    "realizedgrossprofit",
    calculatedRealizedProfit
  );
  const totalMortgages = Math.abs(
    metricOr(metrics, "totalmortgages", calculatedMortgages)
  );

  const allocationItems = Object.values(
    current.reduce<Record<string, { name: string; value: number }>>(
      (countries, project) => {
        const name = countryLabel(project.country);
        const value = projectPortfolioValue(project);

        if (value <= 0) return countries;

        countries[name] ??= { name, value: 0 };
        countries[name].value += value;

        return countries;
      },
      {}
    )
  ).sort((a, b) => b.value - a.value);

  const allocationTotal = allocationItems.reduce((sum, item) => sum + item.value, 0);

  const allocationLimit = 6;
  const visibleAllocation =
    allocationItems.length > allocationLimit
      ? [
          ...allocationItems.slice(0, allocationLimit - 1),
          {
            name: "Other",
            value: allocationItems
              .slice(allocationLimit - 1)
              .reduce((sum, item) => sum + item.value, 0),
          },
        ]
      : allocationItems;

  const allocationColors = [
    COLORS.cypress,
    COLORS.pool,
    COLORS.brass,
    COLORS.travertine,
    COLORS.ink,
    "#B9A98C",
  ];

  let allocationCursor = 0;
  const allocationGradient =
    visibleAllocation
      .map((item, index) => {
        const share = allocationTotal > 0 ? (item.value / allocationTotal) * 100 : 0;
        const start = allocationCursor;
        allocationCursor += share;

        return `${allocationColors[index % allocationColors.length]} ${start}% ${allocationCursor}%`;
      })
      .join(", ") || `${COLORS.travertine} 0% 100%`;

  const currentPages = current;
  const pipelinePages = chunkArray(pipeline, 2);
  const soldPages = chunkArray(sold, 2);

  return (
    <main className="min-h-screen bg-[#FAF7EE] text-[#0E0E12] overflow-x-auto">
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 297mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: ${COLORS.ivory} !important;
          }

          main {
            margin: 0 !important;
            padding: 0 !important;
            background: ${COLORS.ivory} !important;
          }

          .a4-page {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            break-after: page;
            page-break-after: always;
            overflow: hidden !important;
          }

          .a4-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
          }
        }

        @media screen {
          .a4-page {
            margin: 24px auto;
            box-shadow: 0 20px 80px rgba(14,14,18,0.12);
          }
        }
      `}</style>

      <A4Page>
        <Header />

        <div className="grid grid-cols-[1fr_0.82fr] gap-[5mm] mt-[6mm]">
          <div>
            <SectionHeader number="01" label="Overview" title="Portfolio Metrics" />

            <div className="grid grid-cols-4 gap-[2mm]">
              <MetricCard label="Portfolio Value" value={money(portfolioValue)} />
              <MetricCard label="Expected Profit" value={money(expectedProfit)} accent />
              <MetricCard label="Current Projects" value={String(currentCount)} />
              <MetricCard label="Pipeline Projects" value={String(pipelineCount)} />
            </div>

            <div className="grid grid-cols-4 gap-[2mm] mt-[2mm]">
              <MetricCard label="Sold Projects" value={String(soldCount)} />
              <MetricCard label="Track Record Revenue" value={money(totalSalesRevenue)} />
              <MetricCard label="Realized Gross Profit" value={money(realizedGrossProfit)} accent />
              <MetricCard label="Total Mortgages" value={money(totalMortgages)} />
            </div>

            <div className="mt-[6mm]">
  <SectionHeader
    number="03"
    label="Capital Stack"
    title="Mortgage vs Equity"
  />

  <CapitalStackCard
    expectedEndValue={portfolioValue}
    totalMortgages={totalMortgages}
  />
</div>
</div>

          <div>
            <SectionHeader
              number="02"
              label="Country Allocation"
              title="Portfolio Value by Country"
            />

            <div className="bg-white border border-[#E4D8C2] rounded-xl p-[5mm] h-[118mm]">
              <div
                className="w-[58mm] h-[58mm] rounded-full relative mx-auto mt-[4mm]"
                style={{ background: `conic-gradient(${allocationGradient})` }}
              >
                <div className="absolute inset-[16mm] rounded-full bg-white" />
              </div>

              <div className="mt-[8mm] space-y-[3mm]">
                {visibleAllocation.map((item, index) => {
                  const share =
                    allocationTotal > 0 ? (item.value / allocationTotal) * 100 : 0;

                  return (
                    <div
                      key={item.name}
                      className="grid grid-cols-[10px_1fr_auto] gap-3 text-[11px]"
                    >
                      <span
                        className="w-[9px] h-[9px] rounded-full mt-[3px]"
                        style={{
                          background: allocationColors[index % allocationColors.length],
                        }}
                      />
                      <div>
                        <p className="font-bold leading-tight">{item.name}</p>
                        <p className="text-gray-500 mt-1">{money(item.value)}</p>
                      </div>
                      <p className="font-bold">{share.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </A4Page>

      {currentPages.map((project, index) => (
        <A4Page key={`${clean(project.country)}-${clean(project.project)}-${index}`}>
          <ProjectDetailPage project={project} pageIndex={index + 1} totalPages={current.length} />
          <Footer />
        </A4Page>
      ))}

      {pipelinePages.map((projects, index) => (
        <A4Page key={`pipeline-${index}`}>
          <SectionHeader number="05" label="Pipeline" title="Upcoming Projects" />

          <div className="grid grid-cols-2 gap-[5mm] mt-[5mm]">
            {projects.map((project) => (
              <PipelineCard key={`${clean(project.country)}-${clean(project.project)}`} project={project} />
            ))}
          </div>

          <Footer />
        </A4Page>
      ))}

      {soldPages.map((projects, index) => (
        <A4Page key={`sold-${index}`}>
          <SectionHeader number="06" label="Sold Track Record" title="Realized Projects" />

          <div className="grid grid-cols-2 gap-[5mm] mt-[5mm]">
            {projects.map((project) => (
              <SoldProjectCard key={`${clean(project.country)}-${clean(project.project)}`} project={project} />
            ))}
          </div>

          <Footer />
        </A4Page>
      ))}
    </main>
  );
}

function A4Page({ children }: { children: ReactNode }) {
  return (
    <section className="a4-page w-[297mm] h-[210mm] bg-[#FAF7EE] p-[9mm] overflow-hidden relative">
      <img
        src="/leovari-logo.png"
        alt="Leovari"
        className="absolute top-[7mm] right-[9mm] w-[26mm] h-auto object-contain z-20"
      />

      {children}
    </section>
  );
}

function Header() {
  return (
    <header className="flex justify-between items-start border-b border-[#E4D8C2] pb-[5mm]">
      <div>
        <p className="text-[10px] uppercase tracking-[0.45em] text-[#2B3A33] font-bold">
          Confidential Portfolio Report
        </p>
        <h1 className="text-[34px] leading-none font-bold text-[#2B3A33] mt-3">
          Complete Real Estate Portfolio
        </h1>
        <p className="text-[12px] mt-3">
          The Netherlands &amp; Spain <span className="mx-2">·</span> Live Google Sheets data
        </p>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="absolute bottom-[6mm] left-[9mm] right-[9mm] flex justify-between text-[9px] text-gray-500 border-t border-[#E4D8C2] pt-[2mm]">
      <span>Confidential · Not for distribution</span>
      <span>All values in EUR</span>
    </footer>
  );
}

function SectionHeader({
  number,
  label,
  title,
}: {
  number: string;
  label: string;
  title: string;
}) {
  return (
    <>
      <p className="text-[10px] uppercase tracking-[0.42em] text-[#2B3A33] font-bold">
        {number} · {label}
      </p>
      <h2 className="text-[22px] font-bold mt-1">{title}</h2>
    </>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white border border-[#E4D8C2] rounded-lg p-[4mm] h-[27mm]">
      <p className="text-[7.5px] uppercase tracking-[0.25em] text-gray-500 font-bold leading-tight">
        {label}
      </p>
      <p className={`text-[17px] font-bold mt-2 leading-none ${accent ? "text-[#2B3A33]" : ""}`}>
        {value}
      </p>
    </div>
  );
}
function CapitalStackCard({
  expectedEndValue,
  totalMortgages,
}: {
  expectedEndValue: number;
  totalMortgages: number;
}) {
  const netEquityValue = expectedEndValue - totalMortgages;

  const mortgagePct =
    expectedEndValue > 0 ? (totalMortgages / expectedEndValue) * 100 : 0;

  const equityPct =
    expectedEndValue > 0 ? (netEquityValue / expectedEndValue) * 100 : 0;

  const mortgageBarPct = Math.min(Math.max(mortgagePct, 0), 100);
  const equityBarPct = Math.min(Math.max(equityPct, 0), 100);

  return (
    <div className="bg-white border border-[#E4D8C2] rounded-xl p-[5mm]">
      <div className="flex items-start justify-between gap-[5mm]">
      <div>
  <p className="text-[10px] uppercase tracking-[0.25em] text-[#8C6F47] font-bold">
    Net Equity in Portfolio
  </p>
  <p className="text-[22px] leading-none font-bold text-[#2B3A33] mt-[2mm]">
    {money(netEquityValue)}
  </p>
  <p className="text-[10px] text-gray-500 mt-[1mm]">
    Expected End Value - Mortgages
  </p>
</div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold">
            Portfolio LTV
          </p>
          <p className="text-[22px] leading-none font-bold text-[#8C6F47] mt-[2mm]">
            {mortgagePct.toFixed(1)}%
          </p>
          <p className="text-[10px] text-gray-500 mt-[1mm]">
            Mortgage / End Value
          </p>
        </div>
      </div>

      <div className="mt-[6mm]">
        <div className="flex justify-between text-[10px] font-bold mb-[2mm]">
          <span className="text-[#8C6F47]">
            Mortgage {mortgagePct.toFixed(1)}%
          </span>
          <span className="text-[#2B3A33]">
            Equity {equityPct.toFixed(1)}%
          </span>
        </div>

        <div className="h-[13mm] rounded-full overflow-hidden flex bg-[#E4D8C2]">
          <div
            className="h-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{
              width: `${mortgageBarPct}%`,
              backgroundColor: COLORS.cypress,
            }}
          >
            {mortgageBarPct >= 16 ? "Mortgage" : ""}
          </div>

          <div
            className="h-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{
              width: `${equityBarPct}%`,
              backgroundColor: COLORS.pool,
            }}
          >
            {equityBarPct >= 16 ? "Equity" : ""}
          </div>
        </div>
      </div>

      
    </div>
  );
}

function CapitalMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "brass" | "cypress";
}) {
  const color =
    accent === "brass"
      ? COLORS.brass
      : accent === "cypress"
        ? COLORS.cypress
        : COLORS.ink;

  return (
    <div className="bg-[#FAF7EE] border border-[#E4D8C2] rounded-lg p-[3mm]">
      <p className="text-[8px] uppercase tracking-[0.16em] text-gray-400 font-bold leading-tight">
        {label}
      </p>
      <p
        className="text-[12px] leading-tight font-bold mt-[2mm]"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-[#E4D8C2] rounded-xl p-[4mm] h-[61mm]">
      <p className="text-[8px] uppercase tracking-[0.25em] text-gray-500 font-bold mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function MiniBarGroup({
  name,
  rows,
}: {
  name: string;
  rows: { label: string; value: number; max: number; color: string }[];
}) {
  return (
    <div className="mb-[4mm]">
      <p className="text-[10px] font-bold mb-2">{name}</p>

      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-[8px] text-gray-500 mb-1">
              <span>{row.label}</span>
              <span>{money(row.value)}</span>
            </div>

            <div className="h-[2.5mm] bg-[#FAF7EE] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  background: row.color,
                  width: `${Math.max((row.value / row.max) * 100, 3)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectDetailPage({
  project,
  pageIndex,
  totalPages,
}: {
  project: CsvRow;
  pageIndex: number;
  totalPages: number;
}) {
  const name = clean(project.project);
  const photo = projectPhoto(project);

  const purchase = projectPurchase(project);
  const renovation = projectRenovation(project);
  const totalCost = projectTotalCost(project);
  const end = projectPortfolioValue(project);
  const reportedProfit = parseNumber(project.expectedgrossprofit);
  const valueUplift = Math.max(end - totalCost, 0);
  const profit = reportedProfit || valueUplift;
  const profitLabel = reportedProfit > 0 ? "Expected Profit" : "Value Uplift";
  const roi =
    parsePercentage(project.expectedroi || project.roi) ||
    (totalCost > 0 ? (profit / totalCost) * 100 : 0);
  const mortgage = Math.abs(parseNumber(project.mortgage));
  const netRentalIncome = parseNumber(project.netyearlyrentalincome);
  const propertyLtv = end > 0 ? (mortgage / end) * 100 : 0;

  const plotSize = clean(project.plotsizem || project.plotsizem2 || project.plotsize);
  const builtArea = clean(project.builtaream || project.builtaream2 || project.builtarea);
  const bedrooms = clean(project.bedrooms);
  const bathrooms = clean(project.bathrooms);
  const targetCompletion = clean(project.targetcompletion);
  const country = clean(project.country);
  const valueLabel = hasValue(project.expectedsalesvalue)
    ? "Expected Exit Value"
    : "Current Value";

  return (
    <>
      <div className="flex justify-between items-end border-b border-[#E4D8C2] pb-[4mm]">
        <div>
          <SectionHeader
            number="04"
            label={`${country || "Complete"} · Current Portfolio`}
            title={name}
          />
          <p className="text-[11px] text-gray-600 mt-2">{project.address}</p>
        </div>

        <p className="text-[10px] text-gray-500">
          Project {pageIndex} of {totalPages}
        </p>
      </div>

      <div className="grid grid-cols-[1.05fr_0.95fr] gap-[6mm] mt-[5mm]">
        <div>
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-full h-[98mm] object-cover rounded-xl border border-[#E4D8C2]"
            />
          ) : (
            <div className="w-full h-[98mm] rounded-xl bg-[#E4D8C2] border border-[#E4D8C2] flex items-center justify-center text-center px-[10mm]">
              <div>
                <p className="text-[15px] font-bold">{name}</p>
                <p className="text-[10px] text-gray-500 mt-2">
                  Add this project to PORTFOLIO.photos to display an image.
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="grid grid-cols-3 gap-[3mm]">
            <BigMetric label={valueLabel} value={money(end)} dark />
            <BigMetric label={profitLabel} value={money(profit)} pool />
            {roi > 0 && <BigMetric label="ROI" value={`${roi.toFixed(1)}%`} travertine />}
          </div>

          <div className="mt-[5mm]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#8C6F47] font-bold mb-[2mm]">
              Value Creation
            </p>

            <StackBar
              purchase={purchase}
              renovation={renovation}
              profit={profit}
              profitLabel={profitLabel}
            />
          </div>

          <div className="bg-white border border-[#E4D8C2] rounded-xl p-[5mm] mt-[5mm]">
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#2B3A33] font-bold mb-[4mm]">
              Project Memorandum
            </p>

            <div className="grid grid-cols-2 gap-x-[8mm] gap-y-[2.5mm] text-[11px]">
              {hasValue(plotSize) && <Fact label="Plot Size" value={`${plotSize} m²`} />}
              <Fact label="Purchase" value={money(purchase)} />

              {hasValue(builtArea) && <Fact label="Built Area" value={`${builtArea} m²`} />}
              <Fact label="Renovation" value={money(renovation)} />

              {hasValue(bedrooms) && <Fact label="Bedrooms" value={bedrooms} />}
              <Fact label="Total Cost" value={money(totalCost)} />

              {hasValue(bathrooms) && <Fact label="Bathrooms" value={bathrooms} />}
              <Fact label={valueLabel} value={money(end)} />

              {mortgage > 0 && <Fact label="Mortgage" value={money(mortgage)} />}
              {mortgage > 0 && <Fact label="Property LTV" value={`${propertyLtv.toFixed(1)}%`} />}

              {netRentalIncome > 0 && (
                <Fact label="Net Yearly Rental Income" value={money(netRentalIncome)} green />
              )}
              {profit > 0 && <Fact label={profitLabel} value={money(profit)} green />}

              {hasValue(targetCompletion) && (
                <Fact label="Completion" value={targetCompletion} />
              )}
            </div>
          </div>

          {(hasValue(project.exitstrategy) || hasValue(project.notes)) && (
            <div className="border-t border-[#0E0E12] mt-[5mm] pt-[3mm] text-[11px] leading-snug">
              {hasValue(project.exitstrategy) && (
                <p>
                  <strong>Exit Strategy:</strong> {project.exitstrategy}
                </p>
              )}
              {hasValue(project.notes) && (
                <p className="mt-2">
                  <strong>Notes:</strong> {project.notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PipelineCard({ project }: { project: CsvRow }) {
  const name = clean(project.project);
  const location = clean(project.location);
  const purchase = parseNumber(project.expectedpurchaseprice);
  const renovation = projectRenovation(project);
  const expectedCost = projectTotalCost(project) || purchase + renovation;
  const end = projectPortfolioValue(project);
  const strategy = clean(project.expectedexitstrategy);
  const status = clean(project.status || project.notes);
  const plotSize = clean(project.plotsizem || project.plotsizem2 || project.plotsize);
  const builtArea = clean(project.builtaream || project.builtaream2 || project.builtarea);
  const mapImage = clean(project.mapimage || project.mapimageurl);
  const coverImage = mapImage || projectPhoto(project);
  const badgeLabel = clean(project.badgelabel || project.type) || "Project";

  return (
    <div className="bg-white border border-[#E4D8C2] rounded-xl overflow-hidden h-[147mm]">
      {hasValue(coverImage) ? (
        <img
          src={coverImage}
          alt={`${name} location`}
          className="w-full h-[55mm] object-cover"
        />
      ) : (
        <div className="w-full h-[55mm] bg-[#E4D8C2] flex items-center justify-center text-[10px] text-gray-500">
          Project image / location
        </div>
      )}

      <div className="p-[5mm]">
        <div className="flex justify-between gap-[5mm]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.28em] text-gray-400 font-bold">
              {clean(project.country)} · Pipeline Project
            </p>
            <h3 className="text-[19px] font-bold mt-2">{name}</h3>
            {hasValue(location) && (
              <p className="text-[11px] text-gray-600 mt-2 leading-snug">{location}</p>
            )}
          </div>

          <span className="h-fit bg-[#8C6F47] text-white rounded-full px-4 py-2 text-[9px] uppercase font-bold">
            {badgeLabel}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-[3mm] mt-[6mm]">
          <TinyMetric label="Expected Cost" value={expectedCost > 0 ? money(expectedCost) : "TBD"} />
          <TinyMetric label="Expected Exit" value={end > 0 ? money(end) : "TBD"} />
          {hasValue(plotSize) && <TinyMetric label="Plot Size" value={`${plotSize} m²`} />}
          {hasValue(builtArea) && <TinyMetric label="Built Area" value={`${builtArea} m²`} />}
        </div>

        <div className="text-[11px] mt-[6mm] space-y-2 leading-snug">
          {hasValue(strategy) && (
            <p>
              <strong>Strategy:</strong> {strategy}
            </p>
          )}

          {hasValue(status) && (
            <p>
              <strong>Status:</strong> {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SoldProjectCard({ project }: { project: CsvRow }) {
  const name = clean(project.project);
  const photo = projectPhoto(project);

  const purchase = projectPurchase(project);
  const renovation = parseNumber(project.renovationcosts) || projectRenovation(project);
  const totalInvestment = parseNumber(project.totalinvestment) || purchase + renovation;
  const sale = parseNumber(project.saleprice);
  const profit = parseNumber(project.realizedgrossprofit);
  const roi =
    parsePercentage(project.roi) ||
    (totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0);

  const plotSize = clean(project.plotsizem || project.plotsizem2 || project.plotsize);
  const builtArea = clean(project.builtaream || project.builtaream2 || project.builtarea);
  const holdingPeriod = clean(project.holdingperiodmonths || project.holdingperiod);

  return (
    <div className="bg-white border border-[#E4D8C2] rounded-xl overflow-hidden h-[147mm]">
      {photo ? (
        <img src={photo} alt={name} className="w-full h-[53mm] object-cover" />
      ) : (
        <div className="w-full h-[53mm] bg-[#E4D8C2] flex items-center justify-center text-[10px] text-gray-500">
          Add a Photo URL in Google Sheets
        </div>
      )}

      <div className="p-[5mm]">
        <p className="text-[9px] uppercase tracking-[0.28em] text-gray-400 font-bold">
          {clean(project.country)} · Realized Project
        </p>
        <h3 className="text-[20px] font-bold mt-2">{name}</h3>
        <p className="text-[11px] text-gray-600 mt-2 leading-snug h-[12mm] overflow-hidden">
          {project.address}
        </p>

        <div className="grid grid-cols-3 gap-[3mm] mt-[5mm]">
          <BigMetric label="Sale Price" value={money(sale)} dark small />
          <BigMetric label="Profit" value={money(profit)} pool small />
          {roi > 0 && <BigMetric label="ROI" value={`${roi.toFixed(1)}%`} small />}
        </div>

        <div className="bg-white border border-[#E4D8C2] rounded-xl p-[4mm] mt-[5mm]">
          <p className="text-[8px] uppercase tracking-[0.22em] text-[#2B3A33] font-bold mb-[3mm]">
            Deal Summary
          </p>

          <div className="grid grid-cols-2 gap-x-[6mm] gap-y-[1.8mm] text-[10px]">
            <Fact label="Purchase" value={money(purchase)} />
            {hasValue(plotSize) && <Fact label="Plot Size" value={`${plotSize} m²`} />}

            <Fact label="Renovation" value={money(renovation)} />
            {hasValue(builtArea) && <Fact label="Built Area" value={`${builtArea} m²`} />}

            <Fact label="Total Investment" value={money(totalInvestment)} />
            {hasValue(holdingPeriod) && (
              <Fact label="Holding Period" value={`${holdingPeriod} months`} />
            )}

            <Fact label="Realized Profit" value={money(profit)} green />
          </div>
        </div>
      </div>
    </div>
  );
}
function StackBar({
  purchase,
  renovation,
  profit,
  profitLabel = "Profit",
}: {
  purchase: number;
  renovation: number;
  profit: number;
  profitLabel?: string;
}) {
  const total = purchase + renovation + profit;

  const segments = [
    {
      label: "Purchase",
      value: purchase,
      color: COLORS.cypress,
    },
    {
      label: "Renovation",
      value: renovation,
      color: COLORS.brass,
    },
    {
      label: profitLabel,
      value: profit,
      color: COLORS.pool,
    },
  ].filter((segment) => segment.value > 0);

  if (total <= 0) return null;

  return (
    <div className="bg-white border border-[#E4D8C2] rounded-xl p-[4mm]">
      <div className="h-[10mm] rounded-full overflow-hidden flex bg-[#E4D8C2]">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="h-full"
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-[2mm] mt-[4mm]">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-start gap-2">
            <span
              className="w-[8px] h-[8px] rounded-full mt-[3px] shrink-0"
              style={{ backgroundColor: segment.color }}
            />

            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-bold">
                {segment.label}
              </p>
              <p className="text-[12px] font-bold text-[#0E0E12] mt-1">
                {money(segment.value)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function BigMetric({
  label,
  value,
  dark = false,
  pool = false,
  travertine = false,
  small = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
  pool?: boolean;
  travertine?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-[4mm] ${
        dark
          ? "bg-[#0E0E12] text-white"
          : pool
          ? "bg-[#7FA8A4] text-white"
          : "bg-[#FAF7EE]"
      }`}
    >
      <p className="text-[7px] uppercase tracking-[0.2em] opacity-75 font-bold leading-tight">
        {label}
      </p>
      <p className={`${small ? "text-[16px]" : "text-[24px]"} font-bold mt-2 leading-none`}>
        {value}
      </p>
    </div>
  );
}

function TinyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[7px] uppercase tracking-[0.18em] text-gray-500 font-bold leading-tight">
        {label}
      </p>
      <p className="text-[11px] font-bold mt-1">{value}</p>
    </div>
  );
}

function Fact({
  label,
  value,
  green = false,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto] gap-3 leading-tight ${
        green ? "text-[#2B3A33]" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}