import Link from "next/link";
import type {User} from "@/lib/portal/permissions";
import Sidebar from "@/components/office/Sidebar";
import "./portal.css";
import "../office/office.css";
export default function Shell({user,children,legacy=false}:{user?:User;children:React.ReactNode;legacy?:boolean}) {
 if(!user)return <div className="portal-shell"><header><Link href="/portal">LEOVARI <span>& L3 CAPITAL</span></Link></header><main>{children}</main><footer>Leovari & L3 Capital · Besloten portaal</footer></div>;
 return <div className={'office-shell'+(legacy?'':' portal-shell')}><Sidebar user={user}/><div className="office-body"><header className="office-topbar"><span>PRIVATE OFFICE <span className="office-muted"> / Nederland & Spanje</span></span><span>{user.name}</span></header>{legacy?<div className="office-legacy-frame">{children}</div>:<main className="office-content">{children}</main>}<footer className="office-footer">Leovari & L3 Capital · Besloten werkomgeving</footer></div></div>;
}
