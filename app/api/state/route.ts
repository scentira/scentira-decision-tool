import { readState,mutate } from '@/lib/store';
import { getRole,checkOrigin } from '@/lib/auth';
import { AppError } from '@/lib/domain';
import { people } from '@/lib/domain-actions';
import { publicSnapshot,isNormalRecord } from '@/lib/public-demo';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
const teamWorkspace=(req:Request)=>req.headers.get('x-scentira-team-workspace')==='1';
export async function GET(req:Request){try{const role=await getRole(req);if(role==='team'&&!teamWorkspace(req))return reply(publicSnapshot());const {state}=await readState();return reply({mode:'staff',entries:state.entries.filter(e=>e.status!=='No rule'&&isNormalRecord(e)),cases:state.cases.filter(isNormalRecord),people:people.map(({name})=>({name})),role,services:{storage:'convex'}});}catch{return reply({error:"Couldn't load precedents — try again"},503);}}
export async function POST(req:Request){try{checkOrigin(req);const role=await getRole(req);if(role==='team'&&!teamWorkspace(req))return reply({error:'Public demo is read-only. Open the team workspace to submit a real case.'},401);const action=await req.json() as Record<string,unknown>;const state=await mutate(action,role);return reply({saved:true,case:state.cases.find(c=>c.id===(action.caseId||action.id))});}catch(e){return reply({error:e instanceof AppError?e.message:'Could not save. Your text has been preserved; please retry.'},e instanceof AppError?e.status:503);}}
