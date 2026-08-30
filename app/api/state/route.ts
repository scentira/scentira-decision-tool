import { readState,mutate } from '@/lib/store';
import { getRole,checkOrigin } from '@/lib/auth';
import { AppError } from '@/lib/domain';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){try{const {state}=await readState();return reply({entries:state.entries.filter(e=>e.status!=='No rule'),cases:state.cases,role:await getRole(req),services:{ai:false,email:false,scheduler:false,storage:'convex'}});}catch{return reply({error:"Couldn't load precedents — try again"},503);}}
export async function POST(req:Request){try{checkOrigin(req);const action=await req.json() as Record<string,unknown>;const state=await mutate(action,await getRole(req));return reply({saved:true,case:state.cases.find(c=>c.id===(action.caseId||action.id)),warning:'Saved, but email notification failed — email delivery is not connected yet.'});}catch(e){return reply({error:e instanceof AppError?e.message:'Could not save. Your text has been preserved; please retry.'},e instanceof AppError?e.status:503);}}
