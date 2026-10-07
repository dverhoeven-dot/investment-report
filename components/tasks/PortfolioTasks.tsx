"use client";
import {createContext,useContext} from "react";
import {matchTaskProject,type TaskAsset} from "@/lib/tasks/portfolio";
import Link from "next/link";
import type {taskData} from "@/lib/tasks/store";
type Data=Awaited<ReturnType<typeof taskData>>;
const Context=createContext<Data|null>(null);
export function PortfolioTasksProvider({data,children}:{data:Data|null;children:React.ReactNode}){return <Context.Provider value={data}><style>{"@media print{.portfolio-task-block{display:none!important}}"}</style>{children}</Context.Provider>;}
export default function PortfolioTasks({asset}:{asset:TaskAsset}){const data=useContext(Context);if(!data)return null;const project=matchTaskProject(data.projects,asset);const tasks=project?data.tasks.filter(t=>t.projectId===project.id).sort((a,b)=>(b.latestAt||'').localeCompare(a.latestAt||'')):[];
 return <details className="no-print portfolio-task-block" style={{margin:'14px 0',padding:'10px 14px',border:'1px solid #d5dfd1',borderRadius:8,background:'#fafcf8',color:'#274834',font:'12px/1.5 Arial,sans-serif',maxHeight:230,overflow:'auto'}}><summary style={{cursor:'pointer',fontWeight:600}}>Taken bij dit pand ({tasks.length})</summary>{tasks.map(t=><div key={t.id} style={{padding:'10px 0',borderBottom:'1px solid #e2e8de'}}><Link href={'/taken?taak='+t.id}><strong>{t.title}</strong><div>{t.latestAction||'Nog geen handeling'}{t.latestAt?' · '+new Date(t.latestAt).toLocaleString('nl-NL',{timeZone:'Europe/Amsterdam'}):''}</div><div>{data.members.find(m=>m.id===t.assigneeId)?.name} · {t.status}</div></Link></div>)}{!tasks.length&&<p>Geen gekoppelde taken.</p>}{project?<Link href={'/taken?project='+project.id}>Taken openen →</Link>:<p>Koppel taken via het bijbehorende pand in Taken.</p>}</details>;
}

export function PortfolioTasksDirectory({assets}:{assets:TaskAsset[]}){const data=useContext(Context);if(!data)return null;return <details className="no-print portfolio-task-block" style={{maxWidth:1180,margin:'20px auto',padding:18,background:'white',border:'1px solid #d5dfd1',borderRadius:8,color:'#274834',font:'14px/1.5 Arial,sans-serif'}}><summary style={{fontWeight:600,cursor:'pointer'}}>Taken per pand</summary><div style={{maxHeight:500,overflow:'auto'}}>{assets.map((asset,i)=><section key={(asset.sourceKey||asset.project)+i}><h3 style={{marginTop:18,fontWeight:600}}>{asset.project} · {asset.address}</h3><PortfolioTasks asset={asset}/></section>)}{!assets.length&&<p>Geen panden in deze selectie.</p>}</div></details>;}
