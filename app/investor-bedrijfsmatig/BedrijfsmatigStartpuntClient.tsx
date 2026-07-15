"use client";

import { useMemo, useState } from "react";

type MaybeNumber = number | null | undefined;

type ExpenseItem = {
  name: string;
  amount: MaybeNumber;
  percentOfRent: MaybeNumber;
};

export type ReportData = {
  objectNaam: string;
  adres: string;
  afbeeldingUrl: string;

  // Beginwaarden uit page.tsx
  marktwaardeVastgoed: MaybeNumber;
  wozWaardeVastgoed: MaybeNumber;
  financiering: MaybeNumber;
  huurPerMaand: MaybeNumber;
  rentePercentage: MaybeNumber;

  box3WozPercentage: MaybeNumber;
  box3FinancieringPercentage: MaybeNumber;
  box3BelastingPercentage: MaybeNumber;
  gemiddeldeWaardestijging: MaybeNumber;

  fiscaalPartner?: boolean;
  heffingsvrijVermogenToepassen?: boolean;

  exploitatiekosten: ExpenseItem[];
  waarschuwingen: string[];

  // Deze waarden worden in de client berekend
  eigenInleg?: MaybeNumber;
  huurPerJaar?: MaybeNumber;
  brutoRendementMarktwaarde?: MaybeNumber;

  rentelastenPerJaar?: MaybeNumber;
  naRenteResteert?: MaybeNumber;

  vermogensbelastingPercentage?: MaybeNumber;
  vermogensbelastingbasis?: string;
  vermogensbelastingPerJaar?: MaybeNumber;

  box3WozBedrag?: MaybeNumber;
  box3FinancieringBedrag?: MaybeNumber;

  schuldendrempelPerPersoon?: MaybeNumber;
  toegepasteSchuldendrempel?: MaybeNumber;
  aftrekbareBox3Schuld?: MaybeNumber;

  heffingsvrijVermogenZonderPartner?: MaybeNumber;
  heffingsvrijVermogenMetPartner?: MaybeNumber;
  toegepastHeffingsvrijVermogen?: MaybeNumber;

  box3Grondslag?: MaybeNumber;
  grondslagSparenBeleggen?: MaybeNumber;
  aandeelBelastbareGrondslag?: MaybeNumber;
  belastbaarRendement?: MaybeNumber;
  voordeelSparenBeleggen?: MaybeNumber;

  exploitatiekostenTotaal?: MaybeNumber;
  exploitatiekostenPercentage?: MaybeNumber;

  nettoHuurinkomsten?: MaybeNumber;
  nettoRendementMarktwaarde?: MaybeNumber;
  rendementOpEigenInleg?: MaybeNumber;
  totaalRendementInclWaardestijging?: MaybeNumber;
};

export type StartpuntConfig = {
  title: string;
  subtitle: string;
  footerLabel: string;
};

type FormState = {
  objectNaam: string;
  adres: string;
  marktwaardeVastgoed: string;
  wozWaardeVastgoed: string;
  financiering: string;
  huurPerMaand: string;
  rentePercentage: string;
  box3WozPercentage: string;
  box3FinancieringPercentage: string;
  box3BelastingPercentage: string;
  gemiddeldeWaardestijging: string;
  fiscaalPartner: "ja" | "nee";
  heffingsvrijVermogenToepassen: "ja" | "nee";
  exploitatiekosten: string[];
};


const DEFAULT_EXPENSES: ExpenseItem[] = [
  { name: "OZB eigenaar", amount: -950, percentOfRent: null },
  { name: "Waterschapslasten", amount: -65, percentOfRent: null },
  { name: "Opstalverzekering", amount: -600, percentOfRent: null },
  { name: "Reservering groot onderhoud", amount: -3000, percentOfRent: null },
  { name: "Beheer en administratie", amount: -660, percentOfRent: null },
  { name: "Juridisch / overige kosten", amount: -350, percentOfRent: null },
  { name: "Leegstand / wanbetaling", amount: -765, percentOfRent: null },
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

const euroValue = (value: MaybeNumber) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return euro(value);
};

const euroDecimalValue = (value: MaybeNumber) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const costEuroValue = (value: MaybeNumber) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (Math.abs(value) < 0.005) return euro(0);
  return `- ${euro(Math.abs(value))}`;
};

