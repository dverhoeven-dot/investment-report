"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

export type LosNaranjosConfig = {
  title: string;
  subtitle: string;
  footerLabel: string;
};

type ProjectOwnership = "own" | "shared";
type ProjectType = "New Build" | "Renovation";
type PurchaseVatChoice = "no" | "yes";
type ProfitTaxChoice = "no" | "yes";
type BankFinancingChoice = "no" | "yes";
type BankRepaymentFrequency = "monthly" | "yearly";
type BankScheduleMode = "standard" | "custom";
type BankScheduledPayment = {
  month: string;
  amount: string;
};
type Downpayment = {
  month: string;
  amount: string;
};

type BuildLevel = string;
type BuildComponentType = string;
type BuildInputMode = "simple" | "detailed";
type BuildAreaLine = {
  level: BuildLevel;
  component: BuildComponentType;
  areaM2: string;
  costPerM2: string;
  salePricePerM2: string;
};

type InvestorInputMode = "amount" | "percentage";

type CoInvestor = {
  name: string;
  investmentInputMode: InvestorInputMode;
  monthlyTotalAmount: string;
  investmentPercentage: string;
};

type CashflowCategory = "acquisition" | "project" | "financing" | "sale";

type RawCashflowItem = {
  paymentId?: string;
  month: number;
  event: string;
  outflow: number;
  inflow: number;
  category: CashflowCategory;
  sortOrder?: number;
  bankEventType?: "draw" | "interest" | "principal";
};

export type LosNaranjosInitialData = {
  projectName: string;
  analysisDate: string;
  projectStartDate?: string;
  projectType: string;
  projectOwnership?: ProjectOwnership;
  surfaceM2: number;
  plotM2: number;
  durationMonths: number;

  purchasePrice: number;
  purchaseVatEnabled?: PurchaseVatChoice;
  purchaseVatPercentage?: number;
  transferTaxPercentage: number;
  lawyerFeePercentage: number;
  notaryFee: number;
  otherAcquisitionCosts: number;

  buildCostPerM2: number;
  contingencyPercentage: number;
  furniture: number;
  fixedInterior?: number;
  looseFurniture?: number;
  furnitureMarkupPercentage?: number;
  furniturePaymentMonths?: number;
  looseFurniturePaymentMonths?: number;
  projectManagementPercentage: number;

  salePrice: number;
  agentCommissionPercentage: number;
  saleLawyerFeePercentage?: number;
  profitTaxEnabled?: ProfitTaxChoice;
  profitTaxPercentage?: number;

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
  projectStartDate: string;
  projectType: ProjectType;
  projectOwnership: ProjectOwnership;
  coInvestorCount: string;
  coInvestors: CoInvestor[];
  // Legacy fields stay in the saved shape for backwards compatibility.
  // Detailed projects use buildLevels + buildAreas below.
  buildInputMode: BuildInputMode;
  buildRowsManual: boolean;
  surfaceM2: string;
  plotM2: string;
  durationMonths: string;
  buildLevels: BuildLevel[];
  buildAreas: BuildAreaLine[];

  purchasePrice: string;
  purchaseVatEnabled: PurchaseVatChoice;
  purchaseVatPercentage: string;
  transferTaxPercentage: string;
  lawyerFeePercentage: string;
  notaryFee: string;
  otherAcquisitionCosts: string;

  buildCostPerM2: string;
  contingencyPercentage: string;
  fixedInterior: string;
  looseFurniture: string;
  furnitureMarkupPercentage: string;
  furniturePaymentMonths: string;
  looseFurniturePaymentMonths: string;
  projectManagementPercentage: string;

  bankFinancingEnabled: BankFinancingChoice;
  bankDrawScheduleMode: BankScheduleMode;
  bankFinancingStartMonth: string;
  bankFinancingDrawMonths: string[];
  bankFinancingDrawAmounts: string[];
  bankFinancingAmount: string;
  bankFinancingTranches: string;
  bankInterestPercentage: string;
  bankRepaymentScheduleMode: BankScheduleMode;
  bankRepaymentAmount: string;
  bankRepaymentFrequency: BankRepaymentFrequency;
  bankRepaymentCount: string;
  bankRepaymentSchedule: BankScheduledPayment[];

  salePrice: string;
  agentCommissionPercentage: string;
  saleLawyerFeePercentage: string;
  profitTaxEnabled: ProfitTaxChoice;
  profitTaxPercentage: string;

  downpaymentCount: string;
  downpayments: Downpayment[];
  closingMonth: string;
  constructionStartMonth: string;
  constructionDraws: string;
};

type CashflowItem = RawCashflowItem & {
  date: string;
  runningCapital: number;
  ourInvestment: number;
  coInvestorInvestments: number[];
  bankFundingUsed: number;
};

type ParticipantSummary = {
  name: string;
  plannedCapital: number;
  usedCapital: number;
  unusedCapital: number;
  capitalShare: number;
  netProfit: number;
  netProceeds: number;
  roi: number;
  irr: number;
};


type CloudProject = {
  id: string;
  name: string;
  viewToken: string;
  editToken: string;
  canEdit: boolean;
  internalAccess: boolean;
};

type CloudProjectListItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type CloudStatus = "idle" | "loading" | "saving" | "saved" | "error";
type ProjectListStatus = "idle" | "loading" | "ready" | "error";

const STORAGE_KEY = "l3capital.los-naranjos.first-setup.v2";
const LEGACY_STORAGE_KEY = "l3capital.los-naranjos.first-setup.v1";
const MAX_CO_INVESTORS = 8;

const BUILD_LEVEL_OPTIONS: Array<{ value: BuildLevel; labelNl: string; labelEn: string }> = [
  { value: "ground", labelNl: "Begane grond", labelEn: "Ground Floor" },
  { value: "first", labelNl: "Eerste verdieping", labelEn: "First Floor" },
  { value: "second", labelNl: "Tweede verdieping", labelEn: "Second Floor" },
  { value: "basement", labelNl: "Kelder", labelEn: "Basement" },
  { value: "roof", labelNl: "Dak / dakterras", labelEn: "Roof / Roof Terrace" },
];

const BUILD_COMPONENT_OPTIONS: Array<{
  value: BuildComponentType;
  labelNl: string;
  labelEn: string;
}> = [
  { value: "built", labelNl: "Bebouwd", labelEn: "Built Area" },
  { value: "terrace", labelNl: "Terras", labelEn: "Terrace" },
  { value: "pool", labelNl: "Zwembad", labelEn: "Pool" },
  { value: "garage", labelNl: "Garage", labelEn: "Garage" },
];

function getBuildLevelLabel(level: BuildLevel, language: "nl" | "en") {
  const match = BUILD_LEVEL_OPTIONS.find((option) => option.value === level);
  return language === "nl" ? match?.labelNl ?? level : match?.labelEn ?? level;
}

function getBuildComponentLabel(
  component: BuildComponentType,
  language: "nl" | "en"
) {
  const match = BUILD_COMPONENT_OPTIONS.find((option) => option.value === component);
  if (match) return language === "nl" ? match.labelNl : match.labelEn;

  // Vrij toegevoegde onderdelen krijgen een unieke technische sleutel in de
  // opgeslagen data, maar tonen overal alleen de door de gebruiker gekozen naam.
  if (component.startsWith("custom:")) {
    const customName = component.split(":").slice(2).join(":").trim();
    if (customName) return customName;
  }

  return component;
}

function createBuildAreaLine(
  level: BuildLevel,
  component: BuildComponentType,
  areaM2 = "",
  costPerM2 = "",
  salePricePerM2 = ""
): BuildAreaLine {
  return { level, component, areaM2, costPerM2, salePricePerM2 };
}

function createBuildLevelLines(
  level: BuildLevel,
  legacyAreaM2 = "",
  legacyCostPerM2 = ""
): BuildAreaLine[] {
  // Verdiepingen starten bewust zonder standaard onderdelen. Alleen wanneer
  // bestaande algemene invoer wordt gemigreerd, nemen we die over als
  // "Bebouwd" op de begane grond.
  if (
    level === "ground" &&
    (legacyAreaM2.trim() !== "" || legacyCostPerM2.trim() !== "")
  ) {
    return [createBuildAreaLine(level, "built", legacyAreaM2, legacyCostPerM2)];
  }
  return [];
}

const amountFormatter = new Intl.NumberFormat("nl-NL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("nl-NL", {
  maximumFractionDigits: 1,
});

function euro(value: number) {
  const safeValue = Number.isFinite(value) ? Math.abs(value) : 0;
  return `€ ${amountFormatter.format(safeValue)}`;
}

function signedEuro(value: number) {
  if (!Number.isFinite(value)) return "—";
  return value < 0 ? `-${euro(value)}` : euro(value);
}

function percent(value: number, plus = false) {
  if (!Number.isFinite(value)) return "—";
  const shown = `${numberFormatter.format(value * 100)}%`;
  return plus && value > 0 ? `+${shown}` : shown;
}

