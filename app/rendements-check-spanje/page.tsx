import LosNaranjosClient, {
  type LosNaranjosConfig,
  type LosNaranjosInitialData,
} from "./LosNaranjosClient";

const initialData: LosNaranjosInitialData = {
  projectName: "",
  analysisDate: "",
  projectStartDate: "",
  projectType: "Renovation",
  projectOwnership: "own",

  surfaceM2: 0,
  plotM2: 0,
  durationMonths: 0,

  purchasePrice: 0,
  transferTaxPercentage: 0,
  lawyerFeePercentage: 0,
  notaryFee: 0,
  otherAcquisitionCosts: 0,

  buildCostPerM2: 0,
  contingencyPercentage: 0,
  furniture: 0,
  fixedInterior: 0,
  looseFurniture: 0,
  furnitureMarkupPercentage: 0,
  furniturePaymentMonths: 1,
  looseFurniturePaymentMonths: 1,
  projectManagementPercentage: 0,

  salePrice: 0,
  agentCommissionPercentage: 0,

  firstPaymentMonth: 0,
  firstPaymentAmount: 0,
  secondPaymentMonth: 0,
  secondPaymentAmount: 0,
  thirdPaymentMonth: 0,
  thirdPaymentAmount: 0,

  closingMonth: 0,
  constructionStartMonth: 0,
  constructionDraws: 1,

  photoUrls: [],
};

const config: LosNaranjosConfig = {
  title: "Rendements check Spanje",
  subtitle: "Projectanalyse en rendementsberekening",
  footerLabel: "Leovari",
};

export default function Page() {
  return (
    <LosNaranjosClient
      initialData={initialData}
      config={config}
    />
  );
}