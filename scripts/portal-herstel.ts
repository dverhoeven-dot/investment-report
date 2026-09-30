import {existsSync} from "node:fs";
import {createInterface} from "node:readline/promises";
import {stdin,stdout} from "node:process";
import {db} from "../lib/portal/db";
import {hashPassword,passwordError,tokenHash} from "../lib/portal/password";
class RecoveryError extends Error {}
export async function resetEmployeePassword(email:string,password:string) {
 email=email.trim().toLowerCase();
 const error=passwordError(password);if(error) throw new RecoveryError(error);
 const hash=await hashPassword(password);
 const tx=await db().transaction("write");
 try {
 const result=await tx.execute({sql:"SELECT id FROM portal_users WHERE email=? AND role='employee'",args:[email]});
 if(!result.rows[0]) throw new RecoveryError("Geen medewerkeraccount met dit e-mailadres gevonden. Neem het e-mailadres over uit het overzicht.");
 const id=String(result.rows[0].id);
 await tx.execute({sql:"UPDATE portal_users SET password_hash=?,active=1,version=version+1 WHERE id=?",args:[hash,id]});
 await tx.execute({sql:"DELETE FROM portal_sessions WHERE user_id=?",args:[id]});
 await tx.execute({sql:"DELETE FROM portal_limits WHERE key=?",args:["login:"+tokenHash(email)]});
 await tx.execute({sql:"INSERT INTO portal_audit(actor,target,action,at) VALUES (?,?,?,?)",args:["local-recovery",id,"password-recovery",Date.now()]});
 await tx.commit();
 } finally {tx.close();}
}
function hiddenQuestion(prompt:string):Promise<string> {
 if(!stdin.isTTY) throw new RecoveryError("Open hiervoor de terminal in Cursor.");
 stdout.write(prompt);stdin.setRawMode(true);stdin.resume();let input="";
 return new Promise((resolve,reject)=>{
 const finish=()=>{stdin.off("data",onData);stdin.setRawMode(false);stdin.pause();stdout.write("\n");};
 const onData=(chunk:Buffer)=>{
 for(const char of chunk.toString()) {
 if(char==="\u0003" || char==="\u0004") {finish();reject(new RecoveryError("Herstel afgebroken. Er is niets gewijzigd."));return;}
 if(char==="\r" || char==="\n") {finish();resolve(input);return;}
 if(char==="\u007f" || char==="\b") input=input.slice(0,-1);
 else if(char>=" " && input.length<128) input+=char;
 }
 };stdin.on("data",onData);
 });
}
async function main() {
 if(existsSync(".env.local")) process.loadEnvFile(".env.local");
 if(!process.env.TURSO_DATABASE_URL) throw new RecoveryError("De accountdatabase is niet ingesteld. Voer dit uit vanuit je projectmap, waar .env.local staat.");
 const employees=await db().execute("SELECT name,email FROM portal_users WHERE role='employee' ORDER BY name");
 if(!employees.rows.length) throw new RecoveryError("Er is geen medewerkeraccount gevonden. Stuur deze melding door.");
 console.log("Bestaande medewerkeraccounts:");
 for(const row of employees.rows) console.log(`- ${row.name}: ${row.email}`);
 console.log("Kies hieronder je eigen account. Alleen daarvan wordt het wachtwoord hersteld.");
 const rl=createInterface({input:stdin,output:stdout});
 const email=(await rl.question("E-mailadres uit dit overzicht: ")).trim().toLowerCase();rl.close();
 if(!employees.rows.some(row=>String(row.email)===email)) throw new RecoveryError("Dit e-mailadres staat niet in het overzicht. Start het herstel opnieuw.");
 const password=await hiddenQuestion("Nieuw wachtwoord (minimaal 12 tekens; invoer blijft verborgen): ");
 const error=passwordError(password);if(error) throw new RecoveryError(error);
 const confirm=await hiddenQuestion("Herhaal het nieuwe wachtwoord: ");
 if(password!==confirm) throw new RecoveryError("De wachtwoorden verschillen. Er is niets gewijzigd. Start het herstel opnieuw.");
 await resetEmployeePassword(email,password);
 console.log("Wachtwoord hersteld. Open http://localhost:3000/login en log in met dit e-mailadres en je nieuwe wachtwoord.");
 console.log("Bestaande sessies van dit account zijn beëindigd. De andere accounts zijn behouden.");
}
if(process.argv[1]?.endsWith("portal-herstel.ts")) main().catch(error=>{
 console.error(error instanceof RecoveryError ? error.message : "Herstel niet uitgevoerd: de database kon niet worden gelezen of bijgewerkt. Controleer dat je in dezelfde projectmap werkt als je lokale website.");
 process.exitCode=1;
}).finally(()=>db().close());
