"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";
import {allowed,sections,type User} from "@/lib/portal/permissions";
import {logout} from "@/app/portal/actions";
const groups=[{name:'Portefeuilles',ids:['complete','spain','netherlands']},{name:'Rekentools',ids:['returns','residential','commercial']},{name:'Projectrapporten',ids:['los-naranjos','la-carolina']},{name:'Inkoop',ids:['furniture']}];
export default function Sidebar({user}:{user:User}){
 const path=usePathname();const [open,setOpen]=useState(false);
 const active=(href:string)=>path===href||path.startsWith(href+'/');
 const link=(href:string,label:string)=><Link key={href} href={href} aria-current={active(href)?'page':undefined} className={active(href)?'is-active':''} onClick={()=>setOpen(false)}>{label}</Link>;
 return <aside className="office-sidebar"><div className="office-brand"><Link href="/portal">LEOVARI<span>& L3 CAPITAL</span></Link><button className="office-menu-toggle" aria-expanded={open} aria-controls="office-navigation" onClick={()=>setOpen(!open)}>Menu {open?'−':'+'}</button></div><nav id="office-navigation" className={open?'is-open':''} aria-label="Hoofdnavigatie"><p className="office-nav-caption">PRIVATE OFFICE</p>{link('/portal','Vandaag')}{user.role==='employee'&&<>{link('/klanten','Klanten')}{link('/pipeline','Pipeline')}{link('/projecten','Projecten')}{link('/taken','Taken')}</>}{groups.map(group=>{const items=group.ids.flatMap(id=>sections.filter(s=>s.id===id&&allowed(user,id)));return items.length?<details key={group.name} open={items.some(s=>active(s.href))}><summary>{group.name}</summary>{items.map(s=>link(s.href,s.label))}</details>:null;})}{user.role==='employee'&&<div className="office-nav-bottom">{link('/beheer','Teambeheer')}</div>}<div className="office-profile"><strong>{user.name}</strong><span>{user.role==='employee'?'Medewerker':'Extern account'}{user.permissions.includes('__task_team__')?' · Teamoverzicht':''}</span><form action={logout}><button>Uitloggen</button></form></div></nav></aside>;
}
