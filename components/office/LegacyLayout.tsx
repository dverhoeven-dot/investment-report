import Shell from "@/components/portal/Shell";
import {requireUser} from "@/lib/portal/auth";
export default async function LegacyLayout({children}:{children:React.ReactNode}){const user=await requireUser();return <Shell user={user} legacy>{children}</Shell>;}
