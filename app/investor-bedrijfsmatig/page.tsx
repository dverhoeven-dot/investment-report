import BedrijfsmatigStartpuntClient, {
  type ReportData,
  type StartpuntConfig,
} from "./BedrijfsmatigStartpuntClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const config: StartpuntConfig = {
  title: "Startpunt analyse",
  subtitle:
    "Rendementscheck voor bedrijfsmatig vastgoed, inclusief rente, exploitatiekosten, vermogensbelasting en waardestijging.",
  footerLabel: "L3 Capital · Startpunt analyse bedrijfsmatig",
};

const initialData: ReportData = {
  objectNaam: "Voorbeeld Bedrijfspand",
  adres: "Industrieweg 1, Venlo",
  afbeeldingUrl: "/startpunt-analyse-photos/bedrijfsmatig/photo1.png",

  marktwaardeVastgoed: 300000,
  wozWaardeVastgoed: 290000,
  financiering: 150000,
  huurPerMaand: 2125,
  rentePercentage: 0.055,

  box3WozPercentage: 0.06,
  box3FinancieringPercentage: 0.027,
  box3BelastingPercentage: 0.36,
  gemiddeldeWaardestijging: 0.03,

  fiscaalPartner: false,
  heffingsvrijVermogenToepassen: false,

  exploitatiekosten: [
    {
      name: "OZB eigenaar",
      amount: 950,
      percentOfRent: null,
    },
    {
      name: "Waterschapslasten",
      amount: 65,
      percentOfRent: null,
    },
    {
      name: "Opstalverzekering",
      amount: 600,
      percentOfRent: null,
    },
    {
      name: "Reservering groot onderhoud",
      amount: 3000,
      percentOfRent: null,
    },
    {
      name: "Beheer en administratie",
      amount: 660,
      percentOfRent: null,
    },
    {
      name: "Juridisch / overige kosten",
      amount: 350,
      percentOfRent: null,
    },
    {
      name: "Leegstand / wanbetaling",
      amount: 765,
      percentOfRent: null,
    },
  ],

  waarschuwingen: [],
};

export default function BedrijfsmatigPage() {
  return (
    <BedrijfsmatigStartpuntClient
      initialData={initialData}
      config={config}
    />
  );
}