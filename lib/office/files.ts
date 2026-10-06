import "server-only";
import {randomUUID} from "node:crypto";
import {db} from "../portal/db";
import type {User} from "../portal/permissions";
import {fileMime} from "../tasks/files";
import {officeAccess,clientDetails} from "./store";
export async function uploadDocument(actor:User,id:string,file:File){await clientDetails(actor,id);if(!file.size||file.size>3*1024*1024)throw new Error("Maximaal 3 MB per document.");const bytes=new Uint8Array(await file.arrayBuffer()),mime=fileMime(bytes);if(!mime)throw new Error("Kies PNG, JPEG, WebP of PDF.");const name=file.name.replace(/[\x00-\x1f\x7f/\\]/g,"_").slice(0,180)||"document";const tx=await db().transaction("write");try{const n=(await tx.execute({sql:"SELECT COUNT(*) AS n FROM office_documents WHERE client_id=?",args:[id]})).rows[0];if(Number(n.n)>=30)throw new Error("Maximaal 30 documenten per klant.");await tx.execute({sql:"INSERT INTO office_documents(id,client_id,name,mime,size,data,actor,created_at) VALUES(?,?,?,?,?,?,?,?)",args:[randomUUID(),id,name,mime,file.size,bytes,actor.name,new Date().toISOString()]});await tx.commit();}finally{tx.close();}}
export async function getDocument(actor:User,id:string){await officeAccess(actor);return (await db().execute({sql:"SELECT name,mime,data FROM office_documents WHERE id=?",args:[id]})).rows[0]??null;}
export async function removeDocument(actor:User,id:string){await officeAccess(actor);await db().execute({sql:"DELETE FROM office_documents WHERE id=?",args:[id]});}
