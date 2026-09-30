"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

export default function HomeButton() {
 const pathname=usePathname();
 if(pathname==="/login") return null;
 return <>
  <Link href="/portal" prefetch={false} className="portal-global-home" aria-label="Home — terug naar mijn portaal">
   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>
   <span>Home</span>
  </Link>
  <style jsx global>{`
   .portal-global-home {position:fixed;right:20px;bottom:20px;z-index:1000;display:inline-flex;align-items:center;gap:9px;padding:12px 18px;border:1px solid rgba(255,255,255,.25);border-radius:999px;background:#255b46;color:#fff;font:600 15px/1.3 Arial,sans-serif;text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,.18);}
   .portal-global-home:hover {background:#1c4937;}
   .portal-global-home:focus-visible {outline:3px solid #c78c36;outline-offset:4px;}
   @media(max-width:600px) {.portal-global-home {right:12px;bottom:12px;padding:11px 15px;}}
   @media print {.portal-global-home {display:none !important;}}
  `}</style>
 </>;
}
