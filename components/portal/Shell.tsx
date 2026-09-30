import Link from "next/link";
import {logout} from "@/app/portal/actions";
import type {User} from "@/lib/portal/permissions";
import "./portal.css";
export default function Shell({user,children}:{user?:User;children:React.ReactNode}) {return <div className="portal-shell"><header><Link href="/portal">LEOVARI <span>& L3 CAPITAL</span></Link>{user && <nav><span>{user.name}</span><Link href="/portal">Mijn portaal</Link>{user.role==="employee" && <Link href="/beheer">Gebruikers beheren</Link>}<form action={logout}><button className="portal-secondary">Uitloggen</button></form></nav>}</header><main>{children}</main><footer>Leovari & L3 Capital · Besloten portaal</footer></div>; }
