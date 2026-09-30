"use client";
import Link from "next/link";
import {createContext,useContext,useEffect,useRef} from "react";
const AccessContext=createContext({readOnly:false,userId:""});
export const usePortalAccess=()=>useContext(AccessContext);
export default function ReadOnlyBoundary({readOnly,userId,children}:{readOnly:boolean;userId:string;children:React.ReactNode}) {
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!readOnly || !root.current) return;
  const element=root.current;
  const lock=()=>element.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>("input:not([data-portal-view-control]),textarea,select:not([data-portal-view-control]),[data-portal-edit]").forEach(control=>{if(!control.disabled) control.disabled=true;if(control.getAttribute("aria-disabled")!=="true") control.setAttribute("aria-disabled","true");});
  lock();const observer=new MutationObserver(lock);observer.observe(element,{childList:true,subtree:true,attributes:true,attributeFilter:["disabled"]});return ()=>observer.disconnect();
 },[readOnly]);
 return <AccessContext.Provider value={{readOnly,userId}}><div ref={root}><div className="no-print" style={{padding:"12px 24px",background:"#f4f3ef"}}><Link href="/portal">← Mijn portaal</Link></div>{readOnly && <p style={{padding:"12px 24px",background:"#edf1ed",color:"#255b46",margin:0}} className="no-print">Je hebt kijkrechten. Wijzigingen en opslaan zijn alleen beschikbaar voor medewerkers.</p>}{children}</div></AccessContext.Provider>;
}
