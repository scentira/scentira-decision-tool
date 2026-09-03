import { getRole } from '@/lib/auth';
import { readState } from '@/lib/store';
import { supportsDiscountGuide,discountGuidance,discountEscalationText } from '@/lib/discount-guide';
import { supportsDamageGuide,damageQuestions,damageGuidance,validDamageAnswers,damageEscalationText } from '@/lib/damage-guide';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function POST(req:Request){
 try{
  if(await getRole(req)==='team')return reply({error:'Staff sign-in required.'},401);
  const {entryId,situation='',value='',answers=[]}=await req.json();
  if(typeof situation!=='string'||typeof value!=='string'||!Array.isArray(answers)||answers.some(a=>typeof a!=='string'))return reply({error:'Invalid follow-up input.'},400);
  const {state}=await readState();const entry=state.entries.find(e=>e.id===entryId);
  if(supportsDiscountGuide(entry))return reply({kind:'discount',question:'How many previous orders has this customer placed?',result:discountGuidance(value),context:discountEscalationText(situation,value)});
  if(supportsDamageGuide(entry)){const valid=validDamageAnswers(answers);return reply({kind:'damage',question:damageQuestions[valid.length]?.question,options:damageQuestions[valid.length]?.options,result:damageGuidance(valid),context:damageEscalationText(situation,valid)});}
  return reply({kind:null});
 }catch{return reply({error:'Could not load follow-up.'},503);}
}
