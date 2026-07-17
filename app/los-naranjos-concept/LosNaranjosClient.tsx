/// <reference lib="dom" />
"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

export type LosNaranjosConfig = {
  title: string;
  subtitle: string;
  footerLabel: string;
};

export type LosNaranjosInitialData = {
  projectName: string;
  analysisDate: string;
  projectType: string;
  surfaceM2: number;
  plotM2: number;
  durationMonths: number;

  purchasePrice: number;
  transferTaxPercentage: number;
  lawyerFeePercentage: number;
  notaryFee: number;
  otherAcquisitionCosts: number;

  buildCostPerM2: number;
  contingencyPercentage: number;
  furniture: number;
  projectManagementPercentage: number;

  salePrice: number;
  agentCommissionPercentage: number;

  firstPaymentMonth: number;
  firstPaymentAmount: number;
  secondPaymentMonth: number;
  secondPaymentAmount: number;
  thirdPaymentMonth: number;
  thirdPaymentAmount: number;
  closingMonth: number;
  constructionStartMonth: number;
  constructionDraws: number;

  photoUrls: string[];
};

type FormState = {
  projectName: string;
  analysisDate: string;
  projectType: string;
  surfaceM2: string;
  plotM2: string;
  durationMonths: string;

  purchasePrice: string;
  transferTaxPercentage: string;
  lawyerFeePercentage: string;
  notaryFee: string;
  otherAcquisitionCosts: string;

  buildCostPerM2: string;
  contingencyPercentage: string;
  furniture: string;
  projectManagementPercentage: string;

  salePrice: string;
  agentCommissionPercentage: string;

  firstPaymentMonth: string;
  firstPaymentAmount: string;
  secondPaymentMonth: string;
  secondPaymentAmount: string;
  thirdPaymentMonth: string;
  thirdPaymentAmount: string;
  closingMonth: string;
  constructionStartMonth: string;
  constructionDraws: string;
};

type CashflowItem = {
  month: number;
  event: string;
  outflow: number;
  inflow: number;
  runningCapital: number;
};

const STORAGE_KEY = "l3capital.los-naranjos.first-setup.v1";

const euroFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("nl-NL", {
  maximumFractionDigits: 1,
});

function euro(value: number) {
  return euroFormatter.format(Number.isFinite(value) ? value : 0);
}

function signedEuro(value: number) {
  if (!Number.isFinite(value)) return "—";
  return value < 0 ? `-${euro(Math.abs(value))}` : euro(value);
}

function percent(value: number, plus = false) {
  if (!Number.isFinite(value)) return "—";
  const shown = `${numberFormatter.format(value * 100)}%`;
  return plus && value > 0 ? `+${shown}` : shown;
}

function inputNumber(value: number) {
  return String(value);
}

function inputPercent(value: number) {
  return String(Number((value * 100).toFixed(2))).replace(".", ",");
}

