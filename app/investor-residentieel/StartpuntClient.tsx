"use client";

import { useMemo, useState } from "react";

type MaybeNumber = number | null;

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

  box3Grondslag: MaybeNumber;
  box3BelastingPercentage: MaybeNumber;

  exploitatiekostenTotaal: MaybeNumber;
  exploitatiekostenPercentage: MaybeNumber;

  nettoHuurinkomsten: MaybeNumber;
  nettoRendementMarktwaarde: MaybeNumber;
  rendementOpEigenInleg: MaybeNumber;

  gemiddeldeWaardestijging: MaybeNumber;
  totaalRendementInclWaardestijging: MaybeNumber;

  exploitatiekosten: ExpenseItem[];
  waarschuwingen: string[];
};

type StartpuntConfig = {
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
  exploitatiekostenTotaal: string;
  box3WozPercentage: string;
  box3FinancieringPercentage: string;
  box3BelastingPercentage: string;
  gemiddeldeWaardestijging: string;
};

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
  if (value === null || Number.isNaN(value)) return "—";
  return euro(value);
};

const costEuroValue = (value: MaybeNumber) => {
  if (value === null || Number.isNaN(value)) return "—";
  if (Math.abs(value) < 0.005) return euro(0);
  return `- ${euro(Math.abs(value))}`;
};

