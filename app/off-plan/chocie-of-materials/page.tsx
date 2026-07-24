"use client";

import { useEffect, useMemo, useState } from "react";

type MaterialRow = {
  id: string;
  item: string;
  note: string;
  price: string;
  selected: boolean;
};

type MaterialSection = {
  id: string;
  title: string;
  rows: MaterialRow[];
};

type FormState = {
  applicant: string;
  home: string;
  day: string;
  month: string;
  year: string;
  sections: MaterialSection[];
};

const STORAGE_KEY = "capri-choice-of-materials-form";

function createInitialForm(): FormState {
  return {
    applicant: "",
    home: "",
    day: "",
    month: "",
    year: "",

    sections: [
      {
        id: "flooring",
        title: "GENERAL FLOORING",
        rows: [
          {
            id: "flooring-beige",
            item: "Flooring 75x75cm Beige / Standard",
            note: "",
            price: "No cost",
            selected: false,
          },
          {
            id: "flooring-white",
            item: "Flooring 75x75cm White / Optional",
            note: "Except terrace which is Beige 60x60",
            price: "No cost",
            selected: false,
          },
        ],
      },

      {
        id: "master-bathroom-tiling",
        title: "MASTER BATHROOM: VERTICAL TILING",
        rows: [
          {
            id: "master-tiling-beige",
            item: "Vertical Tiling Beige / Standard",
            note: "Only with beige flooring",
            price: "No cost",
            selected: false,
          },
          {
            id: "master-tiling-white",
            item: "Vertical Tiling White / Optional",
            note: "Only with white flooring",
            price: "No cost",
            selected: false,
          },
        ],
      },

      {
        id: "second-bathroom-tiling",
        title: "SECOND BATHROOM VERTICAL TILING",
        rows: [
          {
            id: "second-tiling-beige",
            item: "Vertical Tiling Beige / Standard",
            note: "Only with beige flooring",
            price: "No cost",
            selected: false,
          },
          {
            id: "second-tiling-white",
            item: "Vertical Tiling White / Optional",
            note: "Only with white flooring",
            price: "No cost",
            selected: false,
          },
        ],
      },

      {
        id: "kitchen-doors",
        title: "KITCHEN: DOOR FINISHES",
        rows: [
          {
            id: "kitchen-white-matt",
            item: "White matt / Standard",
            note: "",
            price: "No cost",
            selected: false,
          },
          {
            id: "kitchen-white-gloss",
            item: "White gloss / Optional",
            note: "",
            price: "No cost",
            selected: false,
          },
          {
            id: "kitchen-taupe",
            item: "Taupe matt / Optional",
            note: "",
            price: "No cost",
            selected: false,
          },
          {
            id: "kitchen-island",
            item: "Kitchen island size 210x90 / Optional",
            note: "The island cannot be installed in Type B apartments",
            price: "5.000 €",
            selected: false,
          },
        ],
      },

      {
        id: "countertops",
        title: "KITCHEN / COUNTERTOPS",
        rows: [
          {
            id: "countertop-marble",
            item: "Coverlam or similar, color Marble, Corinto / Standard",
            note: "",
            price: "No cost",
            selected: false,
          },
          {
            id: "countertop-beige",
            item: "Coverlam or similar, color Beige, Basaltina / Optional",
            note: "",
            price: "No cost",
            selected: false,
          },
        ],
      },

      {
        id: "kitchen-extras",
        title: "KITCHEN / EXTRAS AND APPLIANCES",
        rows: [
          {
            id: "island-socket",
            item: "Socket for island",
            note: "",
            price: "200 €",
            selected: false,
          },
          {
            id: "kitchen-led",
            item: "LED lighting under kitchen cabinet",
            note: "",
            price: "650 €",
            selected: false,
          },
          {
            id: "washing-machine",
            item: "Washing machine (BOSCH)",
            note: "",
            price: "850 €",
            selected: false,
          },
          {
            id: "dryer",
            item: "Dryer (BOSCH)",
            note: "",
            price: "900 €",
            selected: false,
          },
        ],
      },

      {
        id: "bathroom-fittings",
        title: "BATHROOM FITTINGS AND SHOWER SCREENS",
        rows: [
          {
            id: "master-shower",
            item: "Master bathroom – Shower including screen / Standard",
            note: "",
            price: "No cost",
            selected: false,
          },
          {
            id: "master-bath",
            item: "Master bathroom – Change shower to bath / Optional",
            note: "Includes screen",
            price: "1.000 €",
            selected: false,
          },
          {
            id: "second-shower",
            item: "Second bathroom – Shower / Standard",
            note: "",
            price: "No cost",
            selected: false,
          },
          {
            id: "second-bath",
            item: "Second bathroom – Change shower to bath / Optional",
            note: "Cannot be installed in Penthouse A",
            price: "1.000 €",
            selected: false,
          },
          {
            id: "second-screen",
            item: "Second bathroom – Shower screen / Optional",
            note: "",
            price: "600 €",
            selected: false,
          },
        ],
      },

      {
        id: "bathroom-furniture",
        title: "BATHROOM: FURNITURE",
        rows: [
          {
            id: "wooden-shelf",
            item: "Second bathroom – Wooden shelf / Standard",
            note: "",
            price: "No cost",
            selected: false,
          },
          {
            id: "bathroom-cabinet",
            item: "Second bathroom – Cabinet with 2 drawers / Optional",
            note: "Wood color",
            price: "700 €",
            selected: false,
          },
        ],
      },

      {
        id: "electric-charger",
        title: "ELECTRIC CHARGER / LIMITED NUMBER",
        rows: [
          {
            id: "charger",
            item: "Electric charger type 1 & 2 / Optional",
            note: "",
            price: "6.000 €",
            selected: false,
          },
        ],
      },
    ],
  };
}

