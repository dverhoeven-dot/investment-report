import "server-only";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {sessionUser} from "./store";
import {allowed} from "./permissions";
export async function authorizeApi(permission:string,write=false,request?:Request) {
 const user=await sessionUser((await cookies()).get("leovari_session")?.value);
 if(!user) return {user:null,response:NextResponse.json({error:"Log eerst in."},{status:401})};
 if(write ? user.role!=="employee" : !allowed(user,permission)) return {user:null,response:NextResponse.json({error:"Je hebt alleen kijkrechten of geen toegang tot dit onderdeel."},{status:403})};
 if(write && request) {
 const origin=request.headers.get("origin");
 const host=request.headers.get("x-forwarded-host")??request.headers.get("host")??new URL(request.url).host;
 let sameOrigin=false;try {sameOrigin=!!origin && new URL(origin).host===host && ["http:","https:"].includes(new URL(origin).protocol);}catch {}
 if(!sameOrigin) return {user:null,response:NextResponse.json({error:"Deze aanvraag komt niet van deze website."},{status:403})};
 }
 return {user,response:null};
}
