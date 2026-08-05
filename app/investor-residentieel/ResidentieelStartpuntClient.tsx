"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

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

  // Optionele BV-beginwaarden. Bestaande page.tsx-bestanden blijven hierdoor werken.
  bezitsvorm?: Bezitsvorm;
  bvAfschrijvingPerJaar?: MaybeNumber;
  bvOverigeKostenPerJaar?: MaybeNumber;
  bvWinstUitkeren?: boolean;
  bvDividendUitkeringPercentage?: MaybeNumber;

  exploitatiekosten: ExpenseItem[];
  waarschuwingen: string[];
};

export type StartpuntConfig = {
  title: string;
  subtitle: string;
  footerLabel: string;
};

type YesNo = "ja" | "nee";
export type Bezitsvorm = "prive" | "bv";

type FormState = {
  objectNaam: string;
  adres: string;
  marktwaardeVastgoed: string;
  wozWaardeVastgoed: string;
  financiering: string;
  huurPerMaand: string;
  rentePercentage: string;
  bezitsvorm: Bezitsvorm;
  box3WozPercentage: string;
  box3FinancieringPercentage: string;
  box3BelastingPercentage: string;
  gemiddeldeWaardestijging: string;
  fiscaalPartner: YesNo;
  heffingsvrijVermogenToepassen: YesNo;
  bvAfschrijvingPerJaar: string;
  bvOverigeKostenPerJaar: string;
  bvWinstUitkeren: YesNo;
  bvDividendUitkeringPercentage: string;
  exploitatiekosten: string[];
};

const SCHULDENDREMPEL_PER_PERSOON = 3_800;
const HEFFINGSVRIJ_PER_PERSOON = 59_357;

// Nederlandse belastingtarieven 2026.
const VPB_GRENS = 200_000;
const VPB_LAAG = 0.19;
const VPB_HOOG = 0.258;
const BOX2_GRENS = 68_843;
const BOX2_LAAG = 0.245;
const BOX2_HOOG = 0.31;
const DIVIDENDBELASTING = 0.15;

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

const amountInputFormatter = new Intl.NumberFormat("nl-NL", {
  maximumFractionDigits: 0,
});

function normalizeAmountInput(value: string) {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

function formatAmountInput(value: string) {
  const digits = normalizeAmountInput(value);
  if (!digits) return "";
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? amountInputFormatter.format(parsed) : "";
}

function caretPositionAfterDigits(formattedValue: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let seenDigits = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) seenDigits += 1;
    if (seenDigits >= digitCount) return index + 1;
  }
  return formattedValue.length;
}

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

function clampPercentage(value: number) {
  return Math.min(1, Math.max(0, value));
}

