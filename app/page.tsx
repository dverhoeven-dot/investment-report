import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSAh0SETpPSy_H-xXq-EQweLnUcvbEwoBqIp5QD9mFEquqLAceyabdeyo4sJEpGV3s4LjYDN6Z1lTA/pub?gid=81309822&single=true&output=csv";

async function getSheetData() {
  const res = await fetch(`${SHEET_URL}&t=${Date.now()}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  const csv = await res.text();

  const rows = csv
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => {
      const [key, ...rest] = row.split(",");
      return [
        cleanText(key),
        cleanText(rest.join(",")),
      ];
    });

  return Object.fromEntries(rows) as Record<string, string>;
}

function cleanText(value?: string) {
  return String(value || "")
    .replaceAll('"', "")
    .replaceAll("\r", "")
    .trim();
}

function parseNumber(value?: string) {
  const cleaned = cleanText(value)
    .replaceAll("€", "")
    .replaceAll(" ", "")
    .replaceAll(".", "")
    .replace(",", ".");

  const number = Number(cleaned);
  return Number.isNaN(number) ? null : number;
}

function money(value?: string) {
  const number = parseNumber(value);
  if (number === null) return cleanText(value);

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(number);
}

function percent(value?: string) {
  const number = parseNumber(value);
  if (number === null) return cleanText(value);

  const pct = number <= 1 ? number * 100 : number;
  return `+${pct.toFixed(1)}%`;
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
      <span
        className={`${bold ? "font-semibold" : ""} ${
          green ? "text-[#1f7a4d]" : ""
        }`}
      >
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
      <div
        className={`mt-1 text-[18px] font-bold leading-tight ${
          green ? "text-[#1f7a4d]" : "text-black"
        }`}
      >
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
  rows: string[][];
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

      {rows.map((row) => (
        <div
          key={row[0]}
          className="grid grid-cols-5 border-b border-gray-200 py-1.5 text-[12px]"
        >
          <div className="pl-2 font-semibold">{row[0]}</div>
          <div>{row[1]}</div>
          <div className="text-right text-[#1f7a4d]">{row[2]}</div>
          <div className="text-right text-[#1f7a4d]">{row[3]}</div>
          <div className="text-right pr-2 text-[#1f7a4d]">{row[4]}</div>
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const data = await getSheetData();

  const netProfit = money(data.netProfit);
  const roi = percent(data.roi);
  const irr = percent(data.irr);

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
            {data.subtitle ||
              "Deal Analysis · 15 June 2026 · Custom cash schedule"}
          </p>
          <div className="mt-4 border-t-[3px] border-black" />
        </header>

        <div className="mt-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
            01 · Overview
          </div>
          <h2 className="mt-1 text-[22px] font-bold leading-none">
            Deal Metrics
          </h2>
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
            <Row
              label="Total Acquisition"
              value={money(data.totalAcquisition)}
              bold
            />
          </div>

          <div>
            <SectionLabel>Project</SectionLabel>
            <Row label="Type" value={data.projectType || ""} bold />
            <Row label="Surface" value={data.surface || ""} bold />
            <Row label="Duration" value={data.duration || ""} bold />
            <Row
              label="Base Build Cost"
              value={money(data.baseBuildCost)}
              bold
            />
            <Row label="Contingency (10%)" value={money(data.contingency)} />
            <Row
              label="Total Project Cost"
              value={money(data.totalProjectCost)}
              bold
            />
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel>Exit & Returns</SectionLabel>
          <Row label="Gross Sale Price" value={money(data.grossSalePrice)} bold />
          <Row
            label="Agent Commission (6%)"
            value={money(data.agentCommission)}
          />
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
            <div className="w-[27%] bg-black pt-1.5">27%</div>
            <div className="w-[39%] bg-[#5e5a52] pt-1.5">39%</div>
            <div className="w-[6%] bg-[#aaa9a2]" />
            <div className="w-[28%] bg-[#1f7a4d] pt-1.5">28%</div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-500">
            <div>■ Acquisition&nbsp;&nbsp; {money(data.totalAcquisition)} · 27%</div>
            <div>■ Build / project&nbsp;&nbsp; {money(data.totalProjectCost)} · 39%</div>
            <div>■ Commission&nbsp;&nbsp; {money(data.agentCommission)} · 6%</div>
            <div className="text-[#1f7a4d]">
              ■ Net profit&nbsp;&nbsp; {netProfit} · 28%
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

          {[
            ["6 months †", "+199.0%"],
            ["12 months †", "+72.9%"],
            ["18 months †", "+44.1%"],
            ["24 months †", "+31.5%"],
            ["36 months †", "+20.0%"],
            ["48 months ←", irr],
          ].map((r) => (
            <div
              key={r[0]}
              className="grid grid-cols-4 border-b border-gray-200 py-1.5 text-[12px]"
            >
              <div className="pl-2 font-semibold">{r[0]}</div>
              <div className="text-right pr-2 text-[#1f7a4d]">{netProfit}</div>
              <div className="text-right pr-2 text-[#1f7a4d]">{roi}</div>
              <div className="text-right pr-2 text-[#1f7a4d]">{r[1]}</div>
            </div>
          ))}

          <p className="mt-2 text-[9px] italic text-gray-400">
            † Exit before plan completion (48m): assumes the completed asset is
            sold at that month.
          </p>
        </div>
      </Page>

      <Page>
        <div>
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
            <Kpi label="Cash @ Month 0" value="€ 45.000" sub="0.4% of total capital" />
            <Kpi label="Cash by Notary" value="€ 6.102.000" sub="By month 12 · 58.1% deployed" />
            <Kpi label="Peak Deployed" value="€ 10.557.000" sub="Reached at month 36" />
            <Kpi label="Avg. Capital Duration" value="30.6m" sub="Weighted by € × months" />
          </div>

          <div className="mt-6 rounded border border-gray-200 p-4">
            <div className="mb-3 flex justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                Capital Deployment
              </div>
              <div className="text-[10px] text-gray-500">
                Peak <b>€ 10.557.000</b> @ m36
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
  <line x1="25" y1="15" x2="25" y2="118" stroke="#eeeeee" />
  <line x1="190" y1="15" x2="190" y2="118" stroke="#eeeeee" />
  <line x1="360" y1="15" x2="360" y2="118" stroke="#eeeeee" />
  <line x1="530" y1="15" x2="530" y2="118" stroke="#eeeeee" />
  <line
    x1="680"
    y1="15"
    x2="680"
    y2="118"
    stroke="#1f7a4d"
    strokeDasharray="3 3"
  />

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

  {[25, 40, 190, 275, 360, 530].map((x, i) => {
    const y = [112, 108, 50, 36, 20, 9][i];
    return (
      <circle
        key={x}
        cx={x}
        cy={y}
        r="4"
        fill="white"
        stroke="#1f1f1f"
        strokeWidth="2"
      />
    );
  })}

  <text x="20" y="134" fontSize="9" fill="#999">m0</text>
  <text x="182" y="134" fontSize="9" fill="#999">m12</text>
  <text x="352" y="134" fontSize="9" fill="#999">m24</text>
  <text x="522" y="134" fontSize="9" fill="#999">m36</text>
  <text x="672" y="134" fontSize="9" fill="#999">m48</text>
  <text x="663" y="13" fontSize="9" fill="#1f7a4d">Exit</text>
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

            {[
              ["m0", "Reservation Deposit (1%)", "-€ 45.000", "—", "€ 45.000"],
              ["m1", "PPC — Private Contract (9%)", "-€ 405.000", "—", "€ 450.000"],
              ["m12", "Notary — Balance (90%)", "-€ 4.050.000", "—", "€ 4.500.000"],
              ["m12", "Side-costs at notary", "-€ 117.000", "—", "€ 4.617.000"],
              ["m12", "Construction Draw 1/4", "-€ 1.485.000", "—", "€ 6.102.000"],
              ["m18", "Construction Draw 2/4", "-€ 1.485.000", "—", "€ 7.587.000"],
              ["m24", "Construction Draw 3/4", "-€ 1.485.000", "—", "€ 9.072.000"],
              ["m36", "Construction Draw 4/4", "-€ 1.485.000", "—", "€ 10.557.000"],
              ["m48", "Sale Proceeds (net)", "—", "€ 15.040.000", "-€ 4.483.000"],
            ].map((row, index) => (
              <div
                key={index}
                className={`grid grid-cols-5 border-b border-gray-200 py-1.5 text-[11px] ${
                  index === 8 ? "bg-[#eef6f0]" : ""
                }`}
              >
                <div className="pl-2">{row[0]}</div>
                <div className="whitespace-nowrap font-semibold">{row[1]}</div>
                <div className="text-right pr-2 text-red-800">{row[2]}</div>
                <div className="text-right pr-2 text-[#1f7a4d] font-semibold">
                  {row[3]}
                </div>
                <div className="text-right pr-2">{row[4]}</div>
              </div>
            ))}
          </div>
        </div>
      </Page>

      <Page>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
            03 · Sensitivity
          </div>
          <h2 className="mt-1 text-[22px] font-bold leading-none">
            Sensitivity Analysis
          </h2>
          <p className="mt-2 border-b border-gray-200 pb-4 text-[12px] text-gray-400">
            Impact of ±15% variations on each key assumption, holding everything else constant.
          </p>

          <SensitivityTable
            title="Purchase Price Sensitivity"
            assumption="Purchase Price"
            rows={[
              ["-15%", "€ 3.400.000", "€ 5.194.400", "+52.8%", "+17.9%"],
              ["-10%", "€ 3.600.000", "€ 4.977.600", "+49.5%", "+16.8%"],
              ["-5%", "€ 3.800.000", "€ 4.760.800", "+46.3%", "+15.7%"],
              ["Base", money(data.purchasePrice), netProfit, roi, irr],
              ["+5%", "€ 4.200.000", "€ 4.327.200", "+40.4%", "+13.7%"],
              ["+10%", "€ 4.400.000", "€ 4.110.400", "+37.6%", "+12.7%"],
              ["+15%", "€ 4.600.000", "€ 3.893.600", "+34.9%", "+11.8%"],
            ]}
          />

          <SensitivityTable
            title="Sale Price Sensitivity"
            assumption="Sale Price"
            rows={[
              ["-15%", "€ 13.600.000", "€ 2.288.000", "+21.8%", "+7.7%"],
              ["-10%", "€ 14.400.000", "€ 3.040.000", "+29.0%", "+10.1%"],
              ["-5%", "€ 15.200.000", "€ 3.792.000", "+36.1%", "+12.4%"],
              ["Base", money(data.grossSalePrice), netProfit, roi, irr],
              ["+5%", "€ 16.800.000", "€ 5.296.000", "+50.5%", "+16.8%"],
              ["+10%", "€ 17.600.000", "€ 6.048.000", "+57.6%", "+18.9%"],
              ["+15%", "€ 18.400.000", "€ 6.800.000", "+64.8%", "+20.9%"],
            ]}
          />
        </div>
      </Page>

      <Page>
        <div className="mt-4">
          <SensitivityTable
            title="Project Cost Sensitivity"
            assumption="Project Cost"
            rows={[
              ["-15%", "€ 5.236.000", "€ 5.468.000", "+57.1%", "+18.3%"],
              ["-10%", "€ 5.544.000", "€ 5.160.000", "+52.2%", "+17.1%"],
              ["-5%", "€ 5.852.000", "€ 4.852.000", "+47.6%", "+15.9%"],
              ["Base", money(data.totalProjectCost), netProfit, roi, irr],
              ["+5%", "€ 6.468.000", "€ 4.236.000", "+39.2%", "+13.5%"],
              ["+10%", "€ 6.776.000", "€ 3.928.000", "+35.3%", "+12.4%"],
              ["+15%", "€ 7.084.000", "€ 3.620.000", "+31.7%", "+11.3%"],
            ]}
          />
        </div>
      </Page>

      <Page>
        <div>
        <SectionLabel>Property Photos</SectionLabel>

<div className="mt-4 space-y-3">

  <img
    src="/photos/photo1.jpg"
    alt=""
    className="h-[220px] w-full object-cover rounded"
  />

<div className="grid grid-cols-2 gap-3">

<img
  src="/photos/photo2.jpg"
  alt=""
  className="h-[160px] w-full object-cover rounded"
/>

<img
  src="/photos/photo3.jpg"
  alt=""
  className="h-[160px] w-full object-cover rounded"
/>

</div>

</div>

<div className="mt-5 border-t border-gray-200 pt-2 text-[11px] text-gray-300">
15 June 2026 · Confidential — for internal use only
</div>
</div>
      </Page>
    </main>
  );
}