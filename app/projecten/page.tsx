import Shell from "@/components/portal/Shell";
import ProjectsClient from "@/components/office/ProjectsClient";
import {requireEmployee} from "@/lib/portal/auth";
import {taskData,syncProjects} from "@/lib/tasks/store";
export default async function ProjectsPage({searchParams}:{searchParams:Promise<{project?:string}>}){const params=await searchParams;const user=await requireEmployee();let warning='';try{await syncProjects(user);}catch{warning='De portefeuille kon niet worden bijgewerkt. De eerder opgehaalde projecten blijven beschikbaar.';}return <Shell user={user}><ProjectsClient data={await taskData(user)} warning={warning} initialProject={params.project}/></Shell>;}
