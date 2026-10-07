import LegacyLayout from "@/components/office/LegacyLayout";
import PortfolioTaskWrapper from "@/components/tasks/PortfolioTaskWrapper";
export default function Layout({children}:{children:React.ReactNode}){return <LegacyLayout><PortfolioTaskWrapper>{children}</PortfolioTaskWrapper></LegacyLayout>;}
