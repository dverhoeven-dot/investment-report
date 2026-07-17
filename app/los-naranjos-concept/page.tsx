import LosNaranjosClient, {
  type LosNaranjosConfig,
  type LosNaranjosInitialData,
} from "./LosNaranjosClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const config: LosNaranjosConfig = {
  title: "Los Naranjos Hill Club Project",
  subtitle: "Deal Analysis · Custom cash schedule",
  footerLabel: "L3 Capital · Confidential — for internal use only",
};

const initialData: LosNaranjosInitialData = {
  projectName: "Los Naranjos Hill Club Project",
  analysisDate: "2026-06-26",
  projectType: "New Build",
  surfaceM2: 600,
  plotM2: 839,
  durationMonths: 20,

  purchasePrice: 1_400_000,
  transferTaxPercentage: 0.012,
  lawyerFeePercentage: 0.012,
  notaryFee: 2_500,
  otherAcquisitionCosts: 4_953,

  buildCostPerM2: 2_000,
  contingencyPercentage: 0.1,
  furniture: 200_000,
  projectManagementPercentage: 0.1,

  salePrice: 5_700_000,
  agentCommissionPercentage: 0.06,

  firstPaymentMonth: 0,
  firstPaymentAmount: 14_000,
  secondPaymentMonth: 3,
  secondPaymentAmount: 266_000,
  thirdPaymentMonth: 5,
  thirdPaymentAmount: 500_000,
  closingMonth: 6,
  constructionStartMonth: 9,
  constructionDraws: 9,

  photoUrls: [],
};

export default function LosNaranjosPage() {
  return <LosNaranjosClient initialData={initialData} config={config} />;
}
