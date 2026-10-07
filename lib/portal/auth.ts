import "server-only";
import {SESSION_MAX_AGE_SECONDS} from "./session-config";
import {cache} from "react";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {sessionUser} from "./store";
import {allowed} from "./permissions";
export const COOKIE="leovari_session";
export const requireUser=cache(async function requireUser() {const user=await sessionUser((await cookies()).get(COOKIE)?.value);if(!user) redirect("/login");return user;});
export async function requireEmployee() {const user=await requireUser();if(user.role!=="employee") redirect("/geen-toegang");return user;}
export async function requirePermission(permission:string) {const user=await requireUser();if(!allowed(user,permission)) redirect("/geen-toegang");return user;}
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",maxAge:SESSION_MAX_AGE_SECONDS};
