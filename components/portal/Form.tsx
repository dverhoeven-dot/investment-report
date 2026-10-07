"use client";
import {useActionState,useState} from "react";
import {login,manage,type Result} from "@/app/portal/actions";
import {sections,type User} from "@/lib/portal/permissions";
function Notice({state}:{state:Result}) {return <div aria-live="polite">{state.error && <p className="portal-error" role="alert">{state.error}</p>}{state.success && <p className="portal-success">{state.success}</p>}</div>;}
export function LoginForm() {const [state,action,pending]=useActionState(login,{});return <form action={action}><label>E-mailadres<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Wachtwoord<input name="password" type="password" autoComplete="current-password" required maxLength={128}/></label><Notice state={state}/><button disabled={pending}>{pending?"Bezig met inloggen…":"Inloggen"}</button></form>;}
export function UserForm({user,self=false}:{user?:User;self?:boolean}) {
 const [state,action,pending]=useActionState(manage,{});
 const [role,setRole]=useState(user?.role??"viewer");const [selected,setSelected]=useState(user?.permissions??[]);
 const [changed,setChanged]=useState(!user);const [show,setShow]=useState(false);
 return <form action={action} onChange={()=>setChanged(true)}>
 <input type="hidden" name="kind" value={user?"save":"create"}/><input type="hidden" name="id" value={user?.id??""}/><input type="hidden" name="version" value={user?.version??0}/>
 <label>Naam<input name="name" defaultValue={user?.name} required maxLength={100}/></label>
 <label>E-mailadres<input name="email" type="email" defaultValue={user?.email} required maxLength={254}/></label>
 {!user && <label>Wachtwoord (minimaal 12 tekens)<input name="password" type={show?"text":"password"} autoComplete="new-password" required minLength={12} maxLength={128}/><span><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> Wachtwoord tonen</span></label>}
 <label>Type gebruiker<select name="role" value={role} onChange={e=>setRole(e.target.value as User["role"])}><option value="viewer" disabled={self}>Externe gebruiker</option><option value="employee">Medewerker — alles bekijken en gebruikers beheren</option></select></label>
 {role==="employee" ? <p>Deze medewerker krijgt toegang tot alles en kan accounts beheren.</p> : <fieldset><legend>Tot welke onderdelen heeft deze persoon toegang?</legend><p>Toegang tot Furniture Procurement geeft automatisch ook rechten om daar items aan te passen.</p><div className="portal-inline"><button type="button" className="portal-secondary" onClick={()=>{setSelected(sections.map(s=>s.id));setChanged(true);}}>Alles selecteren</button><button type="button" className="portal-secondary" onClick={()=>{setSelected([]);setChanged(true);}}>Alles wissen</button></div>{sections.map(s=><label className="portal-check" key={s.id}><input type="checkbox" name="permissions" value={s.id} checked={selected.includes(s.id)} onChange={e=>setSelected(e.target.checked?[...selected,s.id]:selected.filter(id=>id!==s.id))}/>{s.label}</label>)}{selected.length===0 && <p>Deze persoon ziet na inloggen nog geen onderdelen.</p>}</fieldset>}
 {role==="employee"&&<label className="portal-check"><input type="checkbox" name="teamOverview" defaultChecked={user?.permissions.includes("__task_team__")}/>Teamoverzicht voor taken op de homepage (voor Don)</label>}
 {user && <label className="portal-check"><input type="checkbox" name="active" defaultChecked={user.active} disabled={self}/>Account actief {self && "(je eigen account)"}</label>}{self && <input type="hidden" name="active" value="on"/>}
 <Notice state={state}/><button disabled={pending||!changed}>{pending?"Bezig met opslaan…":user?"Wijzigingen opslaan":"Gebruiker aanmaken"}</button>
 </form>;
}
export function AccountAction({user,kind}:{user:User;kind:"password"|"delete"}) {
 const [state,action,pending]=useActionState(manage,{});
 return <form action={action}><input type="hidden" name="kind" value={kind}/><input type="hidden" name="id" value={user.id}/><input type="hidden" name="version" value={user.version}/>{kind==="password"?<label>Nieuw wachtwoord (minimaal 12 tekens)<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label>:<label>Je verwijdert het account van {user.name}. Typ VERWIJDEREN om te bevestigen.<input name="confirmation" required pattern="VERWIJDEREN" autoComplete="off"/></label>}<Notice state={state}/><button disabled={pending} className={kind==="delete"?"portal-danger":""}>{pending?"Bezig…":kind==="delete"?"Account definitief verwijderen":"Wachtwoord wijzigen"}</button></form>;
}
