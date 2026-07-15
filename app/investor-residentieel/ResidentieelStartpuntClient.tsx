"use client";

import { ChangeEvent, useMemo, useState } from "react";

export type MaybeNumber = number | null;

export type ExpenseItem = {
  name: string;
  amount: MaybeNumber;
  percentOfRent: MaybeNumber;
};

export type ReportData = {
  objectNaam: string;
  adres: string;
  afbeeldingUrl: string;

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
};

export type StartpuntConfig = {
  title: string;
  subtitle: string;
  footerLabel: string;
};

type YesNo = "ja" | "nee";

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
  fiscaalPartner: YesNo;
  heffingsvrijVermogenToepassen: YesNo;
  exploitatiekosten: string[];
};

const SCHULDENDREMPEL_PER_PERSOON = 3_800;
const HEFFINGSVRIJ_PER_PERSOON = 59_357;

const money0 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const money2 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent1 = new Intl.NumberFormat("nl-NL", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function euroValue(value: MaybeNumber) {
  return value === null || !Number.isFinite(value) ? "—" : money0.format(value);
}

function euroDecimalValue(value: MaybeNumber) {
  return value === null || !Number.isFinite(value) ? "—" : money2.format(value);
}

function costEuroValue(value: MaybeNumber) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (Math.abs(value) < 0.005) return money0.format(0);
  return `- ${money0.format(Math.abs(value))}`;
}

function pctValue(value: MaybeNumber) {
  return value === null || !Number.isFinite(value)
    ? "—"
    : percent1.format(value);
}

function pctAbsValue(value: MaybeNumber) {
  return value === null || !Number.isFinite(value)
    ? "—"
    : percent1.format(Math.abs(value));
}

function numberToInput(value: MaybeNumber) {
  return value === null || !Number.isFinite(value)
    ? ""
    : String(Math.round(Math.abs(value)));
}

function percentToInput(value: MaybeNumber, fallback: number) {
  const actual = value === null || !Number.isFinite(value) ? fallback : value;
  return String(Number((actual * 100).toFixed(2))).replace(".", ",");
}

