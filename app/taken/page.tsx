import {officeData} from "@/lib/office/store";
import Shell from "@/components/portal/Shell";
import {requireEmployee} from "@/lib/portal/auth";
import {taskData,syncProjects} from "@/lib/tasks/store";
import TasksClient from "@/components/tasks/TasksClient";
export default async function TasksPage({searchParams}:{searchParams:Promise<{taak?:string;nieuw?:string;klant?:string;project?:string}>}){const params=await searchParams;const user=await requireEmployee();let warning="";try{await syncProjects(user);}catch{warning="Complete portefeuille is tijdelijk niet bereikbaar. Je kunt de bestaande projecten en taken gebruiken en zelf projecten toevoegen.";}const data=await taskData(user);const customer=params.klant?(await officeData(user)).clients.find(c=>c.id===params.klant&&!c.archived):undefined;return <Shell user={user}><TasksClient initial={data} clientContext={customer?{id:customer.id,name:customer.name}:undefined} initialProjectId={data.projects.some(p=>p.id===params.project)?params.project:undefined} initialTaskId={params.taak} createNew={params.nieuw==="1"} userId={user.id} team={user.permissions.includes("__task_team__")} warning={warning}/></Shell>;}