function progressiveTax(
  taxableAmount: number,
  threshold: number,
  lowerRate: number,
  upperRate: number
) {
  const amount = Math.max(0, taxableAmount);
  const lowerBand = Math.min(amount, threshold);
  const upperBand = Math.max(0, amount - threshold);
  return lowerBand * lowerRate + upperBand * upperRate;
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
    bezitsvorm: initialData.bezitsvorm ?? "prive",
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
    bvAfschrijvingPerJaar: numberToInput(
      initialData.bvAfschrijvingPerJaar ?? 0
    ),
    bvOverigeKostenPerJaar: numberToInput(
      initialData.bvOverigeKostenPerJaar ?? 0
    ),
    bvWinstUitkeren: initialData.bvWinstUitkeren ? "ja" : "nee",
    bvDividendUitkeringPercentage: percentToInput(
      initialData.bvDividendUitkeringPercentage ?? null,
      1
    ),
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
    const bezitsvorm = form.bezitsvorm;
    const isBv = bezitsvorm === "bv";

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

    // Privé / box 3
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
    const nettoHuurPrive =
      huurPerJaar + rentelasten - exploitatieTotaal + vermogensbelasting;

    // BV: afschrijving verlaagt de fiscale winst, maar is geen kasuitgave.
    const bvAfschrijving = Math.abs(
      parseNumber(form.bvAfschrijvingPerJaar) ?? 0
    );
    const bvOverigeKosten = Math.abs(
      parseNumber(form.bvOverigeKostenPerJaar) ?? 0
    );
    const winstVoorVpb =
      huurPerJaar +
      rentelasten -
      exploitatieTotaal -
      bvOverigeKosten -
      bvAfschrijving;
    const vennootschapsbelasting = progressiveTax(
      winstVoorVpb,
      VPB_GRENS,
      VPB_LAAG,
      VPB_HOOG
    );
    const winstNaVpb = winstVoorVpb - vennootschapsbelasting;
    const kasstroomNaVpb =
      huurPerJaar +
      rentelasten -
      exploitatieTotaal -
      bvOverigeKosten -
      vennootschapsbelasting;

    const dividendUitkeren = form.bvWinstUitkeren === "ja";
    const dividendPercentage = dividendUitkeren
      ? clampPercentage(
          parsePercent(form.bvDividendUitkeringPercentage, 1)
        )
      : 0;
    const uitkeerbareWinstModel = Math.max(0, winstNaVpb);
    const brutoDividend = uitkeerbareWinstModel * dividendPercentage;
    const box2Belasting = progressiveTax(
      brutoDividend,
      BOX2_GRENS,
      BOX2_LAAG,
      BOX2_HOOG
    );
    const ingehoudenDividendbelasting = brutoDividend * DIVIDENDBELASTING;
    const aanvullendeBox2BijAangifte = Math.max(
      0,
      box2Belasting - ingehoudenDividendbelasting
    );
    const nettoDividendNaarPrive = brutoDividend - box2Belasting;
    const liquiditeitInBvNaDividend = kasstroomNaVpb - brutoDividend;

    const nettoHuur = isBv ? kasstroomNaVpb : nettoHuurPrive;
    const nettoRendementMarktwaarde =
      marktwaarde > 0 ? nettoHuur / marktwaarde : null;
    const rendementEigenInleg =
      eigenInleg > 0 ? nettoHuur / eigenInleg : null;
    const rendementNaarPrive =
      isBv && dividendUitkeren && eigenInleg > 0
        ? nettoDividendNaarPrive / eigenInleg
        : null;
    const totaalRendement =
      rendementEigenInleg === null
        ? null
        : rendementEigenInleg + waardestijging;

    const totaleKosten =
      Math.abs(rentelasten) +
      exploitatieTotaal +
      (isBv
        ? bvOverigeKosten + vennootschapsbelasting
        : Math.abs(vermogensbelasting));

    const nettoPerEuro =
      huurPerJaar > 0 ? nettoHuur / huurPerJaar : null;
    const directeKasstroomTekst = nettoHuur;

    return {
      bezitsvorm,
      isBv,
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
      nettoHuurPrive,
      bvAfschrijving,
      bvOverigeKosten,
      winstVoorVpb,
      vennootschapsbelasting,
      winstNaVpb,
      kasstroomNaVpb,
      dividendUitkeren,
      dividendPercentage,
      brutoDividend,
      box2Belasting,
      ingehoudenDividendbelasting,
      aanvullendeBox2BijAangifte,
      nettoDividendNaarPrive,
      liquiditeitInBvNaDividend,
      nettoHuur,
      nettoRendementMarktwaarde,
      rendementEigenInleg,
      rendementNaarPrive,
      waardestijging,
      totaalRendement,
      totaleKosten,
      nettoPerEuro,
      directeKasstroomTekst,
    };
  }, [form, initialData.exploitatiekosten]);

  type CalculationRow = [
    string,
    string,
    "normal" | "soft" | "main"
  ];

  const calculationRows: CalculationRow[] = data.isBv
    ? [
        ["Bezitsvorm", "BV", "normal"],
        ["Marktwaarde vastgoed", euroValue(data.marktwaarde), "normal"],
        ["Huur per jaar", euroValue(data.huurPerJaar), "normal"],
        ["Financiering", euroValue(data.financiering), "normal"],
        ["Rentelasten per jaar", costEuroValue(data.rentelasten), "normal"],
        [
          "Exploitatiekosten per jaar",
          costEuroValue(data.exploitatieTotaal),
          "normal",
        ],
        ["Overige BV-kosten", costEuroValue(data.bvOverigeKosten), "normal"],
        [
          "Fiscale afschrijving (geen kasuitgave)",
          costEuroValue(data.bvAfschrijving),
          "normal",
        ],
        ["Belastbare winst", euroValue(data.winstVoorVpb), "soft"],
        [
          "Vennootschapsbelasting",
          costEuroValue(data.vennootschapsbelasting),
          "normal",
        ],
        ["Kasstroom na Vpb", euroValue(data.kasstroomNaVpb), "main"],
        ...(data.dividendUitkeren
          ? ([
              ["Bruto dividend", euroValue(data.brutoDividend), "normal"],
              ["Box 2-belasting", costEuroValue(data.box2Belasting), "normal"],
              [
                "Netto dividend naar privé",
                euroValue(data.nettoDividendNaarPrive),
                "main",
              ],
            ] as CalculationRow[])
          : []),
        [
          "Rendement op eigen inleg in BV",
          pctValue(data.rendementEigenInleg),
          "normal",
        ],
        ["Gemiddelde waardestijging", pctValue(data.waardestijging), "normal"],
        [
          "Indicatief totaal incl. waardestijging",
          pctValue(data.totaalRendement),
          "main",
        ],
      ]
    : [
        ["Bezitsvorm", "Privé", "normal"],
        ["Marktwaarde vastgoed", euroValue(data.marktwaarde), "normal"],
        ["WOZ-waarde vastgoed", euroValue(data.wozwaarde), "normal"],
        ["Huur per maand", euroValue(data.huurPerMaand), "normal"],
        ["Huur per jaar", euroValue(data.huurPerJaar), "normal"],
        ["Bruto rendement marktwaarde", pctValue(data.brutoRendement), "normal"],
        ["Financiering", euroValue(data.financiering), "normal"],
        ["Rente", pctValue(data.rente), "normal"],
        ["Rentelasten per jaar", costEuroValue(data.rentelasten), "normal"],
        ["Na rente resteert", euroValue(data.naRente), "soft"],
        [
          "Exploitatiekosten per jaar",
          costEuroValue(data.exploitatieTotaal),
          "normal",
        ],
        ["Vermogensbelasting", costEuroValue(data.vermogensbelasting), "normal"],
        ["Netto huurinkomsten", euroValue(data.nettoHuur), "main"],
        [
          "Netto rendement marktwaarde",
          pctValue(data.nettoRendementMarktwaarde),
          "normal",
        ],
        ["Rendement op eigen inleg", pctValue(data.rendementEigenInleg), "normal"],
        ["Gemiddelde waardestijging", pctValue(data.waardestijging), "normal"],
        [
          "Totaal rendement incl. waardestijging",
          pctValue(data.totaalRendement),
          "main",
        ],
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

          <ChoiceField
            label="Investeren vanuit"
            value={form.bezitsvorm}
            options={[
              { value: "prive", label: "Privé" },
              { value: "bv", label: "BV" },
            ]}
            onChange={(value) =>
              updateField("bezitsvorm", value as Bezitsvorm)
            }
          />

          <InputField
            label="Marktwaarde"
            value={form.marktwaardeVastgoed}
            format="amount"
            onChange={(value) => updateField("marktwaardeVastgoed", value)}
          />
          <InputField
            label="WOZ-waarde"
            value={form.wozWaardeVastgoed}
            format="amount"
            onChange={(value) => updateField("wozWaardeVastgoed", value)}
          />
          <InputField
            label="Financiering"
            value={form.financiering}
            format="amount"
            onChange={(value) => updateField("financiering", value)}
          />
          <InputField
            label="Huur per maand"
            value={form.huurPerMaand}
            format="amount"
            onChange={(value) => updateField("huurPerMaand", value)}
          />
          <InputField
            label="Rente %"
            value={form.rentePercentage}
            onChange={(value) => updateField("rentePercentage", value)}
          />
          <InputField
            label="Waardestijging %"
            value={form.gemiddeldeWaardestijging}
            onChange={(value) =>
              updateField("gemiddeldeWaardestijging", value)
            }
          />

          {form.bezitsvorm === "prive" ? (
            <>
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
              <div className="tax-input-note input-full">
                Privémodel 2026: box 3 met WOZ-waarde, schuldendrempel,
                heffingsvrij vermogen en forfaitaire rendementspercentages.
              </div>
            </>
          ) : (
            <>
              <InputField
                label="Fiscale afschrijving per jaar"
                value={form.bvAfschrijvingPerJaar}
                format="amount"
                onChange={(value) =>
                  updateField("bvAfschrijvingPerJaar", value)
                }
              />
              <InputField
                label="Overige BV-kosten per jaar"
                value={form.bvOverigeKostenPerJaar}
                format="amount"
                onChange={(value) =>
                  updateField("bvOverigeKostenPerJaar", value)
                }
              />
              <SelectField
                label="Winst uitkeren naar privé?"
                value={form.bvWinstUitkeren}
                onChange={(value) => updateField("bvWinstUitkeren", value)}
              />
              {form.bvWinstUitkeren === "ja" && (
                <InputField
                  label="Deel winst uitkeren %"
                  value={form.bvDividendUitkeringPercentage}
                  onChange={(value) =>
                    updateField("bvDividendUitkeringPercentage", value)
                  }
                />
              )}
              <div className="tax-input-note input-full">
                BV-model 2026: Vpb 19% tot en met € 200.000 en 25,8% over
                het meerdere. Bij dividend rekent het model aanvullend met
                box 2: 24,5% tot € 68.843 en 31% over het meerdere.
                Afschrijving is fiscaal, maar geen directe kasuitgave.
              </div>
            </>
          )}
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
              format="amount"
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
          <KpiCard
            label="Bruto rendement"
            value={pctValue(data.brutoRendement)}
            text="Huur per jaar gedeeld door marktwaarde."
          />
          <KpiCard
            label="Na rente resteert"
            value={euroValue(data.naRente)}
            text="Huurinkomsten na jaarlijkse rentelasten."
          />
          <KpiCard
            label={data.isBv ? "Kasstroom na Vpb" : "Netto huurinkomsten"}
            value={euroValue(data.nettoHuur)}
            text={
              data.isBv
                ? "Na rente, kosten en vennootschapsbelasting."
                : "Na rente, exploitatiekosten en vermogensbelasting."
            }
          />
          <KpiCard
            label={
              data.isBv && data.dividendUitkeren
                ? "Netto dividend privé"
                : "Totaal incl. waardestijging"
            }
            value={
              data.isBv && data.dividendUitkeren
                ? euroValue(data.nettoDividendNaarPrive)
                : pctValue(data.totaalRendement)
            }
            text={
              data.isBv && data.dividendUitkeren
                ? "Uitkering na de berekende box 2-belasting."
                : "Rendement op eigen inleg plus waardestijging."
            }
          />
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
              <InfoLine
                label="Bezitsvorm"
                value={data.isBv ? "BV" : "Privé"}
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
          {data.isBv ? (
            <>
              <p>
                Het vastgoed wordt in dit rekenmodel vanuit een BV gehouden.
                Van de jaarlijkse huurinkomsten van{" "}
                <strong>{euroValue(data.huurPerJaar)}</strong> gaan{" "}
                <strong>{euroValue(Math.abs(data.rentelasten))}</strong> aan rente,
                <strong> {euroValue(data.exploitatieTotaal)}</strong> aan
                exploitatiekosten en{" "}
                <strong>{euroValue(data.bvOverigeKosten)}</strong> aan overige
                BV-kosten af. De ingevoerde fiscale afschrijving van{" "}
                <strong>{euroValue(data.bvAfschrijving)}</strong> verlaagt de
                belastbare winst, maar is geen directe kasuitgave.
              </p>
              <p>
                De belastbare winst bedraagt{" "}
                <strong>{euroValue(data.winstVoorVpb)}</strong>. Na{" "}
                <strong>{euroValue(data.vennootschapsbelasting)}</strong> aan
                vennootschapsbelasting resteert een jaarlijkse kasstroom in de
                BV van <strong>{euroValue(data.kasstroomNaVpb)}</strong>, oftewel{" "}
                <strong>{pctValue(data.rendementEigenInleg)}</strong> op de eigen
                inleg.
              </p>
              {data.dividendUitkeren ? (
                <p>
                  Van de winst na Vpb wordt{" "}
                  <strong>{pctValue(data.dividendPercentage)}</strong> als
                  dividend uitgekeerd. Na de berekende box 2-belasting van{" "}
                  <strong>{euroValue(data.box2Belasting)}</strong> ontvangt privé
                  netto <strong>{euroValue(data.nettoDividendNaarPrive)}</strong>.
                  De ingehouden dividendbelasting is in dit model een voorheffing
                  en wordt niet dubbel boven op box 2 gerekend.
                </p>
              ) : (
                <p>
                  Er wordt geen dividend uitgekeerd. Daardoor is nog geen box
                  2-belasting opgenomen en blijft de beschikbare liquiditeit in
                  de BV voor herinvestering aanwezig.
                </p>
              )}
              <p>
                De waardestijging is geen jaarlijkse kasstroom. Een eventuele
                fiscale boekwinst bij verkoop, btw-effecten, renteaftrekbeperkingen
                en een mogelijk DGA-loon vallen buiten deze vereenvoudigde check.
              </p>
            </>
          ) : (
            <>
              <p>
                Het bruto rendement van{" "}
                <strong>{pctValue(data.brutoRendement)}</strong> lijkt aantrekkelijk,
                maar geeft een onvolledig beeld. Van de jaarlijkse huurinkomsten
                van <strong>{euroValue(data.huurPerJaar)}</strong> gaan nog{" "}
                <strong>{euroValue(Math.abs(data.rentelasten))}</strong> aan rente,
                <strong> {euroValue(data.exploitatieTotaal)}</strong> aan
                exploitatiekosten en{" "}
                <strong>{euroValue(Math.abs(data.vermogensbelasting))}</strong> aan
                vermogensbelasting af. Uiteindelijk resteert{" "}
                <strong>{euroValue(data.nettoHuur)}</strong> aan netto
                huurinkomsten.
              </p>
              <p>
                Het totale nettorendement inclusief waardestijging bedraagt{" "}
                <strong>{pctValue(data.totaalRendement)}</strong>. De verwachte
                waardestijging is geen directe kasstroom en komt pas beschikbaar
                bij verkoop of herfinanciering. De directe kasstroom uit verhuur
                bedraagt <strong>{pctValue(data.rendementEigenInleg)}</strong>,
                oftewel <strong>{euroValue(data.directeKasstroomTekst)}</strong> per
                jaar.
              </p>
            </>
          )}
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
            {data.isBv ? (
              <>
                <SectionTitle number="04" title="BV-belasting" />
                <div className="tax-list">
                  <InfoLine label="Bezitsvorm" value="BV" />
                  <InfoLine
                    label="Belastbare winst"
                    value={euroValue(data.winstVoorVpb)}
                    strong
                  />
                  <InfoLine
                    label="Vpb-tarief"
                    value="19% / 25,8%"
                  />
                  <InfoLine
                    label="Vennootschapsbelasting"
                    value={costEuroValue(data.vennootschapsbelasting)}
                  />
                  <InfoLine
                    label="Winst na Vpb"
                    value={euroValue(data.winstNaVpb)}
                  />
                  <InfoLine
                    label="Afschrijving terug in kasstroom"
                    value={euroValue(data.bvAfschrijving)}
                  />
                  <InfoLine
                    label="Kasstroom na Vpb"
                    value={euroValue(data.kasstroomNaVpb)}
                    strong
                  />
                  <InfoLine
                    label="Dividenduitkering"
                    value={data.dividendUitkeren ? "Ja" : "Nee"}
                  />
                  {data.dividendUitkeren && (
                    <>
                      <InfoLine
                        label="Uitkeringspercentage"
                        value={pctValue(data.dividendPercentage)}
                      />
                      <InfoLine
                        label="Bruto dividend"
                        value={euroValue(data.brutoDividend)}
                      />
                      <InfoLine
                        label="Box 2 (24,5% / 31%)"
                        value={costEuroValue(data.box2Belasting)}
                      />
                      <InfoLine
                        label="Inhouding dividendbelasting"
                        value={costEuroValue(data.ingehoudenDividendbelasting)}
                      />
                      <InfoLine
                        label="Aanvullend via aangifte"
                        value={costEuroValue(data.aanvullendeBox2BijAangifte)}
                      />
                      <InfoLine
                        label="Netto naar privé"
                        value={euroValue(data.nettoDividendNaarPrive)}
                        strong
                      />
                    </>
                  )}
                  <InfoLine
                    label="Liquiditeit blijft in BV"
                    value={euroValue(data.liquiditeitInBvNaDividend)}
                    strong
                  />
                </div>
                <p className="box3-note">
                  Indicatieve jaarberekening 2026. De fiscale afschrijving moet
                  afzonderlijk worden beoordeeld en mag de fiscale boekwaarde
                  niet onder de WOZ-bodemwaarde brengen. Verkoopwinst, btw,
                  gebruikelijk loon en renteaftrekbeperkingen zijn niet verwerkt.
                </p>
              </>
            ) : (
              <>
                <SectionTitle number="04" title="Box 3-uitgangspunt" />
                <div className="tax-list">
                  <InfoLine
                    label="Fiscaal partner"
                    value={data.fiscaalPartner ? "Ja" : "Nee"}
                  />
                  <InfoLine
                    label="Heffingsvrij vermogen toegepast"
                    value={data.heffingsvrijToepassen ? "Ja" : "Nee"}
                  />
                  <InfoLine
                    label="Schuldendrempel"
                    value={euroValue(data.schuldendrempel)}
                  />
                  <InfoLine
                    label="Toegepaste vrijstelling"
                    value={euroValue(data.toegepasteVrijstelling)}
                  />
                  <InfoLine
                    label={`WOZ-waarde x ${pctValue(data.box3WozPercentage)}`}
                    value={euroValue(data.fictiefRendementWoz)}
                  />
                  <InfoLine
                    label={`Aftrekbare schuld x ${pctValue(
                      data.box3FinancieringPercentage
                    )}`}
                    value={costEuroValue(data.fictiefRendementSchuld)}
                  />
                  <InfoLine
                    label="Rendementsgrondslag"
                    value={euroValue(data.rendementsgrondslag)}
                  />
                  <InfoLine
                    label="Grondslag na vrijstelling"
                    value={euroValue(data.grondslagNaVrijstelling)}
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
                    value={costEuroValue(data.vermogensbelasting)}
                    strong
                  />
                </div>
                <p className="box3-note">
                  Deze Box 3-berekening is gebaseerd op de ingevoerde
                  uitgangspunten. Tarieven, vrijstellingen en de
                  berekeningsmethode kunnen wijzigen.
                </p>
              </>
            )}
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
              value={data.rentelasten}
              max={data.huurPerJaar}
            />
            <Bar
              label="Exploitatiekosten"
              value={data.exploitatieTotaal}
              max={data.huurPerJaar}
            />
            {data.isBv ? (
              <>
                <Bar
                  label="Overige BV-kosten"
                  value={data.bvOverigeKosten}
                  max={data.huurPerJaar}
                />
                <Bar
                  label="Vennootschapsbelasting"
                  value={data.vennootschapsbelasting}
                  max={data.huurPerJaar}
                />
                <Bar
                  label="Kasstroom na Vpb"
                  value={data.kasstroomNaVpb}
                  max={data.huurPerJaar}
                  positive
                />
              </>
            ) : (
              <>
                <Bar
                  label="Vermogensbelasting"
                  value={data.vermogensbelasting}
                  max={data.huurPerJaar}
                />
                <Bar
                  label="Netto huurinkomsten"
                  value={data.nettoHuur}
                  max={data.huurPerJaar}
                  positive
                />
              </>
            )}
          </div>

          <div className="card text-card risico">
            <SectionTitle number="06" title="Risico en weerbaarheid" />
            {data.isBv ? (
              <>
                <p>
                  Van de <strong>{euroValue(data.huurPerJaar)}</strong> bruto
                  jaarhuur gaat in dit rekenvoorbeeld{" "}
                  <strong>{euroValue(data.totaleKosten)}</strong> op aan rente,
                  exploitatiekosten, overige BV-kosten en Vpb. Daardoor blijft{" "}
                  <strong>{pctValue(data.nettoPerEuro)}</strong> van de huur als
                  kasstroom in de BV over.
                </p>
                <p>
                  Afschrijving verlaagt de fiscale winst, maar niet de liquide
                  kasstroom. Bij een dividenduitkering volgt box 2. De uitkomst is
                  een vereenvoudigde indicatie en vervangt geen fiscale beoordeling
                  van boekwaarde, grond, btw, DGA-loon of renteaftrek.
                </p>
              </>
            ) : (
              <>
                <p>
                  Van de <strong>{euroValue(data.huurPerJaar)}</strong> bruto
                  jaarhuur gaat in dit rekenvoorbeeld{" "}
                  <strong>{euroValue(data.totaleKosten)}</strong> op aan rente,
                  exploitatiekosten en vermogensbelasting. Daardoor blijft ongeveer{" "}
                  <strong>{pctValue(data.nettoPerEuro)}</strong> van de huur als
                  directe netto kasstroom over.
                </p>
                <p>
                  Deze uitkomst is een momentopname. Langere leegstand, onverwacht
                  onderhoud, hogere financieringslasten of wijzigingen in fiscale
                  regelgeving kunnen de kasstroom verder verlagen.
                </p>
              </>
            )}
            <div className="closing-box">
              <span>{data.isBv ? "Kasstroom per € 1 huur" : "Netto per € 1 huur"}</span>
              <strong>{euroDecimalValue(data.nettoPerEuro)}</strong>
            </div>
            <div className="closing-box soft">
              <span>
                {data.isBv && data.dividendUitkeren
                  ? "Netto dividend privé"
                  : "Kosten en belasting"}
              </span>
              <strong>
                {data.isBv && data.dividendUitkeren
                  ? euroValue(data.nettoDividendNaarPrive)
                  : euroValue(data.totaleKosten)}
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
  format = "plain",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  format?: "plain" | "amount";
}) {
  const shownValue = format === "amount" ? formatAmountInput(value) : value;
  const [draftValue, setDraftValue] = useState(shownValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraftValue(format === "amount" ? formatAmountInput(value) : value);
    }
  }, [value, format, isFocused]);

  const input = (
    <input
      value={draftValue}
      inputMode={format === "amount" ? "numeric" : undefined}
      autoComplete="off"
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
        if (nextValue !== value) onChange(nextValue);
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
    <label className={`input-field${format === "amount" ? " amount-field" : ""}`}>
      <span>{label}</span>
      {format === "amount" ? (
        <div className="amount-input-wrap">
          <span className="amount-input-prefix" aria-hidden="true">€</span>
          {input}
        </div>
      ) : (
        input
      )}
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

function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
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

  .input-full { grid-column: 1 / -1; }

  .tax-input-note {
    padding: 11px 13px;
    border: 1px dashed rgba(106,93,82,.28);
    border-radius: 11px;
    background: rgba(226,226,222,.45);
    color: var(--walnut);
    font-size: 12px;
    line-height: 1.45;
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

  .input-field input:focus,
  .input-field select:focus,
  .amount-input-wrap:focus-within {
    border-color: rgba(106,93,82,.58);
    box-shadow: 0 0 0 3px rgba(106,93,82,.10);
  }

  .amount-input-wrap {
    display: grid;
    grid-template-columns: 34px minmax(0,1fr);
    min-height: 42px;
    overflow: hidden;
    border: 1px solid rgba(106,93,82,.24);
    border-radius: 11px;
    background: var(--white);
  }

  .amount-input-prefix {
    display: grid;
    place-items: center;
    border-right: 1px solid rgba(106,93,82,.18);
    background: rgba(232,227,218,.62);
    color: var(--walnut);
    font-size: 14px;
    font-weight: 800;
  }

  .amount-input-wrap input {
    min-height: 40px;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none !important;
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
    grid-template-columns: 1fr 82mm;
    gap: 7mm;
  }

  .page-two-grid.lower {
    grid-template-columns: 1fr 82mm;
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
    .input-grid, .expense-input-grid {
      grid-template-columns: repeat(2, minmax(0,1fr));
    }
  }

  @media screen and (max-width: 560px) {
    .input-grid, .expense-input-grid { grid-template-columns: 1fr; }
  }
`;