import Link from "next/link";
import Shell from "@/components/portal/Shell";
import {requireUser} from "@/lib/portal/auth";
import {sections,allowed} from "@/lib/portal/permissions";

export default async function Portal() {
 const user=await requireUser();
 const visible=sections.filter(section=>allowed(user,section.id));
 return (
  <Shell user={user}>
   <h1>Welkom, {user.name}</h1>
   <p>Kies het onderdeel dat je wilt bekijken.</p>
   <div className="portal-grid">
    {visible.map(section=>(
     <Link href={section.href} key={section.id}>
      {section.label}<span aria-hidden="true">→</span>
     </Link>
    ))}
   </div>
   {!visible.length && (
    <div className="portal-card">
     Je hebt nog geen toegang tot onderdelen. Vraag een medewerker om je toegang toe te voegen.
    </div>
   )}
  </Shell>
 );
}
