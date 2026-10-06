export const clientRoles=["Koper","Huurder","Investeerder"] as const;
export type ClientRole=typeof clientRoles[number];
export const stages:Record<ClientRole,readonly string[]>={Koper:["Nieuw","Wensen besproken","Bezichtiging","Bod","Overdracht","Afgerond","Gestopt"],Huurder:["Nieuw","Wensen besproken","Bezichtiging","Contract","Sleuteloverdracht","Afgerond","Gestopt"],Investeerder:["Nieuw","Interesse besproken","Projectvoorstel","Afspraken","Deelname","Afgerond","Gestopt"]};
export type OfficeClient={id:string;name:string;email:string;phone:string;area:string;brief:string;roles:ClientRole[];advisorId:string;archived:boolean;version:number};
export type OfficeDeal={id:string;clientId:string;type:ClientRole;title:string;stage:string;projectId:string;amount:string;notes:string;version:number};
export type OfficeActivity={id:string;kind:string;body:string;actor:string;at:string};
export type OfficeDocument={id:string;name:string;size:number};
export const activeDeal=(deal:OfficeDeal)=>!["Afgerond","Gestopt"].includes(deal.stage);
