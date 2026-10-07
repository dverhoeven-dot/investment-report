import {notFound} from 'next/navigation';
import Shell from '@/components/portal/Shell';
import TaskPipelineClient from '@/components/tasks/TaskPipelineClient';
import {requireEmployee} from '@/lib/portal/auth';
import {taskData} from '@/lib/tasks/store';
export default async function PipelinePage({params}:{params:Promise<{id:string}>}){const user=await requireEmployee();const {id}=await params;const data=await taskData(user);const task=data.tasks.find(t=>t.id===id);if(!task)notFound();return <Shell user={user}><TaskPipelineClient initial={task} projectName={data.projects.find(p=>p.id===task.projectId)?.name??''} memberName={data.members.find(m=>m.id===task.assigneeId)?.name??'Collega'}/></Shell>;}
