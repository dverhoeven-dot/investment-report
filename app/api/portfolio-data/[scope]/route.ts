import {limitPortfolioData} from "@/lib/portal/data-permissions";
import {authorizeApi} from "@/lib/portal/api";
import {parsePortfolioSheet as parseComplete,overviewSourceUrl} from "@/lib/portal/complete-sheet";
import {parsePortfolioSheet as parseNetherlands} from "@/lib/portal/netherlands-sheet";
export async function GET(_request:Request,context:{params:Promise<{scope:string}>}) {
 const {scope}=await context.params;
 if(!["complete","netherlands"].includes(scope)) return Response.json({error:"Onbekend onderdeel."},{status:404});
 const access=await authorizeApi(scope);if(access.response) return access.response;
 try {
  const response=await fetch(overviewSourceUrl,{cache:"no-store"});if(!response.ok) throw new Error("Bron niet beschikbaar");
  const csv=await response.text();const data=scope==="complete"?parseComplete(csv):parseNetherlands(csv);
  return Response.json(limitPortfolioData(data,scope as "complete"|"netherlands"),{headers:{"Cache-Control":"private, no-store"}});
 } catch {return Response.json({error:"Portefeuillegegevens zijn tijdelijk niet beschikbaar."},{status:502});}
}