function parseNumber(value: string) {
  const raw = value.trim().replace(/\s/g, "");
  if (!raw) return 0;

  let normalized = raw.replace(/[^\d,.-]/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePercent(value: string) {
  const parsed = parseNumber(value);
  return Math.abs(parsed) > 1 ? parsed / 100 : parsed;
}

function createInitialForm(data: LosNaranjosInitialData): FormState {
  return {
    projectName: data.projectName,
    analysisDate: data.analysisDate,
    projectType: data.projectType,
    surfaceM2: inputNumber(data.surfaceM2),
    plotM2: inputNumber(data.plotM2),
    durationMonths: inputNumber(data.durationMonths),

    purchasePrice: inputNumber(data.purchasePrice),
    transferTaxPercentage: inputPercent(data.transferTaxPercentage),
    lawyerFeePercentage: inputPercent(data.lawyerFeePercentage),
    notaryFee: inputNumber(data.notaryFee),
    otherAcquisitionCosts: inputNumber(data.otherAcquisitionCosts),

    buildCostPerM2: inputNumber(data.buildCostPerM2),
    contingencyPercentage: inputPercent(data.contingencyPercentage),
    furniture: inputNumber(data.furniture),
    projectManagementPercentage: inputPercent(
      data.projectManagementPercentage
    ),

    salePrice: inputNumber(data.salePrice),
    agentCommissionPercentage: inputPercent(data.agentCommissionPercentage),

    firstPaymentMonth: inputNumber(data.firstPaymentMonth),
    firstPaymentAmount: inputNumber(data.firstPaymentAmount),
    secondPaymentMonth: inputNumber(data.secondPaymentMonth),
    secondPaymentAmount: inputNumber(data.secondPaymentAmount),
    thirdPaymentMonth: inputNumber(data.thirdPaymentMonth),
    thirdPaymentAmount: inputNumber(data.thirdPaymentAmount),
    closingMonth: inputNumber(data.closingMonth),
    constructionStartMonth: inputNumber(data.constructionStartMonth),
    constructionDraws: inputNumber(data.constructionDraws),
  };
}

function calculateAnnualizedReturn(roi: number, months: number) {
  if (months <= 0 || 1 + roi <= 0) return 0;
  return Math.pow(1 + roi, 12 / months) - 1;
}

function formatDate(date: string) {
  if (!date) return "Datum niet ingevuld";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function LosNaranjosClient({
  initialData,
  config,
}: {
  initialData: LosNaranjosInitialData;
  config: LosNaranjosConfig;
}) {
  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(initialData)
  );
  const [storageReady, setStorageReady] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setForm({ ...createInitialForm(initialData), ...JSON.parse(saved) });
      }
    } catch (error) {
      console.warn("De lokale Los Naranjos-invoer kon niet worden geladen.", error);
    } finally {
      setStorageReady(true);
    }
  }, [initialData]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form, storageReady]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    localStorage.removeItem(STORAGE_KEY);
    setForm(createInitialForm(initialData));
    setUploadedPhotos([]);
  }

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []).slice(0, 3);
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    )
      .then(setUploadedPhotos)
      .catch((error) => console.warn("Foto's konden niet worden geladen.", error));
  }

  const data = useMemo(() => {
    const projectName = form.projectName.trim() || config.title;
    const projectType = form.projectType.trim() || "Project";
    const surfaceM2 = Math.max(0, parseNumber(form.surfaceM2));
    const plotM2 = Math.max(0, parseNumber(form.plotM2));
    const durationMonths = Math.max(1, Math.round(parseNumber(form.durationMonths)));

    const purchasePrice = Math.max(0, parseNumber(form.purchasePrice));
    const transferTaxPercentage = Math.max(
      0,
      parsePercent(form.transferTaxPercentage)
    );
    const lawyerFeePercentage = Math.max(
      0,
      parsePercent(form.lawyerFeePercentage)
    );
    const notaryFee = Math.max(0, parseNumber(form.notaryFee));
    const otherAcquisitionCosts = Math.max(
      0,
      parseNumber(form.otherAcquisitionCosts)
    );

    const transferTax = purchasePrice * transferTaxPercentage;
    const lawyerFee = purchasePrice * lawyerFeePercentage;
    const totalAcquisition =
      purchasePrice +
      transferTax +
      lawyerFee +
      notaryFee +
      otherAcquisitionCosts;

    const buildCostPerM2 = Math.max(0, parseNumber(form.buildCostPerM2));
    const contingencyPercentage = Math.max(
      0,
      parsePercent(form.contingencyPercentage)
    );
    const furniture = Math.max(0, parseNumber(form.furniture));
    const projectManagementPercentage = Math.max(
      0,
      parsePercent(form.projectManagementPercentage)
    );

    const baseBuildCost = surfaceM2 * buildCostPerM2;
    const contingency = baseBuildCost * contingencyPercentage;
    const projectSubtotal = baseBuildCost + contingency + furniture;
    const projectManagement =
      projectSubtotal * projectManagementPercentage;
    const totalProjectCost = projectSubtotal + projectManagement;
    const capitalDeployed = totalAcquisition + totalProjectCost;

    const salePrice = Math.max(0, parseNumber(form.salePrice));
    const agentCommissionPercentage = Math.max(
      0,
      parsePercent(form.agentCommissionPercentage)
    );
    const agentCommission = salePrice * agentCommissionPercentage;
    const netProceeds = salePrice - agentCommission;
    const netProfit = netProceeds - capitalDeployed;
    const roi = capitalDeployed ? netProfit / capitalDeployed : 0;
    const irr = calculateAnnualizedReturn(roi, durationMonths);

    const firstPaymentMonth = Math.max(
      0,
      Math.round(parseNumber(form.firstPaymentMonth))
    );
    const secondPaymentMonth = Math.max(
      0,
      Math.round(parseNumber(form.secondPaymentMonth))
    );
    const thirdPaymentMonth = Math.max(
      0,
      Math.round(parseNumber(form.thirdPaymentMonth))
    );
    const closingMonth = Math.max(
      0,
      Math.round(parseNumber(form.closingMonth))
    );
    const constructionStartMonth = Math.max(
      0,
      Math.round(parseNumber(form.constructionStartMonth))
    );
    const constructionDraws = Math.max(
      1,
      Math.round(parseNumber(form.constructionDraws))
    );

    const firstPaymentAmount = Math.max(
      0,
      parseNumber(form.firstPaymentAmount)
    );
    const secondPaymentAmount = Math.max(
      0,
      parseNumber(form.secondPaymentAmount)
    );
    const thirdPaymentAmount = Math.max(
      0,
      parseNumber(form.thirdPaymentAmount)
    );
    const finalPurchasePayment = Math.max(
      0,
      purchasePrice -
        firstPaymentAmount -
        secondPaymentAmount -
        thirdPaymentAmount
    );

    const rawCashflow: Omit<CashflowItem, "runningCapital">[] = [
      {
        month: firstPaymentMonth,
        event: "Downpayment 1",
        outflow: firstPaymentAmount,
        inflow: 0,
      },
      {
        month: secondPaymentMonth,
        event: "Downpayment 2",
        outflow: secondPaymentAmount,
        inflow: 0,
      },
      {
        month: thirdPaymentMonth,
        event: "Downpayment 3",
        outflow: thirdPaymentAmount,
        inflow: 0,
      },
      {
        month: closingMonth,
        event: "Final purchase payment",
        outflow: finalPurchasePayment,
        inflow: 0,
      },
      { month: closingMonth, event: "Transfer tax", outflow: transferTax, inflow: 0 },
      { month: closingMonth, event: "Lawyer fee", outflow: lawyerFee, inflow: 0 },
      { month: closingMonth, event: "Notary fee", outflow: notaryFee, inflow: 0 },
      {
        month: closingMonth,
        event: "Other acquisition costs",
        outflow: otherAcquisitionCosts,
        inflow: 0,
      },
    ];

    const constructionDrawAmount = totalProjectCost / constructionDraws;
    for (let index = 0; index < constructionDraws; index += 1) {
      rawCashflow.push({
        month: constructionStartMonth + index,
        event: `Construction draw ${index + 1}/${constructionDraws}`,
        outflow: constructionDrawAmount,
        inflow: 0,
      });
    }

    rawCashflow.push({
      month: durationMonths,
      event: "Sales proceeds (net)",
      outflow: 0,
      inflow: netProceeds,
    });

    rawCashflow.sort((a, b) => a.month - b.month || a.event.localeCompare(b.event));

    let runningCapital = 0;
    const cashflow: CashflowItem[] = rawCashflow.map((item) => {
      runningCapital += item.outflow - item.inflow;
      return { ...item, runningCapital };
    });

    const monthlyCapital = Array.from({ length: durationMonths + 1 }, (_, month) => {
      const matching = cashflow.filter((item) => item.month <= month);
      return matching.length > 0
        ? matching[matching.length - 1].runningCapital
        : 0;
    });

    const peakDeployed = Math.max(0, ...monthlyCapital.slice(0, durationMonths));
    const capitalMonthArea = monthlyCapital
      .slice(0, durationMonths)
      .reduce((sum, value) => sum + Math.max(0, value), 0);
    const averageCapitalDuration = peakDeployed
      ? capitalMonthArea / peakDeployed
      : 0;
    const cashByConstructionStart =
      monthlyCapital[Math.min(constructionStartMonth, durationMonths)] ?? 0;

    const exitScenarios = [6, 9, 12, 15, 18, durationMonths]
      .filter((month, index, values) => month > 0 && values.indexOf(month) === index)
      .sort((a, b) => a - b)
      .map((month) => ({
        month,
        netProfit,
        roi,
        irr: calculateAnnualizedReturn(roi, month),
      }));

    const saleSensitivity = [-0.1, -0.05, 0, 0.05, 0.1].map((change) => {
      const scenarioSalePrice = salePrice * (1 + change);
      const scenarioNetProceeds =
        scenarioSalePrice * (1 - agentCommissionPercentage);
      const scenarioProfit = scenarioNetProceeds - capitalDeployed;
      const scenarioRoi = capitalDeployed
        ? scenarioProfit / capitalDeployed
        : 0;
      return {
        change,
        salePrice: scenarioSalePrice,
        netProfit: scenarioProfit,
        roi: scenarioRoi,
        irr: calculateAnnualizedReturn(scenarioRoi, durationMonths),
      };
    });

    const projectCostSensitivity = [-0.1, -0.05, 0, 0.05, 0.1].map(
      (change) => {
        const scenarioProjectCost = totalProjectCost * (1 + change);
        const scenarioCapital = totalAcquisition + scenarioProjectCost;
        const scenarioProfit = netProceeds - scenarioCapital;
        const scenarioRoi = scenarioCapital ? scenarioProfit / scenarioCapital : 0;
        return {
          change,
          projectCost: scenarioProjectCost,
          netProfit: scenarioProfit,
          roi: scenarioRoi,
          irr: calculateAnnualizedReturn(scenarioRoi, durationMonths),
        };
      }
    );

    return {
      projectName,
      analysisDate: form.analysisDate,
      projectType,
      surfaceM2,
      plotM2,
      durationMonths,
      purchasePrice,
      transferTaxPercentage,
      lawyerFeePercentage,
      notaryFee,
      otherAcquisitionCosts,
      transferTax,
      lawyerFee,
      totalAcquisition,
      buildCostPerM2,
      contingencyPercentage,
      furniture,
      projectManagementPercentage,
      baseBuildCost,
      contingency,
      projectSubtotal,
      projectManagement,
      totalProjectCost,
      capitalDeployed,
      salePrice,
      agentCommissionPercentage,
      agentCommission,
      netProceeds,
      netProfit,
      roi,
      irr,
      cashflow,
      monthlyCapital,
      peakDeployed,
      averageCapitalDuration,
      cashByConstructionStart,
      firstPaymentAmount,
      exitScenarios,
      saleSensitivity,
      projectCostSensitivity,
    };
  }, [config.title, form]);

  const photos = uploadedPhotos.length > 0 ? uploadedPhotos : initialData.photoUrls;

  return (
    <main className="screen">
      <style>{styles}</style>

      <section className="live-input no-print">
        <header className="input-header">
          <div>
            <span>Live invoer</span>
            <h1>Los Naranjos analyse</h1>
          </div>
          <button type="button" onClick={resetForm}>
            Reset naar beginwaarden
          </button>
        </header>

        <InputGroup title="Projectgegevens">
          <InputField label="Projectnaam" value={form.projectName} onChange={(value) => updateField("projectName", value)} />
          <InputField label="Analyse-datum" type="date" value={form.analysisDate} onChange={(value) => updateField("analysisDate", value)} />
          <InputField label="Projecttype" value={form.projectType} onChange={(value) => updateField("projectType", value)} />
          <InputField label="Oppervlakte m²" value={form.surfaceM2} onChange={(value) => updateField("surfaceM2", value)} />
          <InputField label="Perceel m²" value={form.plotM2} onChange={(value) => updateField("plotM2", value)} />
          <InputField label="Looptijd maanden" value={form.durationMonths} onChange={(value) => updateField("durationMonths", value)} />
          <label className="field field-wide">
            <span>Projectfoto’s (maximaal 3)</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotos} />
          </label>
        </InputGroup>

        <InputGroup title="Aankoop">
          <InputField label="Aankoopprijs" value={form.purchasePrice} onChange={(value) => updateField("purchasePrice", value)} />
          <InputField label="Overdrachtsbelasting %" value={form.transferTaxPercentage} onChange={(value) => updateField("transferTaxPercentage", value)} />
          <InputField label="Advocaatkosten %" value={form.lawyerFeePercentage} onChange={(value) => updateField("lawyerFeePercentage", value)} />
          <InputField label="Notariskosten" value={form.notaryFee} onChange={(value) => updateField("notaryFee", value)} />
          <InputField label="Overige aankoopkosten" value={form.otherAcquisitionCosts} onChange={(value) => updateField("otherAcquisitionCosts", value)} />
        </InputGroup>

        <InputGroup title="Bouw en verkoop">
          <InputField label="Bouwkosten per m²" value={form.buildCostPerM2} onChange={(value) => updateField("buildCostPerM2", value)} />
          <InputField label="Onvoorzien %" value={form.contingencyPercentage} onChange={(value) => updateField("contingencyPercentage", value)} />
          <InputField label="Meubilair" value={form.furniture} onChange={(value) => updateField("furniture", value)} />
          <InputField label="Projectmanagement %" value={form.projectManagementPercentage} onChange={(value) => updateField("projectManagementPercentage", value)} />
          <InputField label="Verkoopprijs" value={form.salePrice} onChange={(value) => updateField("salePrice", value)} />
          <InputField label="Makelaarscommissie %" value={form.agentCommissionPercentage} onChange={(value) => updateField("agentCommissionPercentage", value)} />
        </InputGroup>

        <InputGroup title="Betalingsplanning">
          <InputField label="1e betaling maand" value={form.firstPaymentMonth} onChange={(value) => updateField("firstPaymentMonth", value)} />
          <InputField label="1e betaling bedrag" value={form.firstPaymentAmount} onChange={(value) => updateField("firstPaymentAmount", value)} />
          <InputField label="2e betaling maand" value={form.secondPaymentMonth} onChange={(value) => updateField("secondPaymentMonth", value)} />
          <InputField label="2e betaling bedrag" value={form.secondPaymentAmount} onChange={(value) => updateField("secondPaymentAmount", value)} />
          <InputField label="3e betaling maand" value={form.thirdPaymentMonth} onChange={(value) => updateField("thirdPaymentMonth", value)} />
          <InputField label="3e betaling bedrag" value={form.thirdPaymentAmount} onChange={(value) => updateField("thirdPaymentAmount", value)} />
          <InputField label="Passeerdatum maand" value={form.closingMonth} onChange={(value) => updateField("closingMonth", value)} />
          <InputField label="Start bouwbetalingen" value={form.constructionStartMonth} onChange={(value) => updateField("constructionStartMonth", value)} />
          <InputField label="Aantal bouwbetalingen" value={form.constructionDraws} onChange={(value) => updateField("constructionDraws", value)} />
        </InputGroup>
      </section>

      <section className="report-page overview-page">
        <ReportHeader data={data} config={config} />
        <SectionHeading number="01" eyebrow="Overview" title="Deal Metrics" subtitle="Headline return metrics, cost structure, and exit timeline." />

        <div className="metric-grid">
          <Metric label="Net Profit" value={euro(data.netProfit)} positive />
          <Metric label="ROI" value={percent(data.roi, true)} positive />
          <Metric label={`IRR (${data.durationMonths}M EXIT)`} value={percent(data.irr, true)} positive />
          <Metric label="Capital Deployed" value={euro(data.capitalDeployed)} />
        </div>

        <div className="two-column">
          <DataBlock title="Acquisition">
            <DataRow label="Purchase Price" value={euro(data.purchasePrice)} />
            <DataRow label={`Transfer Tax (${percent(data.transferTaxPercentage)})`} value={euro(data.transferTax)} />
            <DataRow label={`Lawyer Fee (${percent(data.lawyerFeePercentage)})`} value={euro(data.lawyerFee)} />
            <DataRow label="Notary Fee" value={euro(data.notaryFee)} />
            <DataRow label="Other Acquisition Costs" value={euro(data.otherAcquisitionCosts)} />
            <DataRow label="Total Acquisition" value={euro(data.totalAcquisition)} strong />
          </DataBlock>

          <DataBlock title="Project">
            <DataRow label="Type" value={`${data.projectType} – ${euro(data.buildCostPerM2)}/m²`} strong />
            <DataRow label="Surface" value={`${numberFormatter.format(data.surfaceM2)} m²`} strong />
            <DataRow label="Plot" value={`${numberFormatter.format(data.plotM2)} m²`} strong />
            <DataRow label="Duration" value={`${data.durationMonths} months`} strong />
            <DataRow label="Base Build Cost" value={euro(data.baseBuildCost)} />
            <DataRow label={`Contingency (${percent(data.contingencyPercentage)})`} value={euro(data.contingency)} />
            <DataRow label="Furniture" value={euro(data.furniture)} />
            <DataRow label="Subtotal" value={euro(data.projectSubtotal)} strong />
            <DataRow label={`Project Management (${percent(data.projectManagementPercentage)})`} value={euro(data.projectManagement)} />
            <DataRow label="Total Project Cost" value={euro(data.totalProjectCost)} strong />
          </DataBlock>
        </div>

        <DataBlock title="Exit & Returns" full>
          <DataRow label="Gross Sale Price" value={euro(data.salePrice)} strong />
          <DataRow label={`Agent Commission (${percent(data.agentCommissionPercentage)})`} value={euro(data.agentCommission)} />
          <DataRow label="Net Proceeds" value={euro(data.netProceeds)} strong />
          <DataRow label="Net Profit / (Loss)" value={signedEuro(data.netProfit)} strong positive={data.netProfit >= 0} />
        </DataBlock>

        <AllocationBar
          salePrice={data.salePrice}
          acquisition={data.totalAcquisition}
          project={data.totalProjectCost}
          commission={data.agentCommission}
          profit={data.netProfit}
        />
        <PageFooter label={config.footerLabel} page="1 / 5" />
      </section>

      <section className="report-page">
        <SectionHeading number="02" eyebrow="Exit analysis" title="Returns by Exit Timeline" subtitle="Returns under different exit scenarios." />
        <TableTitle>Returns by exit timeline</TableTitle>
        <table>
          <thead><tr><th>Exit</th><th>Net Profit</th><th>ROI</th><th>IRR (Ann.)</th></tr></thead>
          <tbody>
            {data.exitScenarios.map((row) => (
              <tr key={row.month}>
                <td><strong>{row.month} months</strong></td>
                <td className="positive">{euro(row.netProfit)}</td>
                <td className="positive">{percent(row.roi, true)}</td>
                <td className="positive">{percent(row.irr, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note"><strong>Note:</strong> The base case assumes a <strong>{data.durationMonths} months</strong> development and exit period. Earlier exit scenarios use the same profit but annualise the return over a shorter holding period.</p>
        <PageFooter label={config.footerLabel} page="2 / 5" />
      </section>

      <section className="report-page cash-page">
        <SectionHeading number="03" eyebrow="Cash plan" title="Capital Deployment Schedule" subtitle={`Custom schedule · ${data.cashflow.length} tranches · ${data.durationMonths} months to exit`} />
        <div className="metric-grid compact-metrics">
          <Metric label="Cash @ Month 0" value={euro(data.firstPaymentAmount)} sub={`${percent(data.capitalDeployed ? data.firstPaymentAmount / data.capitalDeployed : 0)} of total capital`} />
          <Metric label="Cash by construction" value={euro(data.cashByConstructionStart)} sub={`By month ${parseNumber(form.constructionStartMonth)}`} />
          <Metric label="Peak Deployed" value={euro(data.peakDeployed)} sub={`Before exit in month ${data.durationMonths}`} />
          <Metric label="Avg. Capital Duration" value={`${numberFormatter.format(data.averageCapitalDuration)}m`} sub="Weighted by € × months" />
        </div>
        <CapitalChart monthlyCapital={data.monthlyCapital} durationMonths={data.durationMonths} peak={data.peakDeployed} />
        <TableTitle>Cash flow detail</TableTitle>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Month</th><th>Event</th><th>Outflow</th><th>Inflow</th><th>Running Capital</th></tr></thead>
            <tbody>
              {data.cashflow.map((row, index) => (
                <tr key={`${row.month}-${row.event}-${index}`} className={row.inflow > 0 ? "sale-row" : undefined}>
                  <td>{row.month}</td>
                  <td><strong>{row.event}</strong></td>
                  <td className="negative">{row.outflow ? `-${euro(row.outflow)}` : "—"}</td>
                  <td className="positive">{row.inflow ? euro(row.inflow) : "—"}</td>
                  <td>{signedEuro(row.runningCapital)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PageFooter label={config.footerLabel} page="3 / 5" />
      </section>
      <section className="report-page sensitivity-page">
  <SectionHeading
    number="04"
    eyebrow="Sensitivity"
    title="Sensitivity Analysis"
    subtitle="Impact of key assumption variations, holding everything else constant."
  />

  <TableTitle>Sale price sensitivity</TableTitle>

  <SensitivityTable
    rows={data.saleSensitivity}
    valueKey="salePrice"
    valueLabel="Sale Price"
  />

  <TableTitle>Project cost sensitivity</TableTitle>

  <SensitivityTable
    rows={data.projectCostSensitivity}
    valueKey="projectCost"
    valueLabel="Project Cost"
  />

  <PageFooter label={config.footerLabel} page="4 / 5" />
</section>

<section className="report-page photos-page">
  <TableTitle>Property photos</TableTitle>

  <div className="photo-stack">
    {photos.length > 0 ? (
      photos.slice(0, 3).map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt={`${data.projectName} foto ${index + 1}`}
        />
      ))
    ) : (
      <div className="photo-placeholder">
        Voeg bovenaan maximaal drie projectfoto’s toe.
      </div>
    )}
  </div>

  <PageFooter label={config.footerLabel} page="5 / 5" />
</section>
    </main>
  );
}

function InputGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="input-group">
      <h2>{title}</h2>
      <div className="input-grid">{children}</div>
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} type={type} inputMode={type === "text" ? "decimal" : undefined} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function ReportHeader({ data, config }: { data: { projectName: string; analysisDate: string }; config: LosNaranjosConfig }) {
  return (
    <header className="report-header">
      <h1>{data.projectName}</h1>
      <p>{config.subtitle} · {formatDate(data.analysisDate)}</p>
    </header>
  );
}

function SectionHeading({ number, eyebrow, title, subtitle }: { number: string; eyebrow: string; title: string; subtitle: string }) {
  return (
    <header className="section-heading">
      <span>{number} · {eyebrow}</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}

function Metric({ label, value, sub, positive = false }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong className={positive ? "positive" : undefined}>{value}</strong>
      {sub && <small>{sub}</small>}
    </article>
  );
}

function DataBlock({ title, children, full = false }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <section className={full ? "data-block full" : "data-block"}>
      <h3>{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

function DataRow({ label, value, strong = false, positive = false }: { label: string; value: string; strong?: boolean; positive?: boolean }) {
  return (
    <div className={strong ? "data-row strong" : "data-row"}>
      <dt>{label}</dt>
      <dd className={positive ? "positive" : undefined}>{value}</dd>
    </div>
  );
}

function TableTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="table-title">{children}</h3>;
}

function AllocationBar({ salePrice, acquisition, project, commission, profit }: { salePrice: number; acquisition: number; project: number; commission: number; profit: number }) {
  const total = Math.max(salePrice, 1);
  const items = [
    { label: "Acquisition", value: acquisition, className: "acquisition" },
    { label: "Build / project", value: project, className: "project" },
    { label: "Commission", value: commission, className: "commission" },
    { label: "Net profit", value: Math.max(0, profit), className: "profit" },
  ];

  return (
    <section className="allocation">
      <div className="allocation-title"><TableTitle>Where the sale price goes</TableTitle><span>Gross sale {euro(salePrice)}</span></div>
      <div className="allocation-bar">
        {items.map((item) => (
          <span key={item.label} className={item.className} style={{ width: `${Math.max(0, item.value / total) * 100}%` }}>
            {Math.round((item.value / total) * 100)}%
          </span>
        ))}
      </div>
      <div className="allocation-legend">
        {items.map((item) => <span key={item.label}><i className={item.className} />{item.label} · {euro(item.value)} · {Math.round((item.value / total) * 100)}%</span>)}
      </div>
    </section>
  );
}

function CapitalChart({ monthlyCapital, durationMonths, peak }: { monthlyCapital: number[]; durationMonths: number; peak: number }) {
  const width = 650;
  const height = 180;
  const padX = 28;
  const padY = 24;
  const max = Math.max(peak, 1);
  const points = monthlyCapital.map((value, month) => {
    const x = padX + (month / Math.max(durationMonths, 1)) * (width - padX * 2);
    const y = height - padY - (Math.max(0, value) / max) * (height - padY * 2);
    return { x, y, month, value };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;

  return (
    <section className="chart-card">
      <div className="chart-head"><TableTitle>Capital deployment</TableTitle><span>Peak <strong>{euro(peak)}</strong></span></div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Capital deployment over time">
        {[0, 5, 10, 15, durationMonths].filter((v, i, a) => v <= durationMonths && a.indexOf(v) === i).map((month) => {
          const x = padX + (month / Math.max(durationMonths, 1)) * (width - padX * 2);
          return <g key={month}><line x1={x} y1={padY} x2={x} y2={height - padY} className="grid-line" /><text x={x} y={height - 5} textAnchor="middle">m{month}</text></g>;
        })}
        <polygon points={area} className="chart-area" />
        <polyline points={line} className="chart-line" />
        {points.filter((_, index) => index === 0 || index === points.length - 1 || index % Math.max(1, Math.floor(durationMonths / 8)) === 0).map((point) => <circle key={point.month} cx={point.x} cy={point.y} r="4" />)}
        <line x1={width - padX} y1={padY} x2={width - padX} y2={height - padY} className="exit-line" />
        <text x={width - padX - 2} y={18} textAnchor="end" className="exit-label">Exit</text>
      </svg>
    </section>
  );
}

type SensitivityRow = {
  change: number;
  netProfit: number;
  roi: number;
  irr: number;
  salePrice?: number;
  projectCost?: number;
};

function SensitivityTable({ rows, valueKey, valueLabel }: { rows: SensitivityRow[]; valueKey: "salePrice" | "projectCost"; valueLabel: string }) {
  return (
    <table>
      <thead><tr><th></th><th>{valueLabel}</th><th>Net Profit</th><th>ROI</th><th>IRR</th></tr></thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.change}>
            <td><strong>{row.change === 0 ? "Base" : `${row.change > 0 ? "+" : ""}${numberFormatter.format(row.change * 100)}%`}</strong></td>
            <td>{euro(row[valueKey] ?? 0)}</td>
            <td className="positive">{euro(row.netProfit)}</td>
            <td className="positive">{percent(row.roi, true)}</td>
            <td className="positive">{percent(row.irr, true)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PageFooter({ label, page }: { label: string; page: string }) {
  return <footer><span>{label}</span><span>Page {page}</span></footer>;
}

const styles = `
  :root {
    --ink: #111111;
    --muted: #9393a5;
    --line: #d7dbe2;
    --soft: #f2f3f5;
    --paper: #ffffff;
    --green: #007a46;
    --red: #bf001f;
    --warm: #fbf8f2;
  }

  * { box-sizing: border-box; }
  body { margin: 0; background: #ecebe8; color: var(--ink); font-family: Arial, Helvetica, sans-serif; }
  button, input { font: inherit; }
  .screen { padding: 28px 18px 60px; }

  .live-input {
    width: min(1100px, 100%);
    margin: 0 auto 34px;
    padding: 24px;
    border-radius: 22px;
    background: var(--warm);
    box-shadow: 0 16px 45px rgba(0,0,0,.1);
  }
  .input-header { display: flex; align-items: start; justify-content: space-between; gap: 20px; }
  .input-header span, .input-group h2, .field span, .section-heading > span, .metric > span, .data-block h3, .table-title {
    letter-spacing: .2em;
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 800;
    color: #8d8da0;
  }
  .input-header h1 { margin: 6px 0 0; font-size: 26px; }
  .input-header button { border: 0; border-radius: 99px; padding: 13px 20px; background: #171717; color: white; font-weight: 800; cursor: pointer; }
  .input-group { margin-top: 22px; padding-top: 18px; border-top: 1px solid #ddd7ce; }
  .input-group h2 { margin: 0 0 14px; color: #705c45; }
  .input-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  .field { display: grid; gap: 7px; }
  .field-wide { grid-column: span 2; }
  .field span { color: #6a5740; letter-spacing: 0; text-transform: none; font-size: 12px; }
  .field input { width: 100%; min-height: 46px; padding: 10px 12px; border: 1px solid #d5d2cc; border-radius: 12px; background: white; }

  .report-page {
    position: relative;
    width: min(780px, 100%);
    min-height: 1020px;
    margin: 0 auto 28px;
    padding: 42px 40px 68px;
    background: var(--paper);
    box-shadow: 0 18px 50px rgba(0,0,0,.12);
  }
  .report-header { padding-bottom: 20px; border-bottom: 3px solid #111; }
  .report-header h1 { margin: 0; font-size: 30px; line-height: 1.08; }
  .report-header p, .section-heading p { margin: 5px 0 0; color: var(--muted); font-size: 12px; }
  .section-heading { margin-top: 27px; padding-bottom: 18px; border-bottom: 1px solid var(--line); }
  .section-heading h2 { margin: 5px 0 0; font-size: 22px; }
  .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 20px; border: 1px solid #cdd2da; }
  .metric { min-height: 66px; padding: 14px 16px; border-right: 1px solid #cdd2da; }
  .metric:last-child { border-right: 0; }
  .metric strong { display: block; margin-top: 6px; font-size: 20px; }
  .metric small { display: block; margin-top: 5px; color: var(--muted); font-size: 10px; }
  .compact-metrics .metric { min-height: 100px; }
  .positive { color: var(--green) !important; }
  .negative { color: var(--red) !important; }
  .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 25px; }
  .data-block.full { margin-top: 24px; }
  .data-block h3 { margin: 0 0 4px; padding-bottom: 7px; border-bottom: 1px solid var(--line); }
  .data-block dl { margin: 0; }
  .data-row { display: flex; justify-content: space-between; gap: 18px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
  .data-row dt { min-width: 0; }
  .data-row dd { margin: 0; text-align: right; }
  .data-row.strong { font-weight: 800; }
  .allocation { margin-top: 25px; }
  .allocation-title, .chart-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .allocation-title .table-title, .chart-head .table-title { margin-bottom: 8px; }
  .allocation-title > span, .chart-head > span { color: var(--muted); font-size: 10px; }
  .allocation-bar { display: flex; height: 28px; overflow: hidden; border-radius: 4px; background: #eee; }
  .allocation-bar span { display: flex; align-items: center; justify-content: center; min-width: 0; color: white; font-size: 10px; font-weight: 800; }
  .acquisition { background: #050505; } .project { background: #5d5954; } .commission { background: #aaa9a4; } .profit { background: #237b4b; }
  .allocation-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin-top: 10px; color: #6f7380; font-size: 10px; }
  .allocation-legend i { display: inline-block; width: 5px; height: 5px; margin-right: 6px; vertical-align: middle; }

  .table-title { margin: 28px 0 6px; padding-bottom: 7px; border-bottom: 1px solid var(--line); }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { padding: 11px 8px; background: var(--soft); color: #657084; text-align: left; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; }
  td { padding: 8px; border-bottom: 1px solid var(--line); }
  th:not(:first-child), td:not(:first-child) { text-align: right; }
  .note { margin-top: 17px; color: #687084; font-size: 11px; font-style: italic; line-height: 1.5; }
  .sale-row { background: #eef8f1; }
  .table-scroll { overflow-x: auto; }

  .chart-card { margin-top: 24px; padding: 16px 20px 20px; border: 1px solid var(--line); border-radius: 4px; }
  .chart-card svg { width: 100%; height: auto; overflow: visible; }
  .grid-line { stroke: #e0e3e8; stroke-width: 1; }
  .chart-area { fill: #efefef; }
  .chart-line { fill: none; stroke: #222; stroke-width: 3; }
  .chart-card circle { fill: white; stroke: #222; stroke-width: 2; }
  .chart-card text { fill: #9a9ead; font-size: 10px; }
  .exit-line { stroke: var(--green); stroke-dasharray: 4 4; stroke-width: 2; }
  .exit-label { fill: var(--green) !important; font-weight: 800; }

  .photo-stack { display: grid; gap: 16px; }
  .photo-stack img { display: block; width: 100%; max-height: 275px; object-fit: cover; border-radius: 4px; }
  .photo-placeholder { display: grid; place-items: center; min-height: 600px; border: 1px dashed #c8ccd4; color: #9297a3; }
  footer { position: absolute; left: 40px; right: 40px; bottom: 28px; display: flex; justify-content: space-between; gap: 20px; padding-top: 12px; border-top: 1px solid var(--line); color: #b1b4bd; font-size: 10px; }

  @media (max-width: 850px) {
    .input-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .metric-grid { grid-template-columns: repeat(2, 1fr); }
    .metric:nth-child(2) { border-right: 0; }
    .metric:nth-child(-n+2) { border-bottom: 1px solid #cdd2da; }
    .two-column { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .screen { padding: 0; }
    .live-input { border-radius: 0; margin-bottom: 0; padding: 18px; }
    .input-header { flex-direction: column; }
    .input-grid { grid-template-columns: 1fr; }
    .field-wide { grid-column: auto; }
    .report-page { min-height: auto; margin-bottom: 0; padding: 28px 18px 70px; box-shadow: none; }
    .metric-grid { grid-template-columns: 1fr; }
    .metric { border-right: 0; border-bottom: 1px solid #cdd2da; }
    .metric:last-child { border-bottom: 0; }
    .allocation-legend { grid-template-columns: 1fr; }
    footer { left: 18px; right: 18px; }
  }

  @page { size: A4; margin: 0; }
  @media print {
    body { background: white; }
    .no-print { display: none !important; }
    .screen { padding: 0; }
    .report-page { width: 210mm; height: 297mm; min-height: 0; margin: 0; padding: 14mm 14mm 18mm; box-shadow: none; break-after: page; page-break-after: always; overflow: hidden; }
    .report-page:last-child { break-after: auto; page-break-after: auto; }
    footer { left: 14mm; right: 14mm; bottom: 8mm; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;
