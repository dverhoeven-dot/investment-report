import Shell from "@/components/portal/Shell";
import {requireEmployee} from "@/lib/portal/auth";
import {officeData} from "@/lib/office/store";
import OfficeWorkspace from "@/components/office/OfficeWorkspace";
export default async function PipelinePage(){const user=await requireEmployee();return <Shell user={user}><OfficeWorkspace initial={await officeData(user)} userId={user.id} mode="pipeline"/></Shell>;}
