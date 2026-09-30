import {requirePermission} from "@/lib/portal/auth";
import ReadOnlyBoundary from "@/components/portal/ReadOnlyBoundary";
import FurnitureProcurementClient from "./FurnitureProcurementClient";

export default async function Page() {
 const user=await requirePermission("furniture");
  return (<ReadOnlyBoundary readOnly={user.role!=="employee"} userId={user.id}>
<FurnitureProcurementClient />
</ReadOnlyBoundary>);
}