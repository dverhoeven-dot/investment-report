import Link from "next/link";
import Shell from "@/components/portal/Shell";
import {requireUser} from "@/lib/portal/auth";
export default async function Denied(){const user=await requireUser();return <Shell user={user}><div className="portal-card"><h1>Geen toegang tot dit onderdeel</h1><p>Vraag een medewerker om toegang als je dit onderdeel nodig hebt.</p><Link href="/portal">Terug naar mijn portaal →</Link></div></Shell>;}
