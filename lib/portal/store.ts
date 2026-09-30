import {randomUUID,randomBytes} from "node:crypto";
import type {Row} from "@libsql/client";
import {db} from "./db";
import {hashPassword, passwordError, tokenHash} from "./password";
import {sections,type User} from "./permissions";
export class PortalError extends Error {}
export function toUser(row:Row):User {return {id:String(row.id),name:String(row.name),email:String(row.email),role:row.role as User["role"],active:!!row.active,permissions:JSON.parse(String(row.permissions)),version:Number(row.version)};}
export async function sessionUser(token:string|undefined):Promise<User|null> {
 if(!token || !/^[a-f0-9]{64}$/.test(token)) return null;
 const result=await db().execute({sql:"SELECT u.* FROM portal_sessions s JOIN portal_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>? AND u.active=1",args:[tokenHash(token),Date.now()]});
 return result.rows[0] ? toUser(result.rows[0]) : null;
}
export async function newSession(id:string,expectedHash?:string) {
 const token=randomBytes(32).toString("hex");
 await db().execute({sql:"DELETE FROM portal_sessions WHERE expires<=?",args:[Date.now()]});
 const result=await db().execute({sql:"INSERT INTO portal_sessions(token_hash,user_id,expires) SELECT ?,id,? FROM portal_users WHERE id=? AND active=1 AND (? IS NULL OR password_hash=?)",args:[tokenHash(token),Date.now()+8*60*60*1000,id,expectedHash??null,expectedHash??null]}); if(result.rowsAffected!==1) throw new PortalError("Het account is gewijzigd. Log opnieuw in."); return token;
}
export async function consumeLimit(key:string,max=10,window=15*60*1000) {
 const now=Date.now();
 const result=await db().execute({sql:`INSERT INTO portal_limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count`,args:[key,now+window,now,now]});
 return Number(result.rows[0].count)<=max;
}
export type Mutation={kind:"create"|"save"|"password"|"delete";id:string;version:number;name:string;email:string;role:string;active:boolean;permissions:string[];password:string};
export async function mutateUser(actorId:string,input:Mutation) {
 const tx=await db().transaction("write");
 try {
 const actor=(await tx.execute({sql:"SELECT * FROM portal_users WHERE id=?",args:[actorId]})).rows[0];
 if(!actor || actor.role!=="employee" || !actor.active) throw new PortalError("Je mag geen gebruikers beheren.");
 const old=input.kind==="create" ? null : (await tx.execute({sql:"SELECT * FROM portal_users WHERE id=?",args:[input.id]})).rows[0];
 if(input.kind!=="create" && (!old || Number(old.version)!==input.version)) throw new PortalError("Deze gebruiker is inmiddels gewijzigd. Vernieuw de pagina en probeer opnieuw.");
 if(input.id===actorId && (input.kind==="delete" || (input.kind==="save" && (!input.active || input.role!=="employee")))) throw new PortalError("Je kunt je eigen toegang niet verwijderen of blokkeren.");
 if(old?.role==="employee" && old.active && (input.kind==="delete" || (input.kind==="save" && (!input.active || input.role!=="employee")))) {
 const count=await tx.execute("SELECT COUNT(*) AS total FROM portal_users WHERE role='employee' AND active=1");
 if(Number(count.rows[0].total)<=1) throw new PortalError("Er moet minimaal één actieve medewerker blijven.");
 }
 if(input.kind==="create" || input.kind==="save") {
 if(!input.name.trim() || input.name.length>100) throw new PortalError("Vul een naam in van maximaal 100 tekens.");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || input.email.length>254) throw new PortalError("Vul een geldig e-mailadres in.");
 if(!["employee","viewer"].includes(input.role)) throw new PortalError("Kies een geldig type gebruiker.");
 if(input.permissions.some(id=>!sections.some(s=>s.id===id))) throw new PortalError("Onbekend onderdeel geselecteerd.");
 const duplicate=await tx.execute({sql:"SELECT id FROM portal_users WHERE email=? AND id<>?",args:[input.email,input.id]});
 if(duplicate.rows.length) throw new PortalError("Dit e-mailadres bestaat al.");
 }
 let passwordHash="";
 if(input.kind==="create" || input.kind==="password") {const error=passwordError(input.password);if(error) throw new PortalError(error);passwordHash=await hashPassword(input.password);}
 const id=input.kind==="create" ? randomUUID() : input.id;
 const permissions=JSON.stringify(input.role==="employee" ? [] : [...new Set(input.permissions)]);
 if(input.kind==="create") await tx.execute({sql:"INSERT INTO portal_users(id,name,email,password_hash,role,permissions) VALUES (?,?,?,?,?,?)",args:[id,input.name.trim(),input.email,passwordHash,input.role,permissions]});
 if(input.kind==="save") await tx.execute({sql:"UPDATE portal_users SET name=?,email=?,role=?,active=?,permissions=?,version=version+1 WHERE id=?",args:[input.name.trim(),input.email,input.role,input.active?1:0,permissions,id]});
 if(input.kind==="password") await tx.execute({sql:"UPDATE portal_users SET password_hash=?,version=version+1 WHERE id=?",args:[passwordHash,id]});
 if(input.kind!=="create") await tx.execute({sql:"DELETE FROM portal_sessions WHERE user_id=?",args:[id]});
 if(input.kind==="delete") await tx.execute({sql:"DELETE FROM portal_users WHERE id=?",args:[id]});
 await tx.execute({sql:"INSERT INTO portal_audit(actor,target,action,at) VALUES (?,?,?,?)",args:[actorId,id,input.kind,Date.now()]});
 await tx.commit();
 } finally {tx.close();}
}