function parseNumber(value: string): MaybeNumber {
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

  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function parsePercent(value: string, fallback: number) {
  const parsed = parseNumber(value);
  if (parsed === null) return fallback;
  return Math.abs(parsed) > 1 ? parsed / 100 : parsed;
}

function createInitialForm(initialData: ReportData): FormState {
  return {
    objectNaam: initialData.objectNaam ?? "",
    adres: initialData.adres ?? "",
    marktwaardeVastgoed: numberToInput(initialData.marktwaardeVastgoed),
    wozWaardeVastgoed: numberToInput(initialData.wozWaardeVastgoed),
    financiering: numberToInput(initialData.financiering),
    huurPerMaand: numberToInput(initialData.huurPerMaand),
    rentePercentage: percentToInput(initialData.rentePercentage, 0.04),
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
    exploitatiekosten: initialData.exploitatiekosten.map((item) =>
      numberToInput(item.amount)
    ),
  };
}

export function StartpuntReport({
  initialData,
  config,
}: {
  initialData: ReportData;
  config: StartpuntConfig;
}) {
  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(initialData)
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateExpense(index: number, value: string) {
    setForm((current) => ({
      ...current,
      exploitatiekosten: current.exploitatiekosten.map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.alert("Selecteer een geldig afbeeldingsbestand.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setUploadedImage(reader.result);
    };
    reader.onerror = () => {
      window.alert("De afbeelding kon niet worden ingelezen.");
    };
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setForm(createInitialForm(initialData));
    setUploadedImage(null);
  }

  const data = useMemo(() => {
    const marktwaarde = Math.abs(parseNumber(form.marktwaardeVastgoed) ?? 0);
    const wozwaarde = Math.abs(parseNumber(form.wozWaardeVastgoed) ?? 0);
    const financiering = Math.abs(parseNumber(form.financiering) ?? 0);
    const huurPerMaand = Math.abs(parseNumber(form.huurPerMaand) ?? 0);

    const rente = parsePercent(form.rentePercentage, 0.04);
    const box3WozPercentage = parsePercent(form.box3WozPercentage, 0.06);
    const box3FinancieringPercentage = parsePercent(
      form.box3FinancieringPercentage,
      0.027
    );
    const box3BelastingPercentage = parsePercent(
      form.box3BelastingPercentage,
      0.36
    );
    const waardestijging = parsePercent(
      form.gemiddeldeWaardestijging,
      0.03
    );

    const huurPerJaar = huurPerMaand * 12;
    const brutoRendement = marktwaarde > 0 ? huurPerJaar / marktwaarde : null;
    const eigenInleg = Math.max(0, marktwaarde - financiering);
    const rentelasten = -financiering * rente;
    const naRente = huurPerJaar + rentelasten;

    const exploitatiekosten = initialData.exploitatiekosten.map(
      (item, index) => {
        const amount = Math.abs(
          parseNumber(form.exploitatiekosten[index] ?? "") ?? 0
        );

        return {
          name: item.name,
          amount,
          percentOfRent: huurPerJaar > 0 ? amount / huurPerJaar : null,
        };
      }
    );

    const exploitatieTotaal = exploitatiekosten.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const exploitatiePct =
      huurPerJaar > 0 ? exploitatieTotaal / huurPerJaar : null;

    const fiscaalPartner = form.fiscaalPartner === "ja";
    const heffingsvrijToepassen =
      form.heffingsvrijVermogenToepassen === "ja";

    const schuldendrempel =
      SCHULDENDREMPEL_PER_PERSOON * (fiscaalPartner ? 2 : 1);
    const aftrekbareSchuld = Math.max(0, financiering - schuldendrempel);

    const heffingsvrijVermogen =
      HEFFINGSVRIJ_PER_PERSOON * (fiscaalPartner ? 2 : 1);
    const toegepasteVrijstelling = heffingsvrijToepassen
      ? heffingsvrijVermogen
      : 0;

    const fictiefRendementWoz = wozwaarde * box3WozPercentage;
    const fictiefRendementSchuld =
      aftrekbareSchuld * box3FinancieringPercentage;

    const rendementsgrondslag = Math.max(0, wozwaarde - aftrekbareSchuld);
    const grondslagNaVrijstelling = Math.max(
      0,
      rendementsgrondslag - toegepasteVrijstelling
    );
    const aandeelBelastbaar =
      rendementsgrondslag > 0
        ? grondslagNaVrijstelling / rendementsgrondslag
        : 0;

    const belastbaarForfaitairRendement = Math.max(
      0,
      fictiefRendementWoz - fictiefRendementSchuld
    );
    const voordeelSparenBeleggen =
      belastbaarForfaitairRendement * aandeelBelastbaar;
    const vermogensbelasting =
      -voordeelSparenBeleggen * box3BelastingPercentage;

    const nettoHuur =
      huurPerJaar + rentelasten - exploitatieTotaal + vermogensbelasting;

    const nettoRendementMarktwaarde =
      marktwaarde > 0 ? nettoHuur / marktwaarde : null;
    const rendementEigenInleg =
      eigenInleg > 0 ? nettoHuur / eigenInleg : null;
    const totaalRendement =
      rendementEigenInleg === null
        ? null
        : rendementEigenInleg + waardestijging;

    const totaleKosten =
      Math.abs(rentelasten) +
      exploitatieTotaal +
      Math.abs(vermogensbelasting);

    const nettoPerEuro =
      huurPerJaar > 0 ? nettoHuur / huurPerJaar : null;

    const directeKasstroomTekst =
      rendementEigenInleg === null
        ? null
        : rendementEigenInleg * (marktwaarde - financiering);

    return {
      marktwaarde,
      wozwaarde,
      financiering,
      huurPerMaand,
      huurPerJaar,
      brutoRendement,
      eigenInleg,
      rente,
      rentelasten,
      naRente,
      exploitatiekosten,
      exploitatieTotaal,
      exploitatiePct,
      fiscaalPartner,
      heffingsvrijToepassen,
      schuldendrempel,
      aftrekbareSchuld,
      toegepasteVrijstelling,
      fictiefRendementWoz,
      fictiefRendementSchuld,
      rendementsgrondslag,
      grondslagNaVrijstelling,
      belastbaarForfaitairRendement,
      voordeelSparenBeleggen,
      box3WozPercentage,
      box3FinancieringPercentage,
      box3BelastingPercentage,
      vermogensbelasting,
      nettoHuur,
      nettoRendementMarktwaarde,
      rendementEigenInleg,
      waardestijging,
      totaalRendement,
      totaleKosten,
      nettoPerEuro,
      directeKasstroomTekst,
    };
  }, [form, initialData.exploitatiekosten]);

  const calculationRows: Array<
    [string, string, "normal" | "soft" | "main"]
  > = [
    ["Marktwaarde vastgoed", euroValue(data.marktwaarde), "normal"],
    ["WOZ-waarde vastgoed", euroValue(data.wozwaarde), "normal"],
    ["Huur per maand", euroValue(data.huurPerMaand), "normal"],
    ["Huur per jaar", euroValue(data.huurPerJaar), "normal"],
    ["Bruto rendement marktwaarde", pctValue(data.brutoRendement), "normal"],
    ["Financiering", euroValue(data.financiering), "normal"],
    ["Rente", pctValue(data.rente), "normal"],
    ["Rentelasten per jaar", costEuroValue(data.rentelasten), "normal"],
    ["Na rente resteert", euroValue(data.naRente), "soft"],
    ["Exploitatiekosten per jaar", costEuroValue(data.exploitatieTotaal), "normal"],
    ["Vermogensbelasting", costEuroValue(data.vermogensbelasting), "normal"],
    ["Netto huurinkomsten", euroValue(data.nettoHuur), "main"],
    ["Netto rendement marktwaarde", pctValue(data.nettoRendementMarktwaarde), "normal"],
    ["Rendement op eigen inleg", pctValue(data.rendementEigenInleg), "normal"],
    ["Gemiddelde waardestijging", pctValue(data.waardestijging), "normal"],
    ["Totaal rendement incl. waardestijging", pctValue(data.totaalRendement), "main"],
  ];

  const imageSource = uploadedImage ?? initialData.afbeeldingUrl;

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
            onChange={(value) =>
              updateField("box3BelastingPercentage", value)
            }
          />
          <InputField
            label="Waardestijging %"
            value={form.gemiddeldeWaardestijging}
            onChange={(value) =>
              updateField("gemiddeldeWaardestijging", value)
            }
          />
        </div>

        <div className="expense-input-head">
          <strong>Exploitatiekosten per jaar</strong>
          <span>
            Totaal: {costEuroValue(data.exploitatieTotaal)} ·{" "}
            {pctAbsValue(data.exploitatiePct)} van de huur
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
            <strong>{form.objectNaam || "Vastgoedobject"}</strong>
            <small>{form.adres || "Adres nog niet ingevuld"}</small>
          </div>
        </header>

        <section className="kpi-grid">
          <KpiCard label="Bruto rendement" value={pctValue(data.brutoRendement)} text="Huur per jaar gedeeld door marktwaarde." />
          <KpiCard label="Na rente resteert" value={euroValue(data.naRente)} text="Huurinkomsten na jaarlijkse rentelasten." />
          <KpiCard label="Netto huurinkomsten" value={euroValue(data.nettoHuur)} text="Na rente, exploitatiekosten en vermogensbelasting." />
          <KpiCard label="Totaal incl. waardestijging" value={pctValue(data.totaalRendement)} text="Rendement op eigen inleg plus waardestijging." />
        </section>

        <section className="intro-grid">
          <div className="photo-card">
            <div
              className="photo-wrap"
              style={{
                backgroundImage: imageSource ? `url("${imageSource}")` : undefined,
              }}
            >
              <div className="photo-fallback">Foto vastgoed</div>
            </div>
            <div className="value-list">
              <InfoLine label="Marktwaarde" value={euroValue(data.marktwaarde)} />
              <InfoLine label="WOZ-waarde" value={euroValue(data.wozwaarde)} />
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
            Het bruto rendement van <strong>{pctValue(data.brutoRendement)}</strong> lijkt aantrekkelijk,
            maar geeft een onvolledig beeld. Van de jaarlijkse huurinkomsten van{" "}
            <strong>{euroValue(data.huurPerJaar)}</strong> gaan nog{" "}
            <strong>{euroValue(Math.abs(data.rentelasten))}</strong> aan rente,{" "}
            <strong>{euroValue(data.exploitatieTotaal)}</strong> aan exploitatiekosten en{" "}
            <strong>{euroValue(Math.abs(data.vermogensbelasting))}</strong> aan vermogensbelasting af.
            In totaal verdwijnt daarmee <strong>{euroValue(data.totaleKosten)}</strong>, oftewel{" "}
            <strong>{pctAbsValue(data.huurPerJaar > 0 ? data.totaleKosten / data.huurPerJaar : null)}</strong>{" "}
            van de bruto huurinkomsten. Uiteindelijk resteert{" "}
            <strong>{euroValue(data.nettoHuur)}</strong> aan netto huurinkomsten.
          </p>
          <p>
            Het totale nettorendement inclusief waardestijging bedraagt{" "}
            <strong>{pctValue(data.totaalRendement)}</strong>. Hiervan bestaat{" "}
            <strong>{(data.waardestijging * 100).toFixed(1).replace(".", ",")} procentpunt</strong>{" "}
            uit de verwachte waardestijging van het vastgoed. Dit is geen directe kasstroom en komt pas
            beschikbaar bij verkoop of herfinanciering. De directe kasstroom uit verhuur bedraagt daarom{" "}
            <strong>{pctValue(data.rendementEigenInleg)}</strong>, oftewel{" "}
            <strong>{euroValue(data.directeKasstroomTekst)}</strong> per jaar.
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
              <strong>{costEuroValue(data.exploitatieTotaal)}</strong>. Dat is{" "}
              <strong>{pctAbsValue(data.exploitatiePct)}</strong> van de jaarlijkse huurinkomsten.
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
            <div className="tax-list">
              <InfoLine label="Fiscaal partner" value={data.fiscaalPartner ? "Ja" : "Nee"} />
              <InfoLine label="Heffingsvrij vermogen toegepast" value={data.heffingsvrijToepassen ? "Ja" : "Nee"} />
              <InfoLine label="Schuldendrempel" value={euroValue(data.schuldendrempel)} />
              <InfoLine label="Toegepaste vrijstelling" value={euroValue(data.toegepasteVrijstelling)} />
              <InfoLine label={`WOZ-waarde x ${pctValue(data.box3WozPercentage)}`} value={euroValue(data.fictiefRendementWoz)} />
              <InfoLine label={`Aftrekbare schuld x ${pctValue(data.box3FinancieringPercentage)}`} value={costEuroValue(data.fictiefRendementSchuld)} />
              <InfoLine label="Rendementsgrondslag" value={euroValue(data.rendementsgrondslag)} />
              <InfoLine label="Grondslag na vrijstelling" value={euroValue(data.grondslagNaVrijstelling)} strong />
              <InfoLine label="Belastbaar forfaitair rendement" value={euroValue(data.voordeelSparenBeleggen)} />
              <InfoLine label="Box-3 tarief" value={pctValue(data.box3BelastingPercentage)} />
              <InfoLine label="Vermogensbelasting" value={costEuroValue(data.vermogensbelasting)} strong />
            </div>
            <p className="box3-note">
              Deze Box 3-berekening is gebaseerd op de huidige uitgangspunten. Tarieven,
              vrijstellingen en de berekeningsmethode kunnen in de toekomst wijzigen.
            </p>
          </div>
        </section>

        <section className="page-two-grid lower">
          <div className="card">
            <SectionTitle number="05" title="Kasstroomopbouw" />
            <Bar label="Huur per jaar" value={data.huurPerJaar} max={data.huurPerJaar} positive />
            <Bar label="Rentelasten" value={data.rentelasten} max={data.huurPerJaar} />
            <Bar label="Exploitatiekosten" value={data.exploitatieTotaal} max={data.huurPerJaar} />
            <Bar label="Vermogensbelasting" value={data.vermogensbelasting} max={data.huurPerJaar} />
            <Bar label="Netto huurinkomsten" value={data.nettoHuur} max={data.huurPerJaar} positive />
          </div>

          <div className="card text-card risico">
            <SectionTitle number="06" title="Risico en weerbaarheid" />
            <p>
              Van de <strong>{euroValue(data.huurPerJaar)}</strong> bruto jaarhuur gaat in dit rekenvoorbeeld{" "}
              <strong>{euroValue(data.totaleKosten)}</strong> op aan rente, exploitatiekosten en
              vermogensbelasting. Daardoor blijft ongeveer{" "}
              <strong>{pctValue(data.nettoPerEuro)}</strong> van de huur als directe netto kasstroom over.
              Anders gezegd: van iedere euro aan huurinkomsten resteert circa{" "}
              <strong>{euroDecimalValue(data.nettoPerEuro)}</strong> netto.
            </p>
            <p>
              Deze uitkomst is een momentopname. Langere leegstand, onverwacht onderhoud,
              hogere financieringslasten of wijzigingen in fiscale regelgeving kunnen de
              kasstroom verder verlagen. Een voldoende liquiditeitsbuffer blijft belangrijk.
            </p>
            <div className="closing-box">
              <span>Netto per € 1 huur</span>
              <strong>{euroDecimalValue(data.nettoPerEuro)}</strong>
            </div>
            <div className="closing-box soft">
              <span>Kosten en belasting</span>
              <strong>{euroValue(data.totaleKosten)}</strong>
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

export default function ResidentieelStartpuntClient(props: {
  initialData: ReportData;
  config: StartpuntConfig;
}) {
  return <StartpuntReport {...props} />;
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
  value: YesNo;
  onChange: (value: YesNo) => void;
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as YesNo)}>
        <option value="nee">Nee</option>
        <option value="ja">Ja</option>
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

function KpiCard({ label, value, text }: { label: string; value: string; text: string }) {
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
  const valueNumber = Math.abs(value ?? 0);
  const maxNumber = Math.abs(max ?? 0);
  const width = maxNumber > 0 ? Math.min((valueNumber / maxNumber) * 100, 100) : 0;

  return (
    <div className="bar">
      <div className="bar-top">
        <span>{label}</span>
        <strong>{positive ? euroValue(value) : costEuroValue(value)}</strong>
      </div>
      <div className="bar-track">
        <div className={positive ? "bar-fill positive" : "bar-fill"} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

const styles = `
  :root {
    --onyx: #1c1c1b;
    --walnut: #6a5d52;
    --ash: #979086;
    --greige: #b7ac9b;
    --stucco: #e2e2de;
    --paper: #f4f1ea;
    --card: #faf8f3;
    --soft: #e8e3da;
    --white: #ffffff;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    background: var(--stucco);
    font-family: Arial, Helvetica, sans-serif;
    color: var(--onyx);
  }

  .screen {
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(183,172,155,.28), transparent 34%),
      var(--stucco);
  }

  .input-panel {
    width: 210mm;
    margin: 0 auto 22px;
    padding: 18px;
    border-radius: 22px;
    background: rgba(250,248,243,.96);
    border: 1px solid rgba(106,93,82,.18);
    box-shadow: 0 14px 36px rgba(28,28,27,.1);
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
    letter-spacing: .12em;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .input-panel-head strong { font-size: 20px; }

  .input-panel-head button {
    border: 0;
    background: var(--onyx);
    color: white;
    border-radius: 999px;
    padding: 11px 16px;
    font-weight: 800;
    cursor: pointer;
  }

  .input-grid, .expense-input-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 12px;
  }

  .expense-input-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin: 20px 0 12px;
    padding-top: 18px;
    border-top: 1px solid rgba(106,93,82,.18);
  }

  .expense-input-head span { font-size: 13px; color: var(--walnut); }

  .input-field {
    display: grid;
    gap: 6px;
  }

  .input-field span {
    color: var(--walnut);
    font-size: 12px;
    font-weight: 800;
  }

  .input-field input, .input-field select {
    width: 100%;
    min-height: 42px;
    border: 1px solid rgba(106,93,82,.24);
    background: var(--white);
    color: var(--onyx);
    border-radius: 11px;
    padding: 10px 11px;
    font-size: 14px;
    outline: none;
  }

  .image-input-field input[type="file"] { padding: 7px; cursor: pointer; }

  .image-input-field input[type="file"]::file-selector-button {
    margin-right: 8px;
    border: 0;
    border-radius: 8px;
    padding: 7px 10px;
    background: var(--onyx);
    color: white;
    font-weight: 700;
    cursor: pointer;
  }

  .sheet {
    width: 210mm;
    height: 297mm;
    margin: 0 auto 28px;
    padding: 12mm;
    background: var(--paper);
    border: 1px solid rgba(106,93,82,.18);
    box-shadow: 0 18px 50px rgba(28,28,27,.13);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 7mm;
  }

  .hero {
    min-height: 43mm;
    padding: 8mm;
    border-radius: 8mm;
    background: linear-gradient(135deg, rgba(28,28,27,.94), rgba(106,93,82,.84));
    color: white;
    display: grid;
    grid-template-columns: 1fr 56mm;
    gap: 8mm;
    align-items: center;
  }

  .kicker {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: .2em;
    color: var(--greige);
    font-weight: 800;
    margin-bottom: 3mm;
  }

  h1 {
    margin: 0;
    font-size: 29pt;
    line-height: 1;
    letter-spacing: -.035em;
  }

  .hero p {
    margin: 3mm 0 0;
    color: var(--stucco);
    font-size: 9pt;
    line-height: 1.4;
  }

  .object-box {
    border: 1px solid rgba(226,226,222,.42);
    border-radius: 5mm;
    padding: 5mm;
    display: flex;
    flex-direction: column;
    gap: 2mm;
  }

  .object-box span {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: .18em;
    color: var(--greige);
    font-weight: 800;
  }

  .object-box strong { font-size: 10pt; }
  .object-box small { font-size: 8.5pt; }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 5mm;
  }

  .kpi-card, .photo-card, .card {
    border-radius: 5mm;
    border: 1px solid rgba(106,93,82,.18);
    background: rgba(250,248,243,.85);
  }

  .kpi-card { padding: 4mm; }

  .kpi-card span {
    display: block;
    color: var(--walnut);
    font-size: 7.2pt;
    font-weight: 800;
    margin-bottom: 2mm;
  }

  .kpi-card strong {
    display: block;
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

  .photo-card { padding: 5mm; background: rgba(226,226,222,.62); }

  .photo-wrap {
    height: 58mm;
    border-radius: 5mm;
    overflow: hidden;
    background-color: var(--greige);
    background-size: cover;
    background-position: center;
    position: relative;
  }

  .photo-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: rgba(28,28,27,.45);
    z-index: -1;
  }

  .value-list { margin-top: 4mm; display: grid; gap: 2mm; }

  .info-line {
    display: flex;
    justify-content: space-between;
    gap: 5mm;
    font-size: 8.2pt;
    padding-bottom: 1.8mm;
    border-bottom: 1px solid rgba(106,93,82,.22);
  }

  .info-line span { color: var(--walnut); }
  .info-line strong { text-align: right; }
  .info-line.strong { font-weight: 900; }

  .card { padding: 5mm; }

  .section-title {
    display: flex;
    align-items: center;
    gap: 3mm;
    margin-bottom: 3.5mm;
  }

  .section-title span { color: var(--walnut); font-size: 11pt; }

  .section-title h3 {
    margin: 0;
    font-size: 13pt;
    line-height: 1.1;
    font-weight: 500;
  }

  .calc-row {
    display: flex;
    justify-content: space-between;
    gap: 5mm;
    padding: 1.42mm 0;
    border-bottom: 1px solid rgba(151,144,134,.28);
    font-size: 7.85pt;
    line-height: 1.08;
  }

  .calc-row strong { white-space: nowrap; }

  .soft-row {
    background: rgba(226,226,222,.88);
    margin: 1mm -2mm;
    padding: 1.7mm 2mm;
    border-radius: 2.5mm;
    border-bottom: none;
  }

  .main-row {
    background: rgba(106,93,82,.88);
    color: white;
    margin: 1mm -2mm;
    padding: 1.8mm 2mm;
    border-radius: 2.5mm;
    border-bottom: none;
  }

  .kernbeeld {
    flex: 1;
    font-size: 7.9pt;
    line-height: 1.28;
  }

  .text-card p { margin: 0 0 2mm; }

  .footer {
    margin-top: auto;
    padding-top: 3mm;
    border-top: 1px solid rgba(151,144,134,.28);
    display: flex;
    justify-content: space-between;
    color: var(--ash);
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: .08em;
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

  .tinted { background: rgba(226,226,222,.68); }

  .intro {
    margin: 0 0 4mm;
    color: var(--walnut);
    font-size: 8.4pt;
    line-height: 1.4;
  }

  .expense-head, .expense-row {
    display: grid;
    grid-template-columns: 1fr 27mm 20mm;
    gap: 4mm;
    align-items: center;
  }

  .expense-head {
    padding: 2mm 0;
    border-top: 1px solid rgba(106,93,82,.24);
    border-bottom: 1px solid rgba(106,93,82,.24);
    color: var(--walnut);
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .expense-row {
    padding: 2.4mm 0;
    border-bottom: 1px solid rgba(151,144,134,.26);
    font-size: 8.2pt;
  }

  .tax-list { display: grid; gap: 1.7mm; }

  .tax-list .info-line {
    font-size: 7.8pt;
    padding-bottom: 1.6mm;
  }

  .box3-note {
    margin: 5mm 0 0;
    padding: 3.5mm;
    border-radius: 4mm;
    background: rgba(250,248,243,.72);
    border: 1px solid rgba(106,93,82,.16);
    font-size: 7.8pt;
    line-height: 1.45;
  }

  .bar { margin-bottom: 4mm; }

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
    background: rgba(226,226,222,.95);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
    background: rgba(106,93,82,.68);
  }

  .bar-fill.positive { background: rgba(28,28,27,.72); }

  .risico { font-size: 7.8pt; line-height: 1.35; }

  .closing-box {
    margin-top: 4mm;
    padding: 4mm;
    border-radius: 4mm;
    background: rgba(106,93,82,.84);
    color: white;
    display: flex;
    justify-content: space-between;
    gap: 4mm;
    font-size: 9pt;
  }

  .closing-box.soft {
    background: rgba(226,226,222,.78);
    color: var(--onyx);
    border: 1px solid rgba(106,93,82,.16);
  }

  @page { size: A4; margin: 0; }

  @media print {
    .no-print { display: none !important; }

    html, body, .screen {
      width: 210mm !important;
      min-width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: var(--paper) !important;
    }

    .screen { display: block !important; }

    .sheet {
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 12mm !important;
      box-shadow: none !important;
      border: none !important;
      overflow: hidden !important;
      break-after: page !important;
      page-break-after: always !important;
    }

    .sheet:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }

  @media screen and (max-width: 900px) {
    .screen { padding: 16px; overflow-x: auto; }
  }
`;