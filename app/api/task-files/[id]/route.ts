import {revalidatePath} from "next/cache";
import {authorizeApi} from "@/lib/portal/api";
import {getFile,deleteFile} from "@/lib/tasks/files";
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context){const access=await authorizeApi("__employee_tasks__",false,request);if(access.response)return access.response;if(access.user!.role!=="employee")return new Response(null,{status:403});const file=await getFile(access.user!,(await context.params).id);if(!file)return new Response(null,{status:404});return new Response(file.data as ArrayBuffer,{headers:{"Content-Type":String(file.mime),"Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(String(file.name))}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}
export async function DELETE(request:Request,context:Context){const access=await authorizeApi("__employee_tasks__",true,request);if(access.response)return access.response;await deleteFile(access.user!,(await context.params).id);revalidatePath("/portal");return Response.json({success:true});}
