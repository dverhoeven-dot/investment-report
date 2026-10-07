import {assetPermissions} from "./assets";
export const sections = [
 {id:"spain",label:"Spaanse portefeuille",href:"/portfolio"},
 {id:"netherlands",label:"Nederlandse portefeuille",href:"/nederlandse-portfolio"},
 {id:"complete",label:"Complete portefeuille",href:"/complete-portfolio"},
 {id:"returns",label:"Rendementscheck Spanje",href:"/rendements-check-spanje"},
 {id:"residential",label:"Investeerder residentieel",href:"/investor-residentieel"},
 {id:"commercial",label:"Investeerder bedrijfsmatig",href:"/investor-bedrijfsmatig"},
 {id:"furniture",label:"Furniture Procurement",href:"/furniture-procurement"},
 {id:"los-naranjos",label:"Project Los Naranjos",href:"/reports/los-naranjos"},
 {id:"la-carolina",label:"Project La Carolina",href:"/reports/la-carolina"},
] as const;
export type User = {id:string;name:string;email:string;role:"employee"|"viewer";active:boolean;permissions:string[];version:number};
export function allowed(user:User, permission:string) {return user.active && (user.role === "employee" || user.permissions.includes(permission));}
export function canWrite(user:User,permission:string){return user.active&&(user.role==="employee"||(permission==="furniture"&&allowed(user,"furniture")));}
export function pathPermission(path:string):string|null {
 if(/^\/api\/furniture-items(?:\/[^/]+)?$/.test(path) || path==="/api/furniture-images" || path==="/api/furniture-properties" || path==="/api/product-import") return "furniture";
 if(/^\/api\/rendements-projects(?:\/[^/]+)?$/.test(path)) return "returns";
 if(path==="/api/portfolio-data/complete") return "complete";
 if(path==="/api/portfolio-data/netherlands") return "netherlands";
 const report = /^\/reports\/([^/]+)(?:\/|$)/.exec(path);
 if(report) return sections.find(s=>s.id===report[1] && s.href.startsWith("/reports/"))?.id ?? "__unknown__";
 return sections.find(s=>path===s.href || path.startsWith(s.href+"/"))?.id ?? null;
}
export function canVisit(user:User,path:string,method="GET") {
 if(!user.active) return false;
 if(["/","/portal","/geen-toegang"].includes(path)) return true;
 if(["/klanten","/pipeline","/projecten","/api/office-files"].some(base=>path===base||path.startsWith(base+"/")))return user.role==="employee";
 if(path==="/taken"||path.startsWith("/taken/")||path==="/api/task-files"||path.startsWith("/api/task-files/"))return user.role==="employee";
 if(path==="/beheer" || path.startsWith("/beheer/")) return user.role==="employee";
 if(user.role==="employee") return true;
 if(path.startsWith("/api/") && !["GET","HEAD"].includes(method)) {const permission=pathPermission(path);return permission!==null&&canWrite(user,permission);}
 const assetRights=assetPermissions(path);
 if(assetRights) return assetRights.some(permission=>allowed(user,permission));
 const permission=pathPermission(path);
 return permission!==null && allowed(user,permission);
}
