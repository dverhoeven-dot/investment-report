import {NextResponse,type NextRequest} from "next/server";
import {sessionUser} from "./lib/portal/store";
import {canVisit} from "./lib/portal/permissions";
export async function proxy(request:NextRequest) {
 const path=request.nextUrl.pathname;
 if(path==="/login") return NextResponse.next();
 const user=await sessionUser(request.cookies.get("leovari_session")?.value);
 if(!user) {
 if(path.startsWith("/api/")) return NextResponse.json({error:"Log eerst in."},{status:401});
 return NextResponse.redirect(new URL("/login",request.url));
 }
 if(!canVisit(user,path,request.method)) {
 if(path.startsWith("/api/")) return NextResponse.json({error:"Geen toegang."},{status:403});
 return NextResponse.redirect(new URL("/geen-toegang",request.url));
 }
 const response=NextResponse.next();response.headers.set("Cache-Control","private, no-store");return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"]};
