import ResidentieelStartpuntClient, {
  type ReportData,
  type StartpuntConfig,
} from "./ResidentieelStartpuntClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MaybeNumber = number | null;
type YesNo = "ja" | "nee";

type ExpenseItem = {
  name: string;
  amount: MaybeNumber;
  percentOfRent: MaybeNumber;
};

const config: StartpuntConfig = {
  title: "Startpunt analyse",
  subtitle:
    "Rendementscheck voor residentieel vastgoed, inclusief rente, exploitatiekosten, vermogensbelasting en waardestijging.",
  footerLabel: "L3 Capital · Startpunt analyse residentieel",
};

const initialData: ReportData = {
  objectNaam: "Voorbeeld Appartement",
  adres: "Straat 0, Venlo",
  afbeeldingUrl: "/startpunt-analyse-photos/residentieel/photo1.png",

  marktwaardeVastgoed: 300000,
  wozWaardeVastgoed: 250000,
  financiering: 10000,
  huurPerMaand: 1900,
  rentePercentage: 0.04,

  box3WozPercentage: 0.06,
  box3FinancieringPercentage: 0.027,
  box3BelastingPercentage: 0.36,
  gemiddeldeWaardestijging: 0.03,

  fiscaalPartner: false,
  heffingsvrijVermogenToepassen: false,

  exploitatiekosten: [
    {
      name: "Gemeentelijke lasten eigenaar",
      amount: 750,
      percentOfRent: null,
    },
    {
      name: "Opstalverzekering",
      amount: 450,
      percentOfRent: null,
    },
    {
      name: "Klein onderhoud",
      amount: 750,
      percentOfRent: null,
    },
    {
      name: "Reservering groot onderhoud",
      amount: 1500,
      percentOfRent: null,
    },
    {
      name: "Beheer en administratie",
      amount: 400,
      percentOfRent: null,
    },
    {
      name: "Verhuur- en mutatiekosten",
      amount: 400,
      percentOfRent: null,
    },
    {
      name: "Leegstand / wanbetaling",
      amount: 530,
      percentOfRent: null,
    },
  ],

  waarschuwingen: [],
};

export default function ResidentieelPage() {
  return (
    <ResidentieelStartpuntClient
      initialData={initialData}
      config={config}
    />
  );
}