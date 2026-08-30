import { settings,mutate } from '@/lib/store';
// A trusted external scheduler must invoke this endpoint; browser visits are not a scheduler.
export async function POST(req:Request){if(!settings.JOB_SECRET||req.headers.get('authorization')!==`Bearer ${settings.JOB_SECRET}`)return Response.json({error:'Not allowed'},{status:401});try{await mutate({kind:'route',id:crypto.randomUUID()},'founder');return Response.json({routed:true,emailDelivery:'not-connected'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Routing failed; retry safely.'},{status:503});}}
