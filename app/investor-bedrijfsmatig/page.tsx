import BedrijfsmatigStartpuntClient from "./StartpuntClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  exploitatiekosten: ExpenseItem[];
  waarschuwingen: string[];
};

const STARTPUNT_CONFIG = {
  title: "Startpunt analyse",
  subtitle:
    "Rendementscheck voor bedrijfsmatig vastgoed, inclusief rente, exploitatiekosten, vermogensbelasting en waardestijging.",
  footerLabel: "L3 Capital · Startpunt analyse bedrijfsmatig",
};

const huurPerMaand = 2125;
const huurPerJaar = huurPerMaand * 12;

const exploitatiekosten: ExpenseItem[] = [
  {
    name: "OZB eigenaar",
    amount: -950,
    percentOfRent: -950 / huurPerJaar,
  },
  {
    name: "Waterschapslasten",
    amount: -65,
    percentOfRent: -65 / huurPerJaar,
  },
  {
    name: "Opstalverzekering",
    amount: -600,
    percentOfRent: -600 / huurPerJaar,
  },
  {
    name: "Reservering groot onderhoud",
    amount: -3000,
    percentOfRent: -3000 / huurPerJaar,
  },
  {
    name: "Beheer en administratie",
    amount: -660,
    percentOfRent: -660 / huurPerJaar,
  },
  {
    name: "Juridisch / overige kosten",
    amount: -350,
    percentOfRent: -350 / huurPerJaar,
  },
  {
    name: "Leegstand / wanbetaling",
    amount: -765,
    percentOfRent: -765 / huurPerJaar,
  },
];

const exploitatiekostenTotaal = exploitatiekosten.reduce(
  (total, item) => total + Math.abs(item.amount ?? 0),
  0
);

const initialData: ReportData = {
  objectNaam: "Voorbeeld Bedrijfspand",
  adres: "Straat 0, Venlo",
  afbeeldingUrl: "/startpunt-analyse-photos/bedrijfsmatig/photo1.png",

  marktwaardeVastgoed: 300000,
  wozWaardeVastgoed: 290000,
  financiering: 150000,
  eigenInleg: 150000,

  huurPerMaand,
  huurPerJaar,
  brutoRendementMarktwaarde: huurPerJaar / 300000,

  rentePercentage: 0.055,
  rentelastenPerJaar: -8250,
  naRenteResteert: 17250,

  vermogensbelastingPercentage: 0.36,
  vermogensbelastingbasis: "Voordeel uit sparen en beleggen",
  vermogensbelastingPerJaar: -4842.936,

  box3WozPercentage: 0.06,
  box3WozBedrag: 17400,

  box3FinancieringPercentage: 0.027,
  box3FinancieringBedrag: 3947.4,

  fiscaalPartner: false,
  heffingsvrijVermogenToepassen: false,
  schuldendrempelPerPersoon: 3800,
  toegepasteSchuldendrempel: 3800,
  aftrekbareBox3Schuld: 146200,
  heffingsvrijVermogenZonderPartner: 59357,
  heffingsvrijVermogenMetPartner: 118714,
  toegepastHeffingsvrijVermogen: 0,

  box3Grondslag: 143800,
  grondslagSparenBeleggen: 143800,
  aandeelBelastbareGrondslag: 1,
  belastbaarRendement: 13452.6,
  voordeelSparenBeleggen: 13452.6,
  box3BelastingPercentage: 0.36,

  exploitatiekostenTotaal,
  exploitatiekostenPercentage: exploitatiekostenTotaal / huurPerJaar,

  nettoHuurinkomsten: 6017.064,
  nettoRendementMarktwaarde: 6017.064 / 300000,
  rendementOpEigenInleg: 6017.064 / 150000,

  gemiddeldeWaardestijging: 0.03,
  totaalRendementInclWaardestijging: 6017.064 / 150000 + 0.03,

  exploitatiekosten,
  waarschuwingen: [],
};

export default function BedrijfsmatigStartpuntPage() {
  return (
    <BedrijfsmatigStartpuntClient
      initialData={initialData}
      config={STARTPUNT_CONFIG}
    />
  );
}