import {randomBytes, scrypt, timingSafeEqual, createHash} from "node:crypto";
import {promisify} from "node:util";
const derive=promisify(scrypt);
export function passwordError(password:string) {return password.length<12 ? "Gebruik minimaal 12 tekens voor het wachtwoord." : password.length>128 ? "Gebruik maximaal 128 tekens." : null;}
export async function hashPassword(password:string) {const salt=randomBytes(16).toString("hex"); const key=await derive(password,salt,64) as Buffer; return `scrypt:${salt}:${key.toString("hex")}`;}
export async function verifyPassword(password:string,hash:string) {
 if(password.length>128) return false;
 const [format,salt,value]=hash.split(":"); if(format!=="scrypt" || !salt || !value) return false;
 const key=await derive(password,salt,64) as Buffer; const stored=Buffer.from(value,"hex"); return stored.length===key.length && timingSafeEqual(stored,key);
}
export const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");