const pctValue = (value: MaybeNumber) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("nl-NL", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

const pctAbsValue = (value: MaybeNumber) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("nl-NL", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
};

function toNumber(value: MaybeNumber) {
  return value ?? 0;
}

function numberToInput(value: MaybeNumber) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return String(Math.round(value));
}

function percentToInput(value: MaybeNumber, fallback: number) {
  const normalized =
    value === null || value === undefined || Number.isNaN(value)
      ? fallback
      : value;

  return String(Number((normalized * 100).toFixed(2))).replace(".", ",");
}

function parseInputNumber(value: string): MaybeNumber {
  const cleaned = value
    .trim()
    .replace(/[^\d,.\-−–—]/g, "")
    .replace(/[−–—]/g, "-");

  if (!cleaned) return null;

  let normalized = cleaned;

  if (normalized.includes(".") && normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function parseInputPercent(value: string): MaybeNumber {
  const parsed = parseInputNumber(value);

  if (parsed === null || parsed === undefined) return null;

  if (Math.abs(parsed) > 1) return parsed / 100;

  return parsed;
}

function createInitialForm(initialData: ReportData): FormState {
  return {
    objectNaam: initialData.objectNaam ?? "",
    adres: initialData.adres ?? "",
    marktwaardeVastgoed: numberToInput(initialData.marktwaardeVastgoed),
    wozWaardeVastgoed: numberToInput(initialData.wozWaardeVastgoed),
    financiering: numberToInput(initialData.financiering),
    huurPerMaand: numberToInput(initialData.huurPerMaand),
    rentePercentage: percentToInput(initialData.rentePercentage, 0.055),
    box3WozPercentage: percentToInput(initialData.box3WozPercentage, 0.06),
    box3FinancieringPercentage: percentToInput(
      initialData.box3FinancieringPercentage,
      0.027
    ),
    box3BelastingPercentage: percentToInput(
      initialData.box3BelastingPercentage,
      0.36
    ),
    gemiddeldeWaardestijging: percentToInput(
      initialData.gemiddeldeWaardestijging,
      0.03
    ),
    fiscaalPartner: initialData.fiscaalPartner ? "ja" : "nee",
    heffingsvrijVermogenToepassen:
      initialData.heffingsvrijVermogenToepassen ? "ja" : "nee",
    exploitatiekosten: getExpenseSource(initialData).map((item) =>
      numberToInput(item.amount == null ? null : Math.abs(item.amount))
    ),
  };
}

export default function BedrijfsmatigStartpuntClient({
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

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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
    );
    const box3BelastingPercentage = parseInputPercent(
      form.box3BelastingPercentage
    );
    const gemiddeldeWaardestijging = parseInputPercent(
      form.gemiddeldeWaardestijging
    );

    const fiscaalPartner = form.fiscaalPartner === "ja";
    const heffingsvrijVermogenToepassen =
      form.heffingsvrijVermogenToepassen === "ja";

    const schuldendrempelPerPersoon = 3800;
    const heffingsvrijVermogenZonderPartner = 59357;
    const heffingsvrijVermogenMetPartner = 118714;

    const huurPerJaar =
  huurPerMaand != null ? huurPerMaand * 12 : null;

const brutoRendementMarktwaarde =
  huurPerJaar != null &&
  marktwaardeVastgoed != null &&
  marktwaardeVastgoed !== 0
    ? huurPerJaar / marktwaardeVastgoed
    : null;

const eigenInleg =
  marktwaardeVastgoed != null && financiering != null
    ? marktwaardeVastgoed - financiering
    : null;

const rentelastenPerJaar =
  financiering != null && rentePercentage != null
    ? -Math.abs(financiering) * rentePercentage
    : null;

const naRenteResteert =
  huurPerJaar != null && rentelastenPerJaar != null
    ? huurPerJaar + rentelastenPerJaar
    : null;

const expenseInputs = form.exploitatiekosten ?? [];

const exploitatiekosten = expenseSource.map(
  (item, index): ExpenseItem => {
    const enteredAmount = parseInputNumber(expenseInputs[index] ?? "");

    const amount =
      enteredAmount != null
        ? -Math.abs(enteredAmount)
        : null;

    return {
      name: item.name,
      amount,
      percentOfRent:
        amount != null &&
        huurPerJaar != null &&
        huurPerJaar !== 0
          ? amount / huurPerJaar
          : null,
    };
  }
);

const exploitatiekostenTotaal =
  exploitatiekosten.every((item) => item.amount != null)
    ? exploitatiekosten.reduce(
        (total, item) => total + toNumber(item.amount),
        0
      )
    : null;

const exploitatiekostenPercentage =
  exploitatiekostenTotaal != null &&
  huurPerJaar != null &&
  huurPerJaar !== 0
    ? exploitatiekostenTotaal / huurPerJaar
    : null;

const toegepasteSchuldendrempel = fiscaalPartner
  ? schuldendrempelPerPersoon * 2
  : schuldendrempelPerPersoon;

const aftrekbareBox3Schuld =
  financiering != null
    ? Math.max(
        0,
        Math.abs(financiering) - toegepasteSchuldendrempel
      )
    : null;

const box3WozBedrag =
  wozWaardeVastgoed != null &&
  box3WozPercentage != null
    ? Math.abs(wozWaardeVastgoed) * box3WozPercentage
    : null;

const box3FinancieringBedrag =
  aftrekbareBox3Schuld != null &&
  box3FinancieringPercentage != null
    ? aftrekbareBox3Schuld * box3FinancieringPercentage
    : null;

const toegepastHeffingsvrijVermogen =
  heffingsvrijVermogenToepassen
    ? fiscaalPartner
      ? heffingsvrijVermogenMetPartner
      : heffingsvrijVermogenZonderPartner
    : 0;

const box3Grondslag =
  wozWaardeVastgoed != null &&
  aftrekbareBox3Schuld != null
    ? Math.max(
        0,
        Math.abs(wozWaardeVastgoed) - aftrekbareBox3Schuld
      )
    : null;

const grondslagSparenBeleggen =
  box3Grondslag != null
    ? Math.max(
        0,
        box3Grondslag - toegepastHeffingsvrijVermogen
      )
    : null;

const aandeelBelastbareGrondslag =
  box3Grondslag != null &&
  grondslagSparenBeleggen != null
    ? box3Grondslag === 0
      ? 0
      : grondslagSparenBeleggen / box3Grondslag
    : null;

const belastbaarRendement =
  box3WozBedrag != null &&
  box3FinancieringBedrag != null
    ? box3WozBedrag - box3FinancieringBedrag
    : null;

const voordeelSparenBeleggen =
  belastbaarRendement != null &&
  aandeelBelastbareGrondslag != null
    ? belastbaarRendement * aandeelBelastbareGrondslag
    : null;

const vermogensbelastingPerJaar =
  voordeelSparenBeleggen != null &&
  box3BelastingPercentage != null
    ? -Math.abs(
        voordeelSparenBeleggen * box3BelastingPercentage
      )
    : null;

const nettoHuurinkomsten =
  huurPerJaar != null &&
  rentelastenPerJaar != null &&
  exploitatiekostenTotaal != null &&
  vermogensbelastingPerJaar != null
    ? huurPerJaar +
      rentelastenPerJaar +
      exploitatiekostenTotaal +
      vermogensbelastingPerJaar
    : null;

const nettoRendementMarktwaarde =
  nettoHuurinkomsten != null &&
  marktwaardeVastgoed != null &&
  marktwaardeVastgoed !== 0
    ? nettoHuurinkomsten / marktwaardeVastgoed
    : null;

const rendementOpEigenInleg =
  nettoHuurinkomsten != null &&
  eigenInleg != null &&
  eigenInleg !== 0
    ? nettoHuurinkomsten / eigenInleg
    : null;

const totaalRendementInclWaardestijging =
  rendementOpEigenInleg != null &&
  gemiddeldeWaardestijging != null
    ? rendementOpEigenInleg + gemiddeldeWaardestijging
    : null;

    return {
      ...initialData,
      objectNaam,
      adres,
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

  const calculationRows: Array<[string, string, "normal" | "soft" | "main"]> = [
    ["Marktwaarde vastgoed", euroValue(data.marktwaardeVastgoed), "normal"],
    ["WOZ-waarde vastgoed", euroValue(data.wozWaardeVastgoed), "normal"],
    ["Huur per maand", euroValue(data.huurPerMaand), "normal"],
    ["Huur per jaar", euroValue(data.huurPerJaar), "normal"],
    [
      "Bruto rendement marktwaarde",
      pctValue(data.brutoRendementMarktwaarde),
      "normal",
    ],
    ["Financiering", euroValue(data.financiering), "normal"],
    ["Rente", pctValue(data.rentePercentage), "normal"],
    ["Rentelasten per jaar", costEuroValue(data.rentelastenPerJaar), "normal"],
    ["Na rente resteert", euroValue(data.naRenteResteert), "soft"],
    [
      "Exploitatiekosten per jaar",
      costEuroValue(data.exploitatiekostenTotaal),
      "normal",
    ],
    [
      "Vermogensbelasting",
      costEuroValue(data.vermogensbelastingPerJaar),
      "normal",
    ],
    ["Netto huurinkomsten", euroValue(data.nettoHuurinkomsten), "main"],
    [
      "Netto rendement marktwaarde",
      pctValue(data.nettoRendementMarktwaarde),
      "normal",
    ],
    [
      "Rendement op eigen inleg",
      pctValue(data.rendementOpEigenInleg),
      "normal",
    ],
    [
      "Gemiddelde waardestijging",
      pctValue(data.gemiddeldeWaardestijging),
      "normal",
    ],
    [
      "Totaal rendement incl. waardestijging",
      pctValue(data.totaalRendementInclWaardestijging),
      "main",
    ],
  ];

  return (
    <main className="screen">
      <style>{styles}</style>

      <section className="input-panel no-print">
        <div className="input-panel-head">
          <div>
            <span>Live invoer</span>
            <strong>Startpunt analyse</strong>
          </div>

          <button type="button" onClick={resetForm}>
            Reset naar beginwaarden
          </button>
        </div>

        <div className="input-grid">
          <InputField
            label="Objectnaam"
            value={form.objectNaam}
            onChange={(value) => updateField("objectNaam", value)}
          />

          <InputField
            label="Adres"
            value={form.adres}
            onChange={(value) => updateField("adres", value)}
          />

          <label className="input-field image-input-field">
            <span>Afbeelding vastgoed</span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleImageUpload}
            />
          </label>

          <InputField
            label="Marktwaarde"
            value={form.marktwaardeVastgoed}
            onChange={(value) => updateField("marktwaardeVastgoed", value)}
          />

          <InputField
            label="WOZ-waarde"
            value={form.wozWaardeVastgoed}
            onChange={(value) => updateField("wozWaardeVastgoed", value)}
          />

          <InputField
            label="Financiering"
            value={form.financiering}
            onChange={(value) => updateField("financiering", value)}
          />

          <InputField
            label="Huur per maand"
            value={form.huurPerMaand}
            onChange={(value) => updateField("huurPerMaand", value)}
          />

          <InputField
            label="Rente %"
            value={form.rentePercentage}
            onChange={(value) => updateField("rentePercentage", value)}
          />

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
            {expenseSource.map((item, index) => (
              <InputField
                key={item.name}
                label={item.name}
                value={form.exploitatiekosten[index] ?? ""}
                onChange={(value) => updateExpense(index, value)}
              />
            ))}
          </div>
        </div>
      </section>

      <article className="sheet">
        <header className="hero">
          <div>
            <div className="kicker">L3 Capital</div>
            <h1>{config.title}</h1>
            <p>{config.subtitle}</p>
          </div>

          <div className="object-box">
            <span>Object</span>
            <strong>{data.objectNaam}</strong>
            <small>{data.adres}</small>
          </div>
        </header>

        {data.waarschuwingen.length > 0 && (
          <section className="warning-box">
            {data.waarschuwingen.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </section>
        )}

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
              />
              <InfoLine
                label="WOZ-waarde"
                value={euroValue(data.wozWaardeVastgoed)}
              />
              <InfoLine label="Eigen inleg" value={euroValue(data.eigenInleg)} />
            </div>
          </div>

          <div className="card calc-card">
            <SectionTitle number="01" title="Korte rendementscheck" />

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
            huurinkomsten van <strong>{euroValue(data.huurPerJaar)}</strong>{" "}
            gaan nog{" "}
            <strong>{euroValue(Math.abs(toNumber(data.rentelastenPerJaar)))}</strong>{" "}
            aan rente,{" "}
            <strong>{euroValue(Math.abs(toNumber(data.exploitatiekostenTotaal)))}</strong>{" "}
            aan exploitatiekosten en{" "}
            <strong>{euroValue(Math.abs(toNumber(data.vermogensbelastingPerJaar)))}</strong>{" "}
            aan vermogensbelasting af. In totaal verdwijnt daarmee{" "}
            <strong>
              {euroValue(
                Math.abs(toNumber(data.rentelastenPerJaar)) +
                  Math.abs(toNumber(data.exploitatiekostenTotaal)) +
                  Math.abs(toNumber(data.vermogensbelastingPerJaar))
              )}
            </strong>
            , oftewel{" "}
            <strong>
              {pctAbsValue(
                data.huurPerJaar != null &&
                  data.huurPerJaar !== undefined &&
                  data.huurPerJaar !== 0
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
            <strong>
              {data.gemiddeldeWaardestijging === null ||
              data.gemiddeldeWaardestijging === undefined
                ? "—"
                : `${(data.gemiddeldeWaardestijging * 100)
                    .toFixed(1)
                    .replace(".", ",")} procentpunt`}
            </strong>{" "}
            uit de verwachte waardestijging van het vastgoed. Dit is geen
            directe kasstroom en komt pas beschikbaar bij verkoop of
            herfinanciering. De directe kasstroom uit verhuur bedraagt daarom{" "}
            <strong>{pctValue(data.rendementOpEigenInleg)}</strong>, oftewel{" "}
            <strong>
              {euroValue(
                data.rendementOpEigenInleg != null &&
                  data.rendementOpEigenInleg !== undefined &&
                  data.marktwaardeVastgoed != null &&
                  data.marktwaardeVastgoed !== undefined &&
                  data.financiering != null &&
                  data.financiering !== undefined
                  ? data.rendementOpEigenInleg *
                    (data.marktwaardeVastgoed - data.financiering)
                  : null
              )}
            </strong>{" "}
            per jaar.
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
              In dit rekenvoorbeeld bedragen de exploitatiekosten samen{" "}
              <strong>{costEuroValue(data.exploitatiekostenTotaal)}</strong>.
              Dat is{" "}
              <strong>{pctAbsValue(data.exploitatiekostenPercentage)}</strong>{" "}
              van de jaarlijkse huurinkomsten.
            </p>

            <div className="expense-table">
              <div className="expense-head">
                <span>Kostenpost</span>
                <span>Jaarbedrag</span>
                <span>% huur</span>
              </div>

              {data.exploitatiekosten.map((item) => (
                <div className="expense-row" key={item.name}>
                  <span>{item.name}</span>
                  <strong>{costEuroValue(item.amount)}</strong>
                  <strong>{pctAbsValue(item.percentOfRent)}</strong>
                </div>
              ))}
            </div>
          </div>

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
              Deze Box 3-berekening is gebaseerd op de huidige uitgangspunten.
              Tarieven, vrijstellingen en de berekeningsmethode kunnen in de
              toekomst wijzigen.
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
              Van de <strong>{euroValue(data.huurPerJaar)}</strong> bruto
              jaarhuur gaat in dit rekenvoorbeeld{" "}
              <strong>
                {euroValue(
                  Math.abs(toNumber(data.rentelastenPerJaar)) +
                    Math.abs(toNumber(data.exploitatiekostenTotaal)) +
                    Math.abs(toNumber(data.vermogensbelastingPerJaar))
                )}
              </strong>{" "}
              op aan rente, exploitatiekosten en vermogensbelasting. Daardoor
              blijft ongeveer{" "}
              <strong>
              {pctValue(
  data.huurPerJaar != null && data.huurPerJaar !== 0
    ? toNumber(data.nettoHuurinkomsten) / data.huurPerJaar
    : null
)}
              </strong>{" "}
              van de huur als directe netto kasstroom over. Anders gezegd: van
              iedere euro aan huurinkomsten resteert circa{" "}
              <strong>
                {euroDecimalValue(
                  data.huurPerJaar != null && data.huurPerJaar !== 0
                    ? toNumber(data.nettoHuurinkomsten) / data.huurPerJaar
                    : null
                )}
              </strong>{" "}
              netto.
            </p>

            <p>
              Deze uitkomst is een momentopname. Langere leegstand, onverwacht
              onderhoud, hogere financieringslasten of wijzigingen in de fiscale
              regelgeving kunnen de kasstroom verder verlagen. Het aanhouden van
              een voldoende liquiditeitsbuffer blijft daarom belangrijk.
            </p>

            <div className="closing-box">
              <span>Netto per € 1 huur</span>
              <strong>
                {euroDecimalValue(
                  data.huurPerJaar != null && data.huurPerJaar !== 0
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
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
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
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "info-line strong" : "info-line"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function KpiCard({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  positive = false,
}: {
  label: string;
  value: MaybeNumber;
  max: MaybeNumber;
  positive?: boolean;
}) {
  const valueNumber = Math.abs(toNumber(value));
  const maxNumber = Math.abs(toNumber(max));
  const width =
    maxNumber > 0 ? Math.min((valueNumber / maxNumber) * 100, 100) : 0;

  return (
    <div className="bar">
      <div className="bar-top">
        <span>{label}</span>
        <strong>{positive ? euroValue(value) : costEuroValue(value)}</strong>
      </div>
      <div className="bar-track">
        <div
          className={positive ? "bar-fill positive" : "bar-fill"}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

const styles = `
  :root {
    --onyx: ${colors.onyx};
    --walnut: ${colors.walnut};
    --ash: ${colors.ash};
    --greige: ${colors.greige};
    --stucco: ${colors.stucco};
    --paper: ${colors.paper};
    --card: ${colors.card};
    --soft: ${colors.soft};
    --white: ${colors.white};
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    background: var(--stucco);
    font-family: Arial, Helvetica, sans-serif;
    color: var(--onyx);
  }

  .screen {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(183, 172, 155, 0.28), transparent 34%),
      var(--stucco);
  }

  .input-panel {
    width: 210mm;
    margin: 0 auto 22px auto;
    padding: 18px;
    border-radius: 22px;
    background: rgba(250, 248, 243, 0.94);
    border: 1px solid rgba(106, 93, 82, 0.18);
    box-shadow: 0 14px 36px rgba(28, 28, 27, 0.1);
  }

  .input-panel-head {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
    margin-bottom: 14px;
  }

  .input-panel-head span {
    display: block;
    color: var(--walnut);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .input-panel-head strong {
    display: block;
    color: var(--onyx);
    font-size: 20px;
  }

  .input-panel-head button {
    border: 1px solid rgba(106, 93, 82, 0.22);
    background: var(--onyx);
    color: var(--white);
    border-radius: 999px;
    padding: 10px 15px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  .input-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .input-field {
    display: grid;
    gap: 6px;
  }

  .input-field span {
    color: var(--walnut);
    font-size: 12px;
    font-weight: 800;
  }

  .input-field input,
  .input-field select {
    width: 100%;
    border: 1px solid rgba(106, 93, 82, 0.24);
    background: var(--white);
    color: var(--onyx);
    border-radius: 11px;
    padding: 10px 11px;
    font-size: 14px;
    outline: none;
  }

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
    background: var(--paper);
    border: 1px solid rgba(106, 93, 82, 0.18);
    box-shadow: 0 18px 50px rgba(28, 28, 27, 0.13);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 7mm;
  }

  .hero {
    min-height: 43mm;
    padding: 8mm;
    border-radius: 8mm;
    background:
      linear-gradient(135deg, rgba(28, 28, 27, 0.94), rgba(106, 93, 82, 0.84)),
      var(--onyx);
    color: var(--white);
    display: grid;
    grid-template-columns: 1fr 56mm;
    gap: 8mm;
    align-items: center;
  }

  .kicker {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--greige);
    font-weight: 800;
    margin-bottom: 3mm;
  }

  .kicker.dark {
    color: var(--walnut);
    margin-bottom: 2mm;
  }

  h1 {
    margin: 0;
    font-size: 29pt;
    line-height: 1;
    letter-spacing: -0.035em;
  }

  .hero p {
    margin: 3mm 0 0 0;
    max-width: 118mm;
    color: var(--stucco);
    font-size: 9pt;
    line-height: 1.4;
  }

  .object-box {
    width: 56mm;
    justify-self: center;
    align-self: center;
    transform: translateY(-3mm);
    border: 1px solid rgba(226, 226, 222, 0.42);
    border-radius: 5mm;
    padding: 5mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2mm;
    color: var(--stucco);
  }

  .object-box span {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--greige);
    font-weight: 800;
  }

  .object-box strong {
    font-size: 10pt;
  }

  .object-box small {
    font-size: 8.5pt;
  }

  .warning-box {
    border-radius: 4mm;
    padding: 3mm 4mm;
    background: rgba(183, 172, 155, 0.22);
    border: 1px solid rgba(106, 93, 82, 0.18);
  }

  .warning-box p {
    margin: 0 0 1.5mm 0;
    color: var(--walnut);
    font-size: 7.5pt;
    line-height: 1.35;
  }

  .warning-box p:last-child {
    margin-bottom: 0;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5mm;
  }

  .kpi-card {
    border-radius: 5mm;
    border: 1px solid rgba(106, 93, 82, 0.18);
    background: rgba(250, 248, 243, 0.85);
    padding: 4mm;
  }

  .kpi-card span {
    display: block;
    color: var(--walnut);
    font-size: 7.2pt;
    font-weight: 800;
    margin-bottom: 2mm;
  }

  .kpi-card strong {
    display: block;
    color: var(--onyx);
    font-size: 15pt;
    line-height: 1;
    margin-bottom: 2mm;
  }

  .kpi-card p {
    margin: 0;
    color: var(--walnut);
    font-size: 7.2pt;
    line-height: 1.35;
  }

  .intro-grid {
    display: grid;
    grid-template-columns: 70mm 1fr;
    gap: 7mm;
  }

  .photo-card,
  .card {
    border-radius: 6mm;
    border: 1px solid rgba(106, 93, 82, 0.18);
    background: rgba(250, 248, 243, 0.72);
  }

  .photo-card {
    padding: 5mm;
    background: rgba(226, 226, 222, 0.62);
  }

  .photo-wrap {
    height: 58mm;
    border-radius: 5mm;
    overflow: hidden;
    background-color: var(--greige);
    background-size: cover;
    background-position: center;
    border: none;
    position: relative;
  }

  .photo-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 8mm;
    text-align: center;
    font-size: 8pt;
    color: rgba(28, 28, 27, 0.45);
    z-index: -1;
  }

  .value-list {
    margin-top: 4mm;
    display: grid;
    gap: 2mm;
  }

  .info-line {
    display: flex;
    justify-content: space-between;
    gap: 5mm;
    font-size: 8.2pt;
    padding-bottom: 1.8mm;
    border-bottom: 1px solid rgba(106, 93, 82, 0.22);
  }

  .info-line span {
    color: var(--walnut);
  }

  .info-line strong {
    color: var(--onyx);
    text-align: right;
  }

  .info-line.strong {
    font-weight: 900;
  }

  .card {
    padding: 5mm;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 3mm;
    margin-bottom: 3.5mm;
  }

  .section-title span {
    color: var(--walnut);
    font-size: 11pt;
  }

  .section-title h3 {
    margin: 0;
    color: var(--onyx);
    font-size: 13pt;
    line-height: 1.1;
    font-weight: 500;
  }

  .calc-table {
    display: grid;
  }

  .calc-row {
    display: flex;
    justify-content: space-between;
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
    font-size: 7.9pt;
    line-height: 1.28;
  }

  .kernbeeld p {
    margin-bottom: 2mm;
  }

  .text-card {
    font-size: 8.7pt;
    line-height: 1.45;
  }

  .text-card p {
    margin: 0 0 3mm 0;
  }

  .footer {
    margin-top: auto;
    padding-top: 3mm;
    border-top: 1px solid rgba(151, 144, 134, 0.28);
    display: flex;
    justify-content: space-between;
    color: var(--ash);
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .small-header {
    padding: 7mm;
    border-radius: 7mm;
    background: rgba(226, 226, 222, 0.72);
    border: 1px solid rgba(106, 93, 82, 0.18);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8mm;
  }

  .small-header h2 {
    margin: 0;
    font-size: 22pt;
    line-height: 1.05;
    color: var(--onyx);
    font-weight: 500;
  }

  .small-meta {
    min-width: 54mm;
    border-left: 1px solid rgba(106, 93, 82, 0.24);
    padding-left: 6mm;
    display: grid;
    gap: 1.5mm;
    color: var(--walnut);
    font-size: 8.5pt;
  }

  .small-meta strong {
    color: var(--onyx);
    font-size: 15pt;
  }

  .page-two-grid {
    display: grid;
    grid-template-columns: 1fr 74mm;
    gap: 7mm;
  }

  .page-two-grid.lower {
    grid-template-columns: 1fr 78mm;
    flex: 1;
  }

  .tinted {
    background: rgba(226, 226, 222, 0.68);
  }

  .intro {
    margin: 0 0 4mm 0;
    color: var(--walnut);
    font-size: 8.4pt;
    line-height: 1.4;
  }

  .expense-table {
    display: grid;
  }

  .expense-head,
  .expense-row {
    display: grid;
    grid-template-columns: 1fr 27mm 20mm;
    gap: 4mm;
    align-items: center;
  }

  .expense-head {
    padding: 2mm 0;
    border-top: 1px solid rgba(106, 93, 82, 0.24);
    border-bottom: 1px solid rgba(106, 93, 82, 0.24);
    color: var(--walnut);
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .expense-row {
    padding: 2.4mm 0;
    border-bottom: 1px solid rgba(151, 144, 134, 0.26);
    font-size: 8.2pt;
  }

  .tax-list {
    display: grid;
    gap: 2.4mm;
  }

  .tax-list-compact {
    gap: 1.7mm;
  }

  .tax-list-compact .info-line {
    font-size: 7.8pt;
    padding-bottom: 1.6mm;
  }

  .box3-note {
    margin: 5mm 0 0 0;
    padding: 3.5mm;
    border-radius: 4mm;
    background: rgba(250, 248, 243, 0.72);
    border: 1px solid rgba(106, 93, 82, 0.16);
    color: var(--onyx);
    font-size: 7.8pt;
    line-height: 1.45;
  }

  .bar {
    margin-bottom: 4mm;
  }

  .bar-top {
    display: flex;
    justify-content: space-between;
    gap: 5mm;
    font-size: 8.4pt;
    margin-bottom: 1.5mm;
  }

  .bar-track {
    height: 3mm;
    border-radius: 999px;
    background: rgba(226, 226, 222, 0.95);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
    background: rgba(106, 93, 82, 0.68);
  }

  .bar-fill.positive {
    background: rgba(28, 28, 27, 0.72);
  }

  .closing-box {
    margin-top: 4mm;
    padding: 4mm;
    border-radius: 4mm;
    background: rgba(106, 93, 82, 0.84);
    color: var(--white);
    display: flex;
    justify-content: space-between;
    gap: 4mm;
    font-size: 9pt;
  }

  .closing-box.soft {
    background: rgba(226, 226, 222, 0.78);
    color: var(--onyx);
    border: 1px solid rgba(106, 93, 82, 0.16);
  }

  .image-input-field input[type="file"] {
    padding: 8px;
    cursor: pointer;
  }

  .image-input-field input[type="file"]::file-selector-button {
    margin-right: 10px;
    border: 0;
    border-radius: 8px;
    padding: 8px 12px;
    background: var(--onyx);
    color: var(--white);
    font-weight: 700;
    cursor: pointer;
  }

  @page {
    size: A4;
    margin: 0;
  }

  @media print {
    .no-print {
      display: none !important;
    }

    html,
    body,
    .screen {
      width: 210mm !important;
      min-width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: var(--paper) !important;
    }

    body {
      overflow: visible !important;
    }

    .screen {
      display: block !important;
    }

    .sheet {
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 12mm !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      box-shadow: none !important;
      border: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
      page-break-after: always !important;
      break-after: page !important;
    }

    .sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }

    .hero,
    .kpi-grid,
    .intro-grid,
    .kernbeeld,
    .page-two-grid,
    .photo-card,
    .card,
    .footer {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
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