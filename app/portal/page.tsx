import HomeTasks from "@/components/tasks/HomeTasks";
import {officeData} from "@/lib/office/store";
import {activeDeal} from "@/lib/office/types";
import Link from "next/link";
import Shell from "@/components/portal/Shell";
import {requireUser} from "@/lib/portal/auth";
import {sections,allowed} from "@/lib/portal/permissions";
export default async function Portal(){
 const user=await requireUser();let data:Awaited<ReturnType<typeof officeData>>|null=null;
 if(user.role==='employee')try{data=await officeData(user);}catch{}
 const team=user.permissions.includes('__task_team__');const visible=sections.filter(s=>allowed(user,s.id));
 const deals=data?.deals.filter(d=>activeDeal(d)&&data.clients.some(c=>c.id===d.clientId&&!c.archived&&(team||c.advisorId===user.id)))??[];
 return <Shell user={user}><p className="office-eyebrow">Jouw dagelijkse overzicht</p><h1>Vandaag.</h1><p>Welkom, {user.name}. {user.role==='employee'?'Je taken, klanten en projecten bij elkaar.':'Je portefeuilles en rapporten bij elkaar.'}</p>{user.role==='employee'?<><div className="office-quicklinks"><Link href="/complete-portfolio">Complete portefeuille <span>↗</span></Link><Link href="/rendements-check-spanje">Rendementscheck Spanje <span>↗</span></Link><Link href="/projecten">Projecten <span>↗</span></Link></div>{data?<><HomeTasks {...data} userId={user.id} team={team}/><section className="office-card"><div className="office-heading"><h2>{team?'Lopende klanttrajecten van het team':'Mijn lopende klanttrajecten'}</h2><Link href="/pipeline">Naar pipeline →</Link></div>{deals.slice(0,5).map(d=><article className="office-list-item" key={d.id}><Link href={'/klanten?klant='+d.clientId}><strong>{data.clients.find(c=>c.id===d.clientId)?.name}</strong><span className="office-small office-block">{d.title} · {d.type}</span></Link><span className="portal-tag">{d.stage}</span></article>)}{!deals.length&&<p>Nog geen lopende trajecten. Voeg een klant toe en leg de eerste stap vast.</p>}<p className="office-small">{deals.length} lopende trajecten</p><Link href="/klanten">Klanten bekijken →</Link></section></>:<section className="office-card"><p role="alert">Het werkoverzicht is tijdelijk niet beschikbaar. Laad de pagina opnieuw.</p></section>}</>:<div className="portal-grid">{visible.map(s=><Link href={s.href} key={s.id}>{s.label}<span>→</span></Link>)}{!visible.length&&<p>Je hebt nog geen toegang tot onderdelen. Vraag een medewerker om toegang.</p>}</div>}</Shell>;
}
