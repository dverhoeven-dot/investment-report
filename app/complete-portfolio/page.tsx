import {requirePermission} from "@/lib/portal/auth";
import ReadOnlyBoundary from "@/components/portal/ReadOnlyBoundary";
import PortfolioClient from "./PortfolioClient";
export default async function Page() { const user=await requirePermission("complete"); return <ReadOnlyBoundary readOnly={user.role!=="employee"} userId={user.id}><PortfolioClient/></ReadOnlyBoundary>; }
