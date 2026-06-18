import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REPORTDATA_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSAh0SETpPSy_H-xXq-EQweLnUcvbEwoBqIp5QD9mFEquqLAceyabdeyo4sJEpGV3s4LjYDN6Z1lTA/pub?gid=81309822&single=true&output=tsv";

const CASHFLOW_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSAh0SETpPSy_H-xXq-EQweLnUcvbEwoBqIp5QD9mFEquqLAceyabdeyo4sJEpGV3s4LjYDN6Z1lTA/pub?gid=1281963356&single=true&output=csv";

const EXIT_TIMELINE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSAh0SETpPSy_H-xXq-EQweLnUcvbEwoBqIp5QD9mFEquqLAceyabdeyo4sJEpGV3s4LjYDN6Z1lTA/pub?gid=1488394284&single=true&output=csv";

const SALE_SENSITIVITY_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSAh0SETpPSy_H-xXq-EQweLnUcvbEwoBqIp5QD9mFEquqLAceyabdeyo4sJEpGV3s4LjYDN6Z1lTA/pub?gid=1161652721&single=true&output=tsv";

const PROJECT_COST_SENSITIVITY_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSAh0SETpPSy_H-xXq-EQweLnUcvbEwoBqIp5QD9mFEquqLAceyabdeyo4sJEpGV3s4LjYDN6Z1lTA/pub?gid=1902577654&single=true&output=tsv";

const PURCHASE_SENSITIVITY_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSAh0SETpPSy_H-xXq-EQweLnUcvbEwoBqIp5QD9mFEquqLAceyabdeyo4sJEpGV3s4LjYDN6Z1lTA/pub?gid=1171110990&single=true&output=tsv";

function cleanText(value?: string) {
  return String(value || "")
    .replaceAll('"', "")
    .replaceAll("\r", "")
    .trim();
}

function keyName(value: string) {
  return cleanText(value).replace(/\s+/g, "").toLowerCase();
}

function parseNumber(value?: string) {
  const cleaned = cleanText(value)
    .replaceAll("€", "")
    .replaceAll("%", "")
    .replaceAll(" ", "")
    .replaceAll(".", "")
    .replace(",", ".");

  const number = Number(cleaned);
  return Number.isNaN(number) ? null : number;
}

function money(value?: string | number) {
  const number =
    typeof value === "number" ? value : parseNumber(String(value || ""));

  if (number === null) return cleanText(String(value || ""));

  const sign = number < 0 ? "-" : "";
  const abs = Math.abs(number);

  return (
    sign +
    new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(abs)
  );
}

