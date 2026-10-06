export type TaskProject={id:string;name:string;country:string;address:string;status:string;description:string;source:string;archived:boolean;visible?:boolean;entity?:string};
export type Task={id:string;title:string;description:string;projectId:string;assigneeId:string;status:string;deadline:string;version:number;checklist:{id:string;text:string;done:boolean}[]};
export type TaskMember={id:string;name:string;active:boolean};
export type TaskComment={id:string;name:string;text:string;createdAt:string};
export type TaskFile={id:string;name:string;size:number};
export const statuses=["Te doen","Bezig","Klaar"];
export function sortedOpen(tasks:Task[],owner?:string){return tasks.filter(t=>t.status!=="Klaar"&&(!owner||t.assigneeId===owner)).sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999")||a.title.localeCompare(b.title));}
export function dateLabel(value:string){return value?new Date(value+"T12:00:00").toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"Geen deadline";}
export function todayAmsterdam(){return new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam"}).format(new Date());}

export function visibleProjects(projects:TaskProject[]){return projects.filter(p=>p.visible!==false&&!p.archived);}
