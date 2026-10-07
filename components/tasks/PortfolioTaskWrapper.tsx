import {taskData} from "@/lib/tasks/store";
import {requireUser} from "@/lib/portal/auth";
import {PortfolioTasksProvider} from "./PortfolioTasks";
export default async function PortfolioTaskWrapper({children}:{children:React.ReactNode}){const user=await requireUser();const data=user.role==='employee'?await taskData(user):null;return <PortfolioTasksProvider data={data}>{children}</PortfolioTasksProvider>;}
