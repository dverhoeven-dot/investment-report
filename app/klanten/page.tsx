import Shell from "@/components/portal/Shell";
import {requireEmployee} from "@/lib/portal/auth";
import {officeData} from "@/lib/office/store";
import OfficeWorkspace from "@/components/office/OfficeWorkspace";
export default async function ClientsPage({searchParams}:{searchParams:Promise<{klant?:string}>}){const user=await requireEmployee();const data=await officeData(user);return <Shell user={user}><OfficeWorkspace initial={data} userId={user.id} mode="clients" initialClientId={(await searchParams).klant}/></Shell>;}
