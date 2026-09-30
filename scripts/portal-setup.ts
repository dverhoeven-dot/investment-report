import {existsSync,appendFileSync} from "node:fs";
import {createInterface} from "node:readline/promises";
import {stdin,stdout} from "node:process";
import {passwordError} from "../lib/portal/password";
import {db,schema} from "../lib/portal/db";
function hiddenQuestion(prompt:string):Promise<string> {
 if(!stdin.isTTY) throw new Error("Open hiervoor de terminal in Cursor; het wachtwoord wordt verborgen ingevoerd.");
 stdout.write(prompt);stdin.setRawMode(true);stdin.resume();let input="";
 return new Promise((resolve,reject)=>{
 const finish=()=>{stdin.off("data",onData);stdin.setRawMode(false);stdin.pause();stdout.write("\n");};
 const onData=(chunk:Buffer)=>{
 for(const char of chunk.toString()) {
 if(char==="\u0003" || char==="\u0004") {finish();reject(new Error("Instellen afgebroken."));return;}
 if(char==="\r" || char==="\n") {finish();resolve(input);return;}
 if(char==="\u007f" || char==="\b") input=input.slice(0,-1);
 else if(char>=" " && input.length<128) input+=char;
 }
 };
 stdin.on("data",onData);
 });
}
async function main() {
 if(existsSync(".env.local")) process.loadEnvFile(".env.local");
 if(!process.env.TURSO_DATABASE_URL) {
 process.env.TURSO_DATABASE_URL="file:portal-local.db";
 appendFileSync(".env.local","\n# Persoonlijke accounts: alleen lokale testopslag\nTURSO_DATABASE_URL=file:portal-local.db\n");
 }
 await db().batch(schema,"write");
 const count=await db().execute("SELECT COUNT(*) AS total FROM portal_users");
 if(Number(count.rows[0].total)>0) {db().close();console.log("Er bestaan al accounts. Open /login en gebruik Gebruikers beheren.");return;}
 const rl=createInterface({input:stdin,output:stdout});
 process.env.PORTAL_FIRST_NAME=(await rl.question("Je naam: ")).trim();
 process.env.PORTAL_FIRST_EMAIL=(await rl.question("Je e-mailadres: ")).trim();rl.close();
 const password=await hiddenQuestion("Kies je wachtwoord (minimaal 12 tekens; invoer blijft verborgen): ");
 const error=passwordError(password);if(error) throw new Error(error);
 const confirm=await hiddenQuestion("Herhaal je wachtwoord: ");if(password!==confirm) throw new Error("De wachtwoorden verschillen. Start de instelling opnieuw.");
 process.env.PORTAL_FIRST_PASSWORD=password;
 const {initializePortal}=await import("./portal-init");
 await initializePortal();
 delete process.env.PORTAL_FIRST_PASSWORD;
}
main().catch(error=>{console.error(error instanceof Error ? error.message : "Instellen mislukt.");db().close();process.exitCode=1;});
