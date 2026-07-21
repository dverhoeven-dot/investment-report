"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

export type LosNaranjosConfig = {
  title: string;
  subtitle: string;
  footerLabel: string;
};

type ProjectOwnership = "own" | "shared";
type ProjectType = "New Build" | "Renovation";
type CapitalSplitSource =
  | "ourPercentage"
  | "ourAmount"
  | "partnerPercentage"
  | "partnerAmount";

type Downpayment = {
  month: string;
  amount: string;
};

export type LosNaranjosInitialData = {
  projectName: string;
  analysisDate: string;
  projectType: string;
  projectOwnership?: ProjectOwnership;
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
  fixedInterior?: number;
  looseFurniture?: number;
  furniturePaymentMonths?: number;
  looseFurniturePaymentMonths?: number;
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
  projectType: ProjectType;
  projectOwnership: ProjectOwnership;
  capitalSplitSource: CapitalSplitSource;
  ourEquityPercentage: string;
  ourEquityAmount: string;
  partnerEquityPercentage: string;
  partnerEquityAmount: string;
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
  fixedInterior: string;
  looseFurniture: string;
  furniturePaymentMonths: string;
  looseFurniturePaymentMonths: string;
  projectManagementPercentage: string;

  salePrice: string;
  agentCommissionPercentage: string;

  downpaymentCount: string;
  downpayments: Downpayment[];
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
  // In de live invoer betekent 1 altijd 1% en 0,9 altijd 0,9%.
  return parseNumber(value) / 100;
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeProjectType(value: unknown): ProjectType {
  return String(value).toLowerCase().includes("reno")
    ? "Renovation"
    : "New Build";
}

function normalizeProjectOwnership(value: unknown): ProjectOwnership {
  return value === "own" ? "own" : "shared";
}

function normalizeCapitalSplitSource(value: unknown): CapitalSplitSource {
  return value === "ourAmount" ||
    value === "partnerPercentage" ||
    value === "partnerAmount"
    ? value
    : "ourPercentage";
}

function createInitialForm(data: LosNaranjosInitialData): FormState {
  const downpayments: Downpayment[] = Array.from({ length: 10 }, () => ({
    month: "0",
    amount: "0",
  }));

  return {
    projectName: "",
    analysisDate: data.analysisDate,
    projectType: "Renovation",
    projectOwnership: "own",
    capitalSplitSource: "ourPercentage",

    // De gedeelde-projectverdeling blijft op een bruikbare standaard staan.
    // Deze velden zijn verborgen zolang "Eigen project" is geselecteerd.
    ourEquityPercentage: "50",
    ourEquityAmount: "0",
    partnerEquityPercentage: "50",
    partnerEquityAmount: "0",

    surfaceM2: "0",
    plotM2: "0",
    durationMonths: "0",

    purchasePrice: "0",
    transferTaxPercentage: "0",
    lawyerFeePercentage: "0",
    notaryFee: "0",
    otherAcquisitionCosts: "0",

    buildCostPerM2: "0",
    contingencyPercentage: "0",
    fixedInterior: "0",
    looseFurniture: "0",

    // Een betaalperiode en construction draw kunnen niet uit nul maanden bestaan.
    furniturePaymentMonths: "1",
    looseFurniturePaymentMonths: "1",
    projectManagementPercentage: "0",

    salePrice: "0",
    agentCommissionPercentage: "0",

    downpaymentCount: "0",
    downpayments,
    closingMonth: "0",
    constructionStartMonth: "0",
    constructionDraws: "1",
  };
}

function normalizeStoredForm(
  value: unknown,
  initialData: LosNaranjosInitialData
): FormState {
  const base = createInitialForm(initialData);
  if (!value || typeof value !== "object") return base;

  const stored = value as Partial<FormState> & {
    furniture?: string;
    firstPaymentMonth?: string;
    firstPaymentAmount?: string;
    secondPaymentMonth?: string;
    secondPaymentAmount?: string;
    thirdPaymentMonth?: string;
    thirdPaymentAmount?: string;
  };

  const legacyDownpayments: Downpayment[] = [
    {
      month: stored.firstPaymentMonth ?? base.downpayments[0]?.month ?? "",
      amount: stored.firstPaymentAmount ?? base.downpayments[0]?.amount ?? "",
    },
    {
      month: stored.secondPaymentMonth ?? base.downpayments[1]?.month ?? "",
      amount: stored.secondPaymentAmount ?? base.downpayments[1]?.amount ?? "",
    },
    {
      month: stored.thirdPaymentMonth ?? base.downpayments[2]?.month ?? "",
      amount: stored.thirdPaymentAmount ?? base.downpayments[2]?.amount ?? "",
    },
  ];

  const sourceDownpayments = Array.isArray(stored.downpayments)
    ? stored.downpayments
        .filter(
          (item): item is Downpayment =>
            Boolean(item && typeof item === "object")
        )
        .map((item) => ({
          month: String(item.month ?? ""),
          amount: String(item.amount ?? ""),
        }))
    : legacyDownpayments;

  const requestedCount = clampInteger(
    parseNumber(String(stored.downpaymentCount ?? sourceDownpayments.length)),
    0,
    10
  );

  const downpayments = sourceDownpayments.slice(0, requestedCount);
  while (downpayments.length < requestedCount) {
    downpayments.push({ month: "", amount: "" });
  }

  return {
    ...base,
    ...stored,
    projectType: normalizeProjectType(stored.projectType ?? base.projectType),
    projectOwnership: normalizeProjectOwnership(
      stored.projectOwnership ?? base.projectOwnership
    ),
    capitalSplitSource: normalizeCapitalSplitSource(
      stored.capitalSplitSource ?? base.capitalSplitSource
    ),
    ourEquityAmount: String(stored.ourEquityAmount ?? base.ourEquityAmount),
    partnerEquityPercentage: String(
      stored.partnerEquityPercentage ?? base.partnerEquityPercentage
    ),
    partnerEquityAmount: String(
      stored.partnerEquityAmount ?? base.partnerEquityAmount
    ),
    fixedInterior: String(
      stored.fixedInterior ?? stored.furniture ?? base.fixedInterior
    ),
    looseFurniture: String(stored.looseFurniture ?? base.looseFurniture),
    looseFurniturePaymentMonths: String(
      stored.looseFurniturePaymentMonths ?? base.looseFurniturePaymentMonths
    ),
    downpaymentCount: String(requestedCount),
    downpayments,
  };
}

function calculateAnnualizedIrr(
  cashflows: Array<Pick<CashflowItem, "month" | "outflow" | "inflow">>
) {
  if (cashflows.length === 0) return Number.NaN;

  const lastMonth = Math.max(
    0,
    ...cashflows.map((item) => Math.max(0, Math.round(item.month)))
  );
  const monthlyNetCashflows = Array.from(
    { length: lastMonth + 1 },
    () => 0
  );

  cashflows.forEach((item) => {
    const month = Math.max(0, Math.round(item.month));
    monthlyNetCashflows[month] += item.inflow - item.outflow;
  });

  const hasInvestment = monthlyNetCashflows.some((value) => value < 0);
  const hasReturn = monthlyNetCashflows.some((value) => value > 0);
  if (!hasInvestment || !hasReturn) return Number.NaN;

  const npv = (monthlyRate: number) =>
    monthlyNetCashflows.reduce(
      (sum, cashflow, month) =>
        sum + cashflow / Math.pow(1 + monthlyRate, month),
      0
    );

  let lowerRate = -0.999999;
  let upperRate = 1;
  let lowerNpv = npv(lowerRate);
  let upperNpv = npv(upperRate);

  while (
    Number.isFinite(upperNpv) &&
    Math.sign(lowerNpv) === Math.sign(upperNpv) &&
    upperRate < 1_000_000
  ) {
    upperRate *= 2;
    upperNpv = npv(upperRate);
  }

  if (
    !Number.isFinite(lowerNpv) ||
    !Number.isFinite(upperNpv) ||
    Math.sign(lowerNpv) === Math.sign(upperNpv)
  ) {
    return Number.NaN;
  }

  let monthlyIrr = 0;
  for (let iteration = 0; iteration < 200; iteration += 1) {
    monthlyIrr = (lowerRate + upperRate) / 2;
    const middleNpv = npv(monthlyIrr);

    if (!Number.isFinite(middleNpv)) return Number.NaN;
    if (Math.abs(middleNpv) < 0.01) break;

    if (Math.sign(middleNpv) === Math.sign(lowerNpv)) {
      lowerRate = monthlyIrr;
      lowerNpv = middleNpv;
    } else {
      upperRate = monthlyIrr;
      upperNpv = middleNpv;
    }
  }

  return Math.pow(1 + monthlyIrr, 12) - 1;
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
  const [photoInputKey, setPhotoInputKey] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setForm(normalizeStoredForm(JSON.parse(saved), initialData));
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

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCapitalSplit(
    source: CapitalSplitSource,
    value: string
  ) {
    const fieldBySource: Record<CapitalSplitSource, keyof FormState> = {
      ourPercentage: "ourEquityPercentage",
      ourAmount: "ourEquityAmount",
      partnerPercentage: "partnerEquityPercentage",
      partnerAmount: "partnerEquityAmount",
    };

    setForm((current) => ({
      ...current,
      capitalSplitSource: source,
      [fieldBySource[source]]: value,
    }));
  }

  function updateDownpaymentCount(value: string) {
    const count = clampInteger(parseNumber(value), 0, 10);

    setForm((current) => {
      const downpayments = current.downpayments.slice(0, count);
      while (downpayments.length < count) {
        downpayments.push({ month: "", amount: "" });
      }

      return {
        ...current,
        downpaymentCount: String(count),
        downpayments,
      };
    });
  }

  function updateDownpayment(
    index: number,
    field: keyof Downpayment,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      downpayments: current.downpayments.map((payment, paymentIndex) =>
        paymentIndex === index ? { ...payment, [field]: value } : payment
      ),
    }));
  }

  function printReport() {
    window.print();
  }

  function resetForm() {
    localStorage.removeItem(STORAGE_KEY);
    setForm(createInitialForm(initialData));
    setUploadedPhotos([]);
    setPhotoInputKey((current) => current + 1);
  }

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []).slice(0, 3);

    if (selectedFiles.length === 0) {
      setUploadedPhotos([]);
      return;
    }

    Promise.all(
      selectedFiles.map(
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
      .catch((error) =>
        console.warn("Foto's konden niet worden geladen.", error)
      );
  }

  const data = useMemo(() => {
    const projectName = form.projectName.trim();
    const projectType = form.projectType;
    const projectOwnership = form.projectOwnership;
    const isSharedProject = projectOwnership === "shared";
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
    const fixedInterior = Math.max(0, parseNumber(form.fixedInterior));
    const looseFurniture = Math.max(0, parseNumber(form.looseFurniture));
    const projectManagementPercentage = isSharedProject
      ? Math.max(0, parsePercent(form.projectManagementPercentage))
      : 0;

    const baseBuildCost = surfaceM2 * buildCostPerM2;
    const contingency = baseBuildCost * contingencyPercentage;
    const projectSubtotal = baseBuildCost + contingency + fixedInterior;
    const projectManagement = isSharedProject
      ? projectSubtotal * projectManagementPercentage
      : 0;
    const totalProjectCost = projectSubtotal + projectManagement;
    const developmentCapital = totalAcquisition + totalProjectCost;
    const capitalDeployed = developmentCapital + looseFurniture;

    let ourEquityPercentage = 1;
    if (isSharedProject) {
      switch (form.capitalSplitSource) {
        case "ourAmount":
          ourEquityPercentage = capitalDeployed
            ? parseNumber(form.ourEquityAmount) / capitalDeployed
            : 0;
          break;
        case "partnerPercentage":
          ourEquityPercentage = 1 - parsePercent(form.partnerEquityPercentage);
          break;
        case "partnerAmount":
          ourEquityPercentage = capitalDeployed
            ? 1 - parseNumber(form.partnerEquityAmount) / capitalDeployed
            : 0;
          break;
        case "ourPercentage":
        default:
          ourEquityPercentage = parsePercent(form.ourEquityPercentage);
          break;
      }
      ourEquityPercentage = Math.min(1, Math.max(0, ourEquityPercentage));
    }
    const partnerEquityPercentage = isSharedProject
      ? 1 - ourEquityPercentage
      : 0;

    const salePrice = Math.max(0, parseNumber(form.salePrice));
    const agentCommissionPercentage = Math.max(
      0,
      parsePercent(form.agentCommissionPercentage)
    );
    const agentCommission = salePrice * agentCommissionPercentage;
    const netSaleProceedsBeforeFurniture = salePrice - agentCommission;
    const netProceeds = netSaleProceedsBeforeFurniture;
    const netProfit = netSaleProceedsBeforeFurniture - capitalDeployed;
    const roi = capitalDeployed ? netProfit / capitalDeployed : 0;

    // Bij een gedeeld project wordt de volledige kosten- en opbrengstenverdeling
    // naar rato van de ingelegde vermogenspercentages berekend.
    const ourInvestment = capitalDeployed * ourEquityPercentage;
    const partnerInvestment = capitalDeployed * partnerEquityPercentage;
    const ourAcquisitionCosts = totalAcquisition * ourEquityPercentage;
    const partnerAcquisitionCosts = totalAcquisition * partnerEquityPercentage;
    const ourProjectCosts = totalProjectCost * ourEquityPercentage;
    const partnerProjectCosts = totalProjectCost * partnerEquityPercentage;
    const ourLooseFurniture = looseFurniture * ourEquityPercentage;
    const partnerLooseFurniture = looseFurniture * partnerEquityPercentage;
    const ourSalesCommission = agentCommission * ourEquityPercentage;
    const partnerSalesCommission = agentCommission * partnerEquityPercentage;
    const ourGrossProceeds = salePrice * ourEquityPercentage;
    const partnerGrossProceeds = salePrice * partnerEquityPercentage;
    const ourNetProceeds = netProceeds * ourEquityPercentage;
    const partnerNetProceeds = netProceeds * partnerEquityPercentage;
    const ourNetProfit = netProfit * ourEquityPercentage;
    const partnerNetProfit = netProfit * partnerEquityPercentage;
    const ourRoi = ourInvestment ? ourNetProfit / ourInvestment : 0;
    const partnerRoi = partnerInvestment
      ? partnerNetProfit / partnerInvestment
      : 0;

    const downpaymentCount = clampInteger(
      parseNumber(form.downpaymentCount),
      0,
      10
    );
    const downpayments = form.downpayments
      .slice(0, downpaymentCount)
      .map((payment, index) => ({
        index,
        month: Math.max(0, Math.round(parseNumber(payment.month))),
        amount: Math.max(0, parseNumber(payment.amount)),
      }));

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
    const furniturePaymentMonths = clampInteger(
      parseNumber(form.furniturePaymentMonths),
      1,
      constructionDraws
    );
    const looseFurniturePaymentMonths = clampInteger(
      parseNumber(form.looseFurniturePaymentMonths),
      1,
      constructionDraws
    );

    const totalDownpayments = downpayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const finalPurchasePayment = Math.max(
      0,
      purchasePrice - totalDownpayments
    );

    const rawCashflow: Omit<CashflowItem, "runningCapital">[] = [
      ...downpayments
        .filter((payment) => payment.amount > 0)
        .map((payment) => ({
          month: payment.month,
          event: `Downpayment ${payment.index + 1}`,
          outflow: payment.amount,
          inflow: 0,
        })),
      {
        month: closingMonth,
        event: "Final purchase payment",
        outflow: finalPurchasePayment,
        inflow: 0,
      },
      {
        month: closingMonth,
        event: "Transfer tax",
        outflow: transferTax,
        inflow: 0,
      },
      {
        month: closingMonth,
        event: "Lawyer fee",
        outflow: lawyerFee,
        inflow: 0,
      },
      {
        month: closingMonth,
        event: "Notary fee",
        outflow: notaryFee,
        inflow: 0,
      },
      {
        month: closingMonth,
        event: "Other acquisition costs",
        outflow: otherAcquisitionCosts,
        inflow: 0,
      },
    ];

    // De gewone bouw- en projectkosten worden gelijk over alle construction draws
    // verdeeld. Vaste inbouw en losse meubels worden bovenop de laatste gekozen
    // construction draws gezet. Er ontstaan dus geen losse meubelregels meer.
    const projectCostExcludingFixedInterior = Math.max(
      0,
      totalProjectCost - fixedInterior
    );
    const baseConstructionDrawAmount =
      projectCostExcludingFixedInterior / constructionDraws;
    const fixedInteriorPerSelectedDraw =
      fixedInterior / furniturePaymentMonths;
    const firstFixedInteriorDrawIndex =
      constructionDraws - furniturePaymentMonths;
    const looseFurniturePerSelectedMonth =
      looseFurniture / looseFurniturePaymentMonths;
    const firstLooseFurnitureDrawIndex =
      constructionDraws - looseFurniturePaymentMonths;

    for (let index = 0; index < constructionDraws; index += 1) {
      const includesFixedInterior = index >= firstFixedInteriorDrawIndex;
      const includesLooseFurniture =
        index >= firstLooseFurnitureDrawIndex;
      const constructionDrawAmount =
        baseConstructionDrawAmount +
        (includesFixedInterior ? fixedInteriorPerSelectedDraw : 0) +
        (includesLooseFurniture ? looseFurniturePerSelectedMonth : 0);

      rawCashflow.push({
        month: constructionStartMonth + index,
        event: `Construction draw ${index + 1}/${constructionDraws}`,
        outflow: constructionDrawAmount,
        inflow: 0,
      });
    }

    rawCashflow.push({
      month: durationMonths,
      event: "Sales proceeds (after commission)",
      outflow: 0,
      inflow: netSaleProceedsBeforeFurniture,
    });

    rawCashflow.sort((a, b) => a.month - b.month || a.event.localeCompare(b.event));

    let runningCapital = 0;
    const cashflow: CashflowItem[] = rawCashflow.map((item) => {
      runningCapital += item.outflow - item.inflow;
      return { ...item, runningCapital };
    });

    const irr = calculateAnnualizedIrr(rawCashflow);
    const ourIrr =
      ourInvestment > 0
        ? calculateAnnualizedIrr(
            rawCashflow.map((item) => ({
              ...item,
              outflow: item.outflow * ourEquityPercentage,
              inflow: item.inflow * ourEquityPercentage,
            }))
          )
        : Number.NaN;
    const partnerIrr =
      partnerInvestment > 0
        ? calculateAnnualizedIrr(
            rawCashflow.map((item) => ({
              ...item,
              outflow: item.outflow * partnerEquityPercentage,
              inflow: item.inflow * partnerEquityPercentage,
            }))
          )
        : Number.NaN;

    const cashAtMonth0 = cashflow
      .filter((item) => item.month === 0)
      .reduce((sum, item) => sum + item.outflow, 0);

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
    // Alleen aankoopprijs, downpayments/final payment, belasting en aankoopfees.
    // Bouw- en interieurbetalingen tellen hier nooit mee, ook niet als ze eerder starten.
    const cashByNotary = totalAcquisition;

    const investmentCashflow = rawCashflow.filter(
      (item) => item.event !== "Sales proceeds (after commission)"
    );

    const exitScenarios = [6, 9, 12, 15, 18, durationMonths]
      .filter((month, index, values) => month > 0 && values.indexOf(month) === index)
      .sort((a, b) => a - b)
      .map((month) => ({
        month,
        netProfit,
        roi,
        irr: calculateAnnualizedIrr([
          ...investmentCashflow,
          {
            month,
            event: "Sales proceeds (after commission)",
            outflow: 0,
            inflow: netSaleProceedsBeforeFurniture,
          },
        ]),
      }));

    const saleSensitivity = [-0.1, -0.05, 0, 0.05, 0.1].map((change) => {
      const scenarioSalePrice = salePrice * (1 + change);
      const scenarioNetSaleProceedsBeforeFurniture =
        scenarioSalePrice * (1 - agentCommissionPercentage);
      const scenarioNetProceeds =
        scenarioNetSaleProceedsBeforeFurniture;
      const scenarioProfit =
        scenarioNetSaleProceedsBeforeFurniture - capitalDeployed;
      const scenarioRoi = capitalDeployed
        ? scenarioProfit / capitalDeployed
        : 0;
      return {
        change,
        salePrice: scenarioSalePrice,
        netProfit: scenarioProfit,
        roi: scenarioRoi,
        irr: calculateAnnualizedIrr([
          ...investmentCashflow,
          {
            month: durationMonths,
            event: "Sales proceeds (after commission)",
            outflow: 0,
            inflow: scenarioNetSaleProceedsBeforeFurniture,
          },
        ]),
      };
    });

    const projectCostSensitivity = [-0.1, -0.05, 0, 0.05, 0.1].map(
      (change) => {
        const scenarioProjectCost = totalProjectCost * (1 + change);
        const scenarioCapital =
          totalAcquisition + scenarioProjectCost + looseFurniture;
        const scenarioProfit =
          netSaleProceedsBeforeFurniture - scenarioCapital;
        const scenarioRoi = scenarioCapital ? scenarioProfit / scenarioCapital : 0;
        const constructionCostFactor = totalProjectCost
          ? scenarioProjectCost / totalProjectCost
          : 0;
        const scenarioInvestmentCashflow = investmentCashflow.map((item) => {
          const constructionDrawMatch = item.event.match(
            /^Construction draw (\d+)\/(\d+)$/
          );

          if (!constructionDrawMatch) return item;

          const drawIndex = Number(constructionDrawMatch[1]) - 1;
          const looseFurniturePortion =
            drawIndex >= firstLooseFurnitureDrawIndex
              ? looseFurniturePerSelectedMonth
              : 0;
          const projectCostPortion = Math.max(
            0,
            item.outflow - looseFurniturePortion
          );

          return {
            ...item,
            outflow:
              projectCostPortion * constructionCostFactor +
              looseFurniturePortion,
          };
        });

        return {
          change,
          projectCost: scenarioProjectCost,
          netProfit: scenarioProfit,
          roi: scenarioRoi,
          irr: calculateAnnualizedIrr([
            ...scenarioInvestmentCashflow,
            {
              month: durationMonths,
              event: "Sales proceeds (after commission)",
              outflow: 0,
              inflow: netSaleProceedsBeforeFurniture,
            },
          ]),
        };
      }
    );

    return {
      projectName,
      analysisDate: form.analysisDate,
      projectType,
      projectOwnership,
      isSharedProject,
      capitalSplitSource: form.capitalSplitSource,
      ourEquityPercentage,
      partnerEquityPercentage,
      ourInvestment,
      partnerInvestment,
      ourAcquisitionCosts,
      partnerAcquisitionCosts,
      ourProjectCosts,
      partnerProjectCosts,
      ourLooseFurniture,
      partnerLooseFurniture,
      ourSalesCommission,
      partnerSalesCommission,
      ourGrossProceeds,
      partnerGrossProceeds,
      ourNetProceeds,
      partnerNetProceeds,
      ourNetProfit,
      partnerNetProfit,
      ourRoi,
      partnerRoi,
      ourIrr,
      partnerIrr,
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
      fixedInterior,
      looseFurniture,
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
      netSaleProceedsBeforeFurniture,
      netProceeds,
      netProfit,
      roi,
      irr,
      cashflow,
      monthlyCapital,
      peakDeployed,
      averageCapitalDuration,
      cashByNotary,
      cashAtMonth0,
      furniturePaymentMonths,
      looseFurniturePaymentMonths,
      downpaymentCount,
      exitScenarios,
      saleSensitivity,
      projectCostSensitivity,
    };
  }, [form]);


  const constructionDrawCountForInput = Math.max(
    1,
    Math.round(parseNumber(form.constructionDraws))
  );
  const furniturePaymentMonthsValue = String(
    clampInteger(
      parseNumber(form.furniturePaymentMonths),
      1,
      constructionDrawCountForInput
    )
  );
  const furniturePaymentOptions = Array.from(
    { length: constructionDrawCountForInput },
    (_, index) => {
      const months = index + 1;
      return {
        value: String(months),
        shortLabel: months === 1 ? "1 maand" : `${months} maanden`,
        label:
          months === 1
            ? "1 maand · bij de laatste construction draw"
            : `${months} maanden · over de laatste ${months} construction draws`,
      };
    }
  );
  const looseFurniturePaymentMonthsValue = String(
    clampInteger(
      parseNumber(form.looseFurniturePaymentMonths),
      1,
      constructionDrawCountForInput
    )
  );
  const looseFurniturePaymentOptions = Array.from(
    { length: constructionDrawCountForInput },
    (_, index) => {
      const months = index + 1;
      return {
        value: String(months),
        shortLabel: months === 1 ? "1 maand" : `${months} maanden`,
        label:
          months === 1
            ? "1 maand · in de laatste construction-drawmaand"
            : `${months} maanden · over de laatste ${months} construction-drawmaanden`,
      };
    }
  );

  const photos = uploadedPhotos.slice(0, 3);
  const hasPhotos = photos.length > 0;

  // Houd de kasstroomtabel altijd binnen een A4-pagina.
  // Extra bouwbetalingen krijgen automatisch een vervolgpaginа.
  const cashflowRowsPerPage = 22;
  const cashflowPageCount = Math.max(
    1,
    Math.ceil(data.cashflow.length / cashflowRowsPerPage)
  );
  const cashflowPages = Array.from({ length: cashflowPageCount }, (_, pageIndex) =>
    data.cashflow.slice(
      pageIndex * cashflowRowsPerPage,
      (pageIndex + 1) * cashflowRowsPerPage
    )
  );

  const sharedFinancingPageCount = data.isSharedProject ? 1 : 0;
  const sharedFinancingPageNumber = data.isSharedProject ? 2 : 0;
  const exitPageNumber = 2 + sharedFinancingPageCount;
  const cashOverviewPageNumber = 3 + sharedFinancingPageCount;
  const cashDetailStartPageNumber = cashOverviewPageNumber + 1;
  const sensitivityPageNumber =
    cashDetailStartPageNumber + cashflowPageCount;
  const photosPageNumber = hasPhotos ? sensitivityPageNumber + 1 : 0;
  const totalPages = sensitivityPageNumber + (hasPhotos ? 1 : 0);

  const exitSectionNumber = String(2 + sharedFinancingPageCount).padStart(2, "0");
  const cashSectionNumber = String(3 + sharedFinancingPageCount).padStart(2, "0");
  const sensitivitySectionNumber = String(4 + sharedFinancingPageCount).padStart(2, "0");

  return (
    <main className="screen">
      <style>{styles}</style>

      <section className="live-input no-print">
        <header className="input-header">
          <div>
            <span>Live invoer</span>
            <h1>{form.projectName.trim()}</h1>
          </div>
          <div className="input-actions">
            <button type="button" className="print-button" onClick={printReport}>
              Afdrukken
            </button>
            <button type="button" onClick={resetForm}>
              Reset naar beginwaarden
            </button>
          </div>
        </header>

        <InputGroup title="Projectgegevens">
          <SelectField
            label="Projectvorm"
            value={form.projectOwnership}
            options={[
              { value: "own", label: "Eigen project" },
              { value: "shared", label: "Gedeeld project" },
            ]}
            onChange={(value) =>
              updateField("projectOwnership", value as ProjectOwnership)
            }
          />
          <InputField
            label="Projectnaam"
            value={form.projectName}
            onChange={(value) => updateField("projectName", value)}
          />
          <InputField
            label="Analyse-datum"
            type="date"
            value={form.analysisDate}
            onChange={(value) => updateField("analysisDate", value)}
          />
          <SelectField
            label="Projecttype"
            value={form.projectType}
            options={[
              { value: "New Build", label: "New Build" },
              { value: "Renovation", label: "Renovation" },
            ]}
            onChange={(value) =>
              updateField("projectType", value as ProjectType)
            }
          />
          <InputField
            label="Oppervlakte m²"
            value={form.surfaceM2}
            onChange={(value) => updateField("surfaceM2", value)}
          />
          <InputField
            label="Perceel m²"
            value={form.plotM2}
            onChange={(value) => updateField("plotM2", value)}
          />
          <InputField
            label="Looptijd maanden"
            value={form.durationMonths}
            onChange={(value) => updateField("durationMonths", value)}
          />
          <label className="field field-wide">
            <span>Projectfoto’s (maximaal 3)</span>
            <input
              key={photoInputKey}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
            />
            <small>
              {hasPhotos
                ? `${photos.length} foto${photos.length === 1 ? "" : "’s"} geselecteerd`
                : "Geen foto’s geselecteerd — de fotopagina wordt dan niet opgenomen."}
            </small>
          </label>
        </InputGroup>

        {form.projectOwnership === "shared" && (
          <InputGroup title="Financiering gedeeld project">
            <CapitalSplitFields
              totalCapital={data.capitalDeployed}
              source={form.capitalSplitSource}
              ourPercentage={
                form.capitalSplitSource === "ourPercentage"
                  ? form.ourEquityPercentage
                  : inputPercent(data.ourEquityPercentage)
              }
              ourAmount={
                form.capitalSplitSource === "ourAmount"
                  ? form.ourEquityAmount
                  : inputNumber(Math.round(data.ourInvestment))
              }
              partnerPercentage={
                form.capitalSplitSource === "partnerPercentage"
                  ? form.partnerEquityPercentage
                  : inputPercent(data.partnerEquityPercentage)
              }
              partnerAmount={
                form.capitalSplitSource === "partnerAmount"
                  ? form.partnerEquityAmount
                  : inputNumber(Math.round(data.partnerInvestment))
              }
              onChange={updateCapitalSplit}
            />
          </InputGroup>
        )}

        <InputGroup title="Aankoop">
          <InputField
            label="Aankoopprijs"
            value={form.purchasePrice}
            onChange={(value) => updateField("purchasePrice", value)}
          />
          <InputField
            label="Overdrachtsbelasting %"
            value={form.transferTaxPercentage}
            onChange={(value) =>
              updateField("transferTaxPercentage", value)
            }
          />
          <InputField
            label="Advocaatkosten %"
            value={form.lawyerFeePercentage}
            onChange={(value) => updateField("lawyerFeePercentage", value)}
          />
          <InputField
            label="Notariskosten"
            value={form.notaryFee}
            onChange={(value) => updateField("notaryFee", value)}
          />
          <InputField
            label="Overige aankoopkosten"
            value={form.otherAcquisitionCosts}
            onChange={(value) =>
              updateField("otherAcquisitionCosts", value)
            }
          />
        </InputGroup>

        <InputGroup title="Bouw en verkoop">
          <InputField
            label="Bouwkosten per m²"
            value={form.buildCostPerM2}
            onChange={(value) => updateField("buildCostPerM2", value)}
          />
          <InputField
            label="Onvoorzien %"
            value={form.contingencyPercentage}
            onChange={(value) =>
              updateField("contingencyPercentage", value)
            }
          />
          <InputField
            label="Vaste inbouw"
            value={form.fixedInterior}
            onChange={(value) => updateField("fixedInterior", value)}
          />
          <DetailedSelectField
            label="Vaste inbouw betalen over"
            value={furniturePaymentMonthsValue}
            options={furniturePaymentOptions}
            onChange={(value) =>
              updateField("furniturePaymentMonths", value)
            }
          />
          <InputField
            label="Verkoopprijs"
            value={form.salePrice}
            onChange={(value) => updateField("salePrice", value)}
          />
          <InputField
            label="Makelaarscommissie %"
            value={form.agentCommissionPercentage}
            onChange={(value) =>
              updateField("agentCommissionPercentage", value)
            }
          />
          <InputField
            label="Losse meubels"
            value={form.looseFurniture}
            onChange={(value) => updateField("looseFurniture", value)}
          />
          <DetailedSelectField
            label="Losse meubels betalen over"
            value={looseFurniturePaymentMonthsValue}
            options={looseFurniturePaymentOptions}
            onChange={(value) =>
              updateField("looseFurniturePaymentMonths", value)
            }
          />
          {form.projectOwnership === "shared" && (
            <InputField
              label="Projectmanagement %"
              value={form.projectManagementPercentage}
              onChange={(value) =>
                updateField("projectManagementPercentage", value)
              }
            />
          )}
        </InputGroup>

        <InputGroup title="Betalingsplanning">
          <RangeField
            label="Aantal downpayments"
            value={form.downpaymentCount}
            min={0}
            max={10}
            onChange={updateDownpaymentCount}
          />

          {form.downpayments.length > 0 ? (
            <div className="downpayment-list field-full">
              {form.downpayments.map((payment, index) => (
                <section className="downpayment-card" key={`downpayment-${index}`}>
                  <h3>Downpayment {index + 1}</h3>
                  <div className="downpayment-card-grid">
                    <InputField
                      label="Maand"
                      value={payment.month}
                      onChange={(value) =>
                        updateDownpayment(index, "month", value)
                      }
                    />
                    <InputField
                      label="Bedrag"
                      value={payment.amount}
                      onChange={(value) =>
                        updateDownpayment(index, "amount", value)
                      }
                    />
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="input-hint field-full">
              Geen downpayments: de volledige resterende aankoopprijs wordt
              opgenomen bij de passeerdatum.
            </p>
          )}

          <InputField
            label="Passeerdatum maand"
            value={form.closingMonth}
            onChange={(value) => updateField("closingMonth", value)}
          />
          <InputField
            label="Start bouwbetalingen"
            value={form.constructionStartMonth}
            onChange={(value) =>
              updateField("constructionStartMonth", value)
            }
          />
          <InputField
            label="Aantal bouwbetalingen"
            value={form.constructionDraws}
            onChange={(value) => updateField("constructionDraws", value)}
          />
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
            <DataRow label="Fixed Built-in" value={euro(data.fixedInterior)} />
            {data.isSharedProject && (
              <>
                <DataRow
                  label="Subtotal"
                  value={euro(data.projectSubtotal)}
                  strong
                />
                <DataRow
                  label={`Project Management (${percent(
                    data.projectManagementPercentage
                  )})`}
                  value={euro(data.projectManagement)}
                />
              </>
            )}
            <DataRow
              label="Total Project Cost"
              value={euro(data.totalProjectCost)}
              strong
            />
          </DataBlock>
        </div>

        <DataBlock title="Exit & Returns" full>
          <DataRow label="Gross Sale Price" value={euro(data.salePrice)} strong />
          <DataRow label={`Agent Commission (${percent(data.agentCommissionPercentage)})`} value={euro(data.agentCommission)} />
          <DataRow label="Loose Furniture" value={euro(data.looseFurniture)} />
          <DataRow label="Net Proceeds" value={euro(data.netProceeds)} strong />
          <DataRow label="Net Profit / (Loss)" value={signedEuro(data.netProfit)} strong positive={data.netProfit >= 0} />
        </DataBlock>

        <AllocationBar
          salePrice={data.salePrice}
          acquisition={data.totalAcquisition}
          project={data.totalProjectCost + data.looseFurniture}
          commission={data.agentCommission}
          profit={data.netProfit}
        />
        <PageFooter label={config.footerLabel} page={`1 / ${totalPages}`} />
      </section>

      {data.isSharedProject && (
        <section className="report-page shared-financing-page">
          <SectionHeading
            number="02"
            eyebrow="Shared financing"
            title="Investment & Return Split"
            subtitle="Proportional allocation between our own equity and partner / external capital."
          />

          <div className="metric-grid shared-metrics">
            <Metric
              label="Our equity share"
              value={percent(data.ourEquityPercentage)}
              sub={euro(data.ourInvestment)}
            />
            <Metric
              label="Partner / external share"
              value={percent(data.partnerEquityPercentage)}
              sub={euro(data.partnerInvestment)}
            />
            <Metric
              label="Our net profit"
              value={signedEuro(data.ourNetProfit)}
              positive={data.ourNetProfit >= 0}
            />
            <Metric
              label="Partner net profit"
              value={signedEuro(data.partnerNetProfit)}
              positive={data.partnerNetProfit >= 0}
            />
          </div>

          <TableTitle>Costs and proceeds allocation</TableTitle>
          <table className="split-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total project</th>
                <th>Our equity</th>
                <th>Partner / external</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Acquisition and purchase</strong></td>
                <td>{euro(data.totalAcquisition)}</td>
                <td>{euro(data.ourAcquisitionCosts)}</td>
                <td>{euro(data.partnerAcquisitionCosts)}</td>
              </tr>
              <tr>
                <td><strong>Construction and project</strong></td>
                <td>{euro(data.totalProjectCost)}</td>
                <td>{euro(data.ourProjectCosts)}</td>
                <td>{euro(data.partnerProjectCosts)}</td>
              </tr>
              <tr>
                <td><strong>Loose furniture</strong></td>
                <td>{euro(data.looseFurniture)}</td>
                <td>{euro(data.ourLooseFurniture)}</td>
                <td>{euro(data.partnerLooseFurniture)}</td>
              </tr>
              <tr className="split-total-row">
                <td><strong>Total investment</strong></td>
                <td><strong>{euro(data.capitalDeployed)}</strong></td>
                <td><strong>{euro(data.ourInvestment)}</strong></td>
                <td><strong>{euro(data.partnerInvestment)}</strong></td>
              </tr>
              <tr>
                <td><strong>Gross sale proceeds</strong></td>
                <td>{euro(data.salePrice)}</td>
                <td>{euro(data.ourGrossProceeds)}</td>
                <td>{euro(data.partnerGrossProceeds)}</td>
              </tr>
              <tr>
                <td><strong>Sales commission</strong></td>
                <td>-{euro(data.agentCommission)}</td>
                <td>-{euro(data.ourSalesCommission)}</td>
                <td>-{euro(data.partnerSalesCommission)}</td>
              </tr>
              <tr className="sale-row">
                <td><strong>Net sale proceeds</strong></td>
                <td className="positive"><strong>{euro(data.netProceeds)}</strong></td>
                <td className="positive"><strong>{euro(data.ourNetProceeds)}</strong></td>
                <td className="positive"><strong>{euro(data.partnerNetProceeds)}</strong></td>
              </tr>
              <tr className="split-profit-row">
                <td><strong>Net profit / (loss)</strong></td>
                <td className={data.netProfit >= 0 ? "positive" : "negative"}>{signedEuro(data.netProfit)}</td>
                <td className={data.ourNetProfit >= 0 ? "positive" : "negative"}>{signedEuro(data.ourNetProfit)}</td>
                <td className={data.partnerNetProfit >= 0 ? "positive" : "negative"}>{signedEuro(data.partnerNetProfit)}</td>
              </tr>
              <tr className="split-return-row">
                <td><strong>ROI</strong></td>
                <td className={data.roi >= 0 ? "positive" : "negative"}>{percent(data.roi, true)}</td>
                <td className={data.ourRoi >= 0 ? "positive" : "negative"}>{percent(data.ourRoi, true)}</td>
                <td className={data.partnerRoi >= 0 ? "positive" : "negative"}>{percent(data.partnerRoi, true)}</td>
              </tr>
              <tr className="split-return-row">
                <td><strong>IRR ({data.durationMonths}M annualised)</strong></td>
                <td className={data.irr >= 0 ? "positive" : "negative"}>{percent(data.irr, true)}</td>
                <td className={data.ourIrr >= 0 ? "positive" : "negative"}>{percent(data.ourIrr, true)}</td>
                <td className={data.partnerIrr >= 0 ? "positive" : "negative"}>{percent(data.partnerIrr, true)}</td>
              </tr>
            </tbody>
          </table>

          <p className="note">
            <strong>Assumption:</strong> costs, sale proceeds and profit are split in the same proportion as the capital contribution. Interest, preferred returns or a separate profit waterfall are not included.
          </p>

          <PageFooter
            label={config.footerLabel}
            page={`${sharedFinancingPageNumber} / ${totalPages}`}
          />
        </section>
      )}

      <section className="report-page">
        <SectionHeading number={exitSectionNumber} eyebrow="Exit analysis" title="Returns by Exit Timeline" subtitle="Returns under different exit scenarios." />
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
        <p className="note"><strong>Note:</strong> IRR is calculated from the actual monthly downpayments, acquisition costs, construction draws, loose-furniture payments and sale proceeds. Earlier exit scenarios keep the same planned costs and move the net sale proceeds to the selected exit month.</p>
        <PageFooter label={config.footerLabel} page={`${exitPageNumber} / ${totalPages}`} />
      </section>

      <section className="report-page cash-page cash-overview-page">
        <SectionHeading
          number={cashSectionNumber}
          eyebrow="Cash plan"
          title="Capital Deployment Schedule"
          subtitle={`Custom schedule · ${data.cashflow.length} tranches · ${data.durationMonths} months to exit`}
        />

        <div className="metric-grid compact-metrics">
          <Metric
            label="Cash @ Month 0"
            value={euro(data.cashAtMonth0)}
            sub={`${percent(
              data.capitalDeployed
                ? data.cashAtMonth0 / data.capitalDeployed
                : 0
            )} of total capital`}
          />
          <Metric
            label="Cash by notary"
            value={euro(data.cashByNotary)}
            sub={`Purchase, tax and fees only · month ${parseNumber(
              form.closingMonth
            )}`}
          />
          <Metric
            label="Peak Deployed"
            value={euro(data.peakDeployed)}
            sub={`Before exit in month ${data.durationMonths}`}
          />
          <Metric
            label="Avg. Capital Duration"
            value={`${numberFormatter.format(data.averageCapitalDuration)}m`}
            sub="Weighted by € × months"
          />
        </div>

        <CapitalChart
          monthlyCapital={data.monthlyCapital}
          durationMonths={data.durationMonths}
          peak={data.peakDeployed}
        />

        <section className="cash-summary-card">
          <TableTitle>Deployment summary</TableTitle>
          <table>
            <tbody>
              <tr>
                <td><strong>Acquisition and purchase</strong></td>
                <td>{euro(data.totalAcquisition)}</td>
              </tr>
              <tr>
                <td><strong>Construction and project</strong></td>
                <td>{euro(data.totalProjectCost)}</td>
              </tr>
              <tr>
                <td><strong>Loose furniture</strong></td>
                <td>{euro(data.looseFurniture)}</td>
              </tr>
              <tr>
                <td><strong>Total capital deployed</strong></td>
                <td>{euro(data.capitalDeployed)}</td>
              </tr>
              <tr className="sale-row">
                <td><strong>Net sale proceeds</strong></td>
                <td className="positive">{euro(data.netProceeds)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <PageFooter label={config.footerLabel} page={`${cashOverviewPageNumber} / ${totalPages}`} />
      </section>

      {cashflowPages.map((rows, pageIndex) => {
        const pageNumber = cashDetailStartPageNumber + pageIndex;
        const firstRowNumber = pageIndex * cashflowRowsPerPage + 1;
        const lastRowNumber = firstRowNumber + rows.length - 1;

        return (
          <section
            className="report-page cash-page cash-detail-page"
            key={`cashflow-page-${pageIndex}`}
          >
            <SectionHeading
              number={cashSectionNumber}
              eyebrow="Cash detail"
              title={
                pageIndex === 0
                  ? "Cash Flow Detail"
                  : "Cash Flow Detail — Continued"
              }
              subtitle={
                data.isSharedProject
                  ? `Tranches ${firstRowNumber}–${lastRowNumber} of ${data.cashflow.length} · split ${percent(data.ourEquityPercentage)} / ${percent(data.partnerEquityPercentage)}`
                  : `Tranches ${firstRowNumber}–${lastRowNumber} of ${data.cashflow.length}`
              }
            />

            <section className="cash-table-card">
              <TableTitle>Cash flow detail</TableTitle>
              <div className="table-scroll">
                <table
                  className={
                    data.isSharedProject ? "shared-cashflow-table" : undefined
                  }
                >
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Event</th>
                      <th>Outflow</th>
                      {data.isSharedProject && (
                        <>
                          <th>Our investment</th>
                          <th>Partner investment</th>
                        </>
                      )}
                      <th>Inflow</th>
                      <th>Running Capital</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr
                        key={`${row.month}-${row.event}-${pageIndex}-${rowIndex}`}
                        className={row.inflow > 0 ? "sale-row" : undefined}
                      >
                        <td>{row.month}</td>
                        <td><strong>{row.event}</strong></td>
                        <td className="negative">
                          {row.outflow ? `-${euro(row.outflow)}` : "—"}
                        </td>
                        {data.isSharedProject && (
                          <>
                            <td className="negative party-investment-cell">
                              {row.outflow
                                ? `-${euro(
                                    row.outflow * data.ourEquityPercentage
                                  )}`
                                : "—"}
                            </td>
                            <td className="negative party-investment-cell">
                              {row.outflow
                                ? `-${euro(
                                    row.outflow * data.partnerEquityPercentage
                                  )}`
                                : "—"}
                            </td>
                          </>
                        )}
                        <td className="positive">
                          {row.inflow ? euro(row.inflow) : "—"}
                        </td>
                        <td>{signedEuro(row.runningCapital)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <PageFooter
              label={config.footerLabel}
              page={`${pageNumber} / ${totalPages}`}
            />
          </section>
        );
      })}

      <section className="report-page sensitivity-page">
        <SectionHeading
          number={sensitivitySectionNumber}
          eyebrow="Sensitivity"
          title="Sensitivity Analysis"
          subtitle="Impact of key assumption variations, holding everything else constant."
        />

        <section className="sensitivity-block">
          <TableTitle>Sale price sensitivity</TableTitle>
          <SensitivityTable
            rows={data.saleSensitivity}
            valueKey="salePrice"
            valueLabel="Sale Price"
          />
        </section>

        <section className="sensitivity-block">
          <TableTitle>Project cost sensitivity</TableTitle>
          <SensitivityTable
            rows={data.projectCostSensitivity}
            valueKey="projectCost"
            valueLabel="Project Cost"
          />
        </section>

        <PageFooter label={config.footerLabel} page={`${sensitivityPageNumber} / ${totalPages}`} />
      </section>

      {hasPhotos && (
        <section className="report-page photos-page">
          <TableTitle>Property photos</TableTitle>
          <div className="photo-stack">
            {photos.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={src}
                alt={`${data.projectName} foto ${index + 1}`}
              />
            ))}
          </div>
          <PageFooter
            label={config.footerLabel}
            page={`${photosPageNumber} / ${totalPages}`}
          />
        </section>
      )}
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

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}


function DetailedSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; shortLabel: string }[];
  onChange: (value: string) => void;
}) {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <label className="field">
      <span>{label}</span>
      <div className="detailed-select">
        <span className="detailed-select-value">
          {selectedOption?.shortLabel ?? "Kies aantal maanden"}
        </span>
        <select
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.currentTarget.value)}
        >
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function CapitalSplitFields({
  totalCapital,
  source,
  ourPercentage,
  ourAmount,
  partnerPercentage,
  partnerAmount,
  onChange,
}: {
  totalCapital: number;
  source: CapitalSplitSource;
  ourPercentage: string;
  ourAmount: string;
  partnerPercentage: string;
  partnerAmount: string;
  onChange: (source: CapitalSplitSource, value: string) => void;
}) {
  const field = (
    label: string,
    value: string,
    fieldSource: CapitalSplitSource,
    suffix: string
  ) => (
    <label
      className={`capital-input ${source === fieldSource ? "capital-input-active" : ""}`}
    >
      <span>{label}</span>
      <div className="capital-input-box">
        <input
          value={value}
          inputMode="decimal"
          onChange={(event) => onChange(fieldSource, event.currentTarget.value)}
        />
        <small>{suffix}</small>
      </div>
    </label>
  );

  return (
    <div className="capital-split-fields field-full">
      <div className="capital-split-heading">
        <div>
          <span>Totale investering</span>
          <strong>{euro(totalCapital)}</strong>
        </div>
        <p>Het laatst aangepaste bedrag of percentage bepaalt automatisch de overige drie velden.</p>
      </div>

      <div className="capital-party-grid">
        <section>
          <h3>Ons eigen vermogen</h3>
          <div className="capital-party-fields">
            {field("Bedrag", ourAmount, "ourAmount", "€")}
            {field("Percentage", ourPercentage, "ourPercentage", "%")}
          </div>
        </section>

        <section>
          <h3>Partner / vreemd vermogen</h3>
          <div className="capital-party-fields">
            {field("Bedrag", partnerAmount, "partnerAmount", "€")}
            {field("Percentage", partnerPercentage, "partnerPercentage", "%")}
          </div>
        </section>
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
  const shownValue = clampInteger(parseNumber(value), min, max);

  return (
    <label className="range-field field-full">
      <span>{label}</span>
      <div className="range-control">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={shownValue}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <output>
          {shownValue} {shownValue === 1 ? "downpayment" : "downpayments"}
        </output>
      </div>
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
    --muted: #7f8390;
    --line: #d7dbe2;
    --soft: #f2f3f5;
    --paper: #ffffff;
    --green: #007a46;
    --red: #bf001f;
    --warm: #fbf8f2;
  }

  * { box-sizing: border-box; }
  html { background: #ecebe8; }
  body {
    margin: 0;
    background: #ecebe8;
    color: var(--ink);
    font-family: Arial, Helvetica, sans-serif;
  }
  button, input, select { font: inherit; }
  img, svg { max-width: 100%; }
  .screen { padding: 28px 18px 60px; }

  .live-input {
    width: min(1100px, 100%);
    margin: 0 auto 34px;
    padding: 24px;
    border-radius: 22px;
    background: var(--warm);
    box-shadow: 0 16px 45px rgba(0,0,0,.1);
  }
  .input-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }
  .input-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
  .input-header span,
  .input-group h2,
  .field span,
  .section-heading > span,
  .metric > span,
  .data-block h3,
  .table-title {
    letter-spacing: .2em;
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 800;
    color: #8d8da0;
  }
  .input-header h1 { margin: 6px 0 0; font-size: 26px; }
  .input-header button {
    border: 0;
    border-radius: 99px;
    padding: 13px 20px;
    background: #171717;
    color: white;
    font-weight: 800;
    cursor: pointer;
  }
  .input-header .print-button {
    border: 1px solid #171717;
    background: white;
    color: #171717;
  }
  .input-group { margin-top: 22px; padding-top: 18px; border-top: 1px solid #ddd7ce; }
  .input-group h2 { margin: 0 0 14px; color: #705c45; }
  .input-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  .field { display: grid; gap: 7px; }
  .field-wide { grid-column: span 2; }
  .field span { color: #6a5740; letter-spacing: 0; text-transform: none; font-size: 12px; }
  .field input,
  .field select {
    width: 100%;
    min-height: 46px;
    padding: 10px 12px;
    border: 1px solid #d5d2cc;
    border-radius: 12px;
    background: white;
    color: #171717;
  }
  .field select { cursor: pointer; }
  .detailed-select { position: relative; min-height: 46px; }
  .detailed-select-value {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 46px;
    padding: 10px 38px 10px 12px;
    border: 1px solid #d5d2cc;
    border-radius: 12px;
    background: white;
    color: #171717 !important;
    font-size: inherit !important;
  }
  .detailed-select::after {
    content: "⌄";
    position: absolute;
    top: 50%;
    right: 14px;
    transform: translateY(-55%);
    color: #6a5740;
    pointer-events: none;
  }
  .detailed-select select {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  .detailed-select select option { color: #171717; }
  .field-full { grid-column: 1 / -1; }
  .range-field {
    display: grid;
    gap: 9px;
    padding: 14px 16px;
    border: 1px solid #d8d1c7;
    border-radius: 14px;
    background: rgba(255, 255, 255, .55);
  }
  .range-field > span {
    color: #6a5740;
    font-size: 12px;
    font-weight: 700;
  }
  .range-control {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 150px;
    align-items: center;
    gap: 18px;
  }
  .range-control input { width: 100%; accent-color: #171717; }
  .range-control output {
    padding: 10px 12px;
    border: 1px solid #d5d2cc;
    border-radius: 10px;
    background: #ffffff;
    font-weight: 800;
    text-align: center;
  }
  .capital-split-fields {
    grid-column: 1 / -1;
    display: grid;
    gap: 16px;
    padding: 18px;
    border: 1px solid #d8d1c7;
    border-radius: 14px;
    background: rgba(255, 255, 255, .55);
  }
  .capital-split-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 20px;
  }
  .capital-split-heading > div { display: grid; gap: 4px; }
  .capital-split-heading span {
    color: #6a5740;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .capital-split-heading strong { font-size: 20px; }
  .capital-split-heading p {
    max-width: 430px;
    margin: 0;
    color: #756d64;
    font-size: 12px;
    line-height: 1.45;
    text-align: right;
  }
  .capital-party-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .capital-party-grid section {
    padding: 15px;
    border: 1px solid #ded8cf;
    border-radius: 10px;
    background: #ffffff;
  }
  .capital-party-grid h3 {
    margin: 0 0 12px;
    font-size: 14px;
  }
  .capital-party-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .capital-input { display: grid; gap: 7px; }
  .capital-input > span {
    color: #6f655a;
    font-size: 11px;
    font-weight: 800;
  }
  .capital-input-box {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    border: 1px solid #cfc7bc;
    border-radius: 8px;
    background: #ffffff;
    overflow: hidden;
  }
  .capital-input-box input {
    width: 100%;
    min-width: 0;
    padding: 10px 11px;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
  }
  .capital-input-box small {
    padding: 0 11px;
    color: #6f655a;
    font-size: 12px;
    font-weight: 800;
  }
  .capital-input-active .capital-input-box {
    border-color: #171717;
    box-shadow: 0 0 0 1px #171717;
  }

  .downpayment-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .downpayment-card {
    padding: 14px;
    border: 1px solid #d8d1c7;
    border-radius: 14px;
    background: rgba(255, 255, 255, .62);
  }
  .downpayment-card h3 {
    margin: 0 0 11px;
    color: #705c45;
    font-size: 12px;
  }
  .downpayment-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .input-hint {
    margin: 0;
    padding: 14px 16px;
    border: 1px dashed #cfc6ba;
    border-radius: 12px;
    color: #6f655a;
    background: rgba(255, 255, 255, .45);
    font-size: 13px;
  }

  .report-page {
    position: relative;
    width: min(980px, 100%);
    min-height: 1320px;
    margin: 0 auto 34px;
    padding: 54px 56px 86px;
    background: var(--paper);
    box-shadow: 0 24px 70px rgba(32, 31, 28, .18);
    overflow: hidden;
  }
  .report-header { padding-bottom: 22px; border-bottom: 3px solid #111; }
  .report-header h1 { margin: 0; font-size: 38px; line-height: 1.04; }
  .report-header p,
  .section-heading p { margin: 7px 0 0; color: var(--muted); font-size: 13px; }
  .section-heading { margin-top: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--line); }
  .section-heading h2 { margin: 6px 0 0; font-size: 27px; }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin-top: 24px;
    border: 1px solid #cdd2da;
  }
  .metric { min-height: 86px; padding: 16px 18px; border-right: 1px solid #cdd2da; }
  .metric:last-child { border-right: 0; }
  .metric strong { display: block; margin-top: 7px; font-size: 24px; }
  .metric small { display: block; margin-top: 6px; color: var(--muted); font-size: 11px; }
  .compact-metrics .metric { min-height: 112px; }
  .positive { color: var(--green) !important; }
  .negative { color: var(--red) !important; }

  .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 38px; margin-top: 30px; }
  .data-block.full { margin-top: 28px; }
  .data-block h3 { margin: 0 0 5px; padding-bottom: 9px; border-bottom: 1px solid var(--line); }
  .data-block dl { margin: 0; }
  .data-row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 9px 0;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  .data-row dt { min-width: 0; }
  .data-row dd { margin: 0; text-align: right; white-space: nowrap; }
  .data-row.strong { font-weight: 800; }

  .allocation { margin-top: 28px; }
  .allocation-title,
  .chart-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .allocation-title .table-title,
  .chart-head .table-title { margin-bottom: 9px; }
  .allocation-title > span,
  .chart-head > span { color: var(--muted); font-size: 11px; }
  .allocation-bar { display: flex; height: 32px; overflow: hidden; border-radius: 4px; background: #eee; }
  .allocation-bar span {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    color: white;
    font-size: 11px;
    font-weight: 800;
  }
  .acquisition { background: #050505; }
  .project { background: #5d5954; }
  .commission { background: #aaa9a4; }
  .profit { background: #237b4b; }
  .allocation-legend {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px 20px;
    margin-top: 12px;
    color: #6f7380;
    font-size: 11px;
  }
  .allocation-legend i {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 7px;
    vertical-align: middle;
  }

  .table-title { margin: 31px 0 8px; padding-bottom: 9px; border-bottom: 1px solid var(--line); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead { display: table-header-group; }
  th {
    padding: 12px 10px;
    background: var(--soft);
    color: #657084;
    text-align: left;
    font-size: 10px;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  td { padding: 10px; border-bottom: 1px solid var(--line); }
  th:not(:first-child),
  td:not(:first-child) { text-align: right; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .note { margin-top: 20px; color: #687084; font-size: 12px; font-style: italic; line-height: 1.55; }
  .sale-row { background: #eef8f1; }
  .table-scroll { overflow-x: auto; }
  .cash-table-card {
    margin-top: 24px;
    padding: 0 18px 16px;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: #ffffff;
  }
  .cash-table-card .table-title { margin-top: 0; padding-top: 18px; }
  .cash-page th:nth-child(2),
  .cash-page td:nth-child(2) { text-align: left; }

  .chart-card { margin-top: 28px; padding: 18px 22px 22px; border: 1px solid var(--line); border-radius: 4px; }
  .chart-card svg { width: 100%; height: auto; overflow: visible; }
  .grid-line { stroke: #e0e3e8; stroke-width: 1; }
  .chart-area { fill: #efefef; }
  .chart-line { fill: none; stroke: #222; stroke-width: 3; }
  .chart-card circle { fill: white; stroke: #222; stroke-width: 2; }
  .chart-card text { fill: #9a9ead; font-size: 10px; }
  .exit-line { stroke: var(--green); stroke-dasharray: 4 4; stroke-width: 2; }
  .exit-label { fill: var(--green) !important; font-weight: 800; }

  .shared-financing-page .shared-metrics { margin-bottom: 34px; }
  .shared-financing-page .split-table td:first-child,
  .shared-financing-page .split-table th:first-child { text-align: left; }
  .split-total-row { background: #f2f3f5; }
  .split-profit-row { font-weight: 800; border-top: 2px solid #111111; }
  .split-return-row { font-weight: 800; }
  .split-return-row:last-child { border-bottom: 2px solid #111111; }

  .sensitivity-block + .sensitivity-block { margin-top: 42px; }
  .sensitivity-page .table-title { margin-top: 28px; }

  .photos-page .table-title { margin-top: 0; }
  .photo-stack {
    display: grid;
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 18px;
    min-height: 1120px;
  }
  .photo-stack img {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    object-fit: cover;
    border-radius: 4px;
  }
  .photo-placeholder {
    display: grid;
    place-items: center;
    min-height: 1120px;
    border: 1px dashed #c8ccd4;
    color: #9297a3;
  }

  footer {
    position: absolute;
    left: 56px;
    right: 56px;
    bottom: 30px;
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding-top: 13px;
    border-top: 1px solid var(--line);
    color: #9297a3;
    font-size: 10px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  @media (max-width: 1000px) {
    .report-page { width: min(980px, 100%); }
  }
  @media (max-width: 850px) {
    .input-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .downpayment-list { grid-template-columns: 1fr; }
    .metric-grid { grid-template-columns: repeat(2, 1fr); }
    .metric:nth-child(2) { border-right: 0; }
    .metric:nth-child(-n+2) { border-bottom: 1px solid #cdd2da; }
    .two-column { grid-template-columns: 1fr; }
    .report-page { min-height: auto; overflow: visible; }
    .photo-stack { grid-template-rows: none; min-height: 0; }
    .photo-stack img { height: auto; max-height: 420px; }
    .photo-placeholder { min-height: 600px; }
  }
  @media (max-width: 560px) {
    .screen { padding: 0; }
    .live-input { border-radius: 0; margin-bottom: 0; padding: 18px; }
    .input-header { flex-direction: column; }
    .input-actions { justify-content: flex-start; }
    .input-grid { grid-template-columns: 1fr; }
    .field-wide { grid-column: auto; }
    .range-control { grid-template-columns: 1fr; }
    .downpayment-card-grid { grid-template-columns: 1fr; }
    .capital-split-heading { align-items: start; flex-direction: column; }
    .capital-split-heading p { text-align: left; }
    .capital-party-grid, .capital-party-fields { grid-template-columns: 1fr; }
    .report-page { margin-bottom: 0; padding: 28px 18px 74px; box-shadow: none; }
    .report-header h1 { font-size: 31px; }
    .metric-grid { grid-template-columns: 1fr; }
    .metric { border-right: 0; border-bottom: 1px solid #cdd2da; }
    .metric:last-child { border-bottom: 0; }
    .allocation-legend { grid-template-columns: 1fr; }
    footer { left: 18px; right: 18px; }
  }

  @page {
    size: A4 portrait;
    margin: 0;
  }

  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html,
    body {
      width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
    }

    .no-print {
      display: none !important;
    }

    .screen {
      display: block !important;
      width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    .report-page {
      position: relative !important;
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      padding: 8mm 8mm 13mm !important;
      background: #ffffff !important;
      box-shadow: none !important;
      overflow: hidden !important;
      zoom: 1 !important;
      break-after: page !important;
      page-break-after: always !important;
    }

    .report-page:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }

    /* De voorbeeldpagina begint direct met 01 · Overview. */
    .overview-page .report-header {
      display: none !important;
    }

    .section-heading {
      margin-top: 0 !important;
      padding-bottom: 5mm !important;
      border-bottom: 0.35mm solid #aeb5c0 !important;
    }

    .section-heading > span,
    .metric > span,
    .data-block h3,
    .table-title {
      font-size: 7.5pt !important;
      letter-spacing: .18em !important;
    }

    .section-heading h2 {
      margin: 1.8mm 0 0 !important;
      font-size: 18pt !important;
      line-height: 1.05 !important;
      font-weight: 500 !important;
    }

    .section-heading p {
      margin-top: 3mm !important;
      font-size: 8.5pt !important;
      line-height: 1.35 !important;
    }

    .metric-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      margin-top: 6mm !important;
      border: 0.4mm solid #a6adb8 !important;
      background: #ffffff !important;
    }

    .metric {
      min-height: 25mm !important;
      padding: 5mm 4mm !important;
      border-right: 0.35mm solid #a6adb8 !important;
    }

    .metric:last-child {
      border-right: 0 !important;
    }

    .metric strong {
      margin-top: 3mm !important;
      font-size: 17pt !important;
      line-height: 1 !important;
    }

    .metric small {
      margin-top: 2mm !important;
      font-size: 7.5pt !important;
    }

    .two-column {
      grid-template-columns: 1fr 1fr !important;
      gap: 9mm !important;
      margin-top: 8mm !important;
    }

    .data-block.full {
      margin-top: 7mm !important;
    }

    .data-block h3 {
      margin-bottom: 0 !important;
      padding-bottom: 3mm !important;
      border-bottom: 0.3mm solid #aeb5c0 !important;
    }

    .data-row {
      gap: 5mm !important;
      padding: 3.1mm 0 !important;
      border-bottom: 0.25mm solid #bcc2cb !important;
      font-size: 8.6pt !important;
      line-height: 1.15 !important;
    }

    .data-row dd {
      flex: 0 0 auto !important;
    }

    .allocation {
      margin-top: 10mm !important;
    }

    .allocation-title .table-title,
    .chart-head .table-title {
      margin: 0 0 2.2mm !important;
      padding-bottom: 2.2mm !important;
    }

    .allocation-title > span,
    .chart-head > span {
      font-size: 7pt !important;
    }

    .allocation-bar {
      height: 8mm !important;
    }

    .allocation-bar span {
      font-size: 7.5pt !important;
    }

    .allocation-legend {
      gap: 2mm 8mm !important;
      margin-top: 3mm !important;
      font-size: 7.3pt !important;
    }

    .table-title {
      margin: 7mm 0 2mm !important;
      padding-bottom: 2.5mm !important;
      border-bottom: 0.3mm solid #aeb5c0 !important;
    }

    table {
      font-size: 8.5pt !important;
      border: 0.3mm solid #aeb5c0 !important;
    }

    th {
      padding: 3mm 2.5mm !important;
      border-bottom: 0.35mm solid #a6adb8 !important;
      background: #eceef1 !important;
      font-size: 7pt !important;
    }

    td {
      padding: 2.7mm 2.5mm !important;
      border-bottom: 0.25mm solid #bcc2cb !important;
    }

    .note {
      margin-top: 5mm !important;
      font-size: 8pt !important;
      line-height: 1.45 !important;
    }

    .chart-card {
      margin-top: 6mm !important;
      padding: 4mm 5mm 5mm !important;
      border: 0.35mm solid #a6adb8 !important;
    }

    /* Pagina 3: rustiger, duidelijkere vakken en beter leesbare tabel. */
    .cash-page .metric-grid {
      margin-top: 5mm !important;
    }

    .cash-page .metric {
      min-height: 23mm !important;
      padding: 3.5mm 4mm !important;
    }

    .cash-page .metric strong {
      font-size: 14.5pt !important;
    }

    .cash-page .chart-card {
      margin-top: 5mm !important;
      padding: 3mm 4mm 3mm !important;
      border: 0.4mm solid #a6adb8 !important;
      background: #ffffff !important;
    }

    .cash-page .chart-card svg {
      width: 100% !important;
      height: 42mm !important;
    }

    .cash-page .cash-table-card {
      margin-top: 5mm !important;
      padding: 0 3.5mm 3mm !important;
      border: 0.4mm solid #a6adb8 !important;
      border-radius: 0 !important;
      background: #ffffff !important;
    }

    .cash-page .cash-table-card .table-title {
      margin: 0 !important;
      padding: 3.5mm 0 2.5mm !important;
    }

    .cash-page table {
      table-layout: fixed !important;
      border: 0.3mm solid #aeb5c0 !important;
      font-size: 7.5pt !important;
    }

    .cash-page th {
      padding: 2mm 1.6mm !important;
      font-size: 6.4pt !important;
    }

    .cash-page td {
      padding: 1.55mm 1.6mm !important;
      line-height: 1.15 !important;
    }

    .cash-page th:nth-child(1),
    .cash-page td:nth-child(1) { width: 9% !important; text-align: center !important; }
    .cash-page th:nth-child(2),
    .cash-page td:nth-child(2) { width: 31% !important; text-align: left !important; }
    .cash-page th:nth-child(3),
    .cash-page td:nth-child(3),
    .cash-page th:nth-child(4),
    .cash-page td:nth-child(4),
    .cash-page th:nth-child(5),
    .cash-page td:nth-child(5) { width: 20% !important; text-align: right !important; }

    .cash-page .sale-row td {
      background: #e8f5ec !important;
      border-top: 0.35mm solid #78a98a !important;
      font-weight: 700 !important;
    }

    /* De overzichtspagina blijft altijd stabiel, ongeacht het aantal tranches. */
    .cash-overview-page .chart-card svg {
      height: 78mm !important;
    }

    .cash-overview-page .cash-summary-card {
      margin-top: 6mm !important;
      padding: 0 4mm 3mm !important;
      border: 0.4mm solid #a6adb8 !important;
      background: #ffffff !important;
    }

    .cash-overview-page .cash-summary-card .table-title {
      margin: 0 !important;
      padding: 3.5mm 0 2.5mm !important;
    }

    .cash-overview-page .cash-summary-card table {
      table-layout: fixed !important;
    }

    .cash-overview-page .cash-summary-card td {
      padding: 2.3mm 2mm !important;
      font-size: 8pt !important;
    }

    .cash-overview-page .cash-summary-card td:first-child {
      width: 65% !important;
      text-align: left !important;
    }

    .cash-overview-page .cash-summary-card td:last-child {
      width: 35% !important;
      text-align: right !important;
      font-weight: 700 !important;
    }

    /* Detailpagina's bevatten alleen een vaste hoeveelheid tabelregels. */
    .cash-detail-page .section-heading {
      margin-top: 0 !important;
    }

    .cash-detail-page .cash-table-card {
      margin-top: 8mm !important;
    }

    .cash-detail-page table {
      font-size: 8pt !important;
    }

    .cash-detail-page th {
      padding: 2.5mm 1.8mm !important;
      font-size: 6.8pt !important;
    }

    .cash-detail-page td {
      padding: 2.15mm 1.8mm !important;
      line-height: 1.18 !important;
    }

    .cash-detail-page tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .cash-detail-page .shared-cashflow-table {
      table-layout: fixed !important;
      font-size: 6.9pt !important;
    }

    .cash-detail-page .shared-cashflow-table th {
      padding: 2.2mm 1mm !important;
      font-size: 5.8pt !important;
      letter-spacing: .08em !important;
      white-space: normal !important;
      line-height: 1.15 !important;
    }

    .cash-detail-page .shared-cashflow-table td {
      padding: 2mm 1mm !important;
      white-space: nowrap !important;
    }

    .cash-detail-page .shared-cashflow-table th:nth-child(1),
    .cash-detail-page .shared-cashflow-table td:nth-child(1) {
      width: 6% !important;
    }

    .cash-detail-page .shared-cashflow-table th:nth-child(2),
    .cash-detail-page .shared-cashflow-table td:nth-child(2) {
      width: 24% !important;
      white-space: normal !important;
    }

    .cash-detail-page .shared-cashflow-table th:nth-child(n+3),
    .cash-detail-page .shared-cashflow-table td:nth-child(n+3) {
      width: 14% !important;
    }

    .sensitivity-block + .sensitivity-block {
      margin-top: 8mm !important;
    }

    .sensitivity-page .table-title {
      margin-top: 5mm !important;
    }

    .sensitivity-page table {
      font-size: 8.2pt !important;
    }

    .sensitivity-page th,
    .sensitivity-page td {
      padding-top: 2.6mm !important;
      padding-bottom: 2.6mm !important;
    }

    .photos-page .table-title {
      margin-top: 0 !important;
    }

    .photos-page .photo-stack {
      grid-template-rows: repeat(3, 1fr) !important;
      gap: 4mm !important;
      height: 264mm !important;
      min-height: 0 !important;
    }

    .photos-page .photo-stack img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
    }

    .photo-placeholder {
      min-height: 0 !important;
      height: 264mm !important;
    }

    .metric-grid,
    .two-column,
    .data-block,
    .allocation,
    .chart-card,
    table,
    .sensitivity-block,
    .photo-stack,
    img,
    svg {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .table-scroll {
      overflow: visible !important;
    }

    footer {
      left: 8mm !important;
      right: 8mm !important;
      bottom: 4mm !important;
      padding-top: 3mm !important;
      border-top: 1pt solid #596270 !important;
      font-size: 6.8pt !important;
    }

    /*
     * Printer-safe line system.
     * Hele punten (pt) en donkere, dekkende kleuren blijven scherper dan
     * lichte fractional-pixel/mm-lijnen bij browser- en PDF-afdrukken.
     */
    .section-heading {
      border-bottom: 1pt solid #596270 !important;
    }

    .metric-grid {
      border: 1pt solid #4f5967 !important;
      box-shadow: inset 0 0 0 0.25pt #4f5967 !important;
    }

    .metric {
      border-right: 1pt solid #596270 !important;
    }

    .data-block h3,
    .table-title {
      border-bottom: 1pt solid #66717f !important;
    }

    .data-row {
      border-bottom: 0.75pt solid #8a94a1 !important;
    }

    .chart-card,
    .cash-page .chart-card,
    .cash-page .cash-table-card,
    .cash-overview-page .cash-summary-card {
      border: 1pt solid #4f5967 !important;
      box-shadow: inset 0 0 0 0.25pt #4f5967 !important;
    }

    table,
    .cash-page table {
      border: 1pt solid #596270 !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
    }

    th,
    .cash-page th {
      border: 0 !important;
      border-bottom: 1pt solid #596270 !important;
      background: #e7e9ed !important;
    }

    td,
    .cash-page td {
      border: 0 !important;
      border-bottom: 0.75pt solid #8a94a1 !important;
    }

    th + th,
    td + td,
    .cash-page th + th,
    .cash-page td + td {
      border-left: 0.75pt solid #9aa3ae !important;
    }

    tbody tr:last-child td {
      border-bottom: 0 !important;
    }

    .cash-page .sale-row td {
      border-top: 1pt solid #4f7f60 !important;
    }

    .chart-card svg line,
    .chart-card svg rect {
      shape-rendering: crispEdges;
    }

    .grid-line {
      stroke: #9ca4af !important;
      stroke-width: 1.2 !important;
    }

    .chart-line {
      stroke: #111827 !important;
      stroke-width: 2.6 !important;
    }

    .exit-line {
      stroke: #237b4b !important;
      stroke-width: 2 !important;
    }
  }

`;