const pctValue = (value: MaybeNumber) => {
  if (value === null || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("nl-NL", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

const pctAbsValue = (value: MaybeNumber) => {
  if (value === null || Number.isNaN(value)) return "—";

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
  if (value === null || Number.isNaN(value)) return "";
  return String(Math.round(value));
}

function percentToInput(value: MaybeNumber) {
  if (value === null || Number.isNaN(value)) return "";
  return String(Number((value * 100).toFixed(2))).replace(".", ",");
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
  if (parsed === null) return null;

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
    rentePercentage: percentToInput(initialData.rentePercentage),
    exploitatiekostenTotaal: numberToInput(initialData.exploitatiekostenTotaal),
    box3WozPercentage: percentToInput(initialData.box3WozPercentage),
    box3FinancieringPercentage: percentToInput(
      initialData.box3FinancieringPercentage
    ),
    box3BelastingPercentage: percentToInput(initialData.box3BelastingPercentage),
    gemiddeldeWaardestijging: percentToInput(
      initialData.gemiddeldeWaardestijging
    ),
  };
}

export default function StartpuntClient({
  initialData,
  config,
}: {
  initialData: ReportData;
  config: StartpuntConfig;
}) {
  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(initialData)
  );

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(createInitialForm(initialData));
  }

  const data = useMemo<ReportData>(() => {
    const objectNaam = form.objectNaam || initialData.objectNaam;
    const adres = form.adres || initialData.adres;

    const marktwaardeVastgoed = parseInputNumber(form.marktwaardeVastgoed);
    const wozWaardeVastgoed = parseInputNumber(form.wozWaardeVastgoed);
    const financiering = parseInputNumber(form.financiering);
    const huurPerMaand = parseInputNumber(form.huurPerMaand);
    const rentePercentage = parseInputPercent(form.rentePercentage);
    const exploitatiekostenTotaal = parseInputNumber(
      form.exploitatiekostenTotaal
    );

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

    const exploitatiekostenPercentage =
      exploitatiekostenTotaal !== null &&
      huurPerJaar !== null &&
      huurPerJaar !== 0
        ? exploitatiekostenTotaal / huurPerJaar
        : null;

    const box3WozBedrag =
      wozWaardeVastgoed !== null && box3WozPercentage !== null
        ? Math.abs(wozWaardeVastgoed) * box3WozPercentage
        : null;

    const box3FinancieringBedrag =
      financiering !== null && box3FinancieringPercentage !== null
        ? Math.abs(financiering) * box3FinancieringPercentage
        : null;

    const box3Grondslag =
      box3WozBedrag !== null && box3FinancieringBedrag !== null
        ? box3WozBedrag - box3FinancieringBedrag
        : null;

    const vermogensbelastingPerJaar =
      box3Grondslag !== null && box3BelastingPercentage !== null
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
      rendementOpEigenInleg !== null && gemiddeldeWaardestijging !== null
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

      exploitatiekostenTotaal,
      exploitatiekostenPercentage,

      box3WozPercentage,
      box3WozBedrag,

      box3FinancieringPercentage,
      box3FinancieringBedrag,

      box3Grondslag,
      box3BelastingPercentage,

      vermogensbelastingPercentage: box3BelastingPercentage,
      vermogensbelastingbasis: "Uitgebreide box 3-berekening",
      vermogensbelastingPerJaar,

      nettoHuurinkomsten,
      nettoRendementMarktwaarde,
      rendementOpEigenInleg,

      gemiddeldeWaardestijging,
      totaalRendementInclWaardestijging,
    };
  }, [form, initialData]);

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
            Reset naar sheet
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

          <InputField
            label="Exploitatiekosten p/j"
            value={form.exploitatiekostenTotaal}
            onChange={(value) => updateField("exploitatiekostenTotaal", value)}
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
              style={{ backgroundImage: `url("${data.afbeeldingUrl}")` }}
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
            Het bruto rendement geeft alleen de verhouding weer tussen de
            jaarlijkse huur en de marktwaarde. Na rentelasten resteert{" "}
            <strong>{euroValue(data.naRenteResteert)}</strong>. Na
            exploitatiekosten en vermogensbelasting blijft in dit rekenvoorbeeld{" "}
            <strong>{euroValue(data.nettoHuurinkomsten)}</strong> aan netto
            huurinkomsten over.
          </p>

          <p>
            De gemiddelde waardestijging van{" "}
            <strong>{pctValue(data.gemiddeldeWaardestijging)}</strong> is geen
            directe huurkasstroom en wordt daarom apart weergegeven. Het totale
            rendement exclusief waardestijging komt uit op{" "}
            <strong>{pctValue(data.rendementOpEigenInleg)}</strong>, wat een
            directe huurkasstroom van{" "}
            <strong>{euroValue(data.nettoHuurinkomsten)}</strong> oplevert per
            jaar.
          </p>
        </section>

        <footer className="footer">
          <span>{config.footerLabel}</span>
          <span>Pagina 1 / 2</span>
        </footer>
      </article>

      <article className="sheet">
        <header className="small-header">
          <div>
            <div className="kicker dark">L3 Capital</div>
            <h2>Verdieping rendement en uitgangspunten</h2>
          </div>

          <div className="small-meta">
            <span>{data.objectNaam}</span>
            <strong>{euroValue(data.marktwaardeVastgoed)}</strong>
          </div>
        </header>

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
                label={`WOZ-waarde x ${pctValue(data.box3WozPercentage)}`}
                value={euroValue(data.box3WozBedrag)}
              />

              <InfoLine
                label={`Financiering x ${pctValue(
                  data.box3FinancieringPercentage
                )}`}
                value={costEuroValue(data.box3FinancieringBedrag)}
              />

              <InfoLine
                label="Grondslag"
                value={euroValue(data.box3Grondslag)}
                strong
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
              Voor iedere belegger is de box 3-situatie persoonsgebonden. In dit
              rekenvoorbeeld is ervan uitgegaan dat de belegger meer vermogen
              heeft, waardoor op deze casus geen heffingsvrij vermogen en geen
              schuldendrempel worden toegepast.
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
            <SectionTitle number="06" title="Belangrijk om mee te nemen" />

            <p>
              Een bruto percentage toont niet het volledige beeld. De jaarlijkse
              huur moet worden afgezet tegen financiering, vaste lasten,
              onderhoud, leegstand, belastingdruk en risico.
            </p>

            <p>
              Waardestijging kan het totale rendement verbeteren, maar is geen
              gegarandeerde kasstroom. Daarom wordt deze apart zichtbaar gemaakt.
            </p>

            <div className="closing-box">
              <span>Netto huurinkomsten</span>
              <strong>{euroValue(data.nettoHuurinkomsten)}</strong>
            </div>

            <div className="closing-box soft">
              <span>Totaal incl. waardestijging</span>
              <strong>{pctValue(data.totaalRendementInclWaardestijging)}</strong>
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

  .input-field input {
    width: 100%;
    border: 1px solid rgba(106, 93, 82, 0.24);
    background: var(--white);
    color: var(--onyx);
    border-radius: 11px;
    padding: 10px 11px;
    font-size: 14px;
    outline: none;
  }

  .input-field input:focus {
    border-color: rgba(106, 93, 82, 0.62);
    box-shadow: 0 0 0 3px rgba(183, 172, 155, 0.22);
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

  @page {
    size: A4;
    margin: 0;
  }

  @media print {
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
  }

  @media screen and (max-width: 900px) {
    .screen {
      padding: 16px;
      overflow-x: auto;
    }

    .input-panel {
      width: 100%;
      min-width: 720px;
    }

    .input-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;