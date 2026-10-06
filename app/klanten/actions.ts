"use server";
import {requireEmployee} from "@/lib/portal/auth";
import {revalidatePath} from "next/cache";
import {officeData,clientDetails,saveClient,saveDeal,addClientNote,linkClientTask} from "@/lib/office/store";
import type {OfficeClient,OfficeDeal} from "@/lib/office/types";
function refresh(){for(const path of ["/portal","/klanten","/pipeline","/projecten","/taken"])revalidatePath(path);}
const message=(error:unknown)=>error instanceof Error?error.message:"Opslaan is niet gelukt.";
export async function updateClient(input:OfficeClient){const user=await requireEmployee();try{const id=await saveClient(user,input);refresh();return {id,data:await officeData(user)};}catch(error){return {error:message(error)};}}
export async function updateDeal(input:OfficeDeal){const user=await requireEmployee();try{await saveDeal(user,input);refresh();return {data:await officeData(user)};}catch(error){return {error:message(error)};}}
export async function readClient(id:string){return clientDetails(await requireEmployee(),id);}
export async function reloadOffice(){return officeData(await requireEmployee());}
export async function noteClient(id:string,note:string){const user=await requireEmployee();try{await addClientNote(user,id,note);refresh();return {details:await clientDetails(user,id)};}catch(error){return {error:message(error)};}}
export async function attachTask(clientId:string,taskId:string){const user=await requireEmployee();try{await linkClientTask(user,clientId,taskId);refresh();return {data:await officeData(user),details:await clientDetails(user,clientId)};}catch(error){return {error:message(error)};}}
