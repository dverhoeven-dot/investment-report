import { PORTFOLIO } from "../portfolio";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CsvRow = Record<string, string>;

function clean(value: unknown) {
  return String(value ?? "").replaceAll('"', "").replaceAll("\r", "").trim();
}

function keyName(value: string) {
  return clean(value)
    .replaceAll("€", "")
    .replaceAll("(€)", "")
    .replaceAll("%", "")
    .replace(/[^\w]/g, "")
    .toLowerCase();
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      result.push(clean(current));
      current = "";
    } else current += char;
  }

  result.push(clean(current));
  return result;
}

function parseNumber(value: string | number | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const cleaned = String(value)
    .replaceAll("€", "")
    .replaceAll("%", "")
    .replaceAll(".", "")
    .replaceAll(",", ".")
    .trim();

  return Number(cleaned) || 0;
}

function money(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function hasValue(value: unknown) {
  const cleaned = String(value ?? "")
    .replaceAll('"', "")
    .replaceAll("\r", "")
    .replaceAll("\n", "")
    .trim();

  return cleaned !== "" && cleaned !== "-" && cleaned !== "—";
}

function getPhotos(name: string) {
  return (
    Object.entries(PORTFOLIO.photos).find(
      ([projectName]) =>
        projectName.toLowerCase().trim() === name.toLowerCase().trim()
    )?.[1] || []
  );
}

async function fetchCsv(url: string): Promise<CsvRow[]> {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  const lines = text.split("\n").filter(Boolean);
  const headers = splitCsvLine(lines[0]).map(keyName);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

export default async function PortfolioPage() {
  const sold = await fetchCsv(PORTFOLIO.soldProjects);
  const current = await fetchCsv(PORTFOLIO.currentProjects);

  const totalSalesRevenue = sold.reduce(
    (sum, p) => sum + parseNumber(p.saleprice),
    0
  );

  const realizedGrossProfit = sold.reduce(
    (sum, p) => sum + parseNumber(p.realizedgrossprofit),
    0
  );

  const expectedEndValue = current.reduce(
    (sum, p) => sum + parseNumber(p.expectedendvalue),
    0
  );

  const totalMortgages = current.reduce(
    (sum, p) => sum + parseNumber(p.mortgage),
    0
  );

  const expectedProfit = current.reduce(
    (sum, p) => sum + parseNumber(p.expectedgrossprofit),
    0
  );

  const portfolioValue = totalSalesRevenue + expectedEndValue;

  return (
    <main className="min-h-screen bg-[#f7f7f3] text-[#111] px-4 sm:px-8 lg:px-10 py-8 lg:py-12">
      <section className="max-w-6xl mx-auto">
        <div className="border-b-4 border-black pb-6 mb-10">
          <p className="text-xs uppercase tracking-[0.35em] text-gray-500 font-bold">
            Confidential Portfolio Report
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold mt-3">
            Spanish Real Estate Portfolio
          </h1>
          <p className="text-gray-500 mt-2">
            L3 Capital · Live Google Sheets data
          </p>
        </div>

        <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">
          01 · Overview
        </p>
        <h2 className="text-3xl font-bold mt-2 mb-6">Portfolio Metrics</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-gray-300 bg-white mb-10">
          <Kpi label="Portfolio Value" value={money(portfolioValue)} />
          <Kpi label="Expected Profit" value={money(expectedProfit)} green />
          <Kpi label="Sold Projects" value={String(sold.length)} />
          <Kpi label="Current Projects" value={String(current.length)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          <InfoCard label="Track Record Revenue" value={money(totalSalesRevenue)} />
          <InfoCard label="Realized Gross Profit" value={money(realizedGrossProfit)} green />
          <InfoCard label="Total Mortgages" value={money(totalMortgages)} />
        </div>

        <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold mt-16">
          02 · Portfolio Value Creation
        </p>
        <h2 className="text-3xl font-bold mt-2 mb-6">Value Creation Overview</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
          <ChartCard title="Purchase Value vs End Value">
            {current.map((project) => {
              const name = clean(project.project);
              const purchase = parseNumber(project.purchaseprice);
              const end = parseNumber(project.expectedendvalue);
              const max =
                Math.max(...current.map((p) => parseNumber(p.expectedendvalue))) || 1;

              return (
                <div key={name} className="mb-5">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span>{name}</span>
                    <span>{money(end)}</span>
                  </div>

                  <div className="space-y-2">
                    <Bar label="Purchase" value={purchase} max={max} color="bg-black" />
                    <Bar label="End Value" value={end} max={max} color="bg-[#147a4d]" />
                  </div>
                </div>
              );
            })}
          </ChartCard>

          <ChartCard title="Expected Profit by Project">
            {current.map((project) => {
              const name = clean(project.project);
              const profit = parseNumber(project.expectedgrossprofit);
              const max =
                Math.max(...current.map((p) => parseNumber(p.expectedgrossprofit))) || 1;

              return (
                <div key={name} className="mb-5">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span>{name}</span>
                    <span className="text-[#147a4d]">{money(profit)}</span>
                  </div>

                  <Bar label="Profit" value={profit} max={max} color="bg-[#147a4d]" />
                </div>
              );
            })}
          </ChartCard>
        </div>

        <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">
          03 · Current Portfolio
        </p>
        <h2 className="text-3xl font-bold mt-2 mb-6">Active Projects</h2>

        <div className="space-y-10">
          {current.map((project) => {
            const name = clean(project.project);
            const photos = getPhotos(name);

            const purchase = parseNumber(project.purchaseprice);
            const renovation = parseNumber(project.expectedrenovationcosts);
            const end = parseNumber(project.expectedendvalue);
            const profit = parseNumber(project.expectedgrossprofit);
            const roi = parseNumber(project.expectedroi);

            const plotSize = clean(project.plotsizem || project.plotsizem2 || project.plotsize);
            const builtArea = clean(project.builtaream || project.builtaream2 || project.builtarea);
            const bedrooms = clean(project.bedrooms);
            const bathrooms = clean(project.bathrooms);
            const targetCompletion = clean(project.targetcompletion);

            return (
              <section
                key={name}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {photos[0] && (
                  <img
                    src={photos[0]}
                    alt={name}
                    className="w-full h-[320px] object-cover"
                  />
                )}

                <div className="p-8">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">
                    Current Project
                  </p>
                  <h3 className="text-3xl font-bold mt-2">{name}</h3>
                  <p className="text-gray-500 mt-2">{project.address}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <BigMetric label="Expected Exit Value" value={money(end)} dark />
                    <BigMetric label="Expected Profit" value={money(profit)} green />
                    {roi > 0 && <BigMetric label="ROI" value={`${roi.toFixed(1)}%`} />}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <DetailBox title="Project Facts">
                      {hasValue(plotSize) && <Fact label="Plot Size" value={`${plotSize} m²`} />}
                      {hasValue(builtArea) && <Fact label="Built Area" value={`${builtArea} m²`} />}
                      {hasValue(bedrooms) && <Fact label="Bedrooms" value={bedrooms} />}
                      {hasValue(bathrooms) && <Fact label="Bathrooms" value={bathrooms} />}
                      {hasValue(targetCompletion) && (
                        <Fact label="Completion" value={targetCompletion} />
                      )}
                    </DetailBox>

                    <DetailBox title="Investment Summary">
                      <Fact label="Purchase" value={money(purchase)} />
                      <Fact label="Renovation" value={money(renovation)} />
                      <Fact label="Total Cost" value={money(purchase + renovation)} />
                      <Fact label="Expected Sales Value" value={money(end)} />
                      <Fact label="Profit" value={money(profit)} green />
                    </DetailBox>
                  </div>

                  <div className="mt-8">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-bold mb-3">
                      Value Creation
                    </p>
                    <StackBar purchase={purchase} renovation={renovation} profit={profit} />
                  </div>

                  <div className="mt-8 border-t pt-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-bold">
                      Exit Strategy
                    </p>
                    <p className="mt-2">{project.exitstrategy}</p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold mt-16">
          04 · Sold Track Record
        </p>
        <h2 className="text-3xl font-bold mt-2 mb-6">Realized Projects</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {sold.map((project) => {
            const name = clean(project.project);
            const photos = getPhotos(name);

            const purchase = parseNumber(project.purchaseprice);
            const renovation = parseNumber(project.renovationcosts);
            const sale = parseNumber(project.saleprice);
            const profit = parseNumber(project.realizedgrossprofit);
            const roi = parseNumber(project.roi);

            const plotSize = clean(project.plotsizem || project.plotsizem2 || project.plotsize);
            const builtArea = clean(project.builtaream || project.builtaream2 || project.builtarea);
            const holdingPeriod = clean(project.holdingperiodmonths || project.holdingperiod);

            return (
              <section
                key={name}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {photos[0] && (
                  <img
                    src={photos[0]}
                    alt={name}
                    className="w-full h-[260px] object-cover"
                  />
                )}

                <div className="p-7">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">
                    Realized Project
                  </p>

                  <h3 className="text-3xl font-bold mt-2">{name}</h3>
                  <p className="text-gray-500 mt-2">{project.address}</p>

                  <div className="grid grid-cols-3 gap-4 mt-7">
                    <BigMetric label="Sale Price" value={money(sale)} dark small />
                    <BigMetric label="Profit" value={money(profit)} green small />
                    {roi > 0 && <BigMetric label="ROI" value={`${roi.toFixed(1)}%`} small />}
                  </div>

                  <div className="mt-7 border border-gray-200 rounded-xl p-6">
  <div className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-5">
    Deal Summary
  </div>

  <div className="space-y-3 text-sm">
    <Fact label="Purchase" value={money(purchase)} />
    <Fact label="Renovation" value={money(renovation)} />
    <Fact label="Total Investment" value={money(purchase + renovation)} />
    <Fact label="Realized Profit" value={money(profit)} green />

    {hasValue(plotSize) && (
      <Fact label="Plot Size" value={`${plotSize} m²`} />
    )}

    {hasValue(builtArea) && (
      <Fact label="Built Area" value={`${builtArea} m²`} />
    )}

    {hasValue(holdingPeriod) && (
      <Fact
        label="Holding Period"
        value={`${holdingPeriod} months`}
      />
    )}
  </div>
</div>
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Kpi({
  label,
  value,
  green = false,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="p-6 border-r border-gray-200 last:border-r-0">
      <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-bold">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-2 ${green ? "text-[#147a4d]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  green = false,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-bold">
        {label}
      </p>
      <p className={`text-3xl font-bold mt-2 ${green ? "text-[#147a4d]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function BigMetric({
  label,
  value,
  dark = false,
  green = false,
  small = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
  green?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${
        dark
          ? "bg-black text-white"
          : green
          ? "bg-[#147a4d] text-white"
          : "bg-gray-100"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.25em] opacity-70">
        {label}
      </div>
      <div className={`${small ? "text-xl" : "text-4xl"} font-bold mt-2 whitespace-nowrap`}>
        {value}
      </div>
    </div>
  );
}

function DetailBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <div className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-5">
        {title}
      </div>
      <div className="space-y-4">{children}</div>
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
    <div className={`flex justify-between ${green ? "text-[#147a4d]" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StackBar({
  purchase,
  renovation,
  profit,
}: {
  purchase: number;
  renovation: number;
  profit: number;
}) {
  const total = purchase + renovation + profit || 1;

  return (
    <div>
      <div className="flex h-8 rounded-md overflow-hidden text-white text-xs font-bold">
        <div
          className="bg-black flex items-center justify-center"
          style={{ width: `${(purchase / total) * 100}%` }}
        >
          Purchase
        </div>
        <div
          className="bg-[#6a675e] flex items-center justify-center"
          style={{ width: `${(renovation / total) * 100}%` }}
        >
          Renovation
        </div>
        <div
          className="bg-[#147a4d] flex items-center justify-center"
          style={{ width: `${(profit / total) * 100}%` }}
        >
          Profit
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-bold mb-6">
        {title}
      </p>
      {children}
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{money(value)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${Math.max((value / max) * 100, 3)}%` }}
        />
      </div>
    </div>
  );
}