/**
 * Zet tekst zoals:
 * 5.000 €
 * 1.000 €
 * 650 €
 * No cost
 * om naar een getal.
 */
function parsePrice(value: string): number {
  const text = value.trim().toLowerCase();

  if (
    text === "" ||
    text.includes("no cost") ||
    text.includes("geen kosten") ||
    text.includes("gratis")
  ) {
    return 0;
  }

  let cleaned = text.replace(/[^0-9,.-]/g, "");

  if (!cleaned) {
    return 0;
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    const digitsAfterComma = cleaned.length - lastComma - 1;

    if (digitsAfterComma === 3) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(",", ".");
    }
  } else if (lastDot !== -1) {
    const numberOfDots = (cleaned.match(/\./g) ?? []).length;
    const digitsAfterDot = cleaned.length - lastDot - 1;

    if (numberOfDots > 1 || digitsAfterDot === 3) {
      cleaned = cleaned.replace(/\./g, "");
    }
  }

  const parsedValue = Number.parseFloat(cleaned);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ChoiceOfMaterialsPage() {
  const [form, setForm] = useState<FormState>(createInitialForm);
  const [storageLoaded, setStorageLoaded] = useState(false);

  /*
   * Eerder ingevulde gegevens uit de browser laden.
   */
  useEffect(() => {
    try {
      const savedForm = window.localStorage.getItem(STORAGE_KEY);

      if (savedForm) {
        const parsedForm = JSON.parse(savedForm) as FormState;
        setForm(parsedForm);
      }
    } catch (error) {
      console.error("Het opgeslagen formulier kon niet worden geladen.", error);
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  /*
   * Veranderingen automatisch opslaan.
   */
  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch (error) {
      console.error("Het formulier kon niet worden opgeslagen.", error);
    }
  }, [form, storageLoaded]);

  /*
   * Alleen aangevinkte regels worden opgeteld.
   */
  const total = useMemo(() => {
    return form.sections.reduce((sectionTotal, section) => {
      const selectedRowsTotal = section.rows.reduce((rowTotal, row) => {
        if (!row.selected) {
          return rowTotal;
        }

        return rowTotal + parsePrice(row.price);
      }, 0);

      return sectionTotal + selectedRowsTotal;
    }, 0);
  }, [form.sections]);

  function updateMainField(
    field: "applicant" | "home" | "day" | "month" | "year",
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updateSectionTitle(sectionId: string, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      sections: currentForm.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              title: value,
            }
          : section,
      ),
    }));
  }

  function updateRow(
    sectionId: string,
    rowId: string,
    field: keyof Omit<MaterialRow, "id">,
    value: string | boolean,
  ) {
    setForm((currentForm) => ({
      ...currentForm,

      sections: currentForm.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,

          rows: section.rows.map((row) => {
            if (row.id !== rowId) {
              return row;
            }

            return {
              ...row,
              [field]: value,
            } as MaterialRow;
          }),
        };
      }),
    }));
  }

  function resetForm() {
    const confirmed = window.confirm(
      "Weet je zeker dat je alle ingevulde gegevens wilt verwijderen?",
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setForm(createInitialForm());
  }

  return (
    <main className="choicePage">
      <div className="choiceToolbar noPrint">
        <button
          type="button"
          className="secondaryButton"
          onClick={resetForm}
        >
          Formulier resetten
        </button>

        <button
          type="button"
          className="primaryButton"
          onClick={() => window.print()}
        >
          Afdrukken / PDF
        </button>
      </div>

      <article className="choiceDocument">
        <header className="choiceHero">
          <div className="choiceHeroShade" />

          <div className="choiceHeroContent">
            <div>
              <div className="choiceAnnex">ANNEX</div>
              <h1>CHOICE OF MATERIALS</h1>
            </div>

            <div className="choiceBrand">
              <div className="choiceBrandName">CAPRI</div>
              <div className="choiceBrandSubtitle">Exclusive Homes</div>
            </div>
          </div>
        </header>

        <section className="choiceContent">
          <div className="choiceTopFields">
            <div>
              <label className="choiceFieldRow">
                <span>Applicant:</span>

                <input
                  type="text"
                  value={form.applicant}
                  onChange={(event) =>
                    updateMainField("applicant", event.target.value)
                  }
                  placeholder="Naam van de aanvrager"
                />
              </label>

              <label className="choiceFieldRow">
                <span>Home:</span>

                <input
                  type="text"
                  value={form.home}
                  onChange={(event) =>
                    updateMainField("home", event.target.value)
                  }
                  placeholder="Woning of bouwnummer"
                />
              </label>
            </div>

            <div className="choicePricesHeading">
              PRICES
              <br />
              WITHOUT VAT
            </div>
          </div>

          <p className="choiceInstructions noPrint">
            Alle teksten, opmerkingen en prijzen zijn aanpasbaar. Alleen
            aangevinkte regels worden bij het totaal opgeteld.
          </p>

          <div className="choiceTableWrapper">
            <table className="choiceTable">
              <colgroup>
                <col className="selectColumn" />
                <col className="itemColumn" />
                <col className="noteColumn" />
                <col className="pvpColumn" />
                <col className="priceColumn" />
              </colgroup>

              <thead>
                <tr>
                  <th>Select</th>
                  <th>Material / option</th>
                  <th>Notes</th>
                  <th>P.V.P.</th>
                  <th>Price</th>
                </tr>
              </thead>

              <tbody>
                {form.sections.map((section) => (
                  <SectionRows
                    key={section.id}
                    section={section}
                    updateSectionTitle={updateSectionTitle}
                    updateRow={updateRow}
                  />
                ))}
              </tbody>

              <tfoot>
                <tr className="choiceTotalRow">
                  <th colSpan={3}>TOTAL</th>
                  <td>P.V.P.:</td>
                  <td className="choiceTotalValue">
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="choiceDateRow">
            <span>En Málaga a</span>

            <input
              type="text"
              value={form.day}
              onChange={(event) =>
                updateMainField("day", event.target.value)
              }
              maxLength={2}
              placeholder="dd"
              aria-label="Dag"
            />

            <span>de</span>

            <input
              type="text"
              value={form.month}
              onChange={(event) =>
                updateMainField("month", event.target.value)
              }
              placeholder="maand"
              aria-label="Maand"
            />

            <span>de</span>

            <input
              type="text"
              value={form.year}
              onChange={(event) =>
                updateMainField("year", event.target.value)
              }
              maxLength={4}
              placeholder="jaar"
              aria-label="Jaar"
            />
          </div>
        </section>
      </article>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .choicePage {
          min-height: 100vh;
          padding: 24px;
          background: #edf0f1;
          color: #353a3d;
          font-family: Arial, Helvetica, sans-serif;
        }

        .choiceToolbar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          width: min(1120px, 100%);
          margin: 0 auto 16px;
        }

        .choiceToolbar button {
          padding: 11px 18px;
          border: 0;
          border-radius: 6px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .secondaryButton {
          background: #71777a;
        }

        .primaryButton {
          background: #303538;
        }

        .choiceDocument {
          width: min(1120px, 100%);
          min-height: 1000px;
          margin: 0 auto;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.14);
        }

        .choiceHero {
          position: relative;
          min-height: 160px;
          overflow: hidden;

          /*
           * De rechterkant van de achtergrond wordt ingezoomd.
           * Hierdoor blijft de tekst uit de oorspronkelijke afbeelding
           * buiten beeld.
           */
          background-image: url("/photos/choice-of-materials-bg.png");
          background-repeat: no-repeat;
          background-position: right center;
          background-size: 280% auto;
        }

        .choiceHeroShade {
          position: absolute;
          inset: 0;
          background: rgba(242, 247, 247, 0.28);
          pointer-events: none;
        }

        .choiceHeroContent {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 160px;
          padding: 35px 65px;
        }

        .choiceAnnex {
          margin-bottom: 4px;
          font-size: 18px;
          font-weight: 400;
          letter-spacing: 0.04em;
        }

        .choiceHero h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .choiceBrand {
          text-align: right;
        }

        .choiceBrandName {
          font-size: 42px;
          font-weight: 300;
          letter-spacing: 10px;
        }

        .choiceBrandSubtitle {
          margin-top: 4px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 12px;
          font-style: italic;
        }

        .choiceContent {
          padding: 40px 60px 50px;
        }

        .choiceTopFields {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 130px;
          margin-bottom: 14px;
        }

        .choiceFieldRow {
          display: flex;
          align-items: center;
          min-height: 36px;
          border-bottom: 1px solid #b9bec1;
        }

        .choiceFieldRow span {
          width: 95px;
          padding-left: 10px;
          color: #666c70;
          font-size: 12px;
        }

        .choiceFieldRow input {
          flex: 1;
          min-width: 0;
          padding: 8px;
          border: 0;
          outline: none;
          background: transparent;
          color: #34393c;
          font: inherit;
        }

        .choiceFieldRow input:focus {
          background: #faf7f0;
        }

        .choicePricesHeading {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 6px;
          border-bottom: 1px solid #b9bec1;
          border-left: 1px solid #b9bec1;
          color: #666c70;
          text-align: center;
          font-size: 10px;
          line-height: 1.2;
        }

        .choiceInstructions {
          margin: 0 0 12px;
          color: #72777a;
          font-size: 11px;
        }

        .choiceTableWrapper {
          width: 100%;
          overflow-x: auto;
        }

        .choiceTable {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 11px;
        }

        .selectColumn {
          width: 7%;
        }

        .itemColumn {
          width: 40%;
        }

        .noteColumn {
          width: 31%;
        }

        .pvpColumn {
          width: 8%;
        }

        .priceColumn {
          width: 14%;
        }

        .choiceTable th,
        .choiceTable td {
          height: 31px;
          padding: 4px 7px;
          border-bottom: 1px solid #c2c6c8;
          vertical-align: middle;
        }

        .choiceTable td + td,
        .choiceTable th + th {
          border-left: 1px solid #c2c6c8;
        }

        .choiceTable thead th {
          color: #707679;
          font-size: 9px;
          font-weight: 500;
          text-align: left;
          text-transform: uppercase;
        }

        .choiceTable thead th:first-child,
        .choiceTable thead th:nth-last-child(-n + 2) {
          text-align: center;
        }

        .choiceTotalRow th,
        .choiceTotalRow td {
          height: 42px;
          border: 0;
          background: #dfe3e5;
          font-weight: 700;
        }

        .choiceTotalRow th {
          padding-left: 14px;
          text-align: left;
        }

        .choiceTotalRow td {
          text-align: right;
        }

        .choiceTotalValue {
          font-size: 15px;
          white-space: nowrap;
        }

        .choiceDateRow {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          margin-top: 36px;
          padding-left: 10px;
          font-size: 12px;
        }

        .choiceDateRow input {
          width: 95px;
          padding: 5px;
          border: 0;
          border-bottom: 1px solid #b9bec1;
          outline: none;
          background: transparent;
          text-align: center;
          font: inherit;
        }

        @media (max-width: 800px) {
          .choicePage {
            padding: 0;
          }

          .choiceToolbar {
            padding: 12px;
            margin: 0;
          }

          .choiceDocument {
            width: 100%;
            box-shadow: none;
          }

          .choiceHeroContent {
            align-items: flex-start;
            flex-direction: column;
            gap: 24px;
            padding: 30px 24px;
          }

          .choiceBrand {
            text-align: left;
          }

          .choiceContent {
            padding: 30px 20px;
          }

          .choiceTopFields {
            grid-template-columns: 1fr;
          }

          .choicePricesHeading {
            display: none;
          }

          .choiceDateRow {
            flex-wrap: wrap;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          body {
            background: #ffffff;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .choicePage {
            padding: 0;
            background: #ffffff;
          }

          .noPrint {
            display: none !important;
          }

          .choiceDocument {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            box-shadow: none;
          }

          .choiceHero {
            min-height: 38mm;
          }

          .choiceHeroContent {
            min-height: 38mm;
            padding: 8mm 14mm;
          }

          .choiceContent {
            padding: 8mm 12mm;
          }

          .choiceTableWrapper {
            overflow: visible;
          }

          .choiceTable {
            min-width: 0;
            font-size: 7.3pt;
          }

          .choiceTable th,
          .choiceTable td {
            height: 5.7mm;
            padding: 0.7mm 1.3mm;
          }

          input {
            color: #000000;
          }
        }
      `}</style>
    </main>
  );
}

type SectionRowsProps = {
  section: MaterialSection;

  updateSectionTitle: (
    sectionId: string,
    value: string,
  ) => void;

  updateRow: (
    sectionId: string,
    rowId: string,
    field: keyof Omit<MaterialRow, "id">,
    value: string | boolean,
  ) => void;
};

function SectionRows({
  section,
  updateSectionTitle,
  updateRow,
}: SectionRowsProps) {
  return (
    <>
      <tr className="sectionHeadingRow">
        <th colSpan={5}>
          <input
            type="text"
            value={section.title}
            onChange={(event) =>
              updateSectionTitle(section.id, event.target.value)
            }
            aria-label="Sectietitel"
          />
        </th>
      </tr>

      {section.rows.map((row) => (
        <tr
          key={row.id}
          className={row.selected ? "materialRow selectedRow" : "materialRow"}
        >
          <td className="checkboxCell">
            <input
              type="checkbox"
              checked={row.selected}
              onChange={(event) =>
                updateRow(
                  section.id,
                  row.id,
                  "selected",
                  event.target.checked,
                )
              }
              aria-label={`Selecteer ${row.item}`}
            />
          </td>

          <td>
            <input
              className="rowInput"
              type="text"
              value={row.item}
              onChange={(event) =>
                updateRow(
                  section.id,
                  row.id,
                  "item",
                  event.target.value,
                )
              }
              aria-label="Materiaal of optie"
            />
          </td>

          <td>
            <input
              className="rowInput noteInput"
              type="text"
              value={row.note}
              onChange={(event) =>
                updateRow(
                  section.id,
                  row.id,
                  "note",
                  event.target.value,
                )
              }
              placeholder="Opmerking"
              aria-label="Opmerking"
            />
          </td>

          <td className="pvpCell">P.V.P.:</td>

          <td>
            <input
              className="rowInput priceInput"
              type="text"
              value={row.price}
              onChange={(event) =>
                updateRow(
                  section.id,
                  row.id,
                  "price",
                  event.target.value,
                )
              }
              placeholder="0 €"
              aria-label="Prijs"
            />
          </td>

          <style>{`
            .sectionHeadingRow th {
              height: 34px;
              padding: 0;
              border: 0;
              background: #dfe3e5;
            }

            .sectionHeadingRow input {
              width: 100%;
              height: 100%;
              padding: 6px 13px;
              border: 1px solid transparent;
              outline: none;
              background: transparent;
              color: #252a2d;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
            }

            .sectionHeadingRow input:focus {
              border-color: #a47f40;
              background: rgba(255, 255, 255, 0.45);
            }

            .selectedRow td {
              background: rgba(164, 127, 64, 0.13);
            }

            .checkboxCell {
              padding: 0 !important;
              text-align: center;
            }

            .checkboxCell input {
              width: 16px;
              height: 16px;
              margin: 0;
              cursor: pointer;
              accent-color: #353a3d;
            }

            .rowInput {
              width: 100%;
              padding: 4px 2px;
              border: 1px solid transparent;
              outline: none;
              background: transparent;
              color: #414649;
              font: inherit;
            }

            .rowInput:focus {
              border-color: rgba(164, 127, 64, 0.65);
              background: #ffffff;
            }

            .noteInput {
              color: #62686b;
              text-align: center;
            }

            .priceInput {
              text-align: right;
            }

            .pvpCell {
              color: #686d70;
              text-align: center;
              white-space: nowrap;
            }

            @media print {
              .sectionHeadingRow input,
              .rowInput {
                border-color: transparent;
              }

              .selectedRow td {
                background: rgba(164, 127, 64, 0.13) !important;
              }
            }
          `}</style>
        </tr>
      ))}
    </>
  );
}