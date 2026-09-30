import {randomUUID} from "node:crypto";
import {db,schema} from "../lib/portal/db";
import {hashPassword,passwordError} from "../lib/portal/password";
export async function initializePortal() {
const email=process.env.PORTAL_FIRST_EMAIL?.trim().toLowerCase();
const name=process.env.PORTAL_FIRST_NAME?.trim();
const password=process.env.PORTAL_FIRST_PASSWORD;
if(!email || !name || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || passwordError(password)) throw new Error("Vul PORTAL_FIRST_EMAIL, PORTAL_FIRST_NAME en een wachtwoord van minimaal 12 tekens in.");
await db().batch(schema,"write");
const tx=await db().transaction("write");
try {
 const existing=await tx.execute("SELECT COUNT(*) AS total FROM portal_users");
 if(Number(existing.rows[0].total)>0) throw new Error("Er bestaan al accounts. Gebruik het beheerportaal.");
 await tx.execute({sql:"INSERT INTO portal_users(id,name,email,password_hash,role) VALUES (?,?,?,?, 'employee')",args:[randomUUID(),name,email,await hashPassword(password)]});
 await tx.commit();console.log("Eerste medewerker aangemaakt. Je kunt nu inloggen via /login.");
} finally {tx.close();db().close();}

}
if(process.argv[1]?.endsWith("portal-init.ts")) initializePortal().catch(error=>{console.error(error instanceof Error ? error.message : "Initialisatie mislukt");process.exitCode=1;});
