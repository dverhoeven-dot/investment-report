"use server";
import {officeAccess} from "@/lib/office/store";
import {requireEmployee} from "@/lib/portal/auth";
import {revalidatePath} from "next/cache";
import {saveTaskPipeline,deleteTask,taskHistory,saveTask,saveProject,taskData,taskDetails,addComment,syncProjects,setProjectVisibility} from "@/lib/tasks/store";
import type {Task,TaskProject} from "@/lib/tasks/types";
function refresh(){revalidatePath("/taken");revalidatePath("/portal");revalidatePath("/klanten");revalidatePath("/pipeline");revalidatePath("/projecten");revalidatePath("/complete-portfolio");revalidatePath("/nederlandse-portfolio");}
export async function updateTask(input:Task,clientId?:string){const actor=await requireEmployee();try{if(clientId)await officeAccess(actor);await saveTask(actor,input,clientId);refresh();return {data:await taskData(actor)};}catch(error){return {error:error instanceof Error?error.message:"Opslaan mislukt."};}}
export async function updateProject(input:TaskProject){const actor=await requireEmployee();try{await saveProject(actor,input);refresh();return {data:await taskData(actor)};}catch(error){return {error:error instanceof Error?error.message:"Opslaan mislukt."};}}
export async function readDetails(id:string){return taskDetails(await requireEmployee(),id);}
export async function comment(id:string,text:string){const actor=await requireEmployee();try{await addComment(actor,id,text);refresh();return {details:await taskDetails(actor,id)};}catch(error){return {error:error instanceof Error?error.message:"Opmerking kon niet worden opgeslagen."};}}
export async function reloadTasks(){return taskData(await requireEmployee());}
export async function importProjects(){const actor=await requireEmployee();try{const count=await syncProjects(actor);refresh();return {data:await taskData(actor),count};}catch{return {error:"Projecten konden niet worden opgehaald. Bestaande taken en projecten blijven beschikbaar."};}}

export async function updateProjectVisibility(ids:string[]){const actor=await requireEmployee();try{await setProjectVisibility(actor,ids);refresh();return {data:await taskData(actor)};}catch(error){return {error:error instanceof Error?error.message:"Projectselectie opslaan mislukt."};}}

export async function history(id:string){return taskHistory(await requireEmployee(),id);}
export async function removeTask(id:string,version:number){const actor=await requireEmployee();try{await deleteTask(actor,id,version);refresh();return {data:await taskData(actor)};}catch(error){return {error:error instanceof Error?error.message:"Verwijderen mislukt."};}}

export async function updatePipeline(id:string,version:number,pipeline:Task['pipeline'],currentStepId:string,status:string){const actor=await requireEmployee();try{await saveTaskPipeline(actor,id,version,pipeline,currentStepId,status);refresh();revalidatePath('/taken/'+id+'/pipeline');return {task:(await taskData(actor)).tasks.find(t=>t.id===id)};}catch(error){return {error:error instanceof Error?error.message:'Opslaan mislukt.'};}}