function percent(value?: string | number) {
  const number =
    typeof value === "number" ? value : parseNumber(String(value || ""));

  if (number === null) return cleanText(String(value || ""));

  const pct = Math.abs(number) <= 1 ? number * 100 : number;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

async function getRows(url: string) {
  const res = await fetch(`${url}&t=${Date.now()}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  const text = await res.text();
  const delimiter = text.includes("\t") ? "\t" : ",";

  const lines = text.trim().split("\n");
  const headers = lines[0].split(delimiter).map(keyName);

  return lines.slice(1).map((line) => {
    const values = line.split(delimiter).map(cleanText);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
  }) as Record<string, string>[];
}

async function getReportData() {
  const rows = await getRows(REPORTDATA_URL);
  return Object.fromEntries(
    rows.map((row) => [cleanText(row.key), cleanText(row.value)])
  ) as Record<string, string>;
}

function Row({
  label,
  value,
  bold = false,
  green = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-gray-200 py-1.5 text-[13px]">
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${green ? "text-[#1f7a4d]" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  green = false,
}: {
  label: string;
  value: string;
  sub?: string;
  green?: boolean;
}) {
  return (
    <div className="border border-gray-300 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">
        {label}
      </div>
      <div className={`mt-1 text-[18px] font-bold leading-tight ${green ? "text-[#1f7a4d]" : "text-black"}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[10px] text-gray-400">{sub}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 border-b border-gray-200 pb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
      {children}
    </div>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto mb-8 min-h-[297mm] w-[210mm] bg-white px-[15mm] py-[14mm] shadow-sm print:mb-0 print:shadow-none">
      {children}
    </section>
  );
}

function SensitivityTable({
  title,
  assumption,
  rows,
}: {
  title: string;
  assumption: string;
  rows: Record<string, string>[];
}) {
  return (
    <div className="mt-7">
      <SectionLabel>{title}</SectionLabel>

      <div className="grid grid-cols-5 border-y border-gray-200 bg-gray-100 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
        <div className="pl-2"></div>
        <div>{assumption}</div>
        <div className="text-right">Net Profit</div>
        <div className="text-right">ROI</div>
        <div className="text-right pr-2">IRR</div>
      </div>

      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-5 border-b border-gray-200 py-1.5 text-[12px]">
          <div className="pl-2 font-semibold">{row.case}</div>
          <div>{money(row.assumption)}</div>
          <div className="text-right text-[#1f7a4d]">{money(row.netprofit)}</div>
          <div className="text-right text-[#1f7a4d]">{percent(row.roi)}</div>
          <div className="text-right pr-2 text-[#1f7a4d]">{percent(row.irr)}</div>
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const data = await getReportData();
  const cashFlowRows = await getRows(CASHFLOW_URL);
  const exitRows = await getRows(EXIT_TIMELINE_URL);
  const purchaseRows = await getRows(PURCHASE_SENSITIVITY_URL);
  const saleRows = await getRows(SALE_SENSITIVITY_URL);
  const projectCostRows = await getRows(PROJECT_COST_SENSITIVITY_URL);

  const netProfit = money(data.netProfit);
  const roi = percent(data.roi);
  const irr = percent(data.irr);

  const grossSale = parseNumber(data.grossSalePrice) || 1;
  const acquisitionPct = ((parseNumber(data.totalAcquisition) || 0) / grossSale) * 100;
  const projectPct = ((parseNumber(data.totalProjectCost) || 0) / grossSale) * 100;
  const commissionPct = ((parseNumber(data.agentCommission) || 0) / grossSale) * 100;
  const profitPct = ((parseNumber(data.netProfit) || 0) / grossSale) * 100;

  const cashMonth0 = Math.abs(parseNumber(cashFlowRows[0]?.outflow) || 0);
  const peakDeployed = Math.max(
    ...cashFlowRows.map((r) => parseNumber(r.runningcapital) || 0)
  );

  const cashByNotaryRow =
    cashFlowRows.find((r) =>
      cleanText(r.event).toLowerCase().includes("construction draw 1")
    ) || cashFlowRows.find((r) => cleanText(r.month) === "12");

  const cashByNotary = parseNumber(cashByNotaryRow?.runningcapital) || 0;
  const cashByNotaryPct = peakDeployed ? (cashByNotary / peakDeployed) * 100 : 0;

  const avgCapitalDuration = (() => {
    let total = 0;

    for (let i = 0; i < cashFlowRows.length - 1; i++) {
      const currentMonth = parseNumber(cashFlowRows[i].month) || 0;
      const nextMonth = parseNumber(cashFlowRows[i + 1].month) || currentMonth;
      const capital = parseNumber(cashFlowRows[i].runningcapital) || 0;

      if (capital > 0 && nextMonth > currentMonth) {
        total += capital * (nextMonth - currentMonth);
      }
    }

    return peakDeployed ? total / peakDeployed : 0;
  })();

  return (
    <main className="bg-[#f4f3ef] py-8 font-sans text-[#1b1b1b] print:bg-white print:py-0">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          section { page-break-after: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <Page>
        <header>
          <h1 className="text-[29px] font-bold leading-none">
            {data.projectTitle || "Naguëles Project"}
          </h1>
          <p className="mt-1 text-[12px] text-gray-400">
            {data.subtitle || "Deal Analysis · 15 June 2026 · Custom cash schedule"}
          </p>
          <div className="mt-4 border-t-[3px] border-black" />
        </header>

        <div className="mt-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
            01 · Overview
          </div>
          <h2 className="mt-1 text-[22px] font-bold leading-none">Deal Metrics</h2>
          <p className="mt-2 border-b border-gray-200 pb-3 text-[12px] text-gray-400">
            Headline return metrics, cost structure, and exit timeline.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-4">
          <Kpi label="Net Profit" value={netProfit} green />
          <Kpi label="ROI" value={roi} green />
          <Kpi label="IRR (48M Exit)" value={irr} green />
          <Kpi label="Capital Deployed" value={money(data.capitalDeployed)} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <SectionLabel>Acquisition</SectionLabel>
            <Row label="Purchase Price" value={money(data.purchasePrice)} />
            <Row label="Transfer Tax (7%)" value={money(data.transferTax)} />
            <div className="h-3" />
            <Row label="Lawyer Fee (1%)" value={money(data.lawyerFee)} />
            <Row label="Notary Fee (0.4%)" value={money(data.notaryFee)} />
            <Row label="Total Acquisition" value={money(data.totalAcquisition)} bold />
          </div>

          <div>
            <SectionLabel>Project</SectionLabel>
            <Row label="Type" value={data.projectType || ""} bold />
            <Row label="Surface" value={data.surface || ""} bold />
            <Row label="Duration" value={data.duration || ""} bold />
            <Row label="Base Build Cost" value={money(data.baseBuildCost)} bold />
            <Row label="Contingency (10%)" value={money(data.contingency)} />
            <Row label="Total Project Cost" value={money(data.totalProjectCost)} bold />
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel>Exit & Returns</SectionLabel>
          <Row label="Gross Sale Price" value={money(data.grossSalePrice)} bold />
          <Row label="Agent Commission (6%)" value={money(data.agentCommission)} />
          <Row label="Net Proceeds" value={money(data.netProceeds)} bold />
          <Row label="Net Profit / (Loss)" value={netProfit} bold green />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
              Where the sale price goes
            </div>
            <div className="text-[10px] text-gray-400">
              Gross sale {money(data.grossSalePrice)}
            </div>
          </div>

          <div className="flex h-7 overflow-hidden rounded-sm text-center text-[10px] font-bold text-white">
            <div className="bg-black pt-1.5" style={{ width: `${acquisitionPct}%` }}>
              {acquisitionPct.toFixed(0)}%
            </div>
            <div className="bg-[#5e5a52] pt-1.5" style={{ width: `${projectPct}%` }}>
              {projectPct.toFixed(0)}%
            </div>
            <div className="bg-[#aaa9a2]" style={{ width: `${commissionPct}%` }} />
            <div className="bg-[#1f7a4d] pt-1.5" style={{ width: `${profitPct}%` }}>
              {profitPct.toFixed(0)}%
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-500">
            <div>■ Acquisition&nbsp;&nbsp; {money(data.totalAcquisition)} · {acquisitionPct.toFixed(0)}%</div>
            <div>■ Build / project&nbsp;&nbsp; {money(data.totalProjectCost)} · {projectPct.toFixed(0)}%</div>
            <div>■ Commission&nbsp;&nbsp; {money(data.agentCommission)} · {commissionPct.toFixed(0)}%</div>
            <div className="text-[#1f7a4d]">
              ■ Net profit&nbsp;&nbsp; {netProfit} · {profitPct.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel>Returns by exit timeline</SectionLabel>

          <div className="grid grid-cols-4 border-y border-gray-200 bg-gray-100 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
            <div className="pl-2">Exit</div>
            <div className="text-right pr-2">Net Profit</div>
            <div className="text-right pr-2">ROI</div>
            <div className="text-right pr-2">IRR (Ann.)</div>
          </div>

          {exitRows.map((row, i) => (
            <div key={i} className="grid grid-cols-4 border-b border-gray-200 py-1.5 text-[12px]">
              <div className="pl-2 font-semibold">{row.exit || row.month}</div>
              <div className="text-right pr-2 text-[#1f7a4d]">{money(row.netprofit)}</div>
              <div className="text-right pr-2 text-[#1f7a4d]">{percent(row.roi)}</div>
              <div className="text-right pr-2 text-[#1f7a4d]">{percent(row.irr)}</div>
            </div>
          ))}
        </div>
      </Page>

      <Page>
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
          02 · Cash Plan
        </div>
        <h2 className="mt-1 text-[22px] font-bold leading-none">
          Capital Deployment Schedule
        </h2>
        <p className="mt-2 border-b border-gray-200 pb-4 text-[12px] text-gray-400">
          Custom schedule · 8 tranches · 48 months to exit
        </p>

        <div className="mt-5 grid grid-cols-4">
          <Kpi label="Cash @ Month 0" value={money(cashMonth0)} sub="Initial reservation deposit" />
          <Kpi label="Cash by Notary" value={money(cashByNotary)} sub={`By month 12 · ${cashByNotaryPct.toFixed(1)}% deployed`} />
          <Kpi label="Peak Deployed" value={money(peakDeployed)} sub="Maximum capital deployed" />
          <Kpi label="Avg. Capital Duration" value={`${avgCapitalDuration.toFixed(1)}m`} sub="Weighted by € × months" />
        </div>

        <div className="mt-6 rounded border border-gray-200 p-4">
          <div className="mb-3 flex justify-between">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
              Capital Deployment
            </div>
            <div className="text-[10px] text-gray-500">
              Peak <b>{money(peakDeployed)}</b>
            </div>
          </div>

          <svg viewBox="0 0 700 140" className="h-[140px] w-full">
            <defs>
              <linearGradient id="deploymentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111111" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#111111" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="25" y1="118" x2="680" y2="118" stroke="#e5e5e5" />
            <line x1="680" y1="15" x2="680" y2="118" stroke="#1f7a4d" strokeDasharray="3 3" />
            <path
              d="M25 112 C45 108, 65 104, 82 95 C105 83, 118 62, 152 55 C165 52, 178 50, 190 50 C222 50, 231 40, 265 36 C300 32, 320 22, 360 20 C405 18, 443 18, 480 13 C500 10, 515 9, 530 9 L680 9"
              fill="none"
              stroke="#1f1f1f"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M25 112 C45 108, 65 104, 82 95 C105 83, 118 62, 152 55 C165 52, 178 50, 190 50 C222 50, 231 40, 265 36 C300 32, 320 22, 360 20 C405 18, 443 18, 480 13 C500 10, 515 9, 530 9 L680 9 L680 118 L25 118 Z"
              fill="url(#deploymentFill)"
            />
            <text x="20" y="134" fontSize="9" fill="#999">m0</text>
            <text x="182" y="134" fontSize="9" fill="#999">m12</text>
            <text x="352" y="134" fontSize="9" fill="#999">m24</text>
            <text x="522" y="134" fontSize="9" fill="#999">m36</text>
            <text x="672" y="134" fontSize="9" fill="#999">m48</text>
          </svg>
        </div>

        <div className="mt-6">
          <SectionLabel>Cash Flow Detail</SectionLabel>

          <div className="grid grid-cols-5 border-y border-gray-200 bg-gray-100 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
            <div className="pl-2">Month</div>
            <div>Event</div>
            <div className="text-right">Outflow</div>
            <div className="text-right">Inflow</div>
            <div className="text-right pr-2">Running Capital</div>
          </div>

          {cashFlowRows.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-5 border-b border-gray-200 py-1.5 text-[11px] ${
                index === cashFlowRows.length - 1 ? "bg-[#eef6f0]" : ""
              }`}
            >
              <div className="pl-2">{row.month}</div>
              <div className="whitespace-nowrap font-semibold">{row.event}</div>
              <div className="text-right pr-2 text-red-800">
                {(parseNumber(row.outflow) || 0) === 0 ? "—" : money(row.outflow)}
              </div>
              <div className="text-right pr-2 text-[#1f7a4d] font-semibold">
                {(parseNumber(row.inflow) || 0) === 0 ? "—" : money(row.inflow)}
              </div>
              <div className="text-right pr-2">{money(row.runningcapital)}</div>
            </div>
          ))}
        </div>
      </Page>

      <Page>
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
          03 · Sensitivity
        </div>
        <h2 className="mt-1 text-[22px] font-bold leading-none">
          Sensitivity Analysis
        </h2>
        <p className="mt-2 border-b border-gray-200 pb-4 text-[12px] text-gray-400">
          Impact of key assumption variations, holding everything else constant.
        </p>

        <SensitivityTable title="Purchase Price Sensitivity" assumption="Purchase Price" rows={purchaseRows} />
        <SensitivityTable title="Sale Price Sensitivity" assumption="Sale Price" rows={saleRows} />
      </Page>

      <Page>
        <SensitivityTable title="Project Cost Sensitivity" assumption="Project Cost" rows={projectCostRows} />
      </Page>

      <Page>
        <div>
          <SectionLabel>Property Photos</SectionLabel>

          <div className="mt-4 space-y-3">
            <img src="/photos/photo1.jpg" alt="" className="h-[220px] w-full rounded object-cover" />

            <div className="grid grid-cols-2 gap-3">
              <img src="/photos/photo2.jpg" alt="" className="h-[160px] w-full rounded object-cover" />
              <img src="/photos/photo3.jpg" alt="" className="h-[160px] w-full rounded object-cover" />
            </div>
          </div>

          <div className="mt-5 border-t border-gray-200 pt-2 text-[11px] text-gray-300">
            15 June 2026 · Confidential — for internal use only
          </div>

          <div className="mt-8 h-[110mm] bg-[#f3f2ef]" />
        </div>
      </Page>
    </main>
  );
}