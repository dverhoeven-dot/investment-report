"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

<<<<<<< HEAD
type MaybeNumber = number | null;
type YesNo = "ja" | "nee";
=======
type MaybeNumber = number | null | undefined;
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)

type ExpenseItem = {
  name: string;
  amount: MaybeNumber;
  percentOfRent: MaybeNumber;
};

type ReportData = {
  objectNaam: string;
  adres: string;
  afbeeldingUrl: string;

  marktwaardeVastgoed: MaybeNumber;
  wozWaardeVastgoed: MaybeNumber;
  financiering: MaybeNumber;
  eigenInleg: MaybeNumber;

  huurPerMaand: MaybeNumber;
  huurPerJaar: MaybeNumber;
  brutoRendementMarktwaarde: MaybeNumber;

  rentePercentage: MaybeNumber;
  rentelastenPerJaar: MaybeNumber;
  naRenteResteert: MaybeNumber;

  vermogensbelastingPercentage: MaybeNumber;
  vermogensbelastingbasis: string;
  vermogensbelastingPerJaar: MaybeNumber;

  box3WozPercentage: MaybeNumber;
  box3WozBedrag: MaybeNumber;

  box3FinancieringPercentage: MaybeNumber;
  box3FinancieringBedrag: MaybeNumber;

  fiscaalPartner?: boolean;
  heffingsvrijVermogenToepassen?: boolean;
  schuldendrempelPerPersoon: MaybeNumber;
  toegepasteSchuldendrempel: MaybeNumber;
  aftrekbareBox3Schuld: MaybeNumber;
  heffingsvrijVermogenZonderPartner: MaybeNumber;
  heffingsvrijVermogenMetPartner: MaybeNumber;
  toegepastHeffingsvrijVermogen: MaybeNumber;

  box3Grondslag: MaybeNumber;
  grondslagSparenBeleggen: MaybeNumber;
  aandeelBelastbareGrondslag: MaybeNumber;
  belastbaarRendement: MaybeNumber;
  voordeelSparenBeleggen: MaybeNumber;
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

type StartpuntConfig = {
  title: string;
  subtitle: string;
  footerLabel: string;
};

type FormState = {
  adres: string;
  marktwaardeVastgoed: string;
  wozWaardeVastgoed: string;
  financiering: string;
  rentePercentage: string;
<<<<<<< HEAD
  huurPerMaand: string;
  fiscaalPartner: YesNo;
  heffingsvrijBenut: YesNo;
};

type EditableExpense = {
  name: string;
  amount: string;
  rate: number | null;
  overridden: boolean;
};

type StoredState = {
  form: FormState;
  expenses: EditableExpense[];
=======
  box3WozPercentage: string;
  box3FinancieringPercentage: string;
  box3BelastingPercentage: string;
  gemiddeldeWaardestijging: string;
  fiscaalPartner: "ja" | "nee";
  heffingsvrijVermogenToepassen: "ja" | "nee";
  exploitatiekosten: string[];
};


const DEFAULT_EXPENSES: ExpenseItem[] = [
  { name: "Gemeentelijke lasten eigenaar", amount: -750, percentOfRent: null },
  { name: "Opstalverzekering", amount: -450, percentOfRent: null },
  { name: "Klein onderhoud", amount: -750, percentOfRent: null },
  { name: "Reservering groot onderhoud", amount: -1500, percentOfRent: null },
  { name: "Beheer en administratie", amount: -400, percentOfRent: null },
  { name: "Verhuur- en mutatiekosten", amount: -400, percentOfRent: null },
  { name: "Leegstand / wanbetaling", amount: -530, percentOfRent: null },
];

function getExpenseSource(initialData: ReportData): ExpenseItem[] {
  return Array.isArray(initialData.exploitatiekosten) &&
    initialData.exploitatiekosten.length > 0
    ? initialData.exploitatiekosten
    : DEFAULT_EXPENSES;
}

const colors = {
  onyx: "#1C1C1B",
  walnut: "#6A5D52",
  ash: "#979086",
  greige: "#B7AC9B",
  stucco: "#E2E2DE",
  paper: "#F4F1EA",
  card: "#FAF8F3",
  soft: "#E8E3DA",
  white: "#FFFFFF",
};

const euro = (value: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

  const euroDecimalValue = (value: MaybeNumber) => {
    if (value === null || Number.isNaN(value)) return "—";
  
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

const euroValue = (value: MaybeNumber) => {
  if (value === null || Number.isNaN(value)) return "—";
  return euro(value);
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
};

const DEFAULT_RENTE = 0.04;
const DEFAULT_WOZ_BOX3 = 0.06;
const DEFAULT_FINANCIERING_BOX3 = 0.027;
const DEFAULT_BOX3_BELASTING = 0.36;
const DEFAULT_WAARDESTIJGING = 0.03;
const BOX3_SINGLE_DEBT_THRESHOLD = 3_800;
const BOX3_PARTNER_DEBT_THRESHOLD = 7_600;
const BOX3_SINGLE_EXEMPTION = 59_357;
const BOX3_PARTNER_EXEMPTION = 118_714;
const STORAGE_KEY = "l3capital.startpunt.residentieel.v2";

const COST_RATES: Array<[string, number]> = [
  ["Gemeentelijke lasten eigenaar", 0.04807692308],
  ["Opstalverzekering", 0.02884615385],
  ["Klein onderhoud", 0.04807692308],
  ["Reservering groot onderhoud", 0.09615384615],
  ["Beheer en administratie", 0.02564102564],
  ["Verhuur- en mutatiekosten", 0.02564102564],
  ["Leegstand / wanbetaling", 0.03397435897],
];

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const moneyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("nl-NL", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function euroValue(value: MaybeNumber) {
  if (value === null || !Number.isFinite(value)) return "—";
  return moneyFormatter.format(value);
}

function signedEuroValue(value: MaybeNumber) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value < 0) return `- ${moneyFormatter.format(Math.abs(value))}`;
  return moneyFormatter.format(value);
}

function costEuroValue(value: MaybeNumber) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (Math.abs(value) < 0.005) return moneyFormatter.format(0);
  return `- ${moneyFormatter.format(Math.abs(value))}`;
}

function pctValue(value: MaybeNumber) {
  if (value === null || !Number.isFinite(value)) return "—";
  return percentFormatter.format(value);
}

function pctAbsValue(value: MaybeNumber) {
  if (value === null || !Number.isFinite(value)) return "—";
  return percentFormatter.format(Math.abs(value));
}

function numberToInput(value: MaybeNumber) {
  if (value === null || !Number.isFinite(value)) return "";
  return String(Math.round(value));
}

function percentToInput(value: MaybeNumber, fallback: number) {
  const normalized = value === null || !Number.isFinite(value) ? fallback : value;
  return String(Number((normalized * 100).toFixed(2)));
}

function parseInputNumber(value: string): MaybeNumber {
  const original = value.trim();
  if (!original) return null;

  const isNegative = /[-−–—]/.test(original);
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

function parseInputPercent(value: string, fallback: number) {
  const parsed = parseInputNumber(value);
  if (parsed === null || parsed === 0) return fallback;
  return Math.abs(parsed) > 1 ? parsed / 100 : parsed;
}

function objectNameFromAddress(address: string, fallback: string) {
  const name = address.split(",")[0]?.trim();
  return name || fallback;
}

function createInitialForm(initialData: ReportData): FormState {
  return {
    adres: initialData.adres ?? "",
    marktwaardeVastgoed: numberToInput(initialData.marktwaardeVastgoed),
    wozWaardeVastgoed: numberToInput(initialData.wozWaardeVastgoed),
    financiering: numberToInput(initialData.financiering),
    rentePercentage: percentToInput(
      initialData.rentePercentage,
      DEFAULT_RENTE
    ),
    huurPerMaand: numberToInput(initialData.huurPerMaand),
<<<<<<< HEAD
    fiscaalPartner: initialData.fiscaalPartner ?? "nee",
    heffingsvrijBenut: initialData.heffingsvrijBenut ?? "ja",
=======
    rentePercentage: percentToInput(initialData.rentePercentage),
    box3WozPercentage: percentToInput(
      initialData.box3WozPercentage ?? 0.06
    ),
    
    box3FinancieringPercentage: percentToInput(
      initialData.box3FinancieringPercentage ?? 0.027
    ),
    
    box3BelastingPercentage: percentToInput(
      initialData.box3BelastingPercentage ?? 0.36
    ),
    gemiddeldeWaardestijging: percentToInput(
      initialData.gemiddeldeWaardestijging
    ),
    fiscaalPartner: initialData.fiscaalPartner ? "ja" : "nee",
    heffingsvrijVermogenToepassen:
      initialData.heffingsvrijVermogenToepassen ? "ja" : "nee",
    exploitatiekosten: getExpenseSource(initialData).map((item) =>
      numberToInput(item.amount == null ? null : Math.abs(item.amount))
    ),
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
  };
}

function createEmptyForm(): FormState {
  return {
    adres: "",
    marktwaardeVastgoed: "",
    wozWaardeVastgoed: "",
    financiering: "",
    rentePercentage: String(DEFAULT_RENTE * 100),
    huurPerMaand: "",
    fiscaalPartner: "nee",
    heffingsvrijBenut: "nee",
  };
}

function createInitialExpenses(initialData: ReportData): EditableExpense[] {
  if (initialData.exploitatiekosten.length > 0) {
    return initialData.exploitatiekosten.map((item) => {
      const rate =
        item.percentOfRent === null
          ? null
          : Math.abs(item.percentOfRent);

      return {
        name: item.name,
        amount: numberToInput(Math.abs(item.amount ?? 0)),
        rate,
        overridden: rate === null,
      };
    });
  }

  return COST_RATES.map(([name, rate]) => ({
    name,
    amount: "",
    rate,
    overridden: false,
  }));
}

function createEmptyExpenses(): EditableExpense[] {
  return COST_RATES.map(([name, rate]) => ({
    name,
    amount: "",
    rate,
    overridden: false,
  }));
}

function isYesNo(value: unknown): value is YesNo {
  return value === "ja" || value === "nee";
}

function isStoredState(value: unknown): value is StoredState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<StoredState>;
  if (!candidate.form || !Array.isArray(candidate.expenses)) return false;

  const form = candidate.form as Partial<FormState>;
  const expensesAreValid = candidate.expenses.every((item) => {
    if (!item || typeof item !== "object") return false;
    const expense = item as Partial<EditableExpense>;
    return (
      typeof expense.name === "string" &&
      typeof expense.amount === "string" &&
      (typeof expense.rate === "number" || expense.rate === null) &&
      typeof expense.overridden === "boolean"
    );
  });

  return (
    typeof form.adres === "string" &&
    typeof form.marktwaardeVastgoed === "string" &&
    typeof form.wozWaardeVastgoed === "string" &&
    typeof form.financiering === "string" &&
    typeof form.rentePercentage === "string" &&
    typeof form.huurPerMaand === "string" &&
    isYesNo(form.fiscaalPartner) &&
    isYesNo(form.heffingsvrijBenut) &&
    expensesAreValid
  );
}

export default function StartpuntClient({
  initialData,
  config,
}: {
  initialData: ReportData;
  config: StartpuntConfig;
}) {
  const expenseSource = useMemo(() => getExpenseSource(initialData), [initialData]);

  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(initialData)
  );
<<<<<<< HEAD
  const [expenses, setExpenses] = useState<EditableExpense[]>(() =>
    createInitialExpenses(initialData)
  );
  const [storageReady, setStorageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
=======
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (isStoredState(saved)) {
        setForm(saved.form);
        setExpenses(saved.expenses);
      }
    } catch (error) {
      console.warn("Lokale rapportinvoer kon niet worden geladen.", error);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ form, expenses } satisfies StoredState)
      );
    } catch (error) {
      console.warn("Lokale rapportinvoer kon niet worden opgeslagen.", error);
    }
  }, [expenses, form, storageReady]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateExpense(index: number, amount: string) {
    setExpenses((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, amount, overridden: true }
          : item
      )
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ form, expenses } satisfies StoredState)
      );
    } catch (error) {
      console.warn("Lokale rapportinvoer kon niet worden opgeslagen.", error);
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  function updateExpense(index: number, value: string) {
    setForm((current) => ({
      ...current,
      exploitatiekosten: (
        current.exploitatiekosten ??
        expenseSource.map((item) =>
          numberToInput(item.amount == null ? null : Math.abs(item.amount))
        )
      ).map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }
  function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    if (!file.type.startsWith("image/")) {
      alert("Selecteer een geldig afbeeldingsbestand.");
      return;
    }
  
    const reader = new FileReader();
  
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedImage(reader.result);
      }
    };
  
    reader.onerror = () => {
      alert("De afbeelding kon niet worden ingelezen.");
    };
  
    reader.readAsDataURL(file);
  }

  function resetForm() {
<<<<<<< HEAD
    localStorage.removeItem(STORAGE_KEY);
    setForm(createEmptyForm());
    setExpenses(createEmptyExpenses());
  }

  const data = useMemo(() => {
    const marktwaarde = Math.abs(
      parseInputNumber(form.marktwaardeVastgoed) ?? 0
    );
    const wozwaarde = Math.abs(
      parseInputNumber(form.wozWaardeVastgoed) ?? 0
=======
    setForm(createInitialForm(initialData));
    setUploadedImage(null);
  }

  const data = useMemo<ReportData>(() => {
    const objectNaam = form.objectNaam || initialData.objectNaam;
    const adres = form.adres || initialData.adres;

    const marktwaardeVastgoed = parseInputNumber(form.marktwaardeVastgoed);
    const wozWaardeVastgoed = parseInputNumber(form.wozWaardeVastgoed);
    const financiering = parseInputNumber(form.financiering);
    const huurPerMaand = parseInputNumber(form.huurPerMaand);
    const rentePercentage = parseInputPercent(form.rentePercentage);
    const box3WozPercentage = parseInputPercent(form.box3WozPercentage);
    const box3FinancieringPercentage = parseInputPercent(
      form.box3FinancieringPercentage
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
    );
    const financiering = Math.abs(parseInputNumber(form.financiering) ?? 0);
    const huurPerMaand = Math.abs(parseInputNumber(form.huurPerMaand) ?? 0);
    const huurPerJaar = huurPerMaand * 12;
    const rente = parseInputPercent(form.rentePercentage, DEFAULT_RENTE);
    const rentelasten = -financiering * rente;
    const naRente = huurPerJaar + rentelasten;
    const brutoRendement = marktwaarde ? huurPerJaar / marktwaarde : 0;
    const eigenInleg = Math.max(0, marktwaarde - financiering);

    const costRows = expenses.map((item) => {
      const generatedAmount = huurPerJaar * Math.abs(item.rate ?? 0);
      const enteredAmount = Math.abs(parseInputNumber(item.amount) ?? 0);
      const amount = item.overridden ? enteredAmount : generatedAmount;

      return {
        ...item,
        rawAmount: item.amount,
        amount,
        percentOfRent: huurPerJaar
          ? amount / huurPerJaar
          : Math.abs(item.rate ?? 0),
      };
    });

    const exploitatiekosten = costRows.reduce(
      (sum, item) => sum + item.amount,
      0
    );
<<<<<<< HEAD
    const exploitatiePct = huurPerJaar
      ? exploitatiekosten / huurPerJaar
      : 0;

    const schuldenDrempel =
      form.fiscaalPartner === "ja"
        ? BOX3_PARTNER_DEBT_THRESHOLD
        : BOX3_SINGLE_DEBT_THRESHOLD;
    const heffingsvrijVermogen =
      form.fiscaalPartner === "ja"
        ? BOX3_PARTNER_EXEMPTION
        : BOX3_SINGLE_EXEMPTION;
    const toegepasteVrijstelling =
      form.heffingsvrijBenut === "ja" ? 0 : heffingsvrijVermogen;
    const aftrekbareFinanciering = Math.max(
      0,
      financiering - schuldenDrempel
=======
    const gemiddeldeWaardestijging = parseInputPercent(
      form.gemiddeldeWaardestijging
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
    );
    const boxWozComponent = wozwaarde * DEFAULT_WOZ_BOX3;
    const boxFinancieringComponent =
      aftrekbareFinanciering * DEFAULT_FINANCIERING_BOX3;
    const rendementsgrondslag = Math.max(
      0,
      wozwaarde - aftrekbareFinanciering
    );
    const grondslagNaVrijstelling = Math.max(
      0,
      rendementsgrondslag - toegepasteVrijstelling
    );
    const forfaitairRendement =
      boxWozComponent - boxFinancieringComponent;
    const box3Factor = rendementsgrondslag
      ? grondslagNaVrijstelling / rendementsgrondslag
      : 0;
    const vermogensbelastingbasis = Math.max(
      0,
      forfaitairRendement * box3Factor
    );
    const vermogensbelasting =
      vermogensbelastingbasis * DEFAULT_BOX3_BELASTING;

<<<<<<< HEAD
    const nettoHuur =
      huurPerJaar + rentelasten - exploitatiekosten - vermogensbelasting;
    const nettoRendementMarktwaarde = marktwaarde
      ? nettoHuur / marktwaarde
      : 0;
    const nettoRendementEigenInleg = eigenInleg
      ? nettoHuur / eigenInleg
      : 0;
    const totaalRendement =
      nettoRendementEigenInleg + DEFAULT_WAARDESTIJGING;

    return {
      objectNaam:
        form.adres.trim() === ""
          ? ""
          : form.adres === initialData.adres && initialData.objectNaam
          ? initialData.objectNaam
          : objectNameFromAddress(form.adres, ""),
      adres: form.adres,
      afbeeldingUrl: initialData.afbeeldingUrl,
      marktwaarde,
      wozwaarde,
=======
    const fiscaalPartner = form.fiscaalPartner === "ja";
    const heffingsvrijVermogenToepassen =
      form.heffingsvrijVermogenToepassen === "ja";

    const schuldendrempelPerPersoon = 3800;
    const heffingsvrijVermogenZonderPartner = 59357;
    const heffingsvrijVermogenMetPartner = 118714;

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

    const expenseInputs = form.exploitatiekosten ?? [];

    const exploitatiekosten = expenseSource.map(
      (item, index): ExpenseItem => {
        const enteredAmount = parseInputNumber(expenseInputs[index] ?? "");
        const amount =
          enteredAmount === null ? null : -Math.abs(enteredAmount);

        return {
          name: item.name,
          amount,
          percentOfRent:
            amount !== null && huurPerJaar !== null && huurPerJaar !== 0
              ? amount / huurPerJaar
              : null,
        };
      }
    );

    const exploitatiekostenTotaal =
      exploitatiekosten.every((item) => item.amount !== null)
        ? exploitatiekosten.reduce(
            (total, item) => total + toNumber(item.amount),
            0
          )
        : null;

    const exploitatiekostenPercentage =
      exploitatiekostenTotaal !== null &&
      huurPerJaar !== null &&
      huurPerJaar !== 0
        ? exploitatiekostenTotaal / huurPerJaar
        : null;

    const toegepasteSchuldendrempel = fiscaalPartner
      ? schuldendrempelPerPersoon * 2
      : schuldendrempelPerPersoon;

    const aftrekbareBox3Schuld =
      financiering !== null
        ? Math.max(0, Math.abs(financiering) - toegepasteSchuldendrempel)
        : null;

    const box3WozBedrag =
      wozWaardeVastgoed !== null && box3WozPercentage !== null
        ? Math.abs(wozWaardeVastgoed) * box3WozPercentage
        : null;

    const box3FinancieringBedrag =
      aftrekbareBox3Schuld !== null &&
      box3FinancieringPercentage !== null
        ? aftrekbareBox3Schuld * box3FinancieringPercentage
        : null;

    const toegepastHeffingsvrijVermogen = heffingsvrijVermogenToepassen
      ? fiscaalPartner
        ? heffingsvrijVermogenMetPartner
        : heffingsvrijVermogenZonderPartner
      : 0;

    const box3Grondslag =
      wozWaardeVastgoed !== null && aftrekbareBox3Schuld !== null
        ? Math.max(0, Math.abs(wozWaardeVastgoed) - aftrekbareBox3Schuld)
        : null;

    const grondslagSparenBeleggen =
      box3Grondslag !== null
        ? Math.max(0, box3Grondslag - toegepastHeffingsvrijVermogen)
        : null;

    const aandeelBelastbareGrondslag =
      box3Grondslag !== null && grondslagSparenBeleggen !== null
        ? box3Grondslag === 0
          ? 0
          : grondslagSparenBeleggen / box3Grondslag
        : null;

    const belastbaarRendement =
      box3WozBedrag !== null && box3FinancieringBedrag !== null
        ? box3WozBedrag - box3FinancieringBedrag
        : null;

    const voordeelSparenBeleggen =
      belastbaarRendement !== null &&
      aandeelBelastbareGrondslag !== null
        ? belastbaarRendement * aandeelBelastbareGrondslag
        : null;

    const vermogensbelastingPerJaar =
      voordeelSparenBeleggen !== null &&
      box3BelastingPercentage !== null
        ? -Math.abs(voordeelSparenBeleggen * box3BelastingPercentage)
        : null;

    const nettoHuurinkomsten =
      huurPerJaar !== null &&
      rentelastenPerJaar !== null &&
      exploitatiekostenTotaal !== null &&
      vermogensbelastingPerJaar !== null
        ? huurPerJaar +
          rentelastenPerJaar +
          exploitatiekostenTotaal +
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
      rendementOpEigenInleg !== null && gemiddeldeWaardestijging !== null
        ? rendementOpEigenInleg + gemiddeldeWaardestijging
        : null;

    return {
      ...initialData,
      objectNaam,
      adres,
      marktwaardeVastgoed,
      wozWaardeVastgoed,
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
      financiering,
      eigenInleg,
      huurPerMaand,
      huurPerJaar,
<<<<<<< HEAD
      brutoRendement,
      rente,
      rentelasten,
      naRente,
      costRows,
      exploitatiekosten,
      exploitatiePct,
      fiscaalPartner: form.fiscaalPartner,
      heffingsvrijBenut: form.heffingsvrijBenut,
      schuldenDrempel,
      heffingsvrijVermogen,
      toegepasteVrijstelling,
      aftrekbareFinanciering,
      boxWozComponent,
      boxFinancieringComponent,
      rendementsgrondslag,
      grondslagNaVrijstelling,
      forfaitairRendement,
      vermogensbelastingbasis,
      vermogensbelasting,
      nettoHuur,
      nettoRendementMarktwaarde,
      nettoRendementEigenInleg,
      waardestijging: DEFAULT_WAARDESTIJGING,
      totaalRendement,
    };
  }, [
    expenses,
    form,
    initialData.adres,
    initialData.afbeeldingUrl,
    initialData.objectNaam,
  ]);
=======
      brutoRendementMarktwaarde,
      rentePercentage,
      rentelastenPerJaar,
      naRenteResteert,
      fiscaalPartner,
      heffingsvrijVermogenToepassen,
      schuldendrempelPerPersoon,
      toegepasteSchuldendrempel,
      aftrekbareBox3Schuld,
      heffingsvrijVermogenZonderPartner,
      heffingsvrijVermogenMetPartner,
      toegepastHeffingsvrijVermogen,
      exploitatiekosten,
      exploitatiekostenTotaal,
      exploitatiekostenPercentage,
      box3WozPercentage,
      box3WozBedrag,
      box3FinancieringPercentage,
      box3FinancieringBedrag,
      box3Grondslag,
      grondslagSparenBeleggen,
      aandeelBelastbareGrondslag,
      belastbaarRendement,
      voordeelSparenBeleggen,
      box3BelastingPercentage,
      vermogensbelastingPercentage: box3BelastingPercentage,
      vermogensbelastingbasis: "Voordeel uit sparen en beleggen",
      vermogensbelastingPerJaar,
      nettoHuurinkomsten,
      nettoRendementMarktwaarde,
      rendementOpEigenInleg,
      gemiddeldeWaardestijging,
      totaalRendementInclWaardestijging,
    };
  }, [form, initialData, expenseSource]);
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)

  const calculationRows: Array<{
    label: string;
    value: string;
    variant?: "highlight" | "soft-highlight";
  }> = [
    { label: "Marktwaarde vastgoed", value: euroValue(data.marktwaarde) },
    { label: "WOZ-waarde vastgoed", value: euroValue(data.wozwaarde) },
    { label: "Huur per maand", value: euroValue(data.huurPerMaand) },
    { label: "Huur per jaar", value: euroValue(data.huurPerJaar) },
    {
      label: "Bruto rendement marktwaarde",
      value: pctValue(data.brutoRendement),
    },
    { label: "Financiering", value: euroValue(data.financiering) },
    { label: "Rente", value: pctValue(data.rente) },
    {
      label: "Rentelasten per jaar",
      value: costEuroValue(data.rentelasten),
    },
    {
      label: "Na rente resteert",
      value: signedEuroValue(data.naRente),
      variant: "soft-highlight",
    },
    {
      label: "Exploitatiekosten per jaar",
      value: costEuroValue(data.exploitatiekosten),
    },
    {
      label: "Vermogensbelasting",
      value: costEuroValue(data.vermogensbelasting),
    },
    {
      label: "Netto huurinkomsten",
      value: signedEuroValue(data.nettoHuur),
      variant: "highlight",
    },
    {
      label: "Netto rendement marktwaarde",
      value: pctValue(data.nettoRendementMarktwaarde),
    },
    {
      label: "Rendement op eigen inleg",
      value: pctValue(data.nettoRendementEigenInleg),
    },
    {
      label: "Gemiddelde waardestijging",
      value: pctValue(data.waardestijging),
    },
    {
      label: "Totaal rendement incl. waardestijging",
      value: pctValue(data.totaalRendement),
      variant: "highlight",
    },
  ];

  const imageSource =
    imageFailed || !data.afbeeldingUrl
      ? TRANSPARENT_PIXEL
      : data.afbeeldingUrl;

  return (
    <>
      <style>{styles}</style>

<<<<<<< HEAD
      <section className="case-editor no-print">
        <div>
          <p className="brand">Snelle invoer</p>
          <h2>Nieuwe casus</h2>
=======
      <section className="input-panel no-print">
        <div className="input-panel-head">
          <div>
            <span>Live invoer</span>
            <strong>Startpunt analyse</strong>
          </div>

          <button type="button" onClick={resetForm}>
            Reset naar voorbeeldwaardes
          </button>
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
        </div>

        <form onSubmit={handleSubmit}>
          <InputField
            label="Adres"
            name="adres"
            type="text"
            value={form.adres}
            onChange={(value) => updateField("adres", value)}
          />
<<<<<<< HEAD
=======
<label className="input-field image-input-field">
  <span>Afbeelding vastgoed</span>

  <input
    type="file"
    accept="image/png, image/jpeg, image/webp"
    onChange={handleImageUpload}
  />
</label>
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
          <InputField
            label="Marktwaarde"
            name="marktwaarde"
            step="1000"
            value={form.marktwaardeVastgoed}
            onChange={(value) => updateField("marktwaardeVastgoed", value)}
          />
          <InputField
            label="WOZ-waarde"
            name="wozwaarde"
            step="1000"
            value={form.wozWaardeVastgoed}
            onChange={(value) => updateField("wozWaardeVastgoed", value)}
          />
          <InputField
            label="Financiering"
            name="financiering"
            step="1000"
            value={form.financiering}
            onChange={(value) => updateField("financiering", value)}
          />
          <InputField
            label="Rente"
            name="rente"
            step="0.1"
            value={form.rentePercentage}
            onChange={(value) => updateField("rentePercentage", value)}
          />
<<<<<<< HEAD
          <InputField
            label="Huur per maand"
            name="huur"
            step="50"
            value={form.huurPerMaand}
            onChange={(value) => updateField("huurPerMaand", value)}
          />
          <SelectField
            label="Fiscaal partner"
            name="fiscaalPartner"
            value={form.fiscaalPartner}
            onChange={(value) => updateField("fiscaalPartner", value)}
          />
          <SelectField
            label="Heffingsvrij vermogen benut"
            name="heffingsvrijBenut"
            value={form.heffingsvrijBenut}
            onChange={(value) => updateField("heffingsvrijBenut", value)}
          />

          <button type="submit">Bereken rapport</button>
          <button type="button" onClick={resetForm}>
            Maak leeg
          </button>
        </form>
=======

          <SelectField
            label="Fiscaal partner?"
            value={form.fiscaalPartner}
            onChange={(value) => updateField("fiscaalPartner", value)}
          />

          <SelectField
            label="Heffingsvrij vermogen toepassen?"
            value={form.heffingsvrijVermogenToepassen}
            onChange={(value) =>
              updateField("heffingsvrijVermogenToepassen", value)
            }
          />

          <InputField
            label="Box 3 WOZ %"
            value={form.box3WozPercentage}
            onChange={(value) => updateField("box3WozPercentage", value)}
          />

          <InputField
            label="Box 3 financiering %"
            value={form.box3FinancieringPercentage}
            onChange={(value) =>
              updateField("box3FinancieringPercentage", value)
            }
          />

          <InputField
            label="Box-3 tarief %"
            value={form.box3BelastingPercentage}
            onChange={(value) => updateField("box3BelastingPercentage", value)}
          />

          <InputField
            label="Waardestijging %"
            value={form.gemiddeldeWaardestijging}
            onChange={(value) => updateField("gemiddeldeWaardestijging", value)}
          />
        </div>

        <div className="expense-input-section">
          <div className="expense-input-head">
            <strong>Exploitatiekosten per jaar</strong>
            <span>
              Totaal: {costEuroValue(data.exploitatiekostenTotaal)} ·{" "}
              {pctAbsValue(data.exploitatiekostenPercentage)} van de huur
            </span>
          </div>

          <div className="expense-input-grid">
            {initialData.exploitatiekosten.map((item, index) => (
              <InputField
                key={item.name}
                label={item.name}
                value={form.exploitatiekosten[index] ?? ""}
                onChange={(value) => updateExpense(index, value)}
              />
            ))}
          </div>
        </div>
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
      </section>

      <main className="report" aria-live="polite">
        <section className="page page-one">
          <header className="hero">
            <div>
              <p className="brand">L3 Capital</p>
              <h1>{config.title}</h1>
              <p className="hero-copy">{config.subtitle}</p>
            </div>

            <aside className="object-card">
              <p>Object</p>
              <strong>{data.objectNaam || "Nieuw vastgoedobject"}</strong>
              <span>{data.adres || "Adres nog niet ingevuld"}</span>
            </aside>
          </header>

          {initialData.waarschuwingen.length > 0 && (
            <section className="warning-box" role="status">
              {initialData.waarschuwingen.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </section>
          )}

          <section className="summary-grid">
            <Metric
              label="Bruto jaarhuur"
              value={euroValue(data.huurPerJaar)}
              text="Totale huurinkomsten per jaar."
            />
            <Metric
              label="Bruto rendement"
              value={pctValue(data.brutoRendement)}
              text="Jaarhuur gedeeld door marktwaarde."
            />
            <Metric
              label="Netto rendement"
              value={pctValue(data.nettoRendementEigenInleg)}
              text="Netto huurinkomsten gedeeld door eigen inleg."
            />
            <Metric
              label="Netto incl. waardestijging"
              value={pctValue(data.totaalRendement)}
              text="Netto rendement plus gemiddelde waardestijging."
            />
          </section>

<<<<<<< HEAD
          <section className="main-grid">
            <aside className="property-panel">
              <img
                src={imageSource}
                alt={`Vastgoedobject ${data.objectNaam}`}
                onError={() => setImageFailed(true)}
=======
        <section className="kpi-grid">
          <KpiCard
            label="Bruto rendement"
            value={pctValue(data.brutoRendementMarktwaarde)}
            text="Huur per jaar gedeeld door marktwaarde."
          />
          <KpiCard
            label="Na rente resteert"
            value={euroValue(data.naRenteResteert)}
            text="Huurinkomsten na jaarlijkse rentelasten."
          />
          <KpiCard
            label="Netto huurinkomsten"
            value={euroValue(data.nettoHuurinkomsten)}
            text="Na rente, exploitatiekosten en vermogensbelasting."
          />
          <KpiCard
            label="Totaal incl. waardestijging"
            value={pctValue(data.totaalRendementInclWaardestijging)}
            text="Rendement op eigen inleg plus waardestijging."
          />
        </section>

        <section className="intro-grid">
          <div className="photo-card">
            <div
              className="photo-wrap"
              style={{
                backgroundImage: `url("${uploadedImage ?? data.afbeeldingUrl}")`,
              }}
            >
              <div className="photo-fallback">Foto vastgoed</div>
            </div>

            <div className="value-list">
              <InfoLine
                label="Marktwaarde"
                value={euroValue(data.marktwaardeVastgoed)}
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
              />
              <dl>
                <InfoLine
                  label="Marktwaarde"
                  value={euroValue(data.marktwaarde)}
                />
                <InfoLine
                  label="WOZ-waarde"
                  value={euroValue(data.wozwaarde)}
                />
                <InfoLine
                  label="Eigen inleg"
                  value={euroValue(data.eigenInleg)}
                />
              </dl>
            </aside>

            <section className="check-panel">
              <SectionTitle number="01" title="Korte rendementscheck" />
              <dl className="line-list">
                {calculationRows.map((row) => (
                  <InfoLine
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    className={row.variant}
                  />
                ))}
              </dl>
            </section>
          </section>

<<<<<<< HEAD
          <section className="text-panel">
            <SectionTitle number="02" title="Kernbeeld" />
            <p>
              Het bruto rendement geeft alleen de verhouding weer tussen de
              jaarlijkse huur en de marktwaarde. Na rentelasten resteert{" "}
              <strong>{signedEuroValue(data.naRente)}</strong>. Na
              exploitatiekosten en vermogensbelasting blijft in dit
              rekenvoorbeeld{" "}
              <strong>{signedEuroValue(data.nettoHuur)}</strong> aan netto
              huurinkomsten over.
=======
            <div className="calc-table">
              {calculationRows.map(([label, value, variant]) => (
                <div
                  key={label}
                  className={[
                    "calc-row",
                    variant === "soft" ? "soft-row" : "",
                    variant === "main" ? "main-row" : "",
                  ].join(" ")}
                >
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card text-card kernbeeld">
  <SectionTitle number="02" title="Kernbeeld" />

  <p>
    Het bruto rendement van{" "}
    <strong>{pctValue(data.brutoRendementMarktwaarde)}</strong> lijkt
    aantrekkelijk, maar geeft een onvolledig beeld. Van de jaarlijkse
    huurinkomsten van <strong>{euroValue(data.huurPerJaar)}</strong> gaan nog{" "}
    <strong>{costEuroValue(data.rentelastenPerJaar)}</strong> aan rente,{" "}
    <strong>{costEuroValue(data.exploitatiekostenTotaal)}</strong> aan
    exploitatiekosten en{" "}
    <strong>{costEuroValue(data.vermogensbelastingPerJaar)}</strong> aan
    vermogensbelasting af. In totaal verdwijnt daarmee{" "}
    <strong>
      {costEuroValue(
        Math.abs(toNumber(data.rentelastenPerJaar)) +
          Math.abs(toNumber(data.exploitatiekostenTotaal)) +
          Math.abs(toNumber(data.vermogensbelastingPerJaar))
      )}
    </strong>
    ,{" "}
    <strong>
      {pctAbsValue(
        data.huurPerJaar && data.huurPerJaar !== 0
          ? (
              Math.abs(toNumber(data.rentelastenPerJaar)) +
              Math.abs(toNumber(data.exploitatiekostenTotaal)) +
              Math.abs(toNumber(data.vermogensbelastingPerJaar))
            ) / data.huurPerJaar
          : null
      )}
    </strong>{" "}
    van de bruto huurinkomsten. Uiteindelijk resteert{" "}
    <strong>{euroValue(data.nettoHuurinkomsten)}</strong> aan netto
    huurinkomsten.
  </p>

  <p>
    Het totale nettorendement inclusief waardestijging bedraagt{" "}
    <strong>{pctValue(data.totaalRendementInclWaardestijging)}</strong>.
    Hiervan bestaat{" "}
    <strong>{pctValue(data.gemiddeldeWaardestijging)}</strong> uit de verwachte
    waardestijging van het vastgoed. Waardestijging kan het totale rendement verbeteren, maar is geen gegarandeerde kasstroom en komt pas
    beschikbaar bij verkoop of herfinanciering. De directe kasstroom uit verhuur
    bedraagt daarom{" "}
    <strong>{pctValue(data.rendementOpEigenInleg)}</strong>.
  </p>
</section>

        <footer className="footer">
          <span>{config.footerLabel}</span>
          <span>Pagina 1 / 2</span>
        </footer>
      </article>
      <article className="sheet">
        <section className="page-two-grid">
          <div className="card">
            <SectionTitle number="03" title="Exploitatiekosten" />

            <p className="intro">
              De exploitatiekosten bedragen samen{" "}
              <strong>{costEuroValue(data.exploitatiekostenTotaal)}</strong>.
              Dat is{" "}
              <strong>{pctAbsValue(data.exploitatiekostenPercentage)}</strong>{" "}
              van de jaarlijkse huurinkomsten.
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
            </p>
            <p>
              De gemiddelde waardestijging van{" "}
              <strong>{pctValue(data.waardestijging)}</strong> is geen directe
              huurkasstroom en wordt daarom apart weergegeven. Het totale
              rendement inclusief waardestijging komt uit op{" "}
              <strong>{pctValue(data.totaalRendement)}</strong>.
            </p>
          </section>

          <footer>
            <span>{config.footerLabel}</span>
            <span>Pagina 1 / 2</span>
          </footer>
        </section>

        <section className="page page-two">
          <header className="sub-hero">
            <div>
              <p className="brand">L3 Capital</p>
              <h1>Verdieping rendement en uitgangspunten</h1>
            </div>
            <aside>
              <span>{data.objectNaam || "Nieuw vastgoedobject"}</span>
              <strong>{euroValue(data.marktwaarde)}</strong>
            </aside>
          </header>

          <section className="detail-grid">
            <article className="wide-card">
              <SectionTitle number="03" title="Exploitatiekosten" />
              <p>
                In dit rekenvoorbeeld bedragen de exploitatiekosten samen{" "}
                <strong>{costEuroValue(data.exploitatiekosten)}</strong>. Dat is{" "}
                <strong>{pctAbsValue(data.exploitatiePct)}</strong> van de
                jaarlijkse huurinkomsten.
              </p>

              <table>
                <thead>
                  <tr>
                    <th>Kostenpost</th>
                    <th>Jaarbedrag</th>
                    <th>% huur</th>
                  </tr>
                </thead>
                <tbody>
                  {data.costRows.map((item, index) => {
                    const shownAmount = item.overridden
                      ? item.rawAmount
                      : Math.round(item.amount);

                    return (
                      <tr key={`${item.name}-${index}`}>
                        <td>{item.name}</td>
                        <td>
                          <input
                            className="cost-input"
                            aria-label={`${item.name} per jaar`}
                            type="number"
                            step="1"
                            value={shownAmount}
                            onChange={(event) =>
                              updateExpense(index, event.target.value)
                            }
                          />
                        </td>
                        <td>{pctAbsValue(item.percentOfRent)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </article>

            <article className="muted-card">
              <SectionTitle number="04" title="Box 3-uitgangspunt" />
              <dl className="line-list compact">
                <InfoLine
                  label="Fiscaal partner"
                  value={data.fiscaalPartner === "ja" ? "Ja" : "Nee"}
                />
                <InfoLine
                  label="Heffingsvrij vermogen benut"
                  value={data.heffingsvrijBenut === "ja" ? "Ja" : "Nee"}
                />
                <InfoLine
                  label="Schuldendrempel"
                  value={euroValue(data.schuldenDrempel)}
                />
                <InfoLine
                  label="Toegepaste vrijstelling"
                  value={euroValue(data.toegepasteVrijstelling)}
                />
                <InfoLine
                  label={`WOZ-waarde x ${pctValue(DEFAULT_WOZ_BOX3)}`}
                  value={euroValue(data.boxWozComponent)}
                />
                <InfoLine
                  label={`Aftrekbare schuld x ${pctValue(
                    DEFAULT_FINANCIERING_BOX3
                  )}`}
                  value={costEuroValue(data.boxFinancieringComponent)}
                />
                <InfoLine
                  label="Rendementsgrondslag"
                  value={euroValue(data.rendementsgrondslag)}
                />
                <InfoLine
                  label="Grondslag na vrijstelling"
                  value={euroValue(data.grondslagNaVrijstelling)}
                  className="soft-highlight"
                />
                <InfoLine
                  label="Belastbaar forfaitair rendement"
                  value={euroValue(data.vermogensbelastingbasis)}
                />
                <InfoLine
                  label="Box-3 tarief"
                  value={pctValue(DEFAULT_BOX3_BELASTING)}
                />
                <InfoLine
                  label="Vermogensbelasting"
                  value={costEuroValue(data.vermogensbelasting)}
                  className="highlight"
                />
              </dl>

              <p className="note">
                De Box 3-berekening houdt rekening met fiscaal partner,
                schuldendrempel en het beschikbare heffingsvrije vermogen. Als
                het heffingsvrije vermogen al benut is, wordt er in dit rapport
                geen vrijstelling toegepast.
              </p>
            </article>

            <article className="wide-card">
              <SectionTitle number="05" title="Kasstroomopbouw" />
              <div className="bars">
                <CashflowBar
                  label="Huur per jaar"
                  value={data.huurPerJaar}
                  max={data.huurPerJaar}
                  type="income"
                />
                <CashflowBar
                  label="Rentelasten"
                  value={data.rentelasten}
                  max={data.huurPerJaar}
                  type="cost"
                />
                <CashflowBar
                  label="Exploitatiekosten"
                  value={data.exploitatiekosten}
                  max={data.huurPerJaar}
                  type="cost"
                />
                <CashflowBar
                  label="Vermogensbelasting"
                  value={data.vermogensbelasting}
                  max={data.huurPerJaar}
                  type="cost"
                />
                <CashflowBar
                  label="Netto huurinkomsten"
                  value={data.nettoHuur}
                  max={data.huurPerJaar}
                  type="income"
                />
              </div>
            </article>

            <article className="wide-card">
              <SectionTitle number="06" title="Belangrijk om mee te nemen" />
              <p>
                Een bruto percentage toont niet het volledige beeld. De
                jaarlijkse huur moet worden afgezet tegen financiering, vaste
                lasten, onderhoud, leegstand, belastingdruk en risico.
              </p>
              <p>
                Waardestijging kan het totale rendement verbeteren, maar is geen
                gegarandeerde kasstroom. Daarom wordt deze apart zichtbaar
                gemaakt.
              </p>
              <div className="callout">
                <span>Netto huurinkomsten</span>
                <strong>{signedEuroValue(data.nettoHuur)}</strong>
              </div>
              <div className="pill">
                <span>Totaal incl. waardestijging</span>
                <strong>{pctValue(data.totaalRendement)}</strong>
              </div>
            </article>
          </section>

<<<<<<< HEAD
          <footer>
            <span>{config.footerLabel}</span>
            <span>Pagina 2 / 2</span>
          </footer>
        </section>
      </main>
    </>
=======
          <div className="card tinted">
            <SectionTitle number="04" title="Box 3-uitgangspunt" />

            <div className="tax-list tax-list-compact">
              <InfoLine
                label="Fiscaal partner"
                value={data.fiscaalPartner ? "Ja" : "Nee"}
              />

              <InfoLine
                label="Heffingsvrij vermogen benut"
                value={data.heffingsvrijVermogenToepassen ? "Ja" : "Nee"}
              />

              <InfoLine
                label="Schuldendrempel"
                value={euroValue(data.toegepasteSchuldendrempel)}
              />

              <InfoLine
                label="Toegepaste vrijstelling"
                value={euroValue(data.toegepastHeffingsvrijVermogen)}
              />

              <InfoLine
                label={`WOZ-waarde x ${pctValue(data.box3WozPercentage)}`}
                value={euroValue(data.box3WozBedrag)}
              />

              <InfoLine
                label={`Aftrekbare schuld x ${pctValue(
                  data.box3FinancieringPercentage
                )}`}
                value={costEuroValue(data.box3FinancieringBedrag)}
              />

              <InfoLine
                label="Rendementsgrondslag"
                value={euroValue(data.box3Grondslag)}
              />

              <InfoLine
                label="Grondslag na vrijstelling"
                value={euroValue(data.grondslagSparenBeleggen)}
                strong
              />

              <InfoLine
                label="Belastbaar forfaitair rendement"
                value={euroValue(data.voordeelSparenBeleggen)}
              />

              <InfoLine
                label="Box-3 tarief"
                value={pctValue(data.box3BelastingPercentage)}
              />

              <InfoLine
                label="Vermogensbelasting"
                value={costEuroValue(data.vermogensbelastingPerJaar)}
                strong
              />
            </div>

            <p className="box3-note">
            Deze Box 3-berekening is gebaseerd op de huidige wet- en regelgeving. De toekomstige fiscale behandeling van vastgoed is onzeker: tarieven, vrijstellingen en de berekeningsmethode kunnen in de toekomst veranderen. 
            </p>
          </div>
        </section>

        <section className="page-two-grid lower">
          <div className="card">
            <SectionTitle number="05" title="Kasstroomopbouw" />

            <Bar
              label="Huur per jaar"
              value={data.huurPerJaar}
              max={data.huurPerJaar}
              positive
            />
            <Bar
              label="Rentelasten"
              value={data.rentelastenPerJaar}
              max={data.huurPerJaar}
            />
            <Bar
              label="Exploitatiekosten"
              value={data.exploitatiekostenTotaal}
              max={data.huurPerJaar}
            />
            <Bar
              label="Vermogensbelasting"
              value={data.vermogensbelastingPerJaar}
              max={data.huurPerJaar}
            />
            <Bar
              label="Netto huurinkomsten"
              value={data.nettoHuurinkomsten}
              max={data.huurPerJaar}
              positive
            />
          </div>

          <div className="card text-card">
  <SectionTitle number="06" title="Risico en weerbaarheid" />

  <p>
    Van de <strong>{euroValue(data.huurPerJaar)}</strong> bruto jaarhuur gaat
    in dit rekenvoorbeeld{" "}
    <strong>
      {euroValue(
        Math.abs(toNumber(data.rentelastenPerJaar)) +
          Math.abs(toNumber(data.exploitatiekostenTotaal)) +
          Math.abs(toNumber(data.vermogensbelastingPerJaar))
      )}
    </strong>{" "}
    op aan rente, exploitatiekosten en vermogensbelasting. Daardoor blijft
    ongeveer{" "}
    <strong>
      {pctValue(
        data.huurPerJaar !== null && data.huurPerJaar !== 0
          ? toNumber(data.nettoHuurinkomsten) / data.huurPerJaar
          : null
      )}
    </strong>{" "}
    van de huur als directe netto kasstroom over. Anders gezegd: van iedere
    euro aan huurinkomsten resteert circa{" "}
    <strong>
    {euroDecimalValue(
        data.huurPerJaar !== null && data.huurPerJaar !== 0
          ? toNumber(data.nettoHuurinkomsten) / data.huurPerJaar
          : null
      )}
    </strong>{" "}
    netto.
  </p>

  <p>
    Deze uitkomst is een momentopname. Langere leegstand, onverwacht onderhoud,
    hogere financieringslasten of wijzigingen in de fiscale regelgeving kunnen
    de kasstroom verder verlagen. Het aanhouden van een voldoende
    liquiditeitsbuffer blijft daarom belangrijk.
  </p>

  <div className="closing-box">
    <span>Netto per € 1 huur</span>
    <strong>
    {euroDecimalValue(
        data.huurPerJaar !== null && data.huurPerJaar !== 0
          ? toNumber(data.nettoHuurinkomsten) / data.huurPerJaar
          : null
      )}
    </strong>
  </div>

  <div className="closing-box soft">
    <span>Kosten en belasting</span>
    <strong>
      {euroValue(
        Math.abs(toNumber(data.rentelastenPerJaar)) +
          Math.abs(toNumber(data.exploitatiekostenTotaal)) +
          Math.abs(toNumber(data.vermogensbelastingPerJaar))
      )}
    </strong>
  </div>
</div>
        </section>

        <footer className="footer">
          <span>{config.footerLabel}</span>
          <span>Pagina 2 / 2</span>
        </footer>
      </article>
    </main>
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "number",
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  step?: string;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
<<<<<<< HEAD
=======
  label,
  value,
  onChange,
}: {
  label: string;
  value: "ja" | "nee";
  onChange: (value: "ja" | "nee") => void;
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as "ja" | "nee")}
      >
        <option value="ja">Ja</option>
        <option value="nee">Nee</option>
      </select>
    </label>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="section-title">
      <span>{number}</span>
      <h3>{title}</h3>
    </div>
  );
}

function InfoLine({
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
}) {
  return (
    <label>
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value as YesNo)}
      >
        <option value="nee">Nee</option>
        <option value="ja">Ja</option>
      </select>
    </label>
  );
}

function Metric({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text: string;
}) {
  return (
    <article className="metric">
      <h2>{label}</h2>
      <strong>{value}</strong>
      <p>{text}</p>
    </article>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="section-title">
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}

function InfoLine({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className || undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CashflowBar({
  label,
  value,
  max,
  type,
}: {
  label: string;
  value: number;
  max: number;
  type: "income" | "cost";
}) {
  const width = max
    ? Math.max(4, Math.min(100, (Math.abs(value) / Math.abs(max)) * 100))
    : 4;

  return (
    <div className="bar-row">
      <div className="bar-label">
        <span>{label}</span>
        <strong>
          {type === "cost" ? costEuroValue(value) : signedEuroValue(value)}
        </strong>
      </div>
      <div className="track">
        <span className={`fill ${type}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

const styles = `
  :root {
    --paper: #f6f2ea;
    --ink: #050505;
    --muted: #796d61;
    --line: #d9d1c6;
    --panel: #f9f6ef;
    --soft: #e9e8e3;
    --dark: #2b2724;
    --taupe: #8b7f73;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    background: #d8d7d1;
    color: var(--ink);
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    line-height: 1.45;
  }

  .case-editor {
    width: min(calc(100% - 40px), 980px);
    margin: 28px auto 0;
    padding: 22px;
    border: 1px solid var(--line);
    border-radius: 22px;
    background: rgba(246, 242, 234, 0.96);
    box-shadow: 0 14px 46px rgba(32, 31, 28, 0.14);
  }

  .case-editor h2 {
    margin-bottom: 18px;
    font-size: 24px;
    font-weight: 400;
  }

  .case-editor form {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .case-editor label {
    display: grid;
    gap: 5px;
    color: #5f554c;
    font-size: 12px;
    font-weight: 800;
  }

<<<<<<< HEAD
  .case-editor input,
  .case-editor select {
=======
  .input-field input,
  .input-field select {
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
    width: 100%;
    min-height: 38px;
    padding: 9px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #fffdf8;
    color: var(--ink);
    font: inherit;
  }

<<<<<<< HEAD
  .case-editor input:focus,
  .case-editor select:focus {
    outline: 2px solid rgba(139, 127, 115, 0.3);
    outline-offset: 1px;
    border-color: var(--taupe);
  }

  .case-editor button {
    min-height: 38px;
    align-self: end;
    border: 0;
    border-radius: 10px;
    background: var(--dark);
    color: white;
    cursor: pointer;
    font: inherit;
    font-weight: 800;
  }

  .case-editor button[type="button"] {
    border: 1px solid var(--line);
    background: var(--soft);
    color: var(--ink);
  }

  .report {
    display: grid;
    gap: 34px;
    padding: 32px 20px 58px;
  }

  .page {
    width: min(100%, 980px);
    min-height: 1320px;
    margin: 0 auto;
    padding: 54px 56px 36px;
=======
  .input-field select {
    cursor: pointer;
  }

  .input-field input:focus,
  .input-field select:focus {
    border-color: rgba(106, 93, 82, 0.62);
    box-shadow: 0 0 0 3px rgba(183, 172, 155, 0.22);
  }

  .expense-input-section {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid rgba(106, 93, 82, 0.18);
  }

  .expense-input-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: baseline;
    margin-bottom: 12px;
  }

  .expense-input-head strong {
    font-size: 15px;
  }

  .expense-input-head span {
    color: var(--walnut);
    font-size: 12px;
    font-weight: 700;
  }

  .expense-input-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .sheet {
    width: 210mm;
    height: 297mm;
    margin: 0 auto 28px auto;
    padding: 12mm;
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
    background: var(--paper);
    box-shadow: 0 24px 70px rgba(32, 31, 28, 0.18);
  }

  .hero {
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 44px;
    align-items: center;
    min-height: 190px;
    padding: 34px 36px;
    border-radius: 32px;
    background:
      radial-gradient(circle at 68% 35%, rgba(255, 255, 255, 0.13), transparent 24%),
      linear-gradient(135deg, #1e1c19, #5b5149);
    color: white;
  }

  .brand {
    margin: 0 0 12px;
    color: #d7b98e;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 10px;
    font-size: 45px;
    line-height: 0.98;
    font-weight: 400;
    letter-spacing: 0;
  }

  .hero-copy {
    max-width: 470px;
    margin-bottom: 0;
    font-weight: 700;
  }

  .object-card {
    min-height: 124px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.42);
    border-radius: 22px;
  }

  .object-card p {
    margin-bottom: 12px;
    color: #d7b98e;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  .object-card strong,
  .object-card span {
    display: block;
  }

  .object-card strong {
    margin-bottom: 10px;
    font-size: 16px;
  }

  .warning-box {
    margin-top: 24px;
    padding: 16px 18px;
    border: 1px solid #cbbcae;
    border-radius: 16px;
    background: #eee4d7;
  }

  .warning-box p {
    margin-bottom: 6px;
  }

  .warning-box p:last-child {
    margin-bottom: 0;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
    margin: 32px 0;
  }

  .metric,
  .property-panel,
  .check-panel,
  .text-panel,
  .wide-card,
  .muted-card {
    border: 1px solid var(--line);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.34);
  }

  .metric {
    min-height: 138px;
    padding: 20px 18px;
  }

  .metric h2 {
    margin-bottom: 8px;
    color: #63574d;
    font-size: 12px;
    font-weight: 800;
  }

  .metric strong {
    display: block;
    margin-bottom: 8px;
    font-size: 25px;
  }

  .metric p {
    margin-bottom: 0;
    color: #3d3934;
    font-size: 12px;
  }

  .main-grid {
    display: grid;
    grid-template-columns: 330px 1fr;
    gap: 34px;
  }

  .property-panel {
    padding: 24px;
    background: var(--soft);
  }

  .property-panel img {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 0.98;
    object-fit: cover;
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(120, 111, 98, 0.18), rgba(255, 255, 255, 0.52)),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='520' viewBox='0 0 640 520'%3E%3Crect width='640' height='520' fill='%23dedbd2'/%3E%3Cpath d='M74 454h492V206L322 91 74 208z' fill='%23847769'/%3E%3Cpath d='M106 227h128v227H106zM275 168h258v286H275z' fill='%23a79b8a'/%3E%3Cg fill='%232a2928'%3E%3Crect x='133' y='254' width='65' height='74'/%3E%3Crect x='133' y='356' width='65' height='74'/%3E%3Crect x='314' y='205' width='67' height='86'/%3E%3Crect x='421' y='205' width='67' height='86'/%3E%3Crect x='314' y='329' width='67' height='90'/%3E%3Crect x='421' y='329' width='67' height='90'/%3E%3C/g%3E%3Cpath d='M54 454h532v38H54z' fill='%23675f55'/%3E%3Cpath d='M52 458c55-30 114-42 177-32 82 14 123-44 210-31 61 9 107 36 153 63z' fill='%235e744f'/%3E%3C/svg%3E");
    background-size: cover;
  }

  dl {
    margin: 0;
  }

  .property-panel dl {
    margin-top: 18px;
  }

  .property-panel dl > div,
  .line-list > div {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 9px 0;
    border-bottom: 1px solid #cdc5b9;
  }

  dt {
    color: #3c3732;
  }

  dd {
    margin: 0;
    font-weight: 800;
    text-align: right;
  }

  .check-panel,
  .text-panel,
  .wide-card,
  .muted-card {
    padding: 24px 26px;
  }

  .section-title {
    display: flex;
    align-items: baseline;
    gap: 14px;
    margin-bottom: 20px;
  }

  .section-title span {
    color: #7e6d5d;
    font-size: 18px;
  }

  .section-title h2 {
    margin-bottom: 0;
    font-size: 22px;
    font-weight: 400;
  }

  .line-list > div.highlight {
    margin: 5px -10px;
    padding: 9px 10px;
    border: 0;
    border-radius: 10px;
    background: var(--taupe);
    color: white;
  }

  .line-list > div.highlight dt {
    color: white;
  }

  .line-list > div.soft-highlight {
    margin: 5px -10px;
    padding: 9px 10px;
    border: 0;
    border-radius: 10px;
    background: #e6e4dd;
  }

  .text-panel {
    margin-top: 34px;
  }

  .text-panel p:last-child,
  .wide-card p:last-child,
  .muted-card p:last-child {
    margin-bottom: 0;
  }

  footer {
    display: flex;
    justify-content: space-between;
<<<<<<< HEAD
    margin-top: 34px;
    padding-top: 22px;
    border-top: 1px solid var(--line);
    color: #8e8479;
    font-size: 12px;
    letter-spacing: 1px;
=======
    gap: 5mm;
    padding: 1.42mm 0;
    border-bottom: 1px solid rgba(151, 144, 134, 0.28);
    font-size: 7.85pt;
    line-height: 1.08;
  }

  .calc-row strong {
    white-space: nowrap;
  }

  .soft-row {
    background: rgba(226, 226, 222, 0.88);
    margin: 1mm -2mm;
    padding: 1.7mm 2mm;
    border-radius: 2.5mm;
    border-bottom: none;
  }

  .main-row {
    background: rgba(106, 93, 82, 0.88);
    color: var(--white);
    margin: 1mm -2mm;
    padding: 1.8mm 2mm;
    border-radius: 2.5mm;
    border-bottom: none;
  }

  .main-row span,
  .main-row strong {
    color: var(--white);
  }

  .kernbeeld {
    flex: 1;
  }

  .text-card {
  font-size: 8.1pt;
  line-height: 1.32;
}

.text-card p {
  margin: 0 0 2.2mm 0;
}

  .footer {
    margin-top: auto;
    padding-top: 3mm;
    border-top: 1px solid rgba(151, 144, 134, 0.28);
    display: flex;
    justify-content: space-between;
    color: var(--ash);
    font-size: 7pt;
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
    text-transform: uppercase;
  }

  .sub-hero {
    display: grid;
    grid-template-columns: 1fr 250px;
    gap: 34px;
    align-items: center;
    min-height: 170px;
    margin-bottom: 32px;
    padding: 34px;
    border: 1px solid var(--line);
    border-radius: 30px;
    background: var(--soft);
  }

  .sub-hero h1 {
    max-width: 520px;
    font-size: 34px;
    line-height: 1.05;
  }

  .sub-hero aside {
    padding-left: 30px;
    border-left: 1px solid #c9c0b4;
  }

  .sub-hero aside span,
  .sub-hero aside strong {
    display: block;
  }

  .sub-hero aside strong {
    margin-top: 12px;
    font-size: 24px;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: 32px;
  }

  .muted-card {
    background: var(--soft);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 22px;
  }

  th {
    color: #6d5e52;
    font-size: 12px;
    letter-spacing: 2px;
    text-align: left;
    text-transform: uppercase;
  }

  th,
  td {
    padding: 11px 0;
    border-top: 1px solid #d7cec2;
  }

  td:nth-child(2),
  td:nth-child(3),
  th:nth-child(2),
  th:nth-child(3) {
    text-align: right;
    font-weight: 800;
  }

  .cost-input {
    width: 110px;
    padding: 6px 0;
    border: 0;
    border-bottom: 1px solid #d7cec2;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    text-align: right;
  }

  .cost-input:focus {
    outline: 0;
    border-bottom-color: var(--taupe);
  }

  .compact > div {
    padding: 11px 0;
  }

  .note {
    margin-top: 28px;
    padding: 22px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--panel);
    font-size: 13px;
  }

  .bars {
    display: grid;
    gap: 17px;
  }

  .bar-row {
    display: grid;
    gap: 7px;
  }

  .bar-label {
    display: flex;
    justify-content: space-between;
    gap: 18px;
  }

  .track {
    height: 13px;
    overflow: hidden;
    border-radius: 99px;
    background: #e1dfd9;
  }

  .fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #5c5954;
  }

  .fill.cost {
    background: #978d83;
  }

  .callout,
  .pill {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    margin-top: 22px;
    padding: 17px 19px;
    border-radius: 16px;
  }

  .callout {
    background: var(--taupe);
    color: white;
  }

  .pill {
    border: 1px solid var(--line);
    background: var(--soft);
  }

  @media (max-width: 880px) {
    .page {
      min-height: auto;
      padding: 28px 18px;
    }

    .hero,
    .sub-hero,
    .main-grid,
    .detail-grid {
      grid-template-columns: 1fr;
    }

    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .case-editor form {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    h1 {
      font-size: 38px;
    }

    .sub-hero aside {
      padding-left: 0;
      border-left: 0;
    }
  }

  @media (max-width: 560px) {
    .case-editor {
      width: 100%;
      margin-top: 0;
      border-radius: 0;
    }

    .report {
      padding: 0;
    }

    .page {
      width: 100%;
      border-radius: 0;
      box-shadow: none;
    }

    .summary-grid,
    .case-editor form {
      grid-template-columns: 1fr;
    }

    .hero {
      padding: 28px 22px;
      border-radius: 24px;
    }

    h1 {
      font-size: 34px;
    }

    footer {
      gap: 16px;
      flex-direction: column;
    }
  }

  @page {
    size: A4;
    margin: 0;
  }

  @media print {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      background: white !important;
    }

    .no-print,
    .case-editor {
      display: none !important;
    }

    .report {
      display: block;
      width: 210mm;
      padding: 0;
      overflow: visible;
    }

    .page {
      width: 980px;
      height: 1600px;
      min-height: 0;
      margin: 0;
      padding: 54px 56px 36px;
      background: var(--paper);
      box-shadow: none;
      overflow: visible;
      zoom: 0.7;
      break-after: page;
      page-break-after: always;
    }

    .page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .metric,
    .property-panel,
    .check-panel,
    .text-panel,
    .wide-card,
    .muted-card {
      break-inside: avoid;
      page-break-inside: avoid;
=======
  html,
  body {
    width: 210mm !important;
    min-width: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: var(--paper) !important;
=======
    html,
    body {
      width: 210mm;
      margin: 0 !important;
      padding: 0 !important;
      background: var(--paper) !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .no-print {
      display: none !important;
    }

    .screen {
      padding: 0 !important;
      background: var(--paper) !important;
    }

    .sheet {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      border: none !important;
      page-break-after: always;
      break-after: page;
    }

    .sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
>>>>>>> 36e4478 (Mooie printlayout herstellen)
=======
  .no-print {
    display: none !important;
>>>>>>> 92d1873 (Residentieel en bedrijfsmatig start analyse klaar voor feedabck)
  }

  html,
  body {
    width: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: var(--paper) !important;
  }

  .screen {
    width: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: var(--paper) !important;
  }

  .sheet {
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
    page-break-after: always !important;
    break-after: page !important;
  }

  .sheet:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}


  @media screen and (max-width: 900px) {
    .screen {
      padding: 16px;
      overflow-x: auto;
>>>>>>> f698cf6 (Huidige wijzigingen bewaren)
    }

    .input-grid,
    .expense-input-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .expense-input-head {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;