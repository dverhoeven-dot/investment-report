"use server";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {db} from "@/lib/portal/db";
import {tokenHash,verifyPassword} from "@/lib/portal/password";
import {consumeLimit,mutateUser,newSession,PortalError} from "@/lib/portal/store";
import {COOKIE,cookieOptions,requireEmployee} from "@/lib/portal/auth";
export type Result={error?:string;success?:string};
const value=(form:FormData,key:string)=>String(form.get(key)??"");
export async function login(_:Result,form:FormData):Promise<Result> {
 const email=value(form,"email").trim().toLowerCase();const password=value(form,"password");
 if(email.length>254 || password.length>128) return {error:"E-mailadres of wachtwoord klopt niet."};
 let token:string;
 try {
 if(!await consumeLimit("login:global",200,60*1000) || !await consumeLimit("login:"+tokenHash(email))) return {error:"Te veel pogingen. Probeer over 15 minuten opnieuw."};
 const result=await db().execute({sql:"SELECT * FROM portal_users WHERE email=?",args:[email]});const row=result.rows[0];
 const dummy="scrypt:00000000000000000000000000000000:"+"00".repeat(64);
 const valid=await verifyPassword(password,row ? String(row.password_hash) : dummy);
 if(!row || !row.active || !valid) return {error:"E-mailadres of wachtwoord klopt niet."};
 token=await newSession(String(row.id),String(row.password_hash));
 } catch(error) {console.error("Portal login unavailable",error instanceof Error ? error.name : "unknown");return {error:"Inloggen is tijdelijk niet beschikbaar. Neem contact op met een medewerker."};}
 (await cookies()).set(COOKIE,token,cookieOptions);(await cookies()).delete("portfolio_access");redirect("/portal");
}
export async function logout() {const jar=await cookies();const token=jar.get(COOKIE)?.value;if(token) await db().execute({sql:"DELETE FROM portal_sessions WHERE token_hash=?",args:[tokenHash(token)]});jar.delete(COOKIE);jar.delete("portfolio_access");redirect("/login");}
export async function manage(_:Result,form:FormData):Promise<Result> {
 const actor=await requireEmployee();
 const kind=value(form,"kind");
 if(!["create","save","password","delete"].includes(kind)) return {error:"Onbekende actie."};
 if(kind==="delete" && value(form,"confirmation")!=="VERWIJDEREN") return {error:"Typ VERWIJDEREN om dit account te verwijderen."};
 try {await mutateUser(actor.id,{kind:kind as "create"|"save"|"password"|"delete",id:value(form,"id"),version:Number(value(form,"version")),name:value(form,"name"),email:value(form,"email").trim().toLowerCase(),role:value(form,"role"),active:form.get("active")==="on",permissions:form.getAll("permissions").map(String),teamOverview:form.get("teamOverview")==="on",password:value(form,"password")});}
 catch(error) {return {error:error instanceof PortalError ? error.message : "Opslaan is niet gelukt. Vernieuw de pagina en probeer opnieuw."};}
 revalidatePath("/beheer");revalidatePath("/portal");return {success:kind==="create" ? "Gebruiker aangemaakt." : kind==="delete" ? "Gebruiker verwijderd." : "Wijzigingen opgeslagen. De gebruiker moet opnieuw inloggen."};
}