function parseNumber(value: string) {
  const raw = value.trim().replace(/\s/g, "");
  if (!raw) return 0;

  let normalized = raw.replace(/[^\d,.-]/g, "");
  const commaIndex = normalized.lastIndexOf(",");
  const dotIndex = normalized.lastIndexOf(".");

  if (commaIndex >= 0 && dotIndex >= 0) {
    if (commaIndex > dotIndex) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (commaIndex >= 0) {
    normalized = normalized.replace(",", ".");
  } else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAmountInput(value: string) {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

function formatAmountInput(value: string) {
  const digits = normalizeAmountInput(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function caretPositionAfterDigits(value: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let seenDigits = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) seenDigits += 1;
    if (seenDigits >= digitCount) return index + 1;
  }
  return value.length;
}

function parsePercent(value: string) {
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

function createBlankDownpayment(): Downpayment {
  return { month: "", amount: "" };
}

function emptyIfZeroString(value: unknown) {
  const shown = String(value ?? "").trim();
  return /^0(?:[.,]0+)?$/.test(shown) ? "" : shown;
}

function createInvestor(index: number): CoInvestor {
  return {
    name: `Mede-investeerder ${index + 1}`,
    investmentInputMode: "amount",
    monthlyTotalAmount: "",
    investmentPercentage: "",
  };
}

function createInitialForm(data: LosNaranjosInitialData): FormState {
  const downpayments: Downpayment[] = [];

  return {
    projectName: "",
    analysisDate: data.analysisDate,
    projectStartDate: data.projectStartDate ?? data.analysisDate,
    projectType: "Renovation",
    projectOwnership: "own",
    coInvestorCount: "1",
    coInvestors: [createInvestor(0)],

    buildInputMode: "simple",
    buildRowsManual: true,
    surfaceM2: String(data.surfaceM2 ?? 0),
    plotM2: "0",
    durationMonths: "0",
    buildLevels: ["ground"],
    buildAreas: createBuildLevelLines(
      "ground",
      data.surfaceM2 > 0 ? String(data.surfaceM2) : "",
      data.buildCostPerM2 > 0 ? String(data.buildCostPerM2) : ""
    ),

    purchasePrice: "0",
    purchaseVatEnabled: data.purchaseVatEnabled === "yes" ? "yes" : "no",
    purchaseVatPercentage: String(data.purchaseVatPercentage ?? 0),
    transferTaxPercentage: "0",
    lawyerFeePercentage: "0",
    notaryFee: "0",
    otherAcquisitionCosts: "0",

    buildCostPerM2: String(data.buildCostPerM2 ?? 0),
    contingencyPercentage: "0",
    fixedInterior: "0",
    looseFurniture: "0",
    furnitureMarkupPercentage: "0",
    furniturePaymentMonths: "1",
    looseFurniturePaymentMonths: "1",
    projectManagementPercentage: "0",

    bankFinancingEnabled: "no",
    bankDrawScheduleMode: "standard",
    bankFinancingStartMonth: "",
    bankFinancingDrawMonths: [""],
    bankFinancingDrawAmounts: [""],
    bankFinancingAmount: "",
    bankFinancingTranches: "1",
    bankInterestPercentage: "",
    bankRepaymentScheduleMode: "standard",
    bankRepaymentAmount: "",
    bankRepaymentFrequency: "monthly",
    bankRepaymentCount: "1",
    bankRepaymentSchedule: [{ month: "", amount: "" }],

    salePrice: "0",
    agentCommissionPercentage: "0",
    saleLawyerFeePercentage: "0",
    profitTaxEnabled: data.profitTaxEnabled === "yes" ? "yes" : "no",
    profitTaxPercentage: String(data.profitTaxPercentage ?? 0),

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
    partnerEquityAmount?: string;
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
          month: emptyIfZeroString(item.month),
          amount: emptyIfZeroString(item.amount),
        }))
    : legacyDownpayments;

  const requestedDownpaymentCount = clampInteger(
    parseNumber(
      String(stored.downpaymentCount ?? sourceDownpayments.length)
    ),
    0,
    10
  );
  const downpayments = sourceDownpayments.slice(0, requestedDownpaymentCount);
  while (downpayments.length < requestedDownpaymentCount) {
    downpayments.push({ month: "", amount: "" });
  }

  const legacyPartnerAmount = Math.max(
    0,
    parseNumber(String(stored.partnerEquityAmount ?? "0"))
  );
  type LegacyInvestor = Partial<CoInvestor> & {
    contributions?: Array<{
      month?: string;
      amount?: string;
      paymentId?: string;
    }>;
    monthlyStartMonth?: string;
    monthlyEndMonth?: string;
    monthlyAmount?: string;
  };
  const storedInvestors = Array.isArray((stored as { coInvestors?: unknown }).coInvestors)
    ? ((stored as { coInvestors: LegacyInvestor[] }).coInvestors ?? [])
    : [];
  const sourceInvestors: LegacyInvestor[] = storedInvestors.length > 0
    ? storedInvestors
    : legacyPartnerAmount > 0
      ? [
          {
            name: "Mede-investeerder 1",
            monthlyTotalAmount: String(legacyPartnerAmount),
          },
        ]
      : base.coInvestors;
  const requestedInvestorCount = clampInteger(
    parseNumber(String(stored.coInvestorCount ?? sourceInvestors.length)),
    1,
    MAX_CO_INVESTORS
  );
  const coInvestors: CoInvestor[] = sourceInvestors
    .slice(0, requestedInvestorCount)
    .map((investor, investorIndex) => {
      const storedMonthlyTotal = Math.max(
        0,
        parseNumber(String(investor.monthlyTotalAmount ?? ""))
      );
      const legacyContributionTotal = Array.isArray(investor.contributions)
        ? investor.contributions.reduce(
            (sum, contribution) =>
              sum + Math.max(0, parseNumber(String(contribution?.amount ?? ""))),
            0
          )
        : 0;
      const legacyMonthlyAmount = Math.max(
        0,
        parseNumber(String(investor.monthlyAmount ?? ""))
      );
      const legacyStartMonth = Math.max(
        0,
        Math.round(parseNumber(String(investor.monthlyStartMonth ?? "")))
      );
      const legacyEndMonth = Math.max(
        legacyStartMonth,
        Math.round(parseNumber(String(investor.monthlyEndMonth ?? "")))
      );
      const legacyMonthlyTotal =
        legacyMonthlyAmount > 0
          ? legacyMonthlyAmount * (legacyEndMonth - legacyStartMonth + 1)
          : 0;
      const migratedTotal =
        storedMonthlyTotal || legacyContributionTotal || legacyMonthlyTotal;

      const storedInputMode: InvestorInputMode =
        investor.investmentInputMode === "percentage" ? "percentage" : "amount";
      const storedPercentage = Math.max(
        0,
        Math.min(100, parseNumber(String(investor.investmentPercentage ?? "")))
      );

      return {
        name: String(investor.name ?? `Mede-investeerder ${investorIndex + 1}`),
        investmentInputMode: storedInputMode,
        monthlyTotalAmount:
          migratedTotal > 0 ? String(Math.round(migratedTotal)) : "",
        investmentPercentage:
          storedPercentage > 0 ? String(storedPercentage).replace(".", ",") : "",
      };
    });
  while (coInvestors.length < requestedInvestorCount) {
    coInvestors.push(createInvestor(coInvestors.length));
  }

  const requestedBankTrancheCount = clampInteger(
    parseNumber(String(stored.bankFinancingTranches ?? base.bankFinancingTranches)),
    1,
    24
  );
  const storedBankDrawMonths = Array.isArray(stored.bankFinancingDrawMonths)
    ? stored.bankFinancingDrawMonths.map((month) => String(month ?? ""))
    : [];
  const legacyBankStartMonth = Math.max(
    0,
    Math.round(parseNumber(String(stored.bankFinancingStartMonth ?? "")))
  );
  const bankFinancingDrawMonths = Array.from(
    { length: requestedBankTrancheCount },
    (_, index) =>
      storedBankDrawMonths[index] ??
      (String(stored.bankFinancingStartMonth ?? "").trim()
        ? String(legacyBankStartMonth + index)
        : "")
  );
  const storedBankDrawAmounts = Array.isArray(stored.bankFinancingDrawAmounts)
    ? stored.bankFinancingDrawAmounts.map((amount) => emptyIfZeroString(amount))
    : [];
  const bankFinancingDrawAmounts = Array.from(
    { length: requestedBankTrancheCount },
    (_, index) => storedBankDrawAmounts[index] ?? ""
  );

  const sourceBankRepaymentSchedule = Array.isArray(stored.bankRepaymentSchedule)
    ? stored.bankRepaymentSchedule
        .filter(
          (payment): payment is BankScheduledPayment =>
            Boolean(payment && typeof payment === "object")
        )
        .map((payment) => ({
          month: emptyIfZeroString(payment.month),
          amount: emptyIfZeroString(payment.amount),
        }))
    : [];
  const requestedBankRepaymentCount = clampInteger(
    parseNumber(
      String(
        stored.bankRepaymentCount ??
          (sourceBankRepaymentSchedule.length || base.bankRepaymentCount)
      )
    ),
    1,
    36
  );
  const bankRepaymentSchedule = sourceBankRepaymentSchedule.slice(
    0,
    requestedBankRepaymentCount
  );
  while (bankRepaymentSchedule.length < requestedBankRepaymentCount) {
    bankRepaymentSchedule.push({ month: "", amount: "" });
  }

  const normalizedStoredBuildAreas = Array.isArray(stored.buildAreas)
    ? stored.buildAreas
        .filter(
          (line): line is BuildAreaLine =>
            Boolean(
              line &&
                typeof line === "object" &&
                typeof line.level === "string" &&
                line.level.trim() !== "" &&
                typeof line.component === "string" &&
                line.component.trim() !== ""
            )
        )
        .map((line) => ({
          level: line.level as BuildLevel,
          component: String(line.component),
          areaM2: String(line.areaM2 ?? ""),
          costPerM2: String(line.costPerM2 ?? ""),
          salePricePerM2: String(line.salePricePerM2 ?? ""),
        }))
    : [];

  const storedBuildLevels = Array.isArray(stored.buildLevels)
    ? stored.buildLevels
        .filter(
          (level): level is BuildLevel =>
            typeof level === "string" && level.trim() !== ""
        )
        .map((level) => level.trim())
    : [];

  // De vorige versie maakte voor iedere verdieping automatisch Bebouwd, Terras,
  // Zwembad en Garage aan. Bij de eerste load van deze versie verwijderen we
  // uitsluitend die lege standaardregels. Vanaf nu worden ook lege, bewust
  // toegevoegde regels bewaard via buildRowsManual.
  const storedRowsAreManual = stored.buildRowsManual === true;
  const storedBuildAreas = storedRowsAreManual
    ? normalizedStoredBuildAreas
    : normalizedStoredBuildAreas.filter(
        (line) =>
          line.areaM2.trim() !== "" ||
          line.costPerM2.trim() !== "" ||
          line.salePricePerM2.trim() !== ""
      );

  const inferredBuildLevels = storedBuildAreas.map((line) => line.level);
  const buildLevelSource =
    storedBuildLevels.length > 0
      ? [...storedBuildLevels, ...inferredBuildLevels]
      : inferredBuildLevels.length > 0
        ? inferredBuildLevels
        : ["ground"];
  const buildLevels = Array.from(new Set<BuildLevel>(buildLevelSource));

  const legacySurfaceM2 = String(stored.surfaceM2 ?? base.surfaceM2 ?? "");
  const legacyBuildCostPerM2 = String(
    stored.buildCostPerM2 ?? base.buildCostPerM2 ?? ""
  );

  const storedMode = stored.buildInputMode;
  const inferDetailedMode =
    storedBuildLevels.some((level) => level !== "ground") ||
    storedBuildAreas.some(
      (line) =>
        line.level !== "ground" ||
        (line.component !== "built" &&
          (line.areaM2.trim() !== "" ||
            line.costPerM2.trim() !== "" ||
            line.salePricePerM2.trim() !== ""))
    );
  const buildInputMode: BuildInputMode =
    storedMode === "detailed" || storedMode === "simple"
      ? storedMode
      : inferDetailedMode
        ? "detailed"
        : "simple";

  let buildAreas = [...storedBuildAreas];
  if (
    buildInputMode === "detailed" &&
    buildAreas.length === 0 &&
    (emptyIfZeroString(legacySurfaceM2) || emptyIfZeroString(legacyBuildCostPerM2))
  ) {
    buildAreas.push(
      createBuildAreaLine(
        "ground",
        "built",
        emptyIfZeroString(legacySurfaceM2),
        emptyIfZeroString(legacyBuildCostPerM2)
      )
    );
  }

  // Oudere projecten hadden één totale verkoopprijs. Wanneer zo'n project
  // al gespecificeerde oppervlakten heeft maar nog geen verkoopprijs per m²,
  // verdelen we de bestaande verkoopprijs als één gewogen m²-prijs over alle
  // ingevulde oppervlakten. Zo blijft de totale verkoopprijs exact behouden.
  if (
    buildInputMode === "detailed" &&
    buildAreas.length > 0 &&
    !buildAreas.some((line) => line.salePricePerM2.trim() !== "")
  ) {
    const legacySalePrice = Math.max(
      0,
      parseNumber(String(stored.salePrice ?? base.salePrice ?? ""))
    );
    const detailedSurface = buildAreas.reduce(
      (sum, line) => sum + Math.max(0, parseNumber(line.areaM2)),
      0
    );
    if (legacySalePrice > 0 && detailedSurface > 0) {
      const migratedSalePricePerM2 = (
        Math.round((legacySalePrice / detailedSurface) * 10000) / 10000
      )
        .toString()
        .replace(".", ",");
      buildAreas = buildAreas.map((line) =>
        Math.max(0, parseNumber(line.areaM2)) > 0
          ? { ...line, salePricePerM2: migratedSalePricePerM2 }
          : line
      );
    }
  }

  return {
    ...base,
    ...stored,
    projectType: normalizeProjectType(stored.projectType ?? base.projectType),
    projectOwnership: normalizeProjectOwnership(
      stored.projectOwnership ?? base.projectOwnership
    ),
    projectStartDate: String(
      stored.projectStartDate ?? base.projectStartDate
    ),
    purchaseVatEnabled:
      stored.purchaseVatEnabled === "yes" ? "yes" : "no",
    purchaseVatPercentage: String(
      stored.purchaseVatPercentage ?? base.purchaseVatPercentage
    ),
    profitTaxEnabled:
      stored.profitTaxEnabled === "yes" ? "yes" : "no",
    profitTaxPercentage: String(
      stored.profitTaxPercentage ?? base.profitTaxPercentage
    ),
    fixedInterior: String(
      stored.fixedInterior ?? stored.furniture ?? base.fixedInterior
    ),
    looseFurniture: String(stored.looseFurniture ?? base.looseFurniture),
    furnitureMarkupPercentage: String(
      stored.furnitureMarkupPercentage ?? base.furnitureMarkupPercentage
    ),
    looseFurniturePaymentMonths: String(
      stored.looseFurniturePaymentMonths ?? base.looseFurniturePaymentMonths
    ),
    bankFinancingEnabled:
      stored.bankFinancingEnabled === "yes" ? "yes" : "no",
    bankDrawScheduleMode:
      stored.bankDrawScheduleMode === "custom" ? "custom" : "standard",
    bankFinancingStartMonth: emptyIfZeroString(
      stored.bankFinancingStartMonth ?? base.bankFinancingStartMonth
    ),
    bankFinancingDrawMonths,
    bankFinancingDrawAmounts,
    bankFinancingAmount: emptyIfZeroString(
      stored.bankFinancingAmount ?? base.bankFinancingAmount
    ),
    bankFinancingTranches: String(requestedBankTrancheCount),
    bankInterestPercentage: emptyIfZeroString(
      stored.bankInterestPercentage ?? base.bankInterestPercentage
    ),
    bankRepaymentScheduleMode:
      stored.bankRepaymentScheduleMode === "custom" ? "custom" : "standard",
    bankRepaymentAmount: emptyIfZeroString(
      stored.bankRepaymentAmount ?? base.bankRepaymentAmount
    ),
    bankRepaymentFrequency:
      stored.bankRepaymentFrequency === "yearly" ? "yearly" : "monthly",
    bankRepaymentCount: String(requestedBankRepaymentCount),
    bankRepaymentSchedule,
    coInvestorCount: String(requestedInvestorCount),
    coInvestors,
    buildInputMode,
    buildRowsManual: true,
    buildLevels,
    buildAreas,
    downpaymentCount: String(requestedDownpaymentCount),
    downpayments,
  };
}

function addMonthsToDate(date: string, month: number) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  const originalDay = parsed.getDate();
  parsed.setDate(1);
  parsed.setMonth(parsed.getMonth() + Math.max(0, Math.round(month)));
  const lastDayOfTargetMonth = new Date(
    parsed.getFullYear(),
    parsed.getMonth() + 1,
    0
  ).getDate();
  parsed.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return parsed.toISOString().slice(0, 10);
}

function formatShortDate(date: string) {
  if (!date) return "—";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

type BankFinancingSchedule = {
  rows: RawCashflowItem[];
  drawnAmount: number;
  principalRepaid: number;
  interestPaid: number;
};

type NumericBankPayment = {
  month: number;
  amount: number;
  index: number;
};

function buildBankFinancingSchedule({
  enabled,
  draws,
  annualInterestRate,
  repaymentMode,
  repaymentAmount,
  repaymentFrequency,
  customRepayments,
  exitMonth,
}: {
  enabled: boolean;
  draws: NumericBankPayment[];
  annualInterestRate: number;
  repaymentMode: BankScheduleMode;
  repaymentAmount: number;
  repaymentFrequency: BankRepaymentFrequency;
  customRepayments: NumericBankPayment[];
  exitMonth: number;
}): BankFinancingSchedule {
  const validDraws = draws
    .filter((draw) => Number.isFinite(draw.amount) && draw.amount > 0)
    .map((draw) => ({
      ...draw,
      month: clampInteger(draw.month, 0, exitMonth),
      amount: Math.max(0, draw.amount),
    }))
    .sort((a, b) => a.month - b.month || a.index - b.index);

  if (!enabled || validDraws.length === 0) {
    return { rows: [], drawnAmount: 0, principalRepaid: 0, interestPaid: 0 };
  }

  const validCustomRepayments = customRepayments
    .filter((payment) => Number.isFinite(payment.amount) && payment.amount > 0)
    .map((payment) => ({
      ...payment,
      month: clampInteger(payment.month, 0, exitMonth),
      amount: Math.max(0, payment.amount),
    }))
    .sort((a, b) => a.month - b.month || a.index - b.index);

  const rows: RawCashflowItem[] = [];
  const drawsByMonth = new Map<number, NumericBankPayment[]>();
  validDraws.forEach((draw) => {
    const existing = drawsByMonth.get(draw.month) ?? [];
    existing.push(draw);
    drawsByMonth.set(draw.month, existing);
  });

  const repaymentsByMonth = new Map<number, NumericBankPayment[]>();
  validCustomRepayments.forEach((payment) => {
    const existing = repaymentsByMonth.get(payment.month) ?? [];
    existing.push(payment);
    repaymentsByMonth.set(payment.month, existing);
  });

  const firstDrawMonth = Math.min(...validDraws.map((draw) => draw.month));
  const lastDrawMonth = Math.max(...validDraws.map((draw) => draw.month));
  const repaymentInterval = repaymentFrequency === "yearly" ? 12 : 1;
  const monthlyInterestRate = Math.max(0, annualInterestRate) / 12;
  let outstandingPrincipal = 0;
  let accruedInterest = 0;
  let interestPaid = 0;
  let principalRepaid = 0;

  for (let month = 0; month <= exitMonth; month += 1) {
    const monthDraws = drawsByMonth.get(month) ?? [];
    monthDraws.forEach((draw) => {
      outstandingPrincipal += draw.amount;
      rows.push({
        paymentId: `bank-draw-${draw.index + 1}`,
        month,
        event: `Bank financing payment ${draw.index + 1}/${validDraws.length}`,
        outflow: 0,
        inflow: draw.amount,
        category: "financing",
        sortOrder: 5,
        bankEventType: "draw",
      });
    });

    const isExitMonth = month === exitMonth;
    const isAnnualInterestDate =
      month > firstDrawMonth &&
      (month - firstDrawMonth) % 12 === 0;

    if ((isAnnualInterestDate || isExitMonth) && accruedInterest > 0.005) {
      rows.push({
        paymentId: `bank-interest-${month}`,
        month,
        event:
          isExitMonth && !isAnnualInterestDate
            ? "Bank interest (final accrued interest)"
            : "Bank interest (annual)",
        outflow: accruedInterest,
        inflow: 0,
        category: "financing",
        sortOrder: isExitMonth ? 51 : 31,
        bankEventType: "interest",
      });
      interestPaid += accruedInterest;
      accruedInterest = 0;
    }

    if (repaymentMode === "custom") {
      const monthRepayments = repaymentsByMonth.get(month) ?? [];
      monthRepayments.forEach((payment) => {
        const principalPayment = Math.min(payment.amount, outstandingPrincipal);
        if (principalPayment <= 0.005) return;

        rows.push({
          paymentId: `bank-principal-custom-${payment.index + 1}`,
          month,
          event: `Bank principal repayment ${payment.index + 1}/${validCustomRepayments.length}`,
          outflow: principalPayment,
          inflow: 0,
          category: "financing",
          sortOrder: 32,
          bankEventType: "principal",
        });
        outstandingPrincipal -= principalPayment;
        principalRepaid += principalPayment;
      });
    } else {
      const scheduledRepayment =
        month > lastDrawMonth &&
        (month - lastDrawMonth) % repaymentInterval === 0;

      if (scheduledRepayment && outstandingPrincipal > 0) {
        const principalPayment = Math.min(
          Math.max(0, repaymentAmount),
          outstandingPrincipal
        );

        if (principalPayment > 0.005) {
          rows.push({
            paymentId: `bank-principal-${month}`,
            month,
            event: "Bank principal repayment",
            outflow: principalPayment,
            inflow: 0,
            category: "financing",
            sortOrder: 32,
            bankEventType: "principal",
          });
          outstandingPrincipal -= principalPayment;
          principalRepaid += principalPayment;
        }
      }
    }

    if (isExitMonth && outstandingPrincipal > 0.005) {
      rows.push({
        paymentId: `bank-principal-final-${month}`,
        month,
        event: "Bank principal repayment (final)",
        outflow: outstandingPrincipal,
        inflow: 0,
        category: "financing",
        sortOrder: 52,
        bankEventType: "principal",
      });
      principalRepaid += outstandingPrincipal;
      outstandingPrincipal = 0;
    }

    // Rente over de periode van deze maand tot de volgende maand.
    if (!isExitMonth && outstandingPrincipal > 0) {
      accruedInterest += outstandingPrincipal * monthlyInterestRate;
    }
  }

  return {
    rows,
    drawnAmount: validDraws.reduce((sum, draw) => sum + draw.amount, 0),
    principalRepaid,
    interestPaid,
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
  return new Intl.DateTimeFormat("nl-NL", {
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
  const [cloudProject, setCloudProject] = useState<CloudProject | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("idle");
  const [cloudError, setCloudError] = useState("");
  const [cloudProjects, setCloudProjects] = useState<CloudProjectListItem[]>([]);
  const [projectListStatus, setProjectListStatus] = useState<ProjectListStatus>("idle");
  const [projectListError, setProjectListError] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("project")) {
        setStorageReady(true);
        return;
      }

      const saved =
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STORAGE_KEY);
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
    void refreshProjectList();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("project") ?? "";
    const viewToken = params.get("view") ?? "";
    const editToken = params.get("edit") ?? "";
    const internalAccess = params.get("internal") === "1";

    if (!id || (!internalAccess && !viewToken && !editToken)) return;

    let cancelled = false;
    const token = editToken || viewToken;
    const mode = internalAccess ? "internal" : editToken ? "edit" : "view";
    const projectUrl = internalAccess
      ? `/api/rendements-projects/${encodeURIComponent(id)}?mode=internal`
      : `/api/rendements-projects/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}&mode=${mode}`;

    setCloudStatus("loading");
    setCloudError("");

    fetch(projectUrl, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || "Project kon niet worden geladen.");
        }
        return result;
      })
      .then((result) => {
        if (cancelled) return;
        setForm(normalizeStoredForm(result.data, initialData));
        setCloudProject({
          id: result.id,
          name: result.name || "Online project",
          viewToken,
          editToken,
          canEdit: Boolean(result.canEdit),
          internalAccess,
        });
        setCloudStatus("saved");
        setCloudProjects((current) => upsertProjectListItem(current, {
          id: result.id,
          name: result.name || "Online project",
          createdAt: result.createdAt || "",
          updatedAt: result.updatedAt || new Date().toISOString(),
        }));
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("Online project kon niet worden geladen.", error);
        setCloudError(error instanceof Error ? error.message : "Project kon niet worden geladen.");
        setCloudStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [initialData]);

  useEffect(() => {
    if (!storageReady) return;
    const saveHandle = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    }, 180);
    return () => window.clearTimeout(saveHandle);
  }, [form, storageReady]);


  useEffect(() => {
    if (
      !storageReady ||
      !cloudProject?.id ||
      !cloudProject.canEdit ||
      (!cloudProject.editToken && !cloudProject.internalAccess)
    ) {
      return;
    }

    setCloudStatus("saving");
    setCloudError("");

    const saveHandle = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/rendements-projects/${encodeURIComponent(cloudProject.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              editToken: cloudProject.editToken,
              internal: cloudProject.internalAccess,
              name: form.projectName.trim() || cloudProject.name || "Naamloos project",
              data: form,
            }),
          }
        );

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || "Opslaan is mislukt.");
        }

        const nextName = result.name || form.projectName.trim() || cloudProject.name;
        setCloudProject((current) =>
          current ? { ...current, name: nextName } : current
        );
        setCloudProjects((current) => upsertProjectListItem(current, {
          id: cloudProject.id,
          name: nextName,
          createdAt: "",
          updatedAt: result.updatedAt || new Date().toISOString(),
        }));
        setCloudStatus("saved");
      } catch (error) {
        console.warn("Online project kon niet automatisch worden opgeslagen.", error);
        setCloudError(error instanceof Error ? error.message : "Opslaan is mislukt.");
        setCloudStatus("error");
      }
    }, 900);

    return () => window.clearTimeout(saveHandle);
  }, [
    form,
    storageReady,
    cloudProject?.id,
    cloudProject?.canEdit,
    cloudProject?.editToken,
    cloudProject?.internalAccess,
  ]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateBuildInputMode(value: BuildInputMode) {
    setForm((current) => {
      if (value === "simple") {
        const detailedSurface = current.buildAreas.reduce(
          (sum, line) => sum + Math.max(0, parseNumber(line.areaM2)),
          0
        );
        const detailedBuildCost = current.buildAreas.reduce(
          (sum, line) =>
            sum +
            Math.max(0, parseNumber(line.areaM2)) *
              Math.max(0, parseNumber(line.costPerM2)),
          0
        );
        const detailedSalePrice = current.buildAreas.reduce(
          (sum, line) =>
            sum +
            Math.max(0, parseNumber(line.areaM2)) *
              Math.max(0, parseNumber(line.salePricePerM2)),
          0
        );

        return {
          ...current,
          buildInputMode: value,
          buildRowsManual: true,
          surfaceM2: detailedSurface > 0 ? String(detailedSurface) : current.surfaceM2,
          buildCostPerM2:
            detailedSurface > 0
              ? String(detailedBuildCost / detailedSurface)
              : current.buildCostPerM2,
          salePrice:
            detailedSalePrice > 0 ? String(detailedSalePrice) : current.salePrice,
        };
      }

      const buildLevels = current.buildLevels.includes("ground")
        ? current.buildLevels
        : (["ground", ...current.buildLevels] as BuildLevel[]);
      let buildAreas = current.buildAreas;

      // Bij de eerste overstap van algemene naar gespecificeerde invoer nemen we
      // de bestaande waarden mee als Bebouwd op de begane grond. Daarna bepaalt
      // de gebruiker volledig zelf welke onderdelen per verdieping aanwezig zijn.
      if (buildAreas.length === 0) {
        const areaM2 = emptyIfZeroString(current.surfaceM2);
        const costPerM2 = emptyIfZeroString(current.buildCostPerM2);
        if (areaM2 || costPerM2) {
          buildAreas = [createBuildAreaLine("ground", "built", areaM2, costPerM2)];
        }
      }

      if (
        buildAreas.length > 0 &&
        !buildAreas.some((line) => line.salePricePerM2.trim() !== "")
      ) {
        const totalSurface = buildAreas.reduce(
          (sum, line) => sum + Math.max(0, parseNumber(line.areaM2)),
          0
        );
        const currentSalePrice = Math.max(0, parseNumber(current.salePrice));
        if (totalSurface > 0 && currentSalePrice > 0) {
          const salePricePerM2 = (
            Math.round((currentSalePrice / totalSurface) * 10000) / 10000
          )
            .toString()
            .replace(".", ",");
          buildAreas = buildAreas.map((line) =>
            Math.max(0, parseNumber(line.areaM2)) > 0
              ? { ...line, salePricePerM2 }
              : line
          );
        }
      }

      return {
        ...current,
        buildInputMode: value,
        buildRowsManual: true,
        buildLevels,
        buildAreas,
      };
    });
  }

  function updateBuildArea(
    level: BuildLevel,
    component: BuildComponentType,
    field: "areaM2" | "costPerM2" | "salePricePerM2",
    value: string
  ) {
    setForm((current) => ({
      ...current,
      buildRowsManual: true,
      buildAreas: current.buildAreas.map((line) =>
        line.level === level && line.component === component
          ? { ...line, [field]: value }
          : line
      ),
    }));
  }

  function addBuildComponent(level: BuildLevel, component: BuildComponentType) {
    setForm((current) => {
      if (
        current.buildAreas.some(
          (line) => line.level === level && line.component === component
        )
      ) {
        return current;
      }
      return {
        ...current,
        buildRowsManual: true,
        buildAreas: [...current.buildAreas, createBuildAreaLine(level, component)],
      };
    });
  }

  function addCustomBuildComponent(level: BuildLevel, name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;

    setForm((current) => {
      const duplicate = current.buildAreas.some(
        (line) =>
          line.level === level &&
          getBuildComponentLabel(line.component, "nl").localeCompare(
            cleanName,
            "nl",
            { sensitivity: "accent" }
          ) === 0
      );
      if (duplicate) return current;

      const customComponent = `custom:${Date.now()}:${cleanName}`;
      return {
        ...current,
        buildRowsManual: true,
        buildAreas: [
          ...current.buildAreas,
          createBuildAreaLine(level, customComponent),
        ],
      };
    });
  }

  function removeBuildComponent(level: BuildLevel, component: BuildComponentType) {
    setForm((current) => ({
      ...current,
      buildRowsManual: true,
      buildAreas: current.buildAreas.filter(
        (line) => !(line.level === level && line.component === component)
      ),
    }));
  }

  function addBuildLevel(level: BuildLevel) {
    const cleanLevel = level.trim();
    if (!cleanLevel) return;

    setForm((current) => {
      const duplicate = current.buildLevels.some(
        (item) =>
          getBuildLevelLabel(item, "nl").localeCompare(
            getBuildLevelLabel(cleanLevel, "nl"),
            "nl",
            { sensitivity: "accent" }
          ) === 0
      );
      if (duplicate) return current;

      return {
        ...current,
        buildRowsManual: true,
        buildLevels: [...current.buildLevels, cleanLevel],
      };
    });
  }

  function addCustomBuildLevel(name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    addBuildLevel(cleanName);
  }

  function renameBuildLevel(level: BuildLevel, name: string) {
    const cleanName = name.trim();
    if (!cleanName || cleanName === level) return;

    setForm((current) => {
      const duplicate = current.buildLevels.some(
        (item) =>
          item !== level &&
          getBuildLevelLabel(item, "nl").localeCompare(cleanName, "nl", {
            sensitivity: "accent",
          }) === 0
      );
      if (duplicate) return current;

      return {
        ...current,
        buildRowsManual: true,
        buildLevels: current.buildLevels.map((item) =>
          item === level ? cleanName : item
        ),
        buildAreas: current.buildAreas.map((line) =>
          line.level === level ? { ...line, level: cleanName } : line
        ),
      };
    });
  }

  function removeBuildLevel(level: BuildLevel) {
    setForm((current) => {
      if (current.buildLevels.length <= 1) return current;
      return {
        ...current,
        buildRowsManual: true,
        buildLevels: current.buildLevels.filter((item) => item !== level),
        buildAreas: current.buildAreas.filter((line) => line.level !== level),
      };
    });
  }

  function updateCoInvestorCount(value: string) {
    const count = clampInteger(parseNumber(value), 1, MAX_CO_INVESTORS);
    setForm((current) => {
      const coInvestors = current.coInvestors.slice(0, count);
      while (coInvestors.length < count) {
        coInvestors.push(createInvestor(coInvestors.length));
      }
      return {
        ...current,
        coInvestorCount: String(count),
        coInvestors,
      };
    });
  }

  function updateCoInvestorName(index: number, value: string) {
    setForm((current) => ({
      ...current,
      coInvestors: current.coInvestors.map((investor, investorIndex) =>
        investorIndex === index ? { ...investor, name: value } : investor
      ),
    }));
  }

  function updateInvestorInputMode(
    investorIndex: number,
    value: InvestorInputMode
  ) {
    setForm((current) => ({
      ...current,
      coInvestors: current.coInvestors.map((investor, currentIndex) =>
        currentIndex === investorIndex
          ? { ...investor, investmentInputMode: value }
          : investor
      ),
    }));
  }

  function updateInvestorMonthlyTotal(
    investorIndex: number,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      coInvestors: current.coInvestors.map((investor, currentIndex) =>
        currentIndex === investorIndex
          ? { ...investor, monthlyTotalAmount: value }
          : investor
      ),
    }));
  }

  function updateInvestorPercentage(
    investorIndex: number,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      coInvestors: current.coInvestors.map((investor, currentIndex) =>
        currentIndex === investorIndex
          ? { ...investor, investmentPercentage: value }
          : investor
      ),
    }));
  }

  function updateBankFinancingTranches(value: string) {
    const count = clampInteger(parseNumber(value), 1, 24);
    setForm((current) => {
      const bankFinancingDrawMonths = current.bankFinancingDrawMonths.slice(0, count);
      const bankFinancingDrawAmounts = current.bankFinancingDrawAmounts.slice(0, count);
      while (bankFinancingDrawMonths.length < count) {
        bankFinancingDrawMonths.push("");
      }
      while (bankFinancingDrawAmounts.length < count) {
        bankFinancingDrawAmounts.push("");
      }
      return {
        ...current,
        bankFinancingTranches: String(count),
        bankFinancingDrawMonths,
        bankFinancingDrawAmounts,
      };
    });
  }

  function updateBankFinancingDrawMonth(index: number, value: string) {
    setForm((current) => ({
      ...current,
      bankFinancingDrawMonths: current.bankFinancingDrawMonths.map(
        (month, monthIndex) => (monthIndex === index ? value : month)
      ),
    }));
  }

  function updateBankFinancingDrawAmount(index: number, value: string) {
    setForm((current) => ({
      ...current,
      bankFinancingDrawAmounts: current.bankFinancingDrawAmounts.map(
        (amount, amountIndex) => (amountIndex === index ? value : amount)
      ),
    }));
  }

  function updateBankRepaymentCount(value: string) {
    const count = clampInteger(parseNumber(value), 1, 36);
    setForm((current) => {
      const bankRepaymentSchedule = current.bankRepaymentSchedule.slice(0, count);
      while (bankRepaymentSchedule.length < count) {
        bankRepaymentSchedule.push({ month: "", amount: "" });
      }
      return {
        ...current,
        bankRepaymentCount: String(count),
        bankRepaymentSchedule,
      };
    });
  }

  function updateBankRepaymentSchedule(
    index: number,
    field: keyof BankScheduledPayment,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      bankRepaymentSchedule: current.bankRepaymentSchedule.map(
        (payment, paymentIndex) =>
          paymentIndex === index ? { ...payment, [field]: value } : payment
      ),
    }));
  }

  function updateDownpaymentCount(value: string) {
    const count = clampInteger(parseNumber(value), 0, 10);

    setForm((current) => {
      const downpayments = current.downpayments.slice(0, count);
      while (downpayments.length < count) {
        downpayments.push(createBlankDownpayment());
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

  function upsertProjectListItem(
    projects: CloudProjectListItem[],
    incoming: CloudProjectListItem
  ) {
    const existing = projects.find((project) => project.id === incoming.id);
    const merged = existing
      ? projects.map((project) =>
          project.id === incoming.id
            ? {
                ...project,
                ...incoming,
                createdAt: incoming.createdAt || project.createdAt,
              }
            : project
        )
      : [incoming, ...projects];

    return [...merged].sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
    );
  }

  async function refreshProjectList() {
    setProjectListStatus("loading");
    setProjectListError("");
    try {
      const response = await fetch("/api/rendements-projects", {
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Projecten konden niet worden geladen.");
      }
      setCloudProjects(Array.isArray(result.projects) ? result.projects : []);
      setProjectListStatus("ready");
    } catch (error) {
      console.warn("Projectlijst kon niet worden geladen.", error);
      setProjectListError(
        error instanceof Error ? error.message : "Projecten konden niet worden geladen."
      );
      setProjectListStatus("error");
    }
  }

  async function openProjectFromList(id: string) {
    if (!id) return;
    setCloudStatus("loading");
    setCloudError("");
    try {
      const response = await fetch(
        `/api/rendements-projects/${encodeURIComponent(id)}?mode=internal`,
        { cache: "no-store" }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Project kon niet worden geopend.");
      }

      setForm(normalizeStoredForm(result.data, initialData));
      setCloudProject({
        id: result.id,
        name: result.name || "Online project",
        viewToken: "",
        editToken: "",
        canEdit: true,
        internalAccess: true,
      });
      setUploadedPhotos([]);
      setPhotoInputKey((current) => current + 1);
      setCloudStatus("saved");
      setCloudProjects((current) => upsertProjectListItem(current, {
        id: result.id,
        name: result.name || "Online project",
        createdAt: result.createdAt || "",
        updatedAt: result.updatedAt || new Date().toISOString(),
      }));

      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("project", result.id);
      url.searchParams.set("internal", "1");
      window.history.replaceState({}, "", url.toString());
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Project kon niet worden geopend.");
      setCloudStatus("error");
    }
  }

  async function duplicateProject() {
    const sourceName = form.projectName.trim() || cloudProject?.name || "Naamloos project";
    const copyName = `${sourceName} - kopie`;
    const copyForm = { ...form, projectName: copyName };

    setCloudStatus("saving");
    setCloudError("");
    try {
      const response = await fetch("/api/rendements-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: copyName, data: copyForm }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Project kon niet worden gedupliceerd.");
      }

      const nextProject: CloudProject = {
        id: result.id,
        name: result.name || copyName,
        viewToken: result.viewToken || "",
        editToken: result.editToken || "",
        canEdit: true,
        internalAccess: false,
      };
      setForm(copyForm);
      setCloudProject(nextProject);
      setCloudProjects((current) => upsertProjectListItem(current, {
        id: nextProject.id,
        name: nextProject.name,
        createdAt: result.createdAt || new Date().toISOString(),
        updatedAt: result.updatedAt || new Date().toISOString(),
      }));
      setCloudStatus("saved");
      window.history.replaceState({}, "", makeProjectUrl(nextProject, "edit"));
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Dupliceren is mislukt.");
      setCloudStatus("error");
    }
  }

  async function deleteCurrentProject() {
    if (!cloudProject?.id) return;
    const shouldDelete = window.confirm(
      `Project “${cloudProject.name}” definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`
    );
    if (!shouldDelete) return;

    setCloudStatus("saving");
    setCloudError("");
    try {
      const response = await fetch(
        `/api/rendements-projects/${encodeURIComponent(cloudProject.id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            editToken: cloudProject.editToken,
            internal: cloudProject.internalAccess,
          }),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Project kon niet worden verwijderd.");
      }

      setCloudProjects((current) =>
        current.filter((project) => project.id !== cloudProject.id)
      );
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url.toString());
      setCloudProject(null);
      setCloudStatus("idle");
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setForm(createInitialForm(initialData));
      setUploadedPhotos([]);
      setPhotoInputKey((current) => current + 1);
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Verwijderen is mislukt.");
      setCloudStatus("error");
    }
  }

  function makeProjectUrl(project: CloudProject, mode: "view" | "edit") {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("project", project.id);

    if (project.viewToken) {
      url.searchParams.set("view", project.viewToken);
    }
    if (mode === "edit" && project.editToken) {
      url.searchParams.set("edit", project.editToken);
    }

    return url.toString();
  }

  async function saveProjectOnline() {
    setCloudError("");

    if (
      cloudProject?.id &&
      cloudProject.canEdit &&
      (cloudProject.editToken || cloudProject.internalAccess)
    ) {
      setCloudStatus("saving");
      try {
        const response = await fetch(
          `/api/rendements-projects/${encodeURIComponent(cloudProject.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              editToken: cloudProject.editToken,
              internal: cloudProject.internalAccess,
              name: form.projectName.trim() || cloudProject.name || "Naamloos project",
              data: form,
            }),
          }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || "Opslaan is mislukt.");
        }
        const nextName = result.name || form.projectName.trim() || cloudProject.name;
        setCloudProject((current) =>
          current ? { ...current, name: nextName } : current
        );
        setCloudProjects((current) => upsertProjectListItem(current, {
          id: cloudProject.id,
          name: nextName,
          createdAt: "",
          updatedAt: result.updatedAt || new Date().toISOString(),
        }));
        setCloudStatus("saved");
      } catch (error) {
        setCloudError(error instanceof Error ? error.message : "Opslaan is mislukt.");
        setCloudStatus("error");
      }
      return;
    }

    setCloudStatus("saving");
    try {
      const response = await fetch("/api/rendements-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.projectName.trim() || "Naamloos project",
          data: form,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Online project kon niet worden aangemaakt.");
      }

      const nextProject: CloudProject = {
        id: result.id,
        name: result.name || form.projectName.trim() || "Naamloos project",
        viewToken: result.viewToken,
        editToken: result.editToken,
        canEdit: true,
        internalAccess: false,
      };

      setCloudProject(nextProject);
      setCloudProjects((current) => upsertProjectListItem(current, {
        id: nextProject.id,
        name: nextProject.name,
        createdAt: result.createdAt || new Date().toISOString(),
        updatedAt: result.updatedAt || new Date().toISOString(),
      }));
      setCloudStatus("saved");

      const editUrl = makeProjectUrl(nextProject, "edit");
      window.history.replaceState({}, "", editUrl);
    } catch (error) {
      setCloudError(
        error instanceof Error ? error.message : "Online project kon niet worden aangemaakt."
      );
      setCloudStatus("error");
    }
  }

  async function copyProjectLink(mode: "view" | "edit") {
    if (!cloudProject) return;
    const url = makeProjectUrl(cloudProject, mode);
    try {
      await navigator.clipboard.writeText(url);
      setCloudStatus("saved");
    } catch {
      window.prompt("Kopieer deze link:", url);
    }
  }

  function startNewProject() {
    const shouldContinue = window.confirm(
      "Nieuw project starten? Niet-opgeslagen lokale wijzigingen gaan verloren."
    );
    if (!shouldContinue) return;

    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url.toString());
    setCloudProject(null);
    setCloudStatus("idle");
    setCloudError("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setForm(createInitialForm(initialData));
    setUploadedPhotos([]);
    setPhotoInputKey((current) => current + 1);
  }

  function printReport() {
    window.print();
  }

  function resetForm() {
    if (
      cloudProject?.canEdit &&
      !window.confirm(
        "Dit zet alle invoer terug naar de beginwaarden. Omdat autosave actief is, wordt ook het online project hiermee overschreven. Doorgaan?"
      )
    ) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
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
    const projectStartDate = form.projectStartDate;
    const projectType = form.projectType;
    const projectOwnership = form.projectOwnership;
    const isSharedProject = projectOwnership === "shared";
    const buildInputMode = form.buildInputMode;
    const usesDetailedBuild = buildInputMode === "detailed";
    const detailedBuildBreakdown = form.buildAreas.map((line) => {
      const areaM2 = Math.max(0, parseNumber(line.areaM2));
      const costPerM2 = Math.max(0, parseNumber(line.costPerM2));
      const salePricePerM2 = Math.max(0, parseNumber(line.salePricePerM2));
      return {
        ...line,
        areaM2,
        costPerM2,
        salePricePerM2,
        totalCost: areaM2 * costPerM2,
        saleTotal: areaM2 * salePricePerM2,
      };
    });
    const buildBreakdown = usesDetailedBuild ? detailedBuildBreakdown : [];
    const simpleSurfaceM2 = Math.max(0, parseNumber(form.surfaceM2));
    const surfaceM2 = usesDetailedBuild
      ? buildBreakdown.reduce((sum, line) => sum + line.areaM2, 0)
      : simpleSurfaceM2;
    const builtSurfaceM2 = usesDetailedBuild
      ? buildBreakdown
          .filter((line) => line.component === "built")
          .reduce((sum, line) => sum + line.areaM2, 0)
      : surfaceM2;
    const terraceSurfaceM2 = usesDetailedBuild
      ? buildBreakdown
          .filter((line) => line.component === "terrace")
          .reduce((sum, line) => sum + line.areaM2, 0)
      : 0;
    const poolSurfaceM2 = usesDetailedBuild
      ? buildBreakdown
          .filter((line) => line.component === "pool")
          .reduce((sum, line) => sum + line.areaM2, 0)
      : 0;
    const garageSurfaceM2 = usesDetailedBuild
      ? buildBreakdown
          .filter((line) => line.component === "garage")
          .reduce((sum, line) => sum + line.areaM2, 0)
      : 0;
    const plotM2 = Math.max(0, parseNumber(form.plotM2));
    const durationMonths = Math.max(1, Math.round(parseNumber(form.durationMonths)));
    const bankFinancingEnabled = form.bankFinancingEnabled === "yes";
    const bankDrawScheduleMode = form.bankDrawScheduleMode;
    const bankFinancingStartMonth = Math.max(
      0,
      Math.round(parseNumber(form.bankFinancingStartMonth))
    );
    const bankFinancingTranches = bankFinancingEnabled
      ? clampInteger(parseNumber(form.bankFinancingTranches), 1, 24)
      : 0;
    const bankFinancingDrawMonthsComplete =
      bankFinancingEnabled &&
      form.bankFinancingDrawMonths
        .slice(0, bankFinancingTranches)
        .every((month) => month.trim() !== "");
    const customBankDrawAmountsComplete =
      bankDrawScheduleMode === "custom" &&
      form.bankFinancingDrawAmounts
        .slice(0, bankFinancingTranches)
        .every((amount) => amount.trim() !== "");
    const standardBankFinancingAmount = bankFinancingEnabled
      ? Math.max(0, parseNumber(form.bankFinancingAmount))
      : 0;
    const bankFinancingDrawMonths = bankFinancingDrawMonthsComplete
      ? form.bankFinancingDrawMonths
          .slice(0, bankFinancingTranches)
          .map((month) => Math.max(0, Math.round(parseNumber(month))))
      : [];
    const bankDrawSchedule: NumericBankPayment[] =
      bankFinancingDrawMonthsComplete &&
      (bankDrawScheduleMode === "standard" || customBankDrawAmountsComplete)
        ? bankFinancingDrawMonths.map((month, index) => {
            if (bankDrawScheduleMode === "custom") {
              return {
                month,
                amount: Math.max(
                  0,
                  parseNumber(form.bankFinancingDrawAmounts[index] ?? "")
                ),
                index,
              };
            }

            const alreadyAllocated =
              (standardBankFinancingAmount / bankFinancingTranches) * index;
            return {
              month,
              amount:
                index === bankFinancingTranches - 1
                  ? Math.max(0, standardBankFinancingAmount - alreadyAllocated)
                  : Math.max(
                      0,
                      standardBankFinancingAmount / bankFinancingTranches
                    ),
              index,
            };
          })
        : [];
    const bankFinancingAmount = bankDrawSchedule.reduce(
      (sum, draw) => sum + draw.amount,
      0
    );
    const bankInterestPercentage = bankFinancingEnabled
      ? Math.max(0, parsePercent(form.bankInterestPercentage))
      : 0;
    const bankRepaymentScheduleMode = form.bankRepaymentScheduleMode;
    const bankRepaymentAmount = bankFinancingEnabled
      ? Math.max(0, parseNumber(form.bankRepaymentAmount))
      : 0;
    const bankRepaymentFrequency = form.bankRepaymentFrequency;
    const bankRepaymentCount = bankFinancingEnabled
      ? clampInteger(parseNumber(form.bankRepaymentCount), 1, 36)
      : 0;
    const bankRepaymentScheduleComplete =
      bankRepaymentScheduleMode === "custom" &&
      form.bankRepaymentSchedule
        .slice(0, bankRepaymentCount)
        .every(
          (payment) =>
            payment.month.trim() !== "" && payment.amount.trim() !== ""
        );
    const bankCustomRepayments: NumericBankPayment[] =
      bankRepaymentScheduleComplete
        ? form.bankRepaymentSchedule
            .slice(0, bankRepaymentCount)
            .map((payment, index) => ({
              month: Math.max(0, Math.round(parseNumber(payment.month))),
              amount: Math.max(0, parseNumber(payment.amount)),
              index,
            }))
        : [];

    const coInvestorCount = isSharedProject
      ? clampInteger(parseNumber(form.coInvestorCount), 1, MAX_CO_INVESTORS)
      : 0;
    const coInvestors = form.coInvestors
      .slice(0, coInvestorCount)
      .map((investor, investorIndex) => ({
        index: investorIndex,
        name: investor.name.trim() || `Mede-investeerder ${investorIndex + 1}`,
        investmentInputMode: investor.investmentInputMode,
        enteredAmount: Math.max(0, parseNumber(investor.monthlyTotalAmount)),
        enteredPercentage: Math.min(
          1,
          Math.max(0, parsePercent(investor.investmentPercentage))
        ),
        plannedCapital: 0,
      }));

    const purchasePrice = Math.max(0, parseNumber(form.purchasePrice));
    const purchaseVatEnabled = form.purchaseVatEnabled === "yes";
    const purchaseVatPercentage = purchaseVatEnabled
      ? Math.min(1, Math.max(0, parsePercent(form.purchaseVatPercentage)))
      : 0;
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

    const purchaseVat = purchasePrice * purchaseVatPercentage;
    const transferTax = purchasePrice * transferTaxPercentage;
    const lawyerFee = purchasePrice * lawyerFeePercentage;
    const totalAcquisition =
      purchasePrice +
      purchaseVat +
      transferTax +
      lawyerFee +
      notaryFee +
      otherAcquisitionCosts;

    const simpleBuildCostPerM2 = Math.max(0, parseNumber(form.buildCostPerM2));
    const baseBuildCost = usesDetailedBuild
      ? buildBreakdown.reduce((sum, line) => sum + line.totalCost, 0)
      : surfaceM2 * simpleBuildCostPerM2;
    const buildCostPerM2 = usesDetailedBuild
      ? surfaceM2 > 0
        ? baseBuildCost / surfaceM2
        : 0
      : simpleBuildCostPerM2;
    const contingencyPercentage = Math.max(
      0,
      parsePercent(form.contingencyPercentage)
    );
    const fixedInterior = Math.max(0, parseNumber(form.fixedInterior));
    const looseFurniture = Math.max(0, parseNumber(form.looseFurniture));
    const furnitureMarkupPercentage = Math.min(
      1,
      Math.max(0, parsePercent(form.furnitureMarkupPercentage))
    );
    const projectManagementPercentage = isSharedProject
      ? Math.max(0, parsePercent(form.projectManagementPercentage))
      : 0;

    const contingency = baseBuildCost * contingencyPercentage;
    // De meubelopslag geldt uitsluitend voor Furniture en is geen bouwbetaling.
    // De opslag wordt daarom niet in de projectkosten of construction draws opgenomen,
    // maar als aanvullende opbrengst bij de verkoop verwerkt.
    const furnitureMarkup = looseFurniture * furnitureMarkupPercentage;
    // Furniture wordt los boven op de vastgoedverkoop verkocht. De extra
    // verkoopopbrengst bestaat daarom uit de kostprijs van Furniture plus
    // de ingestelde mark-up. Built-in Furniture valt hier niet onder.
    const furnitureSaleProceeds = looseFurniture + furnitureMarkup;
    const fixedFurnitureCost = fixedInterior;
    const looseFurnitureCost = looseFurniture;
    // Subtotal excludes loose Furniture so Furniture remains a separate line.
    // Project Management is calculated strictly over this Subtotal and therefore
    // does not include loose Furniture.
    const projectSubtotal = baseBuildCost + contingency + fixedInterior;
    const projectManagementBase = projectSubtotal;
    const projectManagement = isSharedProject
      ? projectManagementBase * projectManagementPercentage
      : 0;
    const totalProjectCost =
      projectSubtotal + looseFurniture + projectManagement;
    const capitalDeployed = totalAcquisition + totalProjectCost;

    // Een mede-investeerder kan zijn deelname invoeren als vast bedrag of als
    // percentage van het totale benodigde projectkapitaal. Beide routes worden
    // hier omgerekend naar hetzelfde plannedCapital, zodat de rest van de
    // cashflow- en winstverdeling identiek blijft werken.
    coInvestors.forEach((investor) => {
      investor.plannedCapital =
        investor.investmentInputMode === "percentage"
          ? capitalDeployed * investor.enteredPercentage
          : investor.enteredAmount;
    });

    const salePrice = usesDetailedBuild
      ? buildBreakdown.reduce((sum, line) => sum + line.saleTotal, 0)
      : Math.max(0, parseNumber(form.salePrice));
    const averageSalePricePerM2 = surfaceM2 > 0 ? salePrice / surfaceM2 : 0;
    const agentCommissionPercentage = Math.max(
      0,
      parsePercent(form.agentCommissionPercentage)
    );
    const agentCommission = salePrice * agentCommissionPercentage;
    const saleLawyerFeePercentage = Math.max(
      0,
      parsePercent(form.saleLawyerFeePercentage)
    );
    const saleLawyerFee = salePrice * saleLawyerFeePercentage;
    const netProceeds =
      salePrice - agentCommission - saleLawyerFee + furnitureSaleProceeds;
    const netSaleProceedsBeforeFurniture = netProceeds;
    const operatingNetProfit = netProceeds - capitalDeployed;

    const downpaymentCount = clampInteger(
      parseNumber(form.downpaymentCount),
      0,
      10
    );
    let remainingPurchasePrice = purchasePrice;
    const downpayments = form.downpayments
      .slice(0, downpaymentCount)
      .map((payment, index) => {
        const requestedAmount = Math.max(0, parseNumber(payment.amount));
        const amount = Math.min(requestedAmount, remainingPurchasePrice);
        remainingPurchasePrice = Math.max(0, remainingPurchasePrice - amount);
        return {
          index,
          month: Math.max(0, Math.round(parseNumber(payment.month))),
          amount,
        };
      });

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

    const rawCashflow: RawCashflowItem[] = [
      ...downpayments
        .filter((payment) => payment.amount > 0)
        .map((payment) => ({
          paymentId: `downpayment-${payment.index + 1}`,
          month: payment.month,
          event: `Downpayment ${payment.index + 1}`,
          outflow: payment.amount,
          inflow: 0,
          category: "acquisition" as const,
        })),
      {
        paymentId: "final-purchase-payment",
        month: closingMonth,
        event: "Final purchase payment",
        outflow: finalPurchasePayment,
        inflow: 0,
        category: "acquisition",
      },
      ...(purchaseVatEnabled
        ? [
            {
              paymentId: "purchase-vat",
              month: closingMonth,
              event: `VAT on purchase (${percent(purchaseVatPercentage)})`,
              outflow: purchaseVat,
              inflow: 0,
              category: "acquisition" as const,
            },
          ]
        : []),
      {
        paymentId: "transfer-tax",
        month: closingMonth,
        event: "Transfer tax",
        outflow: transferTax,
        inflow: 0,
        category: "acquisition",
      },
      {
        paymentId: "lawyer-fee",
        month: closingMonth,
        event: "Lawyer fee",
        outflow: lawyerFee,
        inflow: 0,
        category: "acquisition",
      },
      {
        paymentId: "notary-fee",
        month: closingMonth,
        event: "Notary fee",
        outflow: notaryFee,
        inflow: 0,
        category: "acquisition",
      },
      {
        paymentId: "other-acquisition-costs",
        month: closingMonth,
        event: "Other acquisition costs",
        outflow: otherAcquisitionCosts,
        inflow: 0,
        category: "acquisition",
      },
    ];

    const projectCostExcludingFurniture = Math.max(
      0,
      totalProjectCost - fixedFurnitureCost - looseFurnitureCost
    );
    const baseConstructionDrawAmount =
      projectCostExcludingFurniture / constructionDraws;
    const fixedFurniturePerSelectedDraw =
      fixedFurnitureCost / furniturePaymentMonths;
    const firstFixedFurnitureDrawIndex =
      constructionDraws - furniturePaymentMonths;
    const looseFurniturePerSelectedMonth =
      looseFurnitureCost / looseFurniturePaymentMonths;
    const firstLooseFurnitureDrawIndex =
      constructionDraws - looseFurniturePaymentMonths;

    for (let index = 0; index < constructionDraws; index += 1) {
      const includesFixedFurniture = index >= firstFixedFurnitureDrawIndex;
      const includesLooseFurniture = index >= firstLooseFurnitureDrawIndex;
      const constructionDrawAmount =
        baseConstructionDrawAmount +
        (includesFixedFurniture ? fixedFurniturePerSelectedDraw : 0) +
        (includesLooseFurniture ? looseFurniturePerSelectedMonth : 0);

      rawCashflow.push({
        paymentId: `construction-draw-${index + 1}`,
        month: constructionStartMonth + index,
        event: `Construction draw ${index + 1}/${constructionDraws}`,
        outflow: constructionDrawAmount,
        inflow: 0,
        category: "project",
      });
    }

    rawCashflow.push({
      paymentId: "sale-proceeds",
      month: durationMonths,
      event: "Sales proceeds (after sale costs + Furniture incl. mark-up)",
      outflow: 0,
      inflow: netProceeds,
      category: "sale",
      // De verkoopregel wordt altijd als laatste regel van de exitmaand getoond.
      sortOrder: 99,
    });

    const bankSchedule = buildBankFinancingSchedule({
      enabled:
        bankFinancingEnabled &&
        bankFinancingDrawMonthsComplete &&
        (bankDrawScheduleMode === "standard" || customBankDrawAmountsComplete),
      draws: bankDrawSchedule,
      annualInterestRate: bankInterestPercentage,
      repaymentMode: bankRepaymentScheduleMode,
      repaymentAmount: bankRepaymentAmount,
      repaymentFrequency: bankRepaymentFrequency,
      customRepayments: bankCustomRepayments,
      exitMonth: durationMonths,
    });
    rawCashflow.push(...bankSchedule.rows);

    rawCashflow.sort(
      (a, b) =>
        a.month - b.month ||
        (a.sortOrder ?? 20) - (b.sortOrder ?? 20) ||
        a.event.localeCompare(b.event)
    );

    // Bouw de IRR op basis van de daadwerkelijke equity-cashflows.
    // Bankopnames zijn financiering en dus geen rendement voor equity.
    // Aflossing/rente vóór exit kan wel extra equity vragen; aflossing op exit
    // wordt uit de verkoopopbrengst voldaan en zit daarom in de terminal proceeds.
    const buildEquityContributionRows = (
      rows: RawCashflowItem[],
      exitMonth: number
    ) => {
      const sortedRows = [...rows].sort(
        (a, b) =>
          a.month - b.month ||
          (a.sortOrder ?? 20) - (b.sortOrder ?? 20) ||
          a.event.localeCompare(b.event)
      );
      let availableBankCash = 0;
      const contributions: Array<{ month: number; amount: number }> = [];

      sortedRows.forEach((item) => {
        if (item.bankEventType === "draw" && item.inflow > 0) {
          availableBankCash += item.inflow;
        }

        const requiresEquity =
          item.outflow > 0 &&
          (item.category === "acquisition" ||
            item.category === "project" ||
            (item.category === "financing" && item.month < exitMonth));

        if (!requiresEquity) return;

        const bankFundingUsed = Math.min(availableBankCash, item.outflow);
        availableBankCash -= bankFundingUsed;
        const equityRequired = Math.max(0, item.outflow - bankFundingUsed);

        if (equityRequired > 0) {
          contributions.push({
            month: Math.max(0, Math.min(exitMonth, Math.round(item.month))),
            amount: equityRequired,
          });
        }
      });

      return contributions;
    };

    const calculateEquityIrr = (
      contributions: Array<{ month: number; amount: number }>,
      terminalProceeds: number,
      exitMonth: number
    ) => {
      const validContributions = contributions.filter(
        (item) => Number.isFinite(item.amount) && item.amount > 0
      );
      if (validContributions.length === 0) return Number.NaN;

      return calculateAnnualizedIrr([
        ...validContributions.map((item) => ({
          month: Math.max(0, Math.min(exitMonth, Math.round(item.month))),
          outflow: item.amount,
          inflow: 0,
        })),
        {
          month: exitMonth,
          outflow: terminalProceeds < 0 ? Math.abs(terminalProceeds) : 0,
          inflow: terminalProceeds > 0 ? terminalProceeds : 0,
        },
      ]);
    };

    const requestedMonthlyCapital = coInvestors.reduce(
      (sum, investor) => sum + investor.plannedCapital,
      0
    );
    const monthlyCapitalScale =
      requestedMonthlyCapital > capitalDeployed && requestedMonthlyCapital > 0
        ? capitalDeployed / requestedMonthlyCapital
        : 1;
    const monthlyCapitalShares = coInvestors.map((investor) =>
      capitalDeployed > 0
        ? (investor.plannedCapital * monthlyCapitalScale) / capitalDeployed
        : 0
    );

    const investorUsedCapital = coInvestors.map(() => 0);
    let runningCapital = 0;
    let bankCashAvailable = 0;

    const cashflow: CashflowItem[] = rawCashflow.map((item) => {
      const coInvestorInvestments = coInvestors.map(() => 0);
      let ourInvestment = 0;
      let bankFundingUsed = 0;

      if (item.bankEventType === "draw" && item.inflow > 0) {
        bankCashAvailable += item.inflow;
      }

      const isProjectPayment =
        item.outflow > 0 &&
        (item.category === "acquisition" || item.category === "project");
      const isPreExitFinancingPayment =
        item.outflow > 0 &&
        item.category === "financing" &&
        item.month < durationMonths;

      if (isProjectPayment) {
        bankFundingUsed = Math.min(bankCashAvailable, item.outflow);
        bankCashAvailable -= bankFundingUsed;
        let remainingOutflow = item.outflow - bankFundingUsed;

        if (isSharedProject) {
          coInvestors.forEach((_, investorIndex) => {
            const allocation = Math.min(
              remainingOutflow,
              item.outflow * monthlyCapitalShares[investorIndex]
            );
            coInvestorInvestments[investorIndex] = allocation;
            investorUsedCapital[investorIndex] += allocation;
            remainingOutflow -= allocation;
          });
        }

        ourInvestment = Math.max(0, remainingOutflow);
      } else if (isPreExitFinancingPayment) {
        bankFundingUsed = Math.min(bankCashAvailable, item.outflow);
        bankCashAvailable -= bankFundingUsed;
        let remainingOutflow = item.outflow - bankFundingUsed;
        if (isSharedProject) {
          coInvestors.forEach((_, investorIndex) => {
            const allocation = Math.min(
              remainingOutflow,
              item.outflow * monthlyCapitalShares[investorIndex]
            );
            coInvestorInvestments[investorIndex] = allocation;
            investorUsedCapital[investorIndex] += allocation;
            remainingOutflow -= allocation;
          });
        }
        ourInvestment = Math.max(0, remainingOutflow);
      } else if (item.outflow > 0 && item.category !== "financing") {
        ourInvestment = item.outflow;
      }

      runningCapital += item.outflow - item.inflow;
      return {
        ...item,
        date: addMonthsToDate(projectStartDate, item.month),
        runningCapital,
        ourInvestment,
        coInvestorInvestments,
        bankFundingUsed,
      };
    });

    const ourInvestment = cashflow.reduce(
      (sum, item) => sum + item.ourInvestment,
      0
    );
    const partnerInvestment = investorUsedCapital.reduce(
      (sum, value) => sum + value,
      0
    );
    const equityCapitalDeployed = ourInvestment + partnerInvestment;

    const profitTaxEnabled = form.profitTaxEnabled === "yes";
    const profitTaxPercentage = profitTaxEnabled
      ? Math.min(1, Math.max(0, parsePercent(form.profitTaxPercentage)))
      : 0;
    const applyProfitTax = (profitBeforeTax: number) => {
      const taxAmount =
        profitTaxEnabled && profitBeforeTax > 0
          ? profitBeforeTax * profitTaxPercentage
          : 0;
      return {
        taxAmount,
        profitAfterTax: profitBeforeTax - taxAmount,
      };
    };

    const totalBankInterest = bankSchedule.interestPaid;
    const netProfitBeforeTax = operatingNetProfit - totalBankInterest;
    const {
      taxAmount: profitTaxAmount,
      profitAfterTax: netProfitAfterTax,
    } = applyProfitTax(netProfitBeforeTax);
    const netProfit = profitTaxEnabled
      ? netProfitAfterTax
      : netProfitBeforeTax;
    const roi = equityCapitalDeployed
      ? netProfit / equityCapitalDeployed
      : 0;
    const distributableNetProceedsBeforeTax =
      equityCapitalDeployed + netProfitBeforeTax;
    const distributableNetProceedsAfterTax =
      equityCapitalDeployed + netProfitAfterTax;
    const distributableNetProceeds = profitTaxEnabled
      ? distributableNetProceedsAfterTax
      : distributableNetProceedsBeforeTax;
    // Houd de bankcorrectie los van winstbelasting; belasting wordt apart getoond.
    const bankExitAdjustment = Math.max(
      0,
      netProceeds - distributableNetProceedsBeforeTax
    );
    const ourEquityPercentage = equityCapitalDeployed
      ? ourInvestment / equityCapitalDeployed
      : 1;
    const partnerEquityPercentage = equityCapitalDeployed
      ? partnerInvestment / equityCapitalDeployed
      : 0;

    const ourNetProfitBeforeTax =
      netProfitBeforeTax * ourEquityPercentage;
    const partnerNetProfitBeforeTax =
      netProfitBeforeTax * partnerEquityPercentage;
    const ourTaxAmount = profitTaxAmount * ourEquityPercentage;
    const partnerTaxAmount = profitTaxAmount * partnerEquityPercentage;
    const ourNetProfit = netProfit * ourEquityPercentage;
    const partnerNetProfit = netProfit * partnerEquityPercentage;
    const ourNetProceeds = ourInvestment + ourNetProfit;
    const partnerNetProceeds = partnerInvestment + partnerNetProfit;
    const ourRoi = ourInvestment ? ourNetProfit / ourInvestment : 0;
    const partnerRoi = partnerInvestment
      ? partnerNetProfit / partnerInvestment
      : 0;

    const participantIrr = (
      outflows: Array<{ month: number; amount: number }>,
      proceeds: number
    ) =>
      outflows.some((item) => item.amount > 0)
        ? calculateAnnualizedIrr([
            ...outflows
              .filter((item) => item.amount > 0)
              .map((item) => ({
                month: item.month,
                outflow: item.amount,
                inflow: 0,
              })),
            {
              month: durationMonths,
              outflow: 0,
              inflow: proceeds,
            },
          ])
        : Number.NaN;

    const ourIrr = participantIrr(
      cashflow.map((item) => ({
        month: item.month,
        amount: item.ourInvestment,
      })),
      ourNetProceeds
    );
    const partnerIrr = participantIrr(
      cashflow.map((item) => ({
        month: item.month,
        amount: item.coInvestorInvestments.reduce(
          (sum, allocation) => sum + allocation,
          0
        ),
      })),
      partnerNetProceeds
    );

    const coInvestorSummaries: ParticipantSummary[] = coInvestors.map(
      (investor, investorIndex) => {
        const usedCapital = investorUsedCapital[investorIndex];
        const capitalShare = equityCapitalDeployed
          ? usedCapital / equityCapitalDeployed
          : 0;
        const investorNetProfit = netProfit * capitalShare;
        const investorNetProceeds = usedCapital + investorNetProfit;
        return {
          name: investor.name,
          plannedCapital: investor.plannedCapital,
          usedCapital,
          unusedCapital: Math.max(0, investor.plannedCapital - usedCapital),
          capitalShare,
          netProfit: investorNetProfit,
          netProceeds: investorNetProceeds,
          roi: usedCapital ? investorNetProfit / usedCapital : 0,
          irr: participantIrr(
            cashflow.map((item) => ({
              month: item.month,
              amount: item.coInvestorInvestments[investorIndex] ?? 0,
            })),
            investorNetProceeds
          ),
        };
      }
    );

    const ourSummary: ParticipantSummary = {
      name: "Ons kapitaal",
      plannedCapital: ourInvestment,
      usedCapital: ourInvestment,
      unusedCapital: 0,
      capitalShare: ourEquityPercentage,
      netProfit: ourNetProfit,
      netProceeds: ourNetProceeds,
      roi: ourRoi,
      irr: ourIrr,
    };
    const participantSummaries = [ourSummary, ...coInvestorSummaries];

    const plannedPartnerCapital = coInvestors.reduce(
      (sum, investor) => sum + investor.plannedCapital,
      0
    );
    const unusedPartnerCapital = Math.max(
      0,
      plannedPartnerCapital - partnerInvestment
    );

    const ourAcquisitionCosts = cashflow
      .filter((item) => item.category === "acquisition")
      .reduce((sum, item) => sum + item.ourInvestment, 0);
    const partnerAcquisitionCosts = cashflow
      .filter((item) => item.category === "acquisition")
      .reduce(
        (sum, item) =>
          sum + item.coInvestorInvestments.reduce((subtotal, amount) => subtotal + amount, 0),
        0
      );
    const ourProjectCosts = cashflow
      .filter((item) => item.category === "project")
      .reduce((sum, item) => sum + item.ourInvestment, 0);
    const partnerProjectCosts = cashflow
      .filter((item) => item.category === "project")
      .reduce(
        (sum, item) =>
          sum + item.coInvestorInvestments.reduce((subtotal, amount) => subtotal + amount, 0),
        0
      );
    const coInvestorAcquisitionCosts = coInvestors.map((_, investorIndex) =>
      cashflow
        .filter((item) => item.category === "acquisition")
        .reduce(
          (sum, item) => sum + (item.coInvestorInvestments[investorIndex] ?? 0),
          0
        )
    );
    const coInvestorProjectCosts = coInvestors.map((_, investorIndex) =>
      cashflow
        .filter((item) => item.category === "project")
        .reduce(
          (sum, item) => sum + (item.coInvestorInvestments[investorIndex] ?? 0),
          0
        )
    );
    const coInvestorGrossProceeds = coInvestorSummaries.map(
      (summary) => salePrice * summary.capitalShare
    );
    const coInvestorSalesCommission = coInvestorSummaries.map(
      (summary) => agentCommission * summary.capitalShare
    );
    const coInvestorSaleLawyerFees = coInvestorSummaries.map(
      (summary) => saleLawyerFee * summary.capitalShare
    );
    const ourGrossProceeds = salePrice * ourEquityPercentage;
    const partnerGrossProceeds = salePrice * partnerEquityPercentage;
    const ourSalesCommission = agentCommission * ourEquityPercentage;
    const partnerSalesCommission = agentCommission * partnerEquityPercentage;
    const ourSaleLawyerFee = saleLawyerFee * ourEquityPercentage;
    const partnerSaleLawyerFee = saleLawyerFee * partnerEquityPercentage;
    const baseEquityContributions = buildEquityContributionRows(
      rawCashflow.filter((item) => item.category !== "sale"),
      durationMonths
    );
    const irr = calculateEquityIrr(
      baseEquityContributions,
      distributableNetProceeds,
      durationMonths
    );
    const cashAtMonth0 = Math.max(
      0,
      cashflow
        .filter((item) => item.month === 0)
        .reduce((sum, item) => sum + item.outflow - item.inflow, 0)
    );

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
    const cashByNotary = totalAcquisition;

    const investmentCashflow = rawCashflow.filter(
      (item) => item.category !== "sale"
    );
    const operatingRows = investmentCashflow.filter(
      (item) => item.category === "acquisition" || item.category === "project"
    );

    const exitScenarios = [6, 9, 12, 15, 18, durationMonths]
      .filter((month, index, values) => month > 0 && values.indexOf(month) === index)
      .sort((a, b) => a - b)
      .map((month) => {
        // Alle geplande projectkosten blijven onderdeel van het scenario, maar
        // betalingen ná de gekozen exit worden naar de exitmaand gehaald.
        const scenarioOperatingRows = operatingRows.map((item) => ({
          ...item,
          month: Math.min(item.month, month),
        }));

        // Banktranches die pas ná de gekozen exit zouden worden ontvangen,
        // bestaan in dit scenario niet. Zo kan de IRR niet kunstmatig worden
        // verbeterd door financiering die na verkoop zou binnenkomen.
        const scenarioBankSchedule = buildBankFinancingSchedule({
          enabled:
            bankFinancingEnabled &&
            bankFinancingDrawMonthsComplete &&
            (bankDrawScheduleMode === "standard" || customBankDrawAmountsComplete),
          draws: bankDrawSchedule.filter((draw) => draw.month <= month),
          annualInterestRate: bankInterestPercentage,
          repaymentMode: bankRepaymentScheduleMode,
          repaymentAmount: bankRepaymentAmount,
          repaymentFrequency: bankRepaymentFrequency,
          customRepayments: bankCustomRepayments.filter(
            (payment) => payment.month <= month
          ),
          exitMonth: month,
        });

        const scenarioInvestmentRows: RawCashflowItem[] = [
          ...scenarioOperatingRows,
          ...scenarioBankSchedule.rows,
        ];
        const scenarioEquityContributions = buildEquityContributionRows(
          scenarioInvestmentRows,
          month
        );
        const scenarioEquityCapital = scenarioEquityContributions.reduce(
          (sum, item) => sum + item.amount,
          0
        );
        const scenarioProfitBeforeTax =
          operatingNetProfit - scenarioBankSchedule.interestPaid;
        const {
          taxAmount: scenarioTaxAmount,
          profitAfterTax: scenarioProfitAfterTax,
        } = applyProfitTax(scenarioProfitBeforeTax);
        const scenarioProfit = profitTaxEnabled
          ? scenarioProfitAfterTax
          : scenarioProfitBeforeTax;
        const scenarioRoi = scenarioEquityCapital
          ? scenarioProfit / scenarioEquityCapital
          : 0;
        const scenarioDistributableNetProceeds =
          scenarioEquityCapital + scenarioProfit;

        return {
          month,
          date: addMonthsToDate(projectStartDate, month),
          netProfitBeforeTax: scenarioProfitBeforeTax,
          taxAmount: scenarioTaxAmount,
          netProfitAfterTax: scenarioProfitAfterTax,
          netProfit: scenarioProfit,
          roi: scenarioRoi,
          irr: calculateEquityIrr(
            scenarioEquityContributions,
            scenarioDistributableNetProceeds,
            month
          ),
        };
      });

    const saleSensitivity = [-0.1, -0.05, 0, 0.05, 0.1].map((change) => {
      const scenarioSalePrice = salePrice * (1 + change);
      const scenarioNetProceeds =
        scenarioSalePrice *
          (1 - agentCommissionPercentage - saleLawyerFeePercentage) +
        furnitureSaleProceeds;
      const scenarioProfitBeforeTax =
        scenarioNetProceeds - capitalDeployed - totalBankInterest;
      const {
        taxAmount: scenarioTaxAmount,
        profitAfterTax: scenarioProfitAfterTax,
      } = applyProfitTax(scenarioProfitBeforeTax);
      const scenarioProfit = profitTaxEnabled
        ? scenarioProfitAfterTax
        : scenarioProfitBeforeTax;
      const scenarioRoi = equityCapitalDeployed
        ? scenarioProfit / equityCapitalDeployed
        : 0;
      const scenarioDistributableNetProceeds =
        equityCapitalDeployed + scenarioProfit;

      return {
        change,
        salePrice: scenarioSalePrice,
        netProfitBeforeTax: scenarioProfitBeforeTax,
        taxAmount: scenarioTaxAmount,
        netProfitAfterTax: scenarioProfitAfterTax,
        netProfit: scenarioProfit,
        roi: scenarioRoi,
        irr: calculateEquityIrr(
          baseEquityContributions,
          scenarioDistributableNetProceeds,
          durationMonths
        ),
      };
    });

    const projectCostSensitivity = [-0.1, -0.05, 0, 0.05, 0.1].map(
      (change) => {
        const scenarioProjectCost = totalProjectCost * (1 + change);
        const scenarioCapital = totalAcquisition + scenarioProjectCost;
        const scenarioProfitBeforeTax =
          netProceeds - scenarioCapital - totalBankInterest;
        const {
          taxAmount: scenarioTaxAmount,
          profitAfterTax: scenarioProfitAfterTax,
        } = applyProfitTax(scenarioProfitBeforeTax);
        const scenarioProfit = profitTaxEnabled
          ? scenarioProfitAfterTax
          : scenarioProfitBeforeTax;
        const constructionCostFactor = totalProjectCost
          ? scenarioProjectCost / totalProjectCost
          : 0;

        const scenarioOperatingRows = operatingRows.map((item) =>
          item.category === "project"
            ? { ...item, outflow: item.outflow * constructionCostFactor }
            : item
        );
        const scenarioInvestmentRows: RawCashflowItem[] = [
          ...scenarioOperatingRows,
          ...bankSchedule.rows,
        ];
        const scenarioEquityContributions = buildEquityContributionRows(
          scenarioInvestmentRows,
          durationMonths
        );
        const scenarioEquityCapital = scenarioEquityContributions.reduce(
          (sum, item) => sum + item.amount,
          0
        );
        const scenarioRoi = scenarioEquityCapital
          ? scenarioProfit / scenarioEquityCapital
          : 0;
        const scenarioDistributableNetProceeds =
          scenarioEquityCapital + scenarioProfit;

        return {
          change,
          projectCost: scenarioProjectCost,
          netProfitBeforeTax: scenarioProfitBeforeTax,
          taxAmount: scenarioTaxAmount,
          netProfitAfterTax: scenarioProfitAfterTax,
          netProfit: scenarioProfit,
          roi: scenarioRoi,
          irr: calculateEquityIrr(
            scenarioEquityContributions,
            scenarioDistributableNetProceeds,
            durationMonths
          ),
        };
      }
    );

    return {
      projectName,
      analysisDate: form.analysisDate,
      projectStartDate,
      projectType,
      projectOwnership,
      isSharedProject,
      coInvestors,
      coInvestorSummaries,
      participantSummaries,
      coInvestorAcquisitionCosts,
      coInvestorProjectCosts,
      coInvestorGrossProceeds,
      coInvestorSalesCommission,
      coInvestorSaleLawyerFees,
      plannedPartnerCapital,
      unusedPartnerCapital,
      ourEquityPercentage,
      partnerEquityPercentage,
      ourInvestment,
      partnerInvestment,
      ourNetProfitBeforeTax,
      partnerNetProfitBeforeTax,
      ourTaxAmount,
      partnerTaxAmount,
      ourNetProfit,
      partnerNetProfit,
      ourNetProceeds,
      partnerNetProceeds,
      ourAcquisitionCosts,
      partnerAcquisitionCosts,
      ourProjectCosts,
      partnerProjectCosts,
      ourGrossProceeds,
      partnerGrossProceeds,
      ourSalesCommission,
      partnerSalesCommission,
      ourSaleLawyerFee,
      partnerSaleLawyerFee,
      ourRoi,
      partnerRoi,
      ourIrr,
      partnerIrr,
      buildInputMode,
      surfaceM2,
      builtSurfaceM2,
      terraceSurfaceM2,
      poolSurfaceM2,
      garageSurfaceM2,
      buildBreakdown,
      plotM2,
      durationMonths,
      purchasePrice,
      purchaseVatEnabled,
      purchaseVatPercentage,
      purchaseVat,
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
      furnitureMarkupPercentage,
      furnitureMarkup,
      furnitureSaleProceeds,
      fixedFurnitureCost,
      looseFurnitureCost,
      projectManagementPercentage,
      bankFinancingEnabled,
      bankDrawScheduleMode,
      bankFinancingStartMonth,
      bankFinancingDrawMonths,
      bankFinancingDrawMonthsComplete,
      customBankDrawAmountsComplete,
      bankFinancingAmount,
      bankFinancingTranches,
      bankInterestPercentage,
      bankRepaymentScheduleMode,
      bankRepaymentAmount,
      bankRepaymentFrequency,
      bankRepaymentCount,
      bankRepaymentScheduleComplete,
      bankFinancingDrawn: bankSchedule.drawnAmount,
      bankPrincipalRepaid: bankSchedule.principalRepaid,
      totalBankInterest,
      bankFundingUsed: cashflow.reduce(
        (sum, item) => sum + item.bankFundingUsed,
        0
      ),
      equityCapitalDeployed,
      distributableNetProceedsBeforeTax,
      distributableNetProceedsAfterTax,
      distributableNetProceeds,
      bankExitAdjustment,
      baseBuildCost,
      contingency,
      projectSubtotal,
      projectManagement,
      totalProjectCost,
      capitalDeployed,
      salePrice,
      averageSalePricePerM2,
      agentCommissionPercentage,
      agentCommission,
      saleLawyerFeePercentage,
      saleLawyerFee,
      netSaleProceedsBeforeFurniture,
      netProceeds,
      profitTaxEnabled,
      profitTaxPercentage,
      profitTaxAmount,
      netProfitBeforeTax,
      netProfitAfterTax,
      netProfit,
      roi,
      irr,
      cashflow,
      monthlyCapital,
      peakDeployed,
      averageCapitalDuration,
      cashByNotary,
      cashAtMonth0,
      closingMonth,
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

  const investorEntries = data.coInvestorSummaries.map(
    (summary, investorIndex) => ({ summary, investorIndex })
  );
  const investorColumnsPerTable = 2;
  const investorPrintGroups = data.isSharedProject
    ? Array.from(
        {
          length: Math.max(
            1,
            Math.ceil(investorEntries.length / investorColumnsPerTable)
          ),
        },
        (_, groupIndex) =>
          investorEntries.slice(
            groupIndex * investorColumnsPerTable,
            (groupIndex + 1) * investorColumnsPerTable
          )
      )
    : [];
  const investorTablesPerPrintPage = 2;
  const investorPrintPages = data.isSharedProject
    ? Array.from(
        {
          length: Math.max(
            1,
            Math.ceil(investorPrintGroups.length / investorTablesPerPrintPage)
          ),
        },
        (_, pageIndex) =>
          investorPrintGroups.slice(
            pageIndex * investorTablesPerPrintPage,
            (pageIndex + 1) * investorTablesPerPrintPage
          )
      )
    : [];

  const buildSpecificationGroups =
    data.buildInputMode === "detailed"
      ? form.buildLevels.flatMap((level) => {
          const rows = data.buildBreakdown.filter(
            (line) =>
              line.level === level &&
              (line.areaM2 > 0 ||
                line.costPerM2 > 0 ||
                line.salePricePerM2 > 0)
          );

          if (rows.length === 0) return [];

          return [
            {
              level,
              label: getBuildLevelLabel(level, "en"),
              rows,
              levelSurface: rows.reduce((sum, line) => sum + line.areaM2, 0),
              levelCost: rows.reduce((sum, line) => sum + line.totalCost, 0),
              levelSalePrice: rows.reduce((sum, line) => sum + line.saleTotal, 0),
            },
          ];
        })
      : [];

  type BuildSpecificationPageGroup =
    (typeof buildSpecificationGroups)[number] & { continued: boolean };

  // Verdeel een lange bouwspecificatie automatisch over meerdere A4-pagina's.
  // Op de eerste pagina staat ook de metrics-samenvatting en is daarom minder
  // ruimte beschikbaar. Pagina's worden zo volledig mogelijk gevuld; een
  // verdieping mag daarom over twee pagina's doorlopen.
  const buildSpecificationPages: BuildSpecificationPageGroup[][] = [];
  if (data.buildInputMode === "detailed") {
    const firstPageRowCapacity = 16;
    const continuationPageRowCapacity = 20;
    let pageIndex = 0;
    let currentPage: BuildSpecificationPageGroup[] = [];
    let usedRows = 0;

    const finishBuildSpecificationPage = () => {
      buildSpecificationPages.push(currentPage);
      currentPage = [];
      usedRows = 0;
      pageIndex += 1;
    };

    buildSpecificationGroups.forEach((group) => {
      let remainingRows = [...group.rows];
      let continued = false;

      while (remainingRows.length > 0) {
        const capacity =
          pageIndex === 0
            ? firstPageRowCapacity
            : continuationPageRowCapacity;
        const availableRows = capacity - usedRows;
        if (availableRows <= 1) {
          finishBuildSpecificationPage();
          continue;
        }

        const rowsToTake = Math.min(
          remainingRows.length,
          availableRows - 1
        );
        currentPage.push({
          ...group,
          rows: remainingRows.slice(0, rowsToTake),
          continued,
        });
        usedRows += 1 + rowsToTake;
        remainingRows = remainingRows.slice(rowsToTake);
        continued = true;

        if (remainingRows.length > 0) {
          finishBuildSpecificationPage();
        }
      }
    });

    if (currentPage.length > 0 || buildSpecificationPages.length === 0) {
      buildSpecificationPages.push(currentPage);
    }
  }

  const sharedFinancingPageCount = data.isSharedProject
    ? investorPrintPages.length
    : 0;
  const sharedFinancingPageNumber = data.isSharedProject ? 2 : 0;
  const buildSpecificationPageCount =
    data.buildInputMode === "detailed" ? buildSpecificationPages.length : 0;
  const buildSpecificationPageNumber =
    data.buildInputMode === "detailed"
      ? 2 + sharedFinancingPageCount
      : 0;
  const exitPageNumber =
    2 + sharedFinancingPageCount + buildSpecificationPageCount;
  const cashOverviewPageNumber =
    3 + sharedFinancingPageCount + buildSpecificationPageCount;
  const cashDetailStartPageNumber = cashOverviewPageNumber + 1;
  const printedCashflowPageCount = data.isSharedProject
    ? cashflowPageCount * investorPrintGroups.length
    : cashflowPageCount;
  const sensitivityPageNumber =
    cashDetailStartPageNumber + printedCashflowPageCount;
  const photosPageNumber = hasPhotos ? sensitivityPageNumber + 1 : 0;
  const totalPages = sensitivityPageNumber + (hasPhotos ? 1 : 0);

  function renderParticipantSplitTable(
    entries: typeof investorEntries,
    compact = false
  ) {
    return (
      <div className="table-scroll participant-table-scroll">
        <table
          className={`split-table participant-split-table${compact ? " print-compact-table" : ""}`}
          style={
            compact
              ? { width: "100%", minWidth: 0, tableLayout: "fixed" }
              : {
                  minWidth: `${Math.max(900, 430 + (entries.length + 2) * 115)}px`,
                }
          }
        >
          <thead>
            <tr>
              <th>Category</th>
              <th>Total project</th>
              <th>Our equity</th>
              {entries.map(({ summary, investorIndex }) => (
                <th key={`split-head-${investorIndex}`}>{summary.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Acquisition and purchase</strong></td>
              <td>{euro(data.totalAcquisition)}</td>
              <td>{euro(data.ourAcquisitionCosts)}</td>
              {entries.map(({ investorIndex }) => (
                <td key={`acquisition-${investorIndex}`}>
                  {euro(data.coInvestorAcquisitionCosts[investorIndex] ?? 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Construction and project</strong></td>
              <td>{euro(data.totalProjectCost)}</td>
              <td>{euro(data.ourProjectCosts)}</td>
              {entries.map(({ investorIndex }) => (
                <td key={`project-${investorIndex}`}>
                  {euro(data.coInvestorProjectCosts[investorIndex] ?? 0)}
                </td>
              ))}
            </tr>
            <tr className="split-total-row">
              <td><strong>Total equity investment</strong></td>
              <td><strong>{euro(data.equityCapitalDeployed)}</strong></td>
              <td><strong>{euro(data.ourInvestment)}</strong></td>
              {entries.map(({ summary, investorIndex }) => (
                <td key={`investment-${investorIndex}`}>
                  <strong>{euro(summary.usedCapital)}</strong>
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Gross sale proceeds</strong></td>
              <td>{euro(data.salePrice)}</td>
              <td>{euro(data.ourGrossProceeds)}</td>
              {entries.map(({ investorIndex }) => (
                <td key={`gross-${investorIndex}`}>
                  {euro(data.coInvestorGrossProceeds[investorIndex] ?? 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Sales commission</strong></td>
              <td>-{euro(data.agentCommission)}</td>
              <td>-{euro(data.ourSalesCommission)}</td>
              {entries.map(({ investorIndex }) => (
                <td key={`commission-${investorIndex}`}>
                  -{euro(data.coInvestorSalesCommission[investorIndex] ?? 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Lawyer fee on sale</strong></td>
              <td>-{euro(data.saleLawyerFee)}</td>
              <td>-{euro(data.ourSaleLawyerFee)}</td>
              {entries.map(({ investorIndex }) => (
                <td key={`sale-lawyer-${investorIndex}`}>
                  -{euro(data.coInvestorSaleLawyerFees[investorIndex] ?? 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Furniture incl. mark-up</strong></td>
              <td>+{euro(data.furnitureSaleProceeds)}</td>
              <td>+{euro(data.furnitureSaleProceeds * data.ourEquityPercentage)}</td>
              {entries.map(({ summary, investorIndex }) => (
                <td key={`furniture-proceeds-${investorIndex}`}>
                  +{euro(data.furnitureSaleProceeds * summary.capitalShare)}
                </td>
              ))}
            </tr>
            {data.bankFinancingEnabled && (
              <tr>
                <td><strong>Bank financing adjustment at exit</strong></td>
                <td>-{euro(data.bankExitAdjustment)}</td>
                <td>-{euro(data.bankExitAdjustment * data.ourEquityPercentage)}</td>
                {entries.map(({ summary, investorIndex }) => (
                  <td key={`bank-adjustment-${investorIndex}`}>
                    -{euro(data.bankExitAdjustment * summary.capitalShare)}
                  </td>
                ))}
              </tr>
            )}
            <tr className="sale-row">
              <td><strong>{data.profitTaxEnabled ? "Net proceeds to equity after tax" : "Net proceeds to equity before tax"}</strong></td>
              <td className="positive"><strong>{euro(data.distributableNetProceeds)}</strong></td>
              <td className="positive"><strong>{euro(data.ourNetProceeds)}</strong></td>
              {entries.map(({ summary, investorIndex }) => (
                <td className="positive" key={`net-proceeds-${investorIndex}`}>
                  <strong>{euro(summary.netProceeds)}</strong>
                </td>
              ))}
            </tr>
            <tr className="split-profit-row">
              <td><strong>Net profit before tax / (loss)</strong></td>
              <td className={data.netProfitBeforeTax >= 0 ? "positive" : "negative"}>{signedEuro(data.netProfitBeforeTax)}</td>
              <td className={data.ourNetProfitBeforeTax >= 0 ? "positive" : "negative"}>{signedEuro(data.ourNetProfitBeforeTax)}</td>
              {entries.map(({ summary, investorIndex }) => {
                const participantProfitBeforeTax =
                  data.netProfitBeforeTax * summary.capitalShare;
                return (
                  <td className={participantProfitBeforeTax >= 0 ? "positive" : "negative"} key={`profit-before-tax-${investorIndex}`}>
                    {signedEuro(participantProfitBeforeTax)}
                  </td>
                );
              })}
            </tr>
            {data.profitTaxEnabled && (
              <>
                <tr>
                  <td><strong>Tax ({percent(data.profitTaxPercentage)})</strong></td>
                  <td>-{euro(data.profitTaxAmount)}</td>
                  <td>-{euro(data.ourTaxAmount)}</td>
                  {entries.map(({ summary, investorIndex }) => (
                    <td key={`tax-${investorIndex}`}>
                      -{euro(data.profitTaxAmount * summary.capitalShare)}
                    </td>
                  ))}
                </tr>
                <tr className="split-profit-row">
                  <td><strong>Net profit after tax / (loss)</strong></td>
                  <td className={data.netProfitAfterTax >= 0 ? "positive" : "negative"}>{signedEuro(data.netProfitAfterTax)}</td>
                  <td className={data.ourNetProfit >= 0 ? "positive" : "negative"}>{signedEuro(data.ourNetProfit)}</td>
                  {entries.map(({ summary, investorIndex }) => (
                    <td className={summary.netProfit >= 0 ? "positive" : "negative"} key={`profit-after-tax-${investorIndex}`}>
                      {signedEuro(summary.netProfit)}
                    </td>
                  ))}
                </tr>
              </>
            )}
            <tr className="split-return-row">
              <td><strong>{data.profitTaxEnabled ? "ROI after tax" : "ROI before tax"}</strong></td>
              <td className={data.roi >= 0 ? "positive" : "negative"}>{percent(data.roi, true)}</td>
              <td className={data.ourRoi >= 0 ? "positive" : "negative"}>{percent(data.ourRoi, true)}</td>
              {entries.map(({ summary, investorIndex }) => (
                <td className={summary.roi >= 0 ? "positive" : "negative"} key={`roi-${investorIndex}`}>
                  {percent(summary.roi, true)}
                </td>
              ))}
            </tr>
            <tr className="split-return-row">
              <td><strong>{data.profitTaxEnabled ? "IRR after tax" : "IRR before tax"} ({data.durationMonths}M annualised)</strong></td>
              <td className={data.irr >= 0 ? "positive" : "negative"}>{percent(data.irr, true)}</td>
              <td className={data.ourIrr >= 0 ? "positive" : "negative"}>{percent(data.ourIrr, true)}</td>
              {entries.map(({ summary, investorIndex }) => (
                <td className={summary.irr >= 0 ? "positive" : "negative"} key={`irr-${investorIndex}`}>
                  {percent(summary.irr, true)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  function renderCashflowTable(
    rows: CashflowItem[],
    entries: typeof investorEntries,
    compact = false
  ) {
    return (
      <section className="cash-table-card">
        <TableTitle>Cash flow detail</TableTitle>
        <div className="table-scroll">
          <table
            className={`shared-cashflow-table${compact ? " print-compact-table" : ""}`}
            style={{
              minWidth: `${Math.max(
                980,
                650 + entries.length * 105
              )}px`,
            }}
          >
            <thead>
              <tr>
                <th>Month</th>
                <th>Date</th>
                <th>Event</th>
                <th>Outflow</th>
                <th>Our investment</th>
                {entries.map(({ summary, investorIndex }) => (
                  <th key={`cashflow-head-${investorIndex}`}>{summary.name}</th>
                ))}
                <th>Inflow</th>
                <th>Running Capital</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={`${row.month}-${row.event}-${rowIndex}`}
                  className={
                    row.category === "sale"
                      ? "sale-row"
                      : row.category === "financing"
                        ? "financing-row"
                        : undefined
                  }
                >
                  <td>{row.month}</td>
                  <td>{formatShortDate(row.date)}</td>
                  <td><strong>{row.event}</strong></td>
                  <td className="negative">
                    {row.outflow ? `-${euro(row.outflow)}` : "—"}
                  </td>
                  <td className="negative party-investment-cell">
                    {row.ourInvestment ? `-${euro(row.ourInvestment)}` : "—"}
                  </td>
                  {entries.map(({ investorIndex }) => {
                    const amount = row.coInvestorInvestments[investorIndex] ?? 0;
                    return (
                      <td
                        className="negative party-investment-cell"
                        key={`cashflow-investor-${investorIndex}`}
                      >
                        {amount ? `-${euro(amount)}` : "—"}
                      </td>
                    );
                  })}
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
    );
  }

  const hasBuildSpecification = data.buildInputMode === "detailed";
  const buildSpecificationSectionNumber = String(
    2 + (data.isSharedProject ? 1 : 0)
  ).padStart(2, "0");
  const exitSectionNumber = String(
    2 +
      (data.isSharedProject ? 1 : 0) +
      (hasBuildSpecification ? 1 : 0)
  ).padStart(2, "0");
  const cashSectionNumber = String(
    3 +
      (data.isSharedProject ? 1 : 0) +
      (hasBuildSpecification ? 1 : 0)
  ).padStart(2, "0");
  const sensitivitySectionNumber = String(
    4 +
      (data.isSharedProject ? 1 : 0) +
      (hasBuildSpecification ? 1 : 0)
  ).padStart(2, "0");

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

        <section className="cloud-project-bar">
          <div className="cloud-project-left">
            <label className="cloud-project-picker">
              <span>Mijn projecten</span>
              <select
                value={cloudProject?.id || ""}
                onChange={(event) => void openProjectFromList(event.currentTarget.value)}
                disabled={projectListStatus === "loading"}
              >
                <option value="">
                  {projectListStatus === "loading"
                    ? "Projecten laden…"
                    : cloudProjects.length
                      ? "Kies een project…"
                      : "Nog geen opgeslagen projecten"}
                </option>
                {cloudProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="cloud-project-copy">
              <span>Geopend project</span>
              <strong>
                {cloudProject
                  ? cloudProject.name
                  : "Nieuw / nog niet online opgeslagen"}
              </strong>
              <small className={`cloud-status cloud-status-${cloudStatus}`}>
                {projectListStatus === "error"
                  ? projectListError || "Projectlijst kon niet worden geladen."
                  : cloudStatus === "loading"
                    ? "Project laden…"
                    : cloudStatus === "saving"
                      ? "Wijzigingen opslaan…"
                      : cloudStatus === "saved"
                        ? cloudProject?.canEdit
                          ? "Online opgeslagen · autosave actief"
                          : "Presentatiemodus · wijzigingen worden niet online opgeslagen"
                        : cloudStatus === "error"
                          ? cloudError || "Er ging iets mis."
                          : "Kies een project of sla het huidige project online op."}
              </small>
            </div>
          </div>

          <div className="cloud-project-actions">
            {(!cloudProject || cloudProject.canEdit) && (
              <button type="button" onClick={saveProjectOnline}>
                {cloudProject ? "Nu opslaan" : "Opslaan"}
              </button>
            )}
            <button type="button" className="cloud-button-muted" onClick={startNewProject}>
              Nieuw project
            </button>
            {cloudProject?.canEdit && (
              <button type="button" onClick={duplicateProject}>
                Dupliceren
              </button>
            )}
            {cloudProject?.viewToken && (
              <button type="button" onClick={() => copyProjectLink("view")}>
                Kopieer presentatielink
              </button>
            )}
            {cloudProject?.canEdit && cloudProject.editToken && (
              <button type="button" onClick={() => copyProjectLink("edit")}>
                Kopieer bewerklink
              </button>
            )}
            {cloudProject?.canEdit && (
              <button type="button" className="cloud-button-danger" onClick={deleteCurrentProject}>
                Verwijderen
              </button>
            )}
          </div>
        </section>

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
            numeric={false}
            onChange={(value) => updateField("projectName", value)}
          />
          <InputField
            label="Analyse-datum"
            type="date"
            value={form.analysisDate}
            onChange={(value) => updateField("analysisDate", value)}
          />
          <InputField
            label="Startdatum project"
            type="date"
            value={form.projectStartDate}
            onChange={(value) => updateField("projectStartDate", value)}
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
          <SelectField
            label="Oppervlakte & bouwkosten"
            value={form.buildInputMode}
            options={[
              { value: "simple", label: "Algemeen" },
              { value: "detailed", label: "Specificeren" },
            ]}
            onChange={(value) => updateBuildInputMode(value as BuildInputMode)}
          />
          {form.buildInputMode === "simple" && (
            <InputField
              label="Oppervlakte m²"
              value={form.surfaceM2}
              onChange={(value) => updateField("surfaceM2", value)}
            />
          )}
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

        {form.buildInputMode === "detailed" && (
          <InputGroup title="Oppervlakte, bouwkosten & verkoop">
            <div className="build-cost-editor field-full">
              <div className="build-cost-summary">
                <div>
                  <span>Totale oppervlakte</span>
                  <strong>{numberFormatter.format(data.surfaceM2)} m²</strong>
                </div>
                <div>
                  <span>Gem. bouwkosten / m²</span>
                  <strong>{euro(data.buildCostPerM2)}/m²</strong>
                </div>
                <div>
                  <span>Gem. verkoopprijs / m²</span>
                  <strong>{euro(data.averageSalePricePerM2)}/m²</strong>
                </div>
                <div>
                  <span>Totale verkoopprijs</span>
                  <strong>{euro(data.salePrice)}</strong>
                </div>
              </div>

              {form.buildLevels.map((level) => {
                const levelLines = form.buildAreas.filter(
                  (line) => line.level === level
                );
                const availableComponents = BUILD_COMPONENT_OPTIONS.filter(
                  (option) =>
                    !levelLines.some((line) => line.component === option.value)
                );

                return (
                  <section className="build-level-card" key={level}>
                    <div className="build-level-header">
                      <label className="build-level-name">
                        <span>Naam verdieping / gebouw</span>
                        <input
                          key={level}
                          type="text"
                          defaultValue={getBuildLevelLabel(level, "nl")}
                          autoComplete="off"
                          aria-label="Naam verdieping of gebouw"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") event.currentTarget.blur();
                          }}
                          onBlur={(event) => {
                            const nextName = event.currentTarget.value.trim();
                            const duplicate = form.buildLevels.some(
                              (item) =>
                                item !== level &&
                                getBuildLevelLabel(item, "nl").localeCompare(
                                  nextName,
                                  "nl",
                                  { sensitivity: "accent" }
                                ) === 0
                            );

                            if (!nextName || duplicate) {
                              event.currentTarget.value = getBuildLevelLabel(
                                level,
                                "nl"
                              );
                              return;
                            }

                            renameBuildLevel(level, nextName);
                          }}
                        />
                      </label>
                      {form.buildLevels.length > 1 && (
                        <button
                          type="button"
                          className="build-level-remove"
                          onClick={() => removeBuildLevel(level)}
                        >
                          Verwijderen
                        </button>
                      )}
                    </div>

                    {levelLines.length > 0 ? (
                      <div className="build-cost-table">
                        <div className="build-cost-table-head" aria-hidden="true">
                          <span>Onderdeel</span>
                          <span>Oppervlakte</span>
                          <span>Bouw / m²</span>
                          <span>Bouw totaal</span>
                          <span>Verkoop / m²</span>
                          <span>Verkoop totaal</span>
                        </div>

                        {levelLines.map((line) => {
                          const lineArea = Math.max(0, parseNumber(line.areaM2));
                          const lineTotal =
                            lineArea * Math.max(0, parseNumber(line.costPerM2));
                          const lineSaleTotal =
                            lineArea * Math.max(0, parseNumber(line.salePricePerM2));

                          return (
                            <div
                              className="build-cost-row"
                              key={`${line.level}-${line.component}`}
                            >
                              <div className="build-cost-name">
                                <strong>
                                  {getBuildComponentLabel(line.component, "nl")}
                                </strong>
                                <button
                                  type="button"
                                  className="build-component-remove"
                                  onClick={() =>
                                    removeBuildComponent(level, line.component)
                                  }
                                >
                                  Verwijderen
                                </button>
                              </div>

                              <label className="build-cost-input">
                                <span className="build-cost-mobile-label">Oppervlakte</span>
                                <div className="build-cost-input-suffix">
                                  <input
                                    value={line.areaM2}
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="0"
                                    aria-label={`${getBuildLevelLabel(level, "nl")} ${getBuildComponentLabel(line.component, "nl")} oppervlakte in m²`}
                                    onChange={(event) =>
                                      updateBuildArea(
                                        level,
                                        line.component,
                                        "areaM2",
                                        event.currentTarget.value
                                      )
                                    }
                                  />
                                  <span>m²</span>
                                </div>
                              </label>

                              <label className="build-cost-input">
                                <span className="build-cost-mobile-label">Kosten / m²</span>
                                <div className="build-cost-input-prefix">
                                  <span>€</span>
                                  <input
                                    value={formatAmountInput(line.costPerM2)}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder="0"
                                    aria-label={`${getBuildLevelLabel(level, "nl")} ${getBuildComponentLabel(line.component, "nl")} kosten per m²`}
                                    onChange={(event) =>
                                      updateBuildArea(
                                        level,
                                        line.component,
                                        "costPerM2",
                                        normalizeAmountInput(event.currentTarget.value)
                                      )
                                    }
                                  />
                                </div>
                              </label>

                              <strong className="build-cost-total">{euro(lineTotal)}</strong>

                              <label className="build-cost-input">
                                <span className="build-cost-mobile-label">Verkoop / m²</span>
                                <div className="build-cost-input-prefix">
                                  <span>€</span>
                                  <input
                                    value={line.salePricePerM2}
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="0"
                                    aria-label={`${getBuildLevelLabel(level, "nl")} ${getBuildComponentLabel(line.component, "nl")} verkoopprijs per m²`}
                                    onChange={(event) =>
                                      updateBuildArea(
                                        level,
                                        line.component,
                                        "salePricePerM2",
                                        event.currentTarget.value
                                      )
                                    }
                                  />
                                </div>
                              </label>

                              <strong className="build-cost-total build-sale-total">
                                {euro(lineSaleTotal)}
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="build-level-empty">
                        Nog geen onderdelen toegevoegd aan deze verdieping.
                      </div>
                    )}

                    <div className="build-component-add">
                      <div className="build-component-add-controls">
                        <label>
                          <span>Standaard onderdeel toevoegen</span>
                          <select
                            value=""
                            disabled={availableComponents.length === 0}
                            onChange={(event) => {
                              const component = event.currentTarget.value as BuildComponentType;
                              if (component) addBuildComponent(level, component);
                            }}
                          >
                            <option value="">
                              {availableComponents.length > 0
                                ? "Kies onderdeel…"
                                : "Alle standaard onderdelen toegevoegd"}
                            </option>
                            {availableComponents.map((option) => (
                              <option value={option.value} key={option.value}>
                                {option.labelNl}
                              </option>
                            ))}
                          </select>
                        </label>

                        <form
                          className="build-custom-component-add"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const formElement = event.currentTarget;
                            const formData = new FormData(formElement);
                            const customName = String(
                              formData.get("customBuildComponent") ?? ""
                            );
                            if (!customName.trim()) return;
                            addCustomBuildComponent(level, customName);
                            formElement.reset();
                          }}
                        >
                          <label>
                            <span>Eigen onderdeel toevoegen</span>
                            <div className="build-custom-component-row">
                              <input
                                name="customBuildComponent"
                                type="text"
                                autoComplete="off"
                                placeholder="Bijv. lift, gym, buitenkeuken…"
                                aria-label={`${getBuildLevelLabel(level, "nl")} eigen onderdeel toevoegen`}
                              />
                              <button type="submit">Toevoegen</button>
                            </div>
                          </label>
                        </form>
                      </div>
                      <p>
                        Kies een standaard onderdeel of vul zelf een nieuwe naam in.
                      </p>
                    </div>
                  </section>
                );
              })}

              <div className="build-level-add">
                <div className="build-level-add-controls">
                  <label>
                    <span>Standaard verdieping toevoegen</span>
                    <select
                      value=""
                      onChange={(event) => {
                        const level = event.currentTarget.value as BuildLevel;
                        if (level) addBuildLevel(level);
                      }}
                    >
                      <option value="">Kies verdieping…</option>
                      {BUILD_LEVEL_OPTIONS.filter(
                        (option) => !form.buildLevels.includes(option.value)
                      ).map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.labelNl}
                        </option>
                      ))}
                    </select>
                  </label>

                  <form
                    className="build-custom-level-add"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formElement = event.currentTarget;
                      const formData = new FormData(formElement);
                      const customName = String(
                        formData.get("customBuildLevel") ?? ""
                      );
                      if (!customName.trim()) return;
                      addCustomBuildLevel(customName);
                      formElement.reset();
                    }}
                  >
                    <label>
                      <span>Eigen naam toevoegen</span>
                      <div className="build-custom-level-row">
                        <input
                          name="customBuildLevel"
                          type="text"
                          autoComplete="off"
                          placeholder="Bijv. Villa 1, Villa 2, Guest House…"
                        />
                        <button type="submit">Toevoegen</button>
                      </div>
                    </label>
                  </form>
                </div>
                <p>Je kunt iedere verdieping of groep ook zelf een naam geven.</p>
              </div>
            </div>
          </InputGroup>
        )}

        {form.projectOwnership === "shared" && (
          <InputGroup title="Financiering gedeeld project">
            <RangeField
              label="Aantal mede-investeerders"
              value={form.coInvestorCount}
              min={1}
              max={MAX_CO_INVESTORS}
              singular="mede-investeerder"
              plural="mede-investeerders"
              onChange={updateCoInvestorCount}
            />

            <div className="investor-list field-full">
              {form.coInvestors.map((investor, investorIndex) => {
                const summary = data.coInvestorSummaries[investorIndex];
                return (
                  <section className="investor-card" key={`investor-${investorIndex}`}>
                    <div className="investor-card-top">
                      <div className="investor-card-heading">
                        <span className="investor-card-kicker">
                          Mede-investeerder {investorIndex + 1}
                        </span>
                        <h3>{investor.name.trim() || `Mede-investeerder ${investorIndex + 1}`}</h3>
                        <p>
                          Kies een vast investeringsbedrag of een percentage van het totale projectkapitaal. Het model rekent het andere automatisch uit en gebruikt daarna hetzelfde vaste aandeel bij iedere projectbetaling.
                        </p>
                      </div>

                      <div className="investor-card-stats" aria-label="Investeerderssamenvatting">
                        <div className="investor-stat">
                          <span>Investering</span>
                          <strong>{euro(summary?.usedCapital ?? 0)}</strong>
                        </div>
                        <div className="investor-stat investor-stat-accent">
                          <span>Percentage</span>
                          <strong>{percent(summary?.capitalShare ?? 0)}</strong>
                        </div>
                        <div className="investor-stat">
                          <span>Netto winst</span>
                          <strong>{signedEuro(summary?.netProfit ?? 0)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="investor-card-grid investor-card-grid-simple">
                      <InputField
                        label="Naam"
                        value={investor.name}
                        numeric={false}
                        onChange={(value) => updateCoInvestorName(investorIndex, value)}
                      />
                      <SelectField
                        label="Invoer op basis van"
                        value={investor.investmentInputMode}
                        options={[
                          { value: "amount", label: "Bedrag" },
                          { value: "percentage", label: "Percentage" },
                        ]}
                        onChange={(value) =>
                          updateInvestorInputMode(
                            investorIndex,
                            value as InvestorInputMode
                          )
                        }
                      />
                      {investor.investmentInputMode === "percentage" ? (
                        <InputField
                          label="Investeringspercentage %"
                          value={investor.investmentPercentage}
                          placeholder="Bijv. 50"
                          helper={
                            parsePercent(investor.investmentPercentage) > 0
                              ? `${percent(summary?.capitalShare ?? 0)} = ${euro(summary?.plannedCapital ?? 0)}`
                              : "Bijv. 50 voor 50% van het projectkapitaal"
                          }
                          onChange={(value) =>
                            updateInvestorPercentage(investorIndex, value)
                          }
                        />
                      ) : (
                        <InputField
                          label="Totaal investeringsbedrag"
                          value={investor.monthlyTotalAmount}
                          format="amount"
                          placeholder="Bijv. 500.000"
                          helper={
                            parseNumber(investor.monthlyTotalAmount) > 0
                              ? `${percent(summary?.capitalShare ?? 0)} van iedere projectbetaling`
                              : "Vul het totale investeringsbedrag in"
                          }
                          onChange={(value) =>
                            updateInvestorMonthlyTotal(investorIndex, value)
                          }
                        />
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            <p className="input-hint field-full">
              Iedere mede-investeerder kan worden ingevoerd als bedrag of percentage. Het uiteindelijke aandeel wordt bij elke projectbetaling toegepast; wij vullen automatisch het resterende bedrag aan. Winst en opbrengst worden per investeerder berekend over het daadwerkelijk gebruikte kapitaal.
            </p>
          </InputGroup>
        )}

        <InputGroup title="Aankoop">
          <InputField
            label="Aankoopprijs"
            value={form.purchasePrice}
            format="amount"
            onChange={(value) => updateField("purchasePrice", value)}
          />
          <SelectField
            label="BTW op aankoop?"
            value={form.purchaseVatEnabled}
            options={[
              { value: "no", label: "Nee" },
              { value: "yes", label: "Ja" },
            ]}
            onChange={(value) =>
              updateField("purchaseVatEnabled", value as PurchaseVatChoice)
            }
          />
          {form.purchaseVatEnabled === "yes" && (
            <InputField
              label="BTW %"
              value={form.purchaseVatPercentage}
              onChange={(value) => updateField("purchaseVatPercentage", value)}
            />
          )}
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
            format="amount"
            onChange={(value) => updateField("notaryFee", value)}
          />
          <InputField
            label="Overige aankoopkosten"
            value={form.otherAcquisitionCosts}
            format="amount"
            onChange={(value) =>
              updateField("otherAcquisitionCosts", value)
            }
          />
        </InputGroup>

        <InputGroup title="Bouw, meubels en verkoop">
          {form.buildInputMode === "simple" && (
            <InputField
              label="Bouwkosten per m²"
              value={form.buildCostPerM2}
              format="amount"
              onChange={(value) => updateField("buildCostPerM2", value)}
            />
          )}
          <InputField
            label="Onvoorzien %"
            value={form.contingencyPercentage}
            onChange={(value) =>
              updateField("contingencyPercentage", value)
            }
          />
          <InputField
            label="Built-in furniture"
            value={form.fixedInterior}
            format="amount"
            onChange={(value) => updateField("fixedInterior", value)}
          />
          <InputField
            label="Furniture"
            value={form.looseFurniture}
            format="amount"
            onChange={(value) => updateField("looseFurniture", value)}
          />
          <RangeField
            label="Meubelopslag over Furniture"
            value={form.furnitureMarkupPercentage}
            min={0}
            max={100}
            singular="%"
            plural="%"
            onChange={(value) =>
              updateField("furnitureMarkupPercentage", value)
            }
          />
          <DetailedSelectField
            label="Built-in furniture betalen over"
            value={furniturePaymentMonthsValue}
            options={furniturePaymentOptions}
            onChange={(value) =>
              updateField("furniturePaymentMonths", value)
            }
          />
          <DetailedSelectField
            label="Furniture betalen over"
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
          {form.buildInputMode === "simple" && (
            <InputField
              label="Verkoopprijs"
              value={form.salePrice}
              format="amount"
              onChange={(value) => updateField("salePrice", value)}
            />
          )}
          <InputField
            label="Makelaarscommissie %"
            value={form.agentCommissionPercentage}
            onChange={(value) =>
              updateField("agentCommissionPercentage", value)
            }
          />
          <InputField
            label="Advocaatkosten verkoop %"
            value={form.saleLawyerFeePercentage}
            onChange={(value) =>
              updateField("saleLawyerFeePercentage", value)
            }
          />
          <SelectField
            label="Belasting over winst?"
            value={form.profitTaxEnabled}
            options={[
              { value: "no", label: "Nee" },
              { value: "yes", label: "Ja" },
            ]}
            onChange={(value) =>
              updateField("profitTaxEnabled", value as ProfitTaxChoice)
            }
          />
          {form.profitTaxEnabled === "yes" && (
            <InputField
              label="Belasting %"
              value={form.profitTaxPercentage}
              onChange={(value) =>
                updateField("profitTaxPercentage", value)
              }
            />
          )}
        </InputGroup>

        <InputGroup title="Bankfinanciering">
          <SelectField
            label="Financiering via bank"
            value={form.bankFinancingEnabled}
            options={[
              { value: "no", label: "Nee" },
              { value: "yes", label: "Ja" },
            ]}
            onChange={(value) =>
              updateField("bankFinancingEnabled", value as BankFinancingChoice)
            }
          />

          {form.bankFinancingEnabled === "yes" && (
            <>
              <SelectField
                label="Uitbetalingsschema"
                value={form.bankDrawScheduleMode}
                options={[
                  {
                    value: "standard",
                    label: "Standaard uitbetaling · gelijk verdeeld",
                  },
                  {
                    value: "custom",
                    label: "Geen standaard uitbetaling · zelf per maand",
                  },
                ]}
                onChange={(value) =>
                  updateField("bankDrawScheduleMode", value as BankScheduleMode)
                }
              />

              {form.bankDrawScheduleMode === "standard" && (
                <InputField
                  label="Totaal financieringsbedrag"
                  value={form.bankFinancingAmount}
                  format="amount"
                  placeholder="Bijv. 750.000"
                  onChange={(value) => updateField("bankFinancingAmount", value)}
                />
              )}

              <InputField
                label={
                  form.bankDrawScheduleMode === "custom"
                    ? "Aantal uitbetalingen"
                    : "Aantal uitbetalingstermijnen"
                }
                value={form.bankFinancingTranches}
                placeholder="Bijv. 3"
                onChange={updateBankFinancingTranches}
              />

              <section className="bank-draw-schedule field-full">
                <div className="bank-draw-schedule-heading">
                  <h3>Wanneer komen de bankfinancieringen?</h3>
                  <p>
                    {form.bankDrawScheduleMode === "standard"
                      ? "Vul voor iedere termijn de projectmaand in. Het totale financieringsbedrag wordt gelijk over deze termijnen verdeeld."
                      : "Vul per uitbetaling zelf de projectmaand en het bedrag in. Deze bedragen worden exact als inflow in de cashflow verwerkt."}
                  </p>
                </div>
                <div
                  className={`bank-payment-list ${
                    form.bankDrawScheduleMode === "standard"
                      ? "bank-payment-list-standard"
                      : "bank-payment-list-custom"
                  }`}
                >
                  {form.bankFinancingDrawMonths
                    .slice(
                      0,
                      clampInteger(
                        parseNumber(form.bankFinancingTranches),
                        1,
                        24
                      )
                    )
                    .map((month, index) => (
                      <section
                        className="bank-payment-row"
                        key={`bank-draw-month-${index}`}
                      >
                        <InputField
                          label={
                            form.bankDrawScheduleMode === "standard"
                              ? `Termijn ${index + 1}`
                              : `Uitbetaling ${index + 1} · projectmaand`
                          }
                          value={month}
                          placeholder={`Bijv. ${index + 1}`}
                          helper={
                            month.trim()
                              ? `Datum · ${formatShortDate(
                                  addMonthsToDate(
                                    form.projectStartDate,
                                    parseNumber(month)
                                  )
                                )}`
                              : "Datum volgt na invoer"
                          }
                          onChange={(value) =>
                            updateBankFinancingDrawMonth(index, value)
                          }
                        />
                        {form.bankDrawScheduleMode === "custom" && (
                          <InputField
                            label={`Uitbetaling ${index + 1} · bedrag`}
                            value={form.bankFinancingDrawAmounts[index] ?? ""}
                            format="amount"
                            placeholder="Bijv. 100.000"
                            onChange={(value) =>
                              updateBankFinancingDrawAmount(index, value)
                            }
                          />
                        )}
                      </section>
                    ))}
                </div>
                {form.bankDrawScheduleMode === "custom" && (
                  <p className="bank-schedule-total">
                    Totaal ingepland: {euro(
                      form.bankFinancingDrawAmounts
                        .slice(
                          0,
                          clampInteger(
                            parseNumber(form.bankFinancingTranches),
                            1,
                            24
                          )
                        )
                        .reduce(
                          (sum, amount) => sum + Math.max(0, parseNumber(amount)),
                          0
                        )
                    )}
                  </p>
                )}
              </section>

              <InputField
                label="Rente per jaar %"
                value={form.bankInterestPercentage}
                placeholder="Bijv. 5,5"
                onChange={(value) =>
                  updateField("bankInterestPercentage", value)
                }
              />

              <SelectField
                label="Aflossingsschema"
                value={form.bankRepaymentScheduleMode}
                options={[
                  {
                    value: "standard",
                    label: "Standaard aflossing · vast bedrag",
                  },
                  {
                    value: "custom",
                    label: "Geen standaard aflossing · zelf per maand",
                  },
                ]}
                onChange={(value) =>
                  updateField(
                    "bankRepaymentScheduleMode",
                    value as BankScheduleMode
                  )
                }
              />

              {form.bankRepaymentScheduleMode === "standard" ? (
                <>
                  <InputField
                    label="Aflossing per termijn"
                    value={form.bankRepaymentAmount}
                    format="amount"
                    placeholder="Bijv. 25.000"
                    onChange={(value) =>
                      updateField("bankRepaymentAmount", value)
                    }
                  />
                  <SelectField
                    label="Aflossingsfrequentie"
                    value={form.bankRepaymentFrequency}
                    options={[
                      { value: "monthly", label: "Per maand" },
                      { value: "yearly", label: "Per jaar" },
                    ]}
                    onChange={(value) =>
                      updateField(
                        "bankRepaymentFrequency",
                        value as BankRepaymentFrequency
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <InputField
                    label="Aantal aflossingen"
                    value={form.bankRepaymentCount}
                    placeholder="Bijv. 6"
                    onChange={updateBankRepaymentCount}
                  />
                  <section className="bank-draw-schedule field-full">
                    <div className="bank-draw-schedule-heading">
                      <h3>Wanneer en hoeveel wordt afgelost?</h3>
                      <p>
                        Vul per aflossing zelf de projectmaand en het bedrag in.
                        Iedere aflossing verschijnt exact als outflow in de cashflow.
                      </p>
                    </div>
                    <div className="bank-payment-list">
                      {form.bankRepaymentSchedule
                        .slice(
                          0,
                          clampInteger(
                            parseNumber(form.bankRepaymentCount),
                            1,
                            36
                          )
                        )
                        .map((payment, index) => (
                          <section
                            className="bank-payment-row"
                            key={`bank-repayment-${index}`}
                          >
                            <InputField
                              label={`Aflossing ${index + 1} · projectmaand`}
                              value={payment.month}
                              placeholder={`Bijv. ${index + 2}`}
                              helper={
                                payment.month.trim()
                                  ? `Datum · ${formatShortDate(
                                      addMonthsToDate(
                                        form.projectStartDate,
                                        parseNumber(payment.month)
                                      )
                                    )}`
                                  : "Datum volgt na invoer"
                              }
                              onChange={(value) =>
                                updateBankRepaymentSchedule(
                                  index,
                                  "month",
                                  value
                                )
                              }
                            />
                            <InputField
                              label={`Aflossing ${index + 1} · bedrag`}
                              value={payment.amount}
                              format="amount"
                              placeholder="Bijv. 25.000"
                              onChange={(value) =>
                                updateBankRepaymentSchedule(
                                  index,
                                  "amount",
                                  value
                                )
                              }
                            />
                          </section>
                        ))}
                    </div>
                    <p className="bank-schedule-total">
                      Totaal ingepland: {euro(
                        form.bankRepaymentSchedule
                          .slice(
                            0,
                            clampInteger(
                              parseNumber(form.bankRepaymentCount),
                              1,
                              36
                            )
                          )
                          .reduce(
                            (sum, payment) =>
                              sum + Math.max(0, parseNumber(payment.amount)),
                            0
                          )
                      )}
                    </p>
                  </section>
                </>
              )}

              <p className="input-hint field-full">
                Bij een standaardschema worden uitbetalingen gelijk verdeeld en
                aflossingen volgens de gekozen maand- of jaarfrequentie verwerkt.
                Kies je geen standaardschema, dan worden de door jou ingevulde
                maandbedragen exact gebruikt. Rente wordt maandelijks opgebouwd
                over het openstaande saldo en iedere 12 maanden vanaf de eerste
                bankopname betaald. Bij verkoop worden resterende rente en
                hoofdsom volledig afgerekend.
              </p>
            </>
          )}
        </InputGroup>

        <InputGroup title="Betalingsplanning">
          <RangeField
            label="Aantal downpayments"
            value={form.downpaymentCount}
            min={0}
            max={10}
            singular="downpayment"
            plural="downpayments"
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
                      placeholder="Bijv. 0"
                      helper={payment.month.trim()
                        ? `Datum · ${formatShortDate(
                            addMonthsToDate(
                              form.projectStartDate,
                              parseNumber(payment.month)
                            )
                          )}`
                        : "Datum volgt na invoer"}
                      onChange={(value) =>
                        updateDownpayment(index, "month", value)
                      }
                    />
                    <InputField
                      label="Bedrag"
                      value={payment.amount}
                      format="amount"
                      placeholder="Bijv. 100.000"
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
            helper={form.closingMonth.trim()
              ? `Datum · ${formatShortDate(
                  addMonthsToDate(
                    form.projectStartDate,
                    parseNumber(form.closingMonth)
                  )
                )}`
              : "Datum volgt na invoer"}
            onChange={(value) => updateField("closingMonth", value)}
          />
          <InputField
            label="Start bouwbetalingen"
            value={form.constructionStartMonth}
            helper={form.constructionStartMonth.trim()
              ? `Datum · ${formatShortDate(
                  addMonthsToDate(
                    form.projectStartDate,
                    parseNumber(form.constructionStartMonth)
                  )
                )}`
              : "Datum volgt na invoer"}
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
        <SectionHeading
          number="01"
          eyebrow="Overview"
          title="Deal Metrics"
          subtitle="Headline return metrics, cost structure, and exit timeline."
        />

        <div className="metric-grid">
          <Metric
            label={
              data.profitTaxEnabled
                ? "Net Profit after Tax"
                : "Net Profit before Tax"
            }
            value={signedEuro(data.netProfit)}
            positive={data.netProfit >= 0}
          />
          <Metric
            label={data.profitTaxEnabled ? "ROI after Tax" : "ROI before Tax"}
            value={percent(data.roi, true)}
            positive={data.roi >= 0}
          />
          <Metric
            label={
              data.profitTaxEnabled
                ? `IRR after Tax (${data.durationMonths}M EXIT)`
                : `IRR before Tax (${data.durationMonths}M EXIT)`
            }
            value={percent(data.irr, true)}
            positive={data.irr >= 0}
          />
          <Metric label="Capital Deployed" value={euro(data.capitalDeployed)} />
        </div>

        <div className="two-column">
          <DataBlock title="Acquisition">
            <DataRow label="Purchase Price" value={euro(data.purchasePrice)} />
            {data.purchaseVatEnabled && (
              <DataRow
                label={`VAT (${percent(data.purchaseVatPercentage)})`}
                value={euro(data.purchaseVat)}
              />
            )}
            <DataRow label={`Transfer Tax (${percent(data.transferTaxPercentage)})`} value={euro(data.transferTax)} />
            <DataRow label={`Lawyer Fee (${percent(data.lawyerFeePercentage)})`} value={euro(data.lawyerFee)} />
            <DataRow label="Notary Fee" value={euro(data.notaryFee)} />
            <DataRow label="Other Acquisition Costs" value={euro(data.otherAcquisitionCosts)} />
            <DataRow label="Total Acquisition" value={euro(data.totalAcquisition)} strong />
          </DataBlock>

          <DataBlock title="Project">
            <DataRow
              label="Type"
              value={
                data.buildInputMode === "simple"
                  ? `${data.projectType} – ${euro(data.buildCostPerM2)}/m²`
                  : data.projectType
              }
              strong
            />
            <DataRow
              label={data.buildInputMode === "detailed" ? "Total Surface" : "Surface"}
              value={`${numberFormatter.format(data.surfaceM2)} m²`}
              strong
            />
            {data.buildInputMode === "detailed" && (
              <>
                <DataRow
                  label="Average Build Cost / m²"
                  value={`${euro(data.buildCostPerM2)}/m²`}
                  strong
                />
                <DataRow
                  label="Average Sale Price / m²"
                  value={`${euro(data.averageSalePricePerM2)}/m²`}
                  strong
                />
              </>
            )}
            <DataRow label="Plot" value={`${numberFormatter.format(data.plotM2)} m²`} strong />
            <DataRow label="Duration" value={`${data.durationMonths} months`} strong />
            <DataRow label="Base Build Cost" value={euro(data.baseBuildCost)} strong />
            <DataRow label={`Contingency (${percent(data.contingencyPercentage)})`} value={euro(data.contingency)} />
            {data.fixedInterior > 0 && (
              <DataRow label="Built-in Furniture" value={euro(data.fixedInterior)} />
            )}
            {(data.looseFurniture > 0 || data.projectManagement > 0) && (
              <DataRow label="Subtotal" value={euro(data.projectSubtotal)} strong />
            )}
            {data.looseFurniture > 0 && (
              <DataRow label="Furniture" value={euro(data.looseFurniture)} />
            )}
            {data.isSharedProject && data.projectManagement > 0 && (
              <DataRow
                label={`Project Management (${percent(data.projectManagementPercentage)})`}
                value={euro(data.projectManagement)}
              />
            )}
            <DataRow label="Total Project Cost" value={euro(data.totalProjectCost)} strong />
          </DataBlock>
        </div>

        <DataBlock title="Exit & Returns" full>
          <DataRow label="Gross Sale Price" value={euro(data.salePrice)} strong />
          <DataRow label={`Agent Commission (${percent(data.agentCommissionPercentage)})`} value={euro(data.agentCommission)} />
          <DataRow
            label={`Lawyer Fee on Sale (${percent(data.saleLawyerFeePercentage)})`}
            value={euro(data.saleLawyerFee)}
          />
          {data.looseFurniture > 0 && (
            <DataRow
              label={`Furniture + Mark-up – added to proceeds (${percent(data.furnitureMarkupPercentage)})`}
              value={`+${euro(data.furnitureSaleProceeds)}`}
            />
          )}
          <DataRow
            label={data.bankFinancingEnabled ? "Net Proceeds before Bank" : "Net Proceeds"}
            value={euro(data.netProceeds)}
            strong={!data.bankFinancingEnabled}
          />
          {data.bankFinancingEnabled && (
            <>
              <DataRow label="Bank financing adjustment at exit" value={`-${euro(data.bankExitAdjustment)}`} />
              <DataRow
                label={data.profitTaxEnabled ? "Net Proceeds to Equity after Tax" : "Net Proceeds to Equity before Tax"}
                value={euro(data.distributableNetProceeds)}
                strong
              />
              <DataRow label="Total Bank Interest" value={`-${euro(data.totalBankInterest)}`} />
            </>
          )}
          <DataRow
            label="Net Profit before Tax / (Loss)"
            value={signedEuro(data.netProfitBeforeTax)}
            strong={!data.profitTaxEnabled}
            positive={data.netProfitBeforeTax >= 0}
          />
          {data.profitTaxEnabled && (
            <>
              <DataRow
                label={`Tax (${percent(data.profitTaxPercentage)})`}
                value={`-${euro(data.profitTaxAmount)}`}
              />
              <DataRow
                label="Net Profit after Tax / (Loss)"
                value={signedEuro(data.netProfitAfterTax)}
                strong
                positive={data.netProfitAfterTax >= 0}
              />
            </>
          )}
        </DataBlock>

        <AllocationBar
          salePrice={data.salePrice + data.furnitureSaleProceeds}
          acquisition={data.totalAcquisition}
          project={data.totalProjectCost}
          commission={data.agentCommission}
          legalCosts={data.saleLawyerFee}
          tax={data.profitTaxEnabled ? data.profitTaxAmount : 0}
          profit={data.netProfit}
          profitAfterTax={data.profitTaxEnabled}
        />
        <PageFooter label={config.footerLabel} page={`1 / ${totalPages}`} />
      </section>

      {data.isSharedProject && (
        <section className="report-page shared-financing-page screen-only">
          <SectionHeading
            number="02"
            eyebrow="Shared financing"
            title="Investment & Return Split"
            subtitle="Allocation of investment, proceeds and returns for us and each individual co-investor."
          />

          <div className="metric-grid shared-metrics">
            <Metric
              label="Our equity share"
              value={percent(data.ourEquityPercentage)}
              sub={euro(data.ourInvestment)}
            />
            <Metric
              label="Total co-investors share"
              value={percent(data.partnerEquityPercentage)}
              sub={euro(data.partnerInvestment)}
            />
            <Metric
              label="Our net profit before tax"
              value={signedEuro(data.ourNetProfit)}
              positive={data.ourNetProfit >= 0}
            />
            <Metric
              label="Total co-investors net profit before tax"
              value={signedEuro(data.partnerNetProfit)}
              positive={data.partnerNetProfit >= 0}
            />
          </div>

          <TableTitle>Costs and proceeds allocation</TableTitle>
          {renderParticipantSplitTable(investorEntries)}

          <p className="note">
            <strong>Assumption:</strong> every mede-investeerder participates in each project payment using a fixed capital share. Profit and proceeds are allocated per participant over capital actually used.
          </p>

          <PageFooter
            label={config.footerLabel}
            page={`${sharedFinancingPageNumber} / ${totalPages}`}
          />
        </section>
      )}

      {data.isSharedProject &&
        investorPrintPages.map((tableGroups, pageIndex) => {
          const flatEntries = tableGroups.flat();
          const firstInvestorNumber =
            investorEntries.findIndex(
              (entry) => entry.investorIndex === flatEntries[0]?.investorIndex
            ) + 1;
          const lastInvestorNumber =
            investorEntries.findIndex(
              (entry) =>
                entry.investorIndex ===
                flatEntries[flatEntries.length - 1]?.investorIndex
            ) + 1;

          return (
            <section
              className="report-page shared-financing-page print-only"
              key={`shared-financing-print-${pageIndex}`}
            >
              <SectionHeading
                number="02"
                eyebrow="Shared financing"
                title={
                  pageIndex === 0
                    ? "Investment & Return Split"
                    : "Investment & Return Split — Continued"
                }
                subtitle={`Mede-investeerders ${firstInvestorNumber}–${lastInvestorNumber} van ${investorEntries.length} · twee investeerders per tabel.`}
              />

              <div className="metric-grid shared-metrics">
                <Metric
                  label="Our equity share"
                  value={percent(data.ourEquityPercentage)}
                  sub={euro(data.ourInvestment)}
                />
                <Metric
                  label="Total co-investors share"
                  value={percent(data.partnerEquityPercentage)}
                  sub={euro(data.partnerInvestment)}
                />
                <Metric
                  label="Our net profit before tax"
                  value={signedEuro(data.ourNetProfit)}
                  positive={data.ourNetProfit >= 0}
                />
                <Metric
                  label="Total co-investors net profit before tax"
                  value={signedEuro(data.partnerNetProfit)}
                  positive={data.partnerNetProfit >= 0}
                />
              </div>

              <div className="participant-print-page-grid">
                {tableGroups.map((entries, tableIndex) => {
                  const tableFirstInvestor =
                    investorEntries.findIndex(
                      (entry) => entry.investorIndex === entries[0]?.investorIndex
                    ) + 1;
                  const tableLastInvestor =
                    investorEntries.findIndex(
                      (entry) =>
                        entry.investorIndex ===
                        entries[entries.length - 1]?.investorIndex
                    ) + 1;

                  return (
                    <section
                      className="participant-print-group"
                      key={`participant-print-table-${pageIndex}-${tableIndex}`}
                    >
                      <TableTitle>
                        {entries.length === 1
                          ? `Mede-investeerder ${tableFirstInvestor}`
                          : `Mede-investeerders ${tableFirstInvestor}–${tableLastInvestor}`}
                      </TableTitle>
                      {renderParticipantSplitTable(entries, true)}
                    </section>
                  );
                })}
              </div>

              <p className="note participant-print-note">
                <strong>Assumption:</strong> every mede-investeerder participates in each project payment using a fixed capital share. Profit and proceeds are allocated per participant over capital actually used.
              </p>

              <PageFooter
                label={config.footerLabel}
                page={`${sharedFinancingPageNumber + pageIndex} / ${totalPages}`}
              />
            </section>
          );
        })}

      {hasBuildSpecification &&
        buildSpecificationPages.map((pageGroups, pageIndex) => {
          const isFirstPage = pageIndex === 0;
          const isLastPage =
            pageIndex === buildSpecificationPages.length - 1;

          return (
            <section
              className={`report-page build-spec-page${
                isFirstPage ? "" : " build-spec-continuation-page"
              }`}
              key={`build-spec-page-${pageIndex}`}
            >
              <SectionHeading
                number={buildSpecificationSectionNumber}
                eyebrow="Project specification"
                title={
                  isFirstPage
                    ? "Surface, Build Cost & Sale Price Breakdown"
                    : "Surface, Build Cost & Sale Price Breakdown — Continued"
                }
                subtitle={
                  buildSpecificationPages.length > 1
                    ? `Specification page ${pageIndex + 1} of ${buildSpecificationPages.length} · detailed overview per project component.`
                    : "Detailed overview of surface, build cost and expected sale price per project component."
                }
              />

              {isFirstPage && (
                <div className="metric-grid compact-metrics build-spec-metrics">
                  <Metric
                    label="Total Surface"
                    value={`${numberFormatter.format(data.surfaceM2)} m²`}
                    sub="All specified project components"
                  />
                  <Metric
                    label="Average Build Cost / m²"
                    value={`${euro(data.buildCostPerM2)}/m²`}
                    sub="Weighted average over total surface"
                  />
                  <Metric
                    label="Average Sale Price / m²"
                    value={`${euro(data.averageSalePricePerM2)}/m²`}
                    sub="Weighted average over total surface"
                  />
                  <Metric
                    label="Gross Sale Price"
                    value={euro(data.salePrice)}
                    sub="Specified property sale price"
                  />
                </div>
              )}

              <TableTitle>
                {isFirstPage
                  ? "Surface, build cost & sale price specification"
                  : "Specification — continued"}
              </TableTitle>
              <div className="table-scroll">
                <table className="build-spec-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Surface</th>
                      <th>Build / m²</th>
                      <th>Build total</th>
                      <th>Sale / m²</th>
                      <th>Sale total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageGroups.flatMap((group) => [
                      <tr
                        className="build-spec-floor-heading"
                        key={`floor-${group.level}-${pageIndex}-${
                          group.continued ? "continued" : "start"
                        }`}
                      >
                        <td colSpan={6}>
                          <div className="build-spec-floor-heading-content">
                            <strong>
                              {group.label}
                              {group.continued ? " — continued" : ""}
                            </strong>
                            <span>
                              {numberFormatter.format(group.levelSurface)} m² · Build {euro(group.levelCost)} · Sale {euro(group.levelSalePrice)}
                            </span>
                          </div>
                        </td>
                      </tr>,
                      ...group.rows.map((line, rowIndex) => (
                        <tr
                          key={`${line.level}-${line.component}-${pageIndex}-${rowIndex}`}
                          className="build-spec-component-row"
                        >
                          <td className="build-spec-component">
                            {getBuildComponentLabel(line.component, "en")}
                          </td>
                          <td className="build-spec-number">
                            {numberFormatter.format(line.areaM2)} m²
                          </td>
                          <td className="build-spec-number">
                            {euro(line.costPerM2)}/m²
                          </td>
                          <td className="build-spec-number">
                            <strong>{euro(line.totalCost)}</strong>
                          </td>
                          <td className="build-spec-number">
                            {euro(line.salePricePerM2)}/m²
                          </td>
                          <td className="build-spec-number">
                            <strong>{euro(line.saleTotal)}</strong>
                          </td>
                        </tr>
                      )),
                    ])}
                  </tbody>
                  {isLastPage && (
                    <tfoot>
                      <tr>
                        <td>Total</td>
                        <td>{numberFormatter.format(data.surfaceM2)} m²</td>
                        <td>{euro(data.buildCostPerM2)}/m² avg.</td>
                        <td>{euro(data.baseBuildCost)}</td>
                        <td>{euro(data.averageSalePricePerM2)}/m² avg.</td>
                        <td>{euro(data.salePrice)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {isLastPage && (
                <p className="note build-spec-note">
                  <strong>Weighted averages:</strong> Average Build Cost / m² and Average Sale Price / m² are calculated from their respective totals divided by Total Surface.
                </p>
              )}

              <PageFooter
                label={config.footerLabel}
                page={`${buildSpecificationPageNumber + pageIndex} / ${totalPages}`}
              />
            </section>
          );
        })}

      <section className="report-page">
        <SectionHeading number={exitSectionNumber} eyebrow="Exit analysis" title="Returns by Exit Timeline" subtitle="Returns under different exit scenarios." />
        <TableTitle>Returns by exit timeline</TableTitle>
        <table>
          <thead>
            <tr>
              <th>Exit</th>
              <th>Datum</th>
              <th>{data.profitTaxEnabled ? "Net Profit after Tax" : "Net Profit before Tax"}</th>
              <th>{data.profitTaxEnabled ? "ROI after Tax" : "ROI before Tax"}</th>
              <th>{data.profitTaxEnabled ? "IRR after Tax (Ann.)" : "IRR before Tax (Ann.)"}</th>
            </tr>
          </thead>
          <tbody>
            {data.exitScenarios.map((row) => (
              <tr key={row.month}>
                <td><strong>{row.month} months</strong></td>
                <td>{formatShortDate(row.date)}</td>
                <td className={row.netProfit >= 0 ? "positive" : "negative"}>{signedEuro(row.netProfit)}</td>
                <td className={row.roi >= 0 ? "positive" : "negative"}>{percent(row.roi, true)}</td>
                <td className={row.irr >= 0 ? "positive" : "negative"}>{percent(row.irr, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note"><strong>Note:</strong> IRR is calculated on the actual equity cashflows {data.profitTaxEnabled ? "after profit tax" : "before profit tax"}. Earlier exit scenarios keep the same planned project costs, move payments scheduled after exit to the selected exit month, and exclude bank tranches that would only be received after that exit.</p>
        <PageFooter label={config.footerLabel} page={`${exitPageNumber} / ${totalPages}`} />
      </section>

      <section className="report-page cash-page cash-overview-page">
        <SectionHeading
          number={cashSectionNumber}
          eyebrow="Cash plan"
          title="Capital Deployment Schedule"
          subtitle={`Start ${formatShortDate(data.projectStartDate)} · ${data.cashflow.length} tranches · exit ${formatShortDate(addMonthsToDate(data.projectStartDate, data.durationMonths))}`}
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
            sub={`Purchase, tax and fees only · ${formatShortDate(
              addMonthsToDate(data.projectStartDate, data.closingMonth)
            )}`}
          />
          <Metric
            label={data.bankFinancingEnabled ? "Peak Equity Need" : "Peak Deployed"}
            value={euro(data.peakDeployed)}
            sub={`Before exit · ${formatShortDate(addMonthsToDate(data.projectStartDate, data.durationMonths))}`}
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
                <td><strong>Total project capital</strong></td>
                <td>{euro(data.capitalDeployed)}</td>
              </tr>
              {data.bankFinancingEnabled && (
                <>
                  <tr>
                    <td><strong>Bank financing received</strong></td>
                    <td className="positive">{euro(data.bankFinancingDrawn)}</td>
                  </tr>
                  <tr>
                    <td><strong>Bank interest</strong></td>
                    <td className="negative">-{euro(data.totalBankInterest)}</td>
                  </tr>
                  <tr>
                    <td><strong>Equity capital used</strong></td>
                    <td>{euro(data.equityCapitalDeployed)}</td>
                  </tr>
                </>
              )}
              <tr className="sale-row">
                <td><strong>{
                  data.bankFinancingEnabled
                    ? data.profitTaxEnabled
                      ? "Net proceeds to equity after tax"
                      : "Net proceeds to equity before tax"
                    : data.profitTaxEnabled
                      ? "Net sale proceeds before profit tax"
                      : "Net sale proceeds"
                }</strong></td>
                <td className="positive">{euro(
                  data.bankFinancingEnabled
                    ? data.distributableNetProceeds
                    : data.netProceeds
                )}</td>
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
            className={`report-page cash-page cash-detail-page${data.isSharedProject ? " screen-only" : ""}`}
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
                  ? `Tranches ${firstRowNumber}–${lastRowNumber} of ${data.cashflow.length} · investment split per participant`
                  : `Tranches ${firstRowNumber}–${lastRowNumber} of ${data.cashflow.length}`
              }
            />

            {data.isSharedProject ? (
              renderCashflowTable(rows, investorEntries)
            ) : (
            <section className="cash-table-card">
              <TableTitle>Cash flow detail</TableTitle>
              <div className="table-scroll">
                <table
                  className={
                    data.isSharedProject ? "shared-cashflow-table" : undefined
                  }
                  style={
                    data.isSharedProject
                      ? {
                          minWidth: `${Math.max(
                            980,
                            650 + data.coInvestorSummaries.length * 105
                          )}px`,
                        }
                      : undefined
                  }
                >
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Outflow</th>
                            {data.isSharedProject && (
                        <>
                          <th>Our investment</th>
                          {data.coInvestorSummaries.map((summary, investorIndex) => (
                            <th key={`cashflow-head-${investorIndex}`}>{summary.name}</th>
                          ))}
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
                        className={
                          row.category === "sale"
                            ? "sale-row"
                            : row.category === "financing"
                              ? "financing-row"
                              : undefined
                        }
                      >
                        <td>{row.month}</td>
                        <td>{formatShortDate(row.date)}</td>
                        <td><strong>{row.event}</strong></td>
                        <td className="negative">
                          {row.outflow ? `-${euro(row.outflow)}` : "—"}
                        </td>
                        {data.isSharedProject && (
                          <>
                            <td className="negative party-investment-cell">
                              {row.ourInvestment ? `-${euro(row.ourInvestment)}` : "—"}
                            </td>
                            {data.coInvestorSummaries.map((summary, investorIndex) => {
                              const amount = row.coInvestorInvestments[investorIndex] ?? 0;
                              return (
                                <td
                                  className="negative party-investment-cell"
                                  key={`cashflow-investor-${investorIndex}`}
                                >
                                  {amount ? `-${euro(amount)}` : "—"}
                                </td>
                              );
                            })}
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
            )}

            <PageFooter
              label={config.footerLabel}
              page={`${pageNumber} / ${totalPages}`}
            />
          </section>
        );
      })}

      {data.isSharedProject &&
        investorPrintGroups.flatMap((entries, groupIndex) =>
          cashflowPages.map((rows, pageIndex) => {
            const pageNumber =
              cashDetailStartPageNumber +
              groupIndex * cashflowPageCount +
              pageIndex;
            const firstRowNumber = pageIndex * cashflowRowsPerPage + 1;
            const lastRowNumber = firstRowNumber + rows.length - 1;
            const firstInvestorNumber =
              groupIndex * investorColumnsPerTable + 1;
            const lastInvestorNumber =
              firstInvestorNumber + entries.length - 1;

            return (
              <section
                className="report-page cash-page cash-detail-page print-only"
                key={`cashflow-print-${groupIndex}-${pageIndex}`}
              >
                <SectionHeading
                  number={cashSectionNumber}
                  eyebrow="Cash detail"
                  title={
                    pageIndex === 0 && groupIndex === 0
                      ? "Cash Flow Detail"
                      : "Cash Flow Detail — Continued"
                  }
                  subtitle={`Tranches ${firstRowNumber}–${lastRowNumber} van ${data.cashflow.length} · mede-investeerders ${firstInvestorNumber}–${lastInvestorNumber} van ${investorEntries.length}`}
                />

                {renderCashflowTable(rows, entries, true)}

                <PageFooter
                  label={config.footerLabel}
                  page={`${pageNumber} / ${totalPages}`}
                />
              </section>
            );
          })
        )}

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
            taxEnabled={data.profitTaxEnabled}
          />
        </section>

        <section className="sensitivity-block">
          <TableTitle>Project cost sensitivity</TableTitle>
          <SensitivityTable
            rows={data.projectCostSensitivity}
            valueKey="projectCost"
            valueLabel="Project Cost"
            taxEnabled={data.profitTaxEnabled}
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
  numeric = true,
  placeholder,
  format = "plain",
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
  numeric?: boolean;
  placeholder?: string;
  format?: "plain" | "amount";
  helper?: string;
}) {
  const shownValue = format === "amount" ? formatAmountInput(value) : value;
  const [draftValue, setDraftValue] = useState(shownValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraftValue(format === "amount" ? formatAmountInput(value) : value);
    }
  }, [value, isFocused, format]);

  const input = (
    <input
      value={draftValue}
      type={type}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      inputMode={
        type === "text"
          ? format === "amount"
            ? "numeric"
            : numeric
              ? "decimal"
              : "text"
          : undefined
      }
      onFocus={() => setIsFocused(true)}
      onBlur={(event) => {
        setIsFocused(false);
        const nextValue =
          format === "amount"
            ? normalizeAmountInput(event.currentTarget.value)
            : event.currentTarget.value;
        setDraftValue(
          format === "amount" ? formatAmountInput(nextValue) : nextValue
        );
        if (nextValue !== value) {
          onChange(nextValue);
        }
      }}
      onChange={(event) => {
        if (format !== "amount") {
          const nextValue = event.currentTarget.value;
          setDraftValue(nextValue);
          onChange(nextValue);
          return;
        }

        const inputElement = event.currentTarget;
        const rawValue = inputElement.value;
        const cursorPosition = inputElement.selectionStart ?? rawValue.length;
        const digitsBeforeCursor = rawValue
          .slice(0, cursorPosition)
          .replace(/\D/g, "").length;
        const nextValue = normalizeAmountInput(rawValue);
        const formattedValue = formatAmountInput(nextValue);

        setDraftValue(formattedValue);
        onChange(nextValue);

        window.requestAnimationFrame(() => {
          const nextCursorPosition = caretPositionAfterDigits(
            formattedValue,
            digitsBeforeCursor
          );
          inputElement.setSelectionRange(nextCursorPosition, nextCursorPosition);
        });
      }}
    />
  );

  return (
    <label className={`field${format === "amount" ? " field-amount" : ""}`}>
      <span>{label}</span>
      {format === "amount" ? (
        <div className="amount-input">
          <span className="amount-prefix" aria-hidden="true">€</span>
          {input}
        </div>
      ) : (
        input
      )}
      {helper ? <small className="field-helper">{helper}</small> : null}
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

function RangeField({
  label,
  value,
  min,
  max,
  singular,
  plural,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  singular: string;
  plural: string;
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
          {shownValue} {shownValue === 1 ? singular : plural}
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

function AllocationBar({
  salePrice,
  acquisition,
  project,
  commission,
  legalCosts,
  tax,
  profit,
  profitAfterTax,
}: {
  salePrice: number;
  acquisition: number;
  project: number;
  commission: number;
  legalCosts: number;
  tax: number;
  profit: number;
  profitAfterTax: boolean;
}) {
  const total = Math.max(salePrice, 1);
  const items = [
    { label: "Acquisition", value: acquisition, className: "acquisition" },
    { label: "Build / project", value: project, className: "project" },
    { label: "Commission", value: commission, className: "commission" },
    { label: "Sale legal costs", value: legalCosts, className: "commission" },
    ...(tax > 0
      ? [{ label: "Tax", value: tax, className: "commission" }]
      : []),
    {
      label: profitAfterTax ? "Net profit after tax" : "Net profit before tax",
      value: Math.max(0, profit),
      className: "profit",
    },
  ];

  return (
    <section className="allocation">
      <div className="allocation-title"><TableTitle>Where the sale proceeds go</TableTitle><span>Gross proceeds {euro(salePrice)}</span></div>
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

function SensitivityTable({
  rows,
  valueKey,
  valueLabel,
  taxEnabled,
}: {
  rows: SensitivityRow[];
  valueKey: "salePrice" | "projectCost";
  valueLabel: string;
  taxEnabled: boolean;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th></th>
          <th>{valueLabel}</th>
          <th>{taxEnabled ? "Net Profit after Tax" : "Net Profit before Tax"}</th>
          <th>{taxEnabled ? "ROI after Tax" : "ROI before Tax"}</th>
          <th>{taxEnabled ? "IRR after Tax" : "IRR before Tax"}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.change}>
            <td><strong>{row.change === 0 ? "Base" : `${row.change > 0 ? "+" : ""}${numberFormatter.format(row.change * 100)}%`}</strong></td>
            <td>{euro(row[valueKey] ?? 0)}</td>
            <td className={row.netProfit >= 0 ? "positive" : "negative"}>{signedEuro(row.netProfit)}</td>
            <td className={row.roi >= 0 ? "positive" : "negative"}>{percent(row.roi, true)}</td>
            <td className={row.irr >= 0 ? "positive" : "negative"}>{percent(row.irr, true)}</td>
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
    width: min(1180px, 100%);
    margin: 0 auto 30px;
    padding: 16px;
    border: 1px solid rgba(117, 96, 68, .18);
    border-radius: 22px;
    background:
      radial-gradient(circle at top right, rgba(214, 190, 150, .16), transparent 34%),
      #f4f0e8;
    box-shadow: 0 18px 50px rgba(57, 48, 38, .12);
  }
  .input-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    min-height: 72px;
    padding: 14px 16px;
    border-radius: 16px;
    background: linear-gradient(135deg, #201c18, #3b3128);
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(38, 31, 25, .16);
  }
  .input-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
  .input-header span,
  .input-group h2,
  .field > span,
  .section-heading > span,
  .metric > span,
  .data-block h3,
  .table-title {
    letter-spacing: .16em;
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 800;
    color: #8d8da0;
  }
  .input-header span { color: rgba(255, 255, 255, .62); }
  .input-header h1 {
    margin: 4px 0 0;
    font-size: 23px;
    line-height: 1.05;
    color: #ffffff;
  }
  .input-header button {
    min-height: 38px;
    border: 1px solid rgba(255, 255, 255, .16);
    border-radius: 10px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, .1);
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: transform .16s ease, background .16s ease, border-color .16s ease;
  }
  .input-header button:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, .16);
    border-color: rgba(255, 255, 255, .28);
  }
  .input-header .print-button {
    border-color: #d8bd8d;
    background: #ead4ac;
    color: #2a2119;
  }
  .cloud-project-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-top: 12px;
    padding: 12px 14px;
    border: 1px solid rgba(117, 96, 68, .16);
    border-radius: 14px;
    background: rgba(255, 255, 255, .72);
  }
  .cloud-project-left {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 14px;
  }
  .cloud-project-picker {
    display: grid;
    flex: 0 1 300px;
    min-width: 220px;
    gap: 5px;
  }
  .cloud-project-picker > span {
    color: #8a7257;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .cloud-project-picker select {
    width: 100%;
    min-height: 38px;
    border: 1px solid #cabca8;
    border-radius: 9px;
    padding: 7px 34px 7px 10px;
    background: #fffdf9;
    color: #392d22;
    font: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }
  .cloud-project-picker select:disabled {
    cursor: wait;
    opacity: .65;
  }
  .cloud-project-copy {
    display: grid;
    min-width: 0;
    gap: 2px;
  }
  .cloud-project-copy > span {
    color: #8a7257;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .cloud-project-copy > strong {
    overflow: hidden;
    color: #2a2119;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cloud-status {
    color: #786d62;
    font-size: 11px;
    line-height: 1.35;
  }
  .cloud-status-saving,
  .cloud-status-loading { color: #8b6737; }
  .cloud-status-saved { color: #3f6c53; }
  .cloud-status-error { color: #a23838; }
  .cloud-project-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }
  .cloud-project-actions button {
    min-height: 34px;
    border: 1px solid #cabca8;
    border-radius: 9px;
    padding: 7px 11px;
    background: #fffdf9;
    color: #392d22;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }
  .cloud-project-actions button:hover { background: #f5eee4; }
  .cloud-project-actions .cloud-button-muted {
    border-color: transparent;
    background: transparent;
    color: #756b61;
  }
  .cloud-project-actions .cloud-button-danger {
    border-color: rgba(162, 56, 56, .24);
    background: #fff9f8;
    color: #a23838;
  }
  .cloud-project-actions .cloud-button-danger:hover {
    background: #fff0ee;
  }
  .input-header .print-button:hover { background: #f0ddb9; }
  .input-group {
    margin-top: 12px;
    padding: 14px;
    border: 1px solid rgba(125, 105, 79, .16);
    border-radius: 16px;
    background: rgba(255, 255, 255, .7);
    box-shadow: 0 5px 16px rgba(71, 58, 43, .04);
  }
  .input-group h2 {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    margin: 0 0 11px;
    padding: 5px 9px;
    border-radius: 999px;
    background: #efe7da;
    color: #69543a;
    letter-spacing: .1em;
  }
  .input-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .field {
    display: grid;
    align-content: start;
    gap: 5px;
    min-width: 0;
  }
  .field-wide { grid-column: span 2; }
  .field > span {
    color: #67543e;
    letter-spacing: 0;
    text-transform: none;
    font-size: 11px;
  }
  .field input,
  .field select {
    width: 100%;
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #d7d0c6;
    border-radius: 9px;
    outline: none;
    background: rgba(255, 255, 255, .96);
    color: #171717;
    font-size: 14px;
    transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
  }
  .field input::placeholder { color: #aaa197; }
  .field-helper {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    max-width: 100%;
    min-height: 22px;
    margin-top: 1px;
    padding: 3px 8px;
    border: 1px solid #e5ddd2;
    border-radius: 999px;
    background: #f8f5f0;
    color: #7b7066;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.2;
  }
  .field-helper::before {
    content: "";
    flex: 0 0 auto;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #b89868;
    box-shadow: 0 0 0 2px rgba(184, 152, 104, .16);
  }
  .field input:focus,
  .field select:focus,
  .amount-input:focus-within {
    border-color: #a88655;
    box-shadow: 0 0 0 3px rgba(168, 134, 85, .12);
    background: #ffffff;
  }
  .field select { cursor: pointer; }
  .amount-input {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    align-items: center;
    min-height: 40px;
    border: 1px solid #d7d0c6;
    border-radius: 9px;
    background: rgba(255, 255, 255, .96);
    overflow: hidden;
    transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
  }
  .amount-input .amount-prefix {
    display: grid;
    place-items: center;
    align-self: stretch;
    border-right: 1px solid #e2dcd3;
    background: #f5f0e8;
    color: #755b39;
    font-size: 13px;
    font-weight: 800;
  }
  .amount-input input {
    min-height: 38px;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none !important;
  }
  .detailed-select { position: relative; min-height: 40px; }
  .detailed-select-value {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 40px;
    padding: 8px 34px 8px 10px;
    border: 1px solid #d7d0c6;
    border-radius: 9px;
    background: rgba(255, 255, 255, .96);
    color: #171717 !important;
    font-size: 13px !important;
  }
  .detailed-select::after {
    content: "⌄";
    position: absolute;
    top: 50%;
    right: 12px;
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
  .build-cost-editor {
    display: grid;
    gap: 12px;
  }
  .build-cost-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .build-cost-summary > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    padding: 10px 12px;
    border: 1px solid #ddd4c8;
    border-radius: 11px;
    background: #faf7f2;
  }
  .build-cost-summary span {
    color: #756858;
    font-size: 11px;
    font-weight: 700;
  }
  .build-cost-summary strong {
    color: #2a2119;
    font-size: 15px;
  }
  .build-level-card {
    overflow: hidden;
    border: 1px solid #d8d1c7;
    border-radius: 13px;
    background: rgba(255, 255, 255, .76);
  }
  .build-level-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 12px;
    border-bottom: 1px solid #e2dbd2;
    background: #f6f1e9;
  }
  .build-level-name {
    display: grid;
    flex: 1;
    gap: 4px;
    min-width: 0;
  }
  .build-level-header span {
    color: #8a7257;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .build-level-name input {
    width: min(420px, 100%);
    min-height: 34px;
    padding: 5px 9px;
    border: 1px solid transparent;
    border-radius: 7px;
    outline: none;
    background: transparent;
    color: #34291f;
    font-size: 14px;
    font-weight: 800;
  }
  .build-level-name input:hover,
  .build-level-name input:focus {
    border-color: #d7d0c6;
    background: #fff;
  }
  .build-level-remove {
    min-height: 32px;
    padding: 6px 9px;
    border: 1px solid rgba(162, 56, 56, .22);
    border-radius: 8px;
    background: #fff9f8;
    color: #9a3b3b;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
  }
  .build-cost-table { display: grid; }
  .build-cost-table-head,
  .build-cost-row {
    display: grid;
    grid-template-columns: minmax(125px, 1fr) minmax(105px, .68fr) minmax(125px, .76fr) minmax(105px, .7fr) minmax(125px, .76fr) minmax(105px, .7fr);
    gap: 10px;
    align-items: center;
  }
  .build-cost-table-head {
    padding: 9px 12px 7px;
    color: #897968;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .build-cost-table-head span:nth-child(4),
  .build-cost-table-head span:nth-child(6) { text-align: right; }
  .build-cost-row {
    padding: 9px 12px;
    border-top: 1px solid #eee8e0;
  }
  .build-cost-row:first-of-type { border-top: 0; }
  .build-cost-name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    color: #3a3027;
    font-size: 12px;
  }
  .build-cost-name strong { min-width: 0; }
  .build-component-remove {
    flex: none;
    padding: 3px 0;
    border: 0;
    background: transparent;
    color: #9a3b3b;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  .build-cost-input { display: grid; gap: 4px; min-width: 0; }
  .build-cost-mobile-label { display: none; color: #7b7066; font-size: 9px; font-weight: 700; }
  .build-cost-input-suffix,
  .build-cost-input-prefix {
    display: grid;
    align-items: center;
    min-height: 38px;
    overflow: hidden;
    border: 1px solid #d7d0c6;
    border-radius: 8px;
    background: #fff;
  }
  .build-cost-input-suffix { grid-template-columns: minmax(0, 1fr) 38px; }
  .build-cost-input-prefix { grid-template-columns: 32px minmax(0, 1fr); }
  .build-cost-input-suffix > span,
  .build-cost-input-prefix > span {
    display: grid;
    place-items: center;
    align-self: stretch;
    background: #f5f0e8;
    color: #755b39;
    font-size: 11px;
    font-weight: 800;
  }
  .build-cost-input-suffix > span { border-left: 1px solid #e2dcd3; }
  .build-cost-input-prefix > span { border-right: 1px solid #e2dcd3; }
  .build-cost-input input {
    width: 100%;
    min-width: 0;
    min-height: 36px;
    padding: 7px 9px;
    border: 0;
    outline: none;
    background: transparent;
    color: #171717;
    font-size: 13px;
  }
  .build-cost-input-suffix:focus-within,
  .build-cost-input-prefix:focus-within {
    border-color: #a88655;
    box-shadow: 0 0 0 3px rgba(168, 134, 85, .12);
  }
  .build-cost-total {
    color: #2f5f49;
    font-size: 12px;
    text-align: right;
    white-space: nowrap;
  }
  .build-level-empty {
    padding: 14px 12px;
    color: #81766b;
    font-size: 11px;
    border-bottom: 1px solid #eee8e0;
  }
  .build-component-add,
  .build-level-add {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 14px;
    padding-top: 2px;
  }
  .build-component-add {
    padding: 10px 12px 12px;
    border-top: 1px solid #eee8e0;
  }
  .build-component-add-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(190px, 1fr));
    gap: 10px;
    flex: 1;
    min-width: 0;
  }
  .build-component-add label,
  .build-level-add label,
  .build-custom-component-add label,
  .build-custom-level-add label { display: grid; min-width: min(280px, 100%); gap: 5px; }
  .build-component-add label > span,
  .build-level-add label > span,
  .build-custom-component-add label > span,
  .build-custom-level-add label > span { color: #67543e; font-size: 11px; }
  .build-component-add select,
  .build-level-add select,
  .build-custom-component-row input,
  .build-custom-level-row input {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #d7d0c6;
    border-radius: 9px;
    background: #fff;
    color: #171717;
    font-size: 13px;
  }
  .build-custom-component-add,
  .build-custom-level-add { margin: 0; }
  .build-level-add-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(190px, 1fr));
    gap: 10px;
    flex: 1;
    min-width: 0;
  }
  .build-custom-component-row,
  .build-custom-level-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 7px;
  }
  .build-custom-component-row input,
  .build-custom-level-row input { width: 100%; min-width: 0; }
  .build-custom-component-row button,
  .build-custom-level-row button {
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid #8d7350;
    border-radius: 9px;
    background: #8d7350;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }
  .build-component-add p,
  .build-level-add p {
    margin: 0 0 7px;
    color: #7b7066;
    font-size: 10px;
    line-height: 1.4;
    text-align: right;
  }
  .range-field {
    display: grid;
    gap: 7px;
    padding: 10px 12px;
    border: 1px solid #d9d1c6;
    border-radius: 11px;
    background: rgba(255, 255, 255, .72);
  }
  .range-field > span {
    color: #67543e;
    font-size: 11px;
    font-weight: 700;
  }
  .range-control {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 118px;
    align-items: center;
    gap: 12px;
  }
  .range-control input { width: 100%; accent-color: #6f5534; }
  .range-control output {
    min-height: 36px;
    display: grid;
    place-items: center;
    padding: 7px 9px;
    border: 1px solid #d7d0c6;
    border-radius: 8px;
    background: #ffffff;
    font-size: 12px;
    font-weight: 800;
    text-align: center;
  }
  .investor-list {
    display: grid;
    gap: 12px;
  }
  .investor-card {
    padding: 14px;
    border: 1px solid #d8d1c7;
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(255, 255, 255, .84), rgba(255, 255, 255, .62));
    box-shadow: 0 8px 22px rgba(88, 76, 59, .06);
  }
  .investor-card-top {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(320px, 1fr);
    gap: 12px;
    align-items: start;
    margin-bottom: 11px;
  }
  .investor-card-heading {
    display: grid;
    gap: 6px;
  }
  .investor-card-kicker {
    color: #8b6e45;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .investor-card-heading h3 {
    margin: 0;
    color: #3e2d1b;
    font-size: 19px;
    line-height: 1.1;
  }
  .investor-card-heading p {
    margin: 0;
    color: #756d64;
    font-size: 13px;
    line-height: 1.45;
  }
  .investor-card-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .investor-stat {
    display: grid;
    gap: 4px;
    padding: 9px 10px;
    border: 1px solid #ddd4c7;
    border-radius: 12px;
    background: rgba(255, 255, 255, .92);
  }
  .investor-stat span {
    color: #7b6e61;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
  }
  .investor-stat strong {
    color: #1f1b16;
    font-size: 14px;
    line-height: 1.15;
  }
  .investor-stat-accent {
    border-color: #cdb488;
    background: linear-gradient(180deg, rgba(255, 248, 237, .98), rgba(255, 255, 255, .92));
  }
  .investor-card-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(300px, .9fr);
    gap: 12px;
    align-items: stretch;
  }
  .investor-card-grid .range-field {
    grid-column: auto;
    height: 100%;
  }
  .investor-card-grid-simple {
    grid-template-columns: minmax(0, .8fr) minmax(180px, .6fr) minmax(260px, 1fr);
  }

  .downpayment-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .downpayment-card {
    padding: 11px;
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
  .bank-draw-schedule {
    padding: 12px;
    border: 1px solid #d8d1c7;
    border-radius: 14px;
    background: rgba(255, 255, 255, .62);
  }
  .bank-draw-schedule-heading {
    display: grid;
    gap: 3px;
    margin-bottom: 9px;
  }
  .bank-draw-schedule-heading h3 {
    margin: 0;
    color: #5f4930;
    font-size: 13px;
  }
  .bank-draw-schedule-heading p {
    margin: 0;
    color: #756d64;
    font-size: 11px;
    line-height: 1.35;
  }
  .bank-draw-month-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .bank-payment-list {
    display: grid;
    gap: 8px;
  }
  .bank-payment-list-standard {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .bank-payment-list-custom {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .bank-payment-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 9px;
    border: 1px solid #e1dbd2;
    border-radius: 10px;
    background: rgba(255, 255, 255, .72);
  }
  .bank-payment-list-standard .bank-payment-row {
    grid-template-columns: minmax(0, 1fr);
    padding: 8px;
  }
  .bank-payment-list-standard .field {
    gap: 4px;
  }
  .bank-payment-list-standard .field input {
    min-height: 36px;
    padding: 6px 9px;
  }
  .bank-payment-list-standard .field-helper {
    padding: 3px 7px;
    font-size: 10px;
  }
  .bank-payment-row:has(.field:only-child) {
    grid-template-columns: minmax(0, 1fr);
  }
  .bank-schedule-total {
    margin: 11px 0 0;
    padding-top: 10px;
    border-top: 1px solid #e1dbd2;
    color: #5f4930;
    font-size: 12px;
    font-weight: 800;
    text-align: right;
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
  /* Op het scherm gebruikt pagina 2 exact dezelfde kaartmaat als de overige rapportpagina's.
     Alleen tijdens printen wordt deze pagina fysiek 210 × 297 mm A4. */
  .build-spec-page {
    box-sizing: border-box;
    width: min(980px, 100%);
    height: 1320px;
    min-height: 1320px;
    max-height: 1320px;
    padding: 54px 56px 86px;
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
  .build-spec-metrics { margin-bottom: 32px; }
  .build-spec-table {
    border: 1px solid #d7dbe2;
  }
  .build-spec-table th:first-child,
  .build-spec-table td:first-child {
    text-align: left;
  }
  .build-spec-table th:nth-child(n + 2),
  .build-spec-table td:nth-child(n + 2) {
    text-align: right;
    white-space: nowrap;
  }
  .build-spec-table .build-spec-floor-heading td {
    padding: 11px 12px;
    background: #f7f4ee;
    border-top: 2px solid #cfd5dc;
    border-bottom: 1px solid #d7dbe2;
  }
  .build-spec-table tbody .build-spec-floor-heading:first-child td {
    border-top: 0;
  }
  .build-spec-floor-heading-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }
  .build-spec-floor-heading-content strong {
    color: #2f4037;
    font-size: 13px;
  }
  .build-spec-floor-heading-content span {
    color: #71798a;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }
  .build-spec-table .build-spec-component-row td {
    padding-top: 10px;
    padding-bottom: 10px;
  }
  .build-spec-table .build-spec-component {
    padding-left: 24px;
    color: #303842;
    font-weight: 600;
  }
  .build-spec-table .build-spec-number {
    text-align: right;
    white-space: nowrap;
  }
  .build-spec-table tfoot td {
    padding-top: 12px;
    padding-bottom: 12px;
    border-top: 2px solid #111;
    background: #f6f7f2;
    font-weight: 800;
  }
  .build-spec-note { margin-top: 22px; }
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
  .cash-detail-page th:nth-child(3),
  .cash-detail-page td:nth-child(3) { text-align: left; }
  .cash-detail-page th:nth-child(1),
  .cash-detail-page td:nth-child(1),
  .cash-detail-page th:nth-child(2),
  .cash-detail-page td:nth-child(2) { text-align: center; }

  .chart-card { margin-top: 28px; padding: 18px 22px 22px; border: 1px solid var(--line); border-radius: 4px; }
  .chart-card svg { width: 100%; height: auto; overflow: visible; }
  .grid-line { stroke: #e0e3e8; stroke-width: 1; }
  .chart-area { fill: #efefef; }
  .chart-line { fill: none; stroke: #222; stroke-width: 3; }
  .chart-card circle { fill: white; stroke: #222; stroke-width: 2; }
  .chart-card text { fill: #9a9ead; font-size: 10px; }
  .exit-line { stroke: var(--green); stroke-dasharray: 4 4; stroke-width: 2; }
  .exit-label { fill: var(--green) !important; font-weight: 800; }

  .shared-financing-page .shared-metrics { margin-bottom: 28px; }
  .participant-print-stack {
    display: grid;
    gap: 18px;
  }
  .participant-print-block {
    min-width: 0;
  }
  .participant-print-block .table-title {
    margin-top: 0;
  }
  .shared-financing-page .split-table { font-size: 12px; }
  .shared-financing-page .split-table th:first-child,
  .shared-financing-page .split-table td:first-child { text-align: left; }
  .shared-financing-page .split-table th:not(:first-child),
  .shared-financing-page .split-table td:not(:first-child) { text-align: right; }
  .participant-table-scroll {
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .participant-split-table {
    width: 100%;
  }
  .participant-split-table th,
  .participant-split-table td {
    white-space: normal;
    vertical-align: middle;
  }
  .participant-split-table th:first-child,
  .participant-split-table td:first-child {
    min-width: 185px;
  }
  .split-profit-row td { border-top: 2px solid #171717; font-weight: 800; }
  .split-return-row td { font-weight: 800; }
  .shared-financing-page .participant-table,
  .shared-financing-page .contribution-schedule-table { font-size: 11px; }
  .shared-financing-page .participant-table th,
  .shared-financing-page .participant-table td { padding-left: 6px; padding-right: 6px; }
  .shared-financing-page .participant-table td:first-child,
  .shared-financing-page .participant-table th:first-child,
  .shared-financing-page .contribution-schedule-table td:first-child,
  .shared-financing-page .contribution-schedule-table th:first-child { text-align: left; }
  .split-total-row { background: #f2f3f5; }

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
    .build-spec-page { width: min(980px, 100%); }
  }
  @media (max-width: 850px) {
    .cloud-project-bar { align-items: stretch; flex-direction: column; }
    .cloud-project-left { align-items: stretch; flex-direction: column; }
    .cloud-project-picker { flex-basis: auto; min-width: 0; }
    .cloud-project-actions { justify-content: flex-start; }
    .input-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .downpayment-list,
    .investor-card-stats { grid-template-columns: 1fr; }
    .investor-card-top,
    .investor-card-grid,
    .metric-grid { grid-template-columns: repeat(2, 1fr); }
    .metric:nth-child(2) { border-right: 0; }
    .metric:nth-child(-n+2) { border-bottom: 1px solid #cdd2da; }
    .two-column { grid-template-columns: 1fr; }
    .report-page { min-height: auto; overflow: visible; }
    /* Ook op smallere schermen blijft pagina 2 visueel gelijk aan de overige rapportpagina's. */
    .build-spec-page {
      width: 100%;
      height: 1320px;
      min-height: 1320px;
      max-height: 1320px;
      overflow: hidden;
    }
    .photo-stack { grid-template-rows: none; min-height: 0; }
    .photo-stack img { height: auto; max-height: 420px; }
    .photo-placeholder { min-height: 600px; }
  }
  @media (max-width: 560px) {
    .screen { padding: 0; }
    .live-input { border: 0; border-radius: 0; margin-bottom: 0; padding: 10px; }
    .input-header { align-items: stretch; flex-direction: column; padding: 13px; }
    .input-actions { justify-content: flex-start; }
    .input-grid { grid-template-columns: 1fr; }
    .field-wide { grid-column: auto; }
    .build-cost-summary { grid-template-columns: 1fr; }
    .build-cost-table-head { display: none; }
    .build-cost-row { grid-template-columns: 1fr 1fr; gap: 9px; }
    .build-cost-name,
    .build-cost-total { grid-column: 1 / -1; }
    .build-cost-mobile-label { display: block; }
    .build-cost-total { padding-top: 2px; text-align: left; }
    .build-component-add,
    .build-level-add { align-items: stretch; flex-direction: column; }
    .build-component-add-controls { grid-template-columns: 1fr; width: 100%; }
    .build-custom-component-row,
    .build-custom-level-row { grid-template-columns: 1fr; }
    .build-level-add-controls { grid-template-columns: 1fr; }
    .build-component-add p,
    .build-level-add p { margin: 0; text-align: left; }
    .range-control { grid-template-columns: 1fr; }
    .downpayment-card-grid,
    .investor-card-stats { grid-template-columns: 1fr; }
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

  .print-only { display: none; }

  @media print {
    .screen-only { display: none !important; }
    .print-only { display: block !important; }
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

    .build-spec-page {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      overflow: hidden !important;
    }

    .build-spec-page .build-spec-metrics {
      margin-top: 4mm !important;
      margin-bottom: 4mm !important;
    }

    .build-spec-page .metric {
      min-height: 20mm !important;
      padding: 3.2mm 3mm !important;
    }

    .build-spec-page .metric strong {
      margin-top: 2mm !important;
      font-size: 13.5pt !important;
    }

    .build-spec-page .metric small {
      margin-top: 1.3mm !important;
      font-size: 6.8pt !important;
      line-height: 1.2 !important;
    }

    .build-spec-page .table-title {
      margin-top: 4mm !important;
      margin-bottom: 1.5mm !important;
      padding-bottom: 1.8mm !important;
    }

    .build-spec-page .build-spec-table {
      table-layout: fixed !important;
      width: 100% !important;
      font-size: 7.4pt !important;
    }

    .build-spec-page .build-spec-table th {
      padding: 1.8mm 1.4mm !important;
      font-size: 6.2pt !important;
      letter-spacing: .08em !important;
    }

    .build-spec-page .build-spec-table td {
      padding: 1.8mm 1.4mm !important;
      line-height: 1.12 !important;
    }

    .build-spec-page .build-spec-floor-heading td {
      padding: 2mm 1.6mm !important;
    }

    .build-spec-page .build-spec-floor-heading-content {
      gap: 4mm !important;
    }

    .build-spec-page .build-spec-floor-heading-content strong {
      font-size: 7.5pt !important;
    }

    .build-spec-page .build-spec-floor-heading-content span {
      font-size: 6.5pt !important;
    }

    .build-spec-page .build-spec-component {
      padding-left: 4mm !important;
    }

    .build-spec-page .build-spec-note {
      margin-top: 3mm !important;
      font-size: 6.8pt !important;
    }

    .build-spec-page tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
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

    .cash-detail-page table:not(.shared-cashflow-table) th:nth-child(1),
    .cash-detail-page table:not(.shared-cashflow-table) td:nth-child(1) {
      width: 7% !important;
      text-align: center !important;
    }
    .cash-detail-page table:not(.shared-cashflow-table) th:nth-child(2),
    .cash-detail-page table:not(.shared-cashflow-table) td:nth-child(2) {
      width: 14% !important;
      text-align: center !important;
    }
    .cash-detail-page table:not(.shared-cashflow-table) th:nth-child(3),
    .cash-detail-page table:not(.shared-cashflow-table) td:nth-child(3) {
      width: 29% !important;
      text-align: left !important;
    }
    .cash-detail-page table:not(.shared-cashflow-table) th:nth-child(n+4),
    .cash-detail-page table:not(.shared-cashflow-table) td:nth-child(n+4) {
      width: 16.66% !important;
      text-align: right !important;
    }

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
      width: 5% !important;
      text-align: center !important;
    }

    .cash-detail-page .shared-cashflow-table th:nth-child(2),
    .cash-detail-page .shared-cashflow-table td:nth-child(2) {
      width: 12% !important;
      text-align: center !important;
    }

    .cash-detail-page .shared-cashflow-table th:nth-child(3),
    .cash-detail-page .shared-cashflow-table td:nth-child(3) {
      width: 21% !important;
      white-space: normal !important;
      text-align: left !important;
    }

    .cash-detail-page .shared-cashflow-table th:nth-child(n+4),
    .cash-detail-page .shared-cashflow-table td:nth-child(n+4) {
      width: auto !important;
      text-align: right !important;
    }

    .cash-detail-page .shared-cashflow-table,
    .shared-financing-page .participant-split-table {
      min-width: 0 !important;
      width: 100% !important;
    }

    .shared-financing-page .participant-split-table th:first-child,
    .shared-financing-page .participant-split-table td:first-child {
      width: 23% !important;
      min-width: 0 !important;
      text-align: left !important;
    }

    .shared-financing-page .participant-split-table th:not(:first-child),
    .shared-financing-page .participant-split-table td:not(:first-child) {
      width: auto !important;
      word-break: break-word !important;
    }

    .shared-financing-page .split-table {
      font-size: 8pt !important;
      table-layout: fixed !important;
    }

    .shared-financing-page .split-table th,
    .shared-financing-page .split-table td {
      padding: 2.1mm 1.1mm !important;
    }

    .shared-financing-page .participant-split-table th {
      font-size: 5.7pt !important;
      letter-spacing: .05em !important;
      line-height: 1.15 !important;
    }

    .shared-financing-page .participant-split-table td {
      font-size: 6.8pt !important;
    }

    .shared-financing-page .participant-table,
    .shared-financing-page .contribution-schedule-table {
      font-size: 6.8pt !important;
      table-layout: fixed !important;
    }

    .shared-financing-page .participant-table th,
    .shared-financing-page .participant-table td,
    .shared-financing-page .contribution-schedule-table th,
    .shared-financing-page .contribution-schedule-table td {
      padding: 1.7mm 1mm !important;
    }

    .shared-financing-page .participant-table th {
      font-size: 5.4pt !important;
      letter-spacing: .06em !important;
    }

    .participant-print-page-grid {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 3mm !important;
      margin-top: 2.5mm !important;
    }

    .participant-print-group {
      margin-top: 0 !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .shared-financing-page.print-only .section-heading {
      margin-top: 0 !important;
      padding-bottom: 3mm !important;
    }

    .shared-financing-page.print-only .shared-metrics {
      margin: 3mm 0 2.5mm !important;
    }

    .shared-financing-page.print-only .metric {
      padding-top: 2.5mm !important;
      padding-bottom: 2.5mm !important;
    }

    .participant-print-group .table-title {
      margin: 0 0 1.5mm !important;
      padding-bottom: 1.2mm !important;
      font-size: 7pt !important;
    }

    .participant-print-group .participant-split-table th,
    .participant-print-group .participant-split-table td {
      padding: 1.05mm .9mm !important;
    }

    .participant-print-group .participant-split-table th {
      font-size: 5.8pt !important;
      line-height: 1.05 !important;
    }

    .participant-print-group .participant-split-table td {
      font-size: 6.5pt !important;
      line-height: 1.08 !important;
    }

    .participant-print-group .participant-split-table th:first-child,
    .participant-print-group .participant-split-table td:first-child {
      width: 28% !important;
    }

    .participant-print-group .participant-split-table th:not(:first-child),
    .participant-print-group .participant-split-table td:not(:first-child) {
      width: 18% !important;
    }

    .participant-print-note {
      margin-top: 2mm !important;
      padding: 2mm 2.5mm !important;
      font-size: 6.5pt !important;
      line-height: 1.2 !important;
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
      border-bottom: 0.25mm solid #d3d8df !important;
    }

    .data-row {
      border-bottom: 0.22mm solid #d7dce3 !important;
    }

    .chart-card,
    .cash-page .chart-card,
    .cash-page .cash-table-card,
    .cash-overview-page .cash-summary-card {
      border: 0.3mm solid #d8dde4 !important;
      box-shadow: none !important;
    }

    table,
    .cash-page table {
      border: 0 !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
    }

    th,
    .cash-page th {
      border: 0 !important;
      border-bottom: 0.25mm solid #d3d8df !important;
      background: #f3f4f6 !important;
    }

    td,
    .cash-page td {
      border: 0 !important;
      border-bottom: 0.22mm solid #d7dce3 !important;
    }

    th + th,
    td + td,
    .cash-page th + th,
    .cash-page td + td {
      border-left: 0 !important;
    }

    tbody tr:last-child td {
      border-bottom: 0 !important;
    }

    .cash-page .sale-row td,
    .sale-row td {
      background: #eef8f1 !important;
      border-top: 0 !important;
      border-bottom: 0.22mm solid #d7dce3 !important;
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