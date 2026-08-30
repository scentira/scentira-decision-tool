export type Category = 'Customer Service' | 'Operations' | 'Marketing';
export type Role = 'team' | 'founder' | 'cos';
export type Priority = 'High' | 'Medium' | 'Low';
export type Entry = {id:string;title:string;category:Category;situation:string;decision:string;reasoning:string;exception:string;status:'Active'|'Superseded'|'No rule';seed:boolean;createdAt:number;founderOnly?:boolean;supersedesId?:string;replacementId?:string;changeReason?:string;caseId?:string};
export type Answer = {decision:string;reasoning:string;exception:string;role:'founder'|'cos';at:number};
export type RuleFeedback = {outcome:string;source:Entry;resolution?:{choice:'keep'|'clarify'|'replace';reason:string;at:number;entryId:string}};
export type Situation = {id:string;situation:string;submitter:string;priority:Priority;founderOnly:boolean;sourceId?:string;feedback?:RuleFeedback;createdAt:number;routedAt?:number;answer?:Answer;review?:{outcome:'approved'|'amended'|'one-off';at:number};precedentId?:string;actionIds:string[]};
export type Notice = {id:string;caseId:string;to:string;kind:'high'|'fallback'|'answer'|'decided';state:'pending'|'sent';createdAt:number};
export type State = {entries:Entry[];cases:Situation[];notices:Notice[]};
export const categories:Category[]=['Customer Service','Operations','Marketing'];
export const people = [{name:'Lovish',email:'lovish@scentira.in'},{name:'Gazal',email:'gazal@scentira.in'},{name:'Neha',email:'neha@scentira.in'},{name:'Hemanshi',email:'hemanshi@scentira.in'}];
export class AppError extends Error {status:number; constructor(message:string,status=400){super(message);this.status=status;}}
export function currentRule(entries:Entry[],id:string):Entry|undefined{const seen=new Set<string>();let entry=entries.find(e=>e.id===id);while(entry?.status==='Superseded'&&entry.replacementId&&!seen.has(entry.id)){seen.add(entry.id);entry=entries.find(e=>e.id===entry!.replacementId);}return entry?.status==='Active'?entry:undefined;}
const stop=new Set('a an the and or to of for with without in on at is it its be been being has have had do does did says say customer customers product products order orders situation wants want asking asks ask already but this that there them they their i we can could should would after before from as by my me no not'.split(' '));
const aliases:Record<string,string>={perfume:'fragrance',perfumes:'fragrance',fragrances:'fragrance',broken:'damage',damaged:'damage',cracked:'damage',leaking:'damage',discounts:'discount',discounted:'discount',unboxing:'unbox',video:'video',videos:'video',addresses:'address',modification:'modify',modifications:'modify',change:'modify',changes:'modify',changed:'modify',packed:'pack',packing:'pack',warehouse:'warehouse',refund:'return',returned:'return',returns:'return',influencers:'influencer',collaborations:'collaboration',swapped:'swap',swapping:'swap',publicly:'public',threatens:'threat',threatening:'threat',threatened:'threat',negatively:'negative',reviews:'review',reviewed:'review',posted:'post',messages:'message',messaging:'message',stones:'stone',used:'use',opened:'open'};
export function tokens(text:string){return [...new Set((text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>!stop.has(w)).map(w=>aliases[w]||w))];}
export function search(entries:Entry[],query:string){const active=entries.filter(e=>e.status==='Active');const q=tokens(query);if(!q.length)return [];const docs=active.map(e=>tokens(e.situation));return active.map((entry,i)=>{const shared=q.filter(w=>docs[i].includes(w));const weight=(w:string)=>1+Math.log((active.length+1)/(1+docs.filter(d=>d.includes(w)).length));const matched=shared.reduce((n,w)=>n+weight(w),0);const total=q.reduce((n,w)=>n+weight(w),0);const score=matched/Math.max(total,1);return {entry,score,possible:score<.66};}).filter(x=>x.score>=.18).sort((a,b)=>b.score-a.score||a.entry.id.localeCompare(b.entry.id)).slice(0,3);}
export function publicRisk(text:string){return /\b(?:negative|bad)\s+(?:review|post)|\breputation\b|\b(?:threat\w*|escalat\w*|complain\w*)\b[\s\S]*\b(?:public\w*|social media|viral)\b|\b(?:public\w*|social media)\b[\s\S]*\b(?:threat\w*|escalat\w*|complain\w*|negative)\b/i.test(text);}
export function queue(cases:Situation[],role:Role){return cases.filter(c=>role==='cos'?!!c.routedAt&&!c.founderOnly&&!c.answer:!c.answer||(c.answer.role==='cos'&&!c.review)).sort((a,b)=>{const review=(c:Situation)=>c.answer?.role==='cos'&&!c.review?0:1;return review(a)-review(b)||(['High','Medium','Low'].indexOf(a.priority)-['High','Medium','Low'].indexOf(b.priority))||a.createdAt-b.createdAt;});}
function note(s:State,c:Situation,to:string,kind:Notice['kind'],now:number){const id=`${c.id}:${kind}:${to}`;if(!s.notices.some(n=>n.id===id))s.notices.push({id,caseId:c.id,to,kind,state:'pending',createdAt:now});}
function text(value:unknown,name:string){if(typeof value!=='string'||!value.trim())throw new AppError(`${name} is required.`);return value.trim();}
export function applyAction(state:State,action:Record<string,unknown>,role:Role,now=Date.now()):State{
 const s=structuredClone(state);const kind=action.kind;const id=text(action.id,'Action ID');
 if(kind==='reportFeedback'){
  if(s.cases.some(c=>c.id===id))return s;
  const source=s.entries.find(e=>e.id===action.sourceId);
  if(!source||source.status==='No rule')throw new AppError('The original rule could not be found. Refresh the library.',404);
  const submitter=text(action.submitter,'Submitter');
  if(!people.some(p=>p.name===submitter))throw new AppError('Choose a submitter.');
  if(!['High','Medium','Low'].includes(String(action.priority)))throw new AppError('Choose High, Medium or Low.');
  const c:Situation={id,situation:text(action.situation,'Situation'),submitter,priority:action.priority as Priority,founderOnly:true,sourceId:source.id,createdAt:now,actionIds:[id],feedback:{outcome:text(action.outcome,'What happened'),source:structuredClone(source)}};
  s.cases.push(c);if(c.priority==='High')note(s,c,people[0].email,'high',now);return s;
 }
 if(kind==='resolveFeedback'){
  if(role!=='founder')throw new AppError('Only the founder can review a rule report.',403);
  const c=s.cases.find(c=>c.id===action.caseId);
  if(!c?.feedback)throw new AppError('Rule report not found.',404);
  if(c.actionIds.includes(id))return s;
  if(c.answer)throw new AppError('This report has already been reviewed. Refresh to see the decision.',409);
  const current=s.entries.find(e=>e.id===action.entryId);
  // Reject stale reviews rather than overwriting a rule changed by another review.
  if(!current||current.status!=='Active'||current.id!==currentRule(s.entries,c.sourceId!)?.id)throw new AppError('The rule has changed. Refresh and review the current version.',409);
  if(!['keep','clarify','replace'].includes(String(action.choice)))throw new AppError('Choose keep, clarify or replace.');
  const choice=action.choice as 'keep'|'clarify'|'replace';
  const reason=text(action.reason,'Review reason');let entryId=current.id;
  if(choice!=='keep'){
   if(s.entries.some(e=>e.id===id))throw new AppError('Review ID already exists.',409);
   if(!categories.includes(action.category as Category))throw new AppError('Choose a category.');
   const next:Entry={...current,id,decision:text(action.decision,'Decision'),reasoning:text(action.reasoning,'Reasoning'),exception:typeof action.exception==='string'?action.exception.trim():'',category:action.category as Category,seed:false,createdAt:now,supersedesId:current.id,replacementId:undefined,changeReason:reason,caseId:c.id};
   current.status='Superseded';current.replacementId=id;s.entries.push(next);entryId=id;
  }
  c.feedback.resolution={choice,reason,at:now,entryId};
  c.answer={decision:choice==='keep'?'Keep the current rule.':choice==='clarify'?'Rule clarified for future use.':'Rule replaced for future use.',reasoning:reason,exception:'',role:'founder',at:now};
  c.actionIds.push(id);note(s,c,people.find(p=>p.name===c.submitter)!.email,'answer',now);return s;
 }
 if(kind==='escalate'){
  if(s.cases.some(c=>c.id===id))return s;
  const situation=text(action.situation,'Situation');const submitter=text(action.submitter,'Submitter');if(!people.some(p=>p.name===submitter))throw new AppError('Choose a submitter.');
  if(!['High','Medium','Low'].includes(String(action.priority)))throw new AppError('Choose High, Medium or Low.');
  const source=s.entries.find(e=>e.id===action.sourceId);const founderOnly=!!source?.founderOnly||publicRisk(situation);
  const c:Situation={id,situation,submitter,priority:founderOnly?'High':action.priority as Priority,founderOnly,sourceId:source?.id,createdAt:now,actionIds:[id]};s.cases.push(c);if(c.priority==='High')note(s,c,people[0].email,'high',now);return s;
 }
 if(kind==='route') {if(role!=='founder')throw new AppError('Not allowed.',403);for(const c of s.cases)if(!c.answer&&!c.founderOnly&&!c.routedAt&&c.priority==='High'&&now-c.createdAt>=3600000){c.routedAt=now;note(s,c,people[1].email,'fallback',now);}return s;}
 if(role==='team')throw new AppError('Unlock founder or CoS access first.',401);
 const c=s.cases.find(c=>c.id===action.caseId);
 if(c?.feedback)throw new AppError('Use the founder rule-review form for this report.',403);
 if(c?.actionIds.includes(id)||s.entries.some(e=>e.id===id))return s;
 if(kind==='answer'){
  if(!c)throw new AppError('Situation not found.',404);if(role==='cos'&&(!c.routedAt||c.founderOnly))throw new AppError('This case is not assigned to the CoS.',403);if(c.answer)throw new AppError('This has already been answered. Refresh to see the decision.',409);
  c.answer={decision:text(action.decision,'Decision'),reasoning:text(action.reasoning,'Reasoning'),exception:typeof action.exception==='string'?action.exception.trim():'',role,at:now};
  note(s,c,people.find(p=>p.name===c.submitter)!.email,'answer',now);if(c.routedAt)note(s,c,role==='founder'?people[1].email:people[0].email,'decided',now);
 }else if(kind==='review'||kind==='promote'){
  if(role!=='founder')throw new AppError('Founder access required.',403);if(!c?.answer)throw new AppError('An answer is required first.');if(kind==='review'&&(c.answer.role!=='cos'||c.review))throw new AppError('This review is already complete or not required.',409);if(kind==='promote'&&c.answer.role==='cos'&&!c.review)throw new AppError('Review the CoS decision before publishing it.',409);if(c.precedentId)throw new AppError('This situation already has a precedent.',409);
 }else if(kind!=='replace')throw new AppError('Unknown action.');
 if(role==='cos'&&(action.savePrecedent===true||action.supersedesId))throw new AppError('Only the founder can publish precedents.',403);
 if(kind==='replace'&&role!=='founder')throw new AppError('Founder access required.',403);
 const publish=kind==='replace'||kind==='promote'||action.savePrecedent===true;
 if(publish){
  if(!categories.includes(action.category as Category))throw new AppError('Choose a category.');
  const predecessor=action.supersedesId?s.entries.find(e=>e.id===action.supersedesId):undefined;
  if(action.supersedesId&&(!predecessor||predecessor.status!=='Active'))throw new AppError('This rule was already replaced. Refresh the library.',409);
  if(kind==='replace'&&!predecessor)throw new AppError('Choose the rule to replace.');
  const changeReason=predecessor?text(action.changeReason,'Reason for change'):undefined;
  const situation=c?.situation||predecessor?.situation||text(action.situation,'Situation');
  const entry:Entry={id,title:typeof action.title==='string'&&action.title.trim()?action.title.trim():situation.slice(0,90),category:action.category as Category,situation,decision:text(action.decision,'Decision'),reasoning:text(action.reasoning,'Reasoning'),exception:typeof action.exception==='string'?action.exception.trim():'',status:'Active',seed:false,createdAt:now,caseId:c?.id,supersedesId:predecessor?.id,changeReason,founderOnly:predecessor?.founderOnly||c?.founderOnly};
  if(predecessor){predecessor.status='Superseded';predecessor.replacementId=id;}s.entries.push(entry);if(c)c.precedentId=id;
 }
 if(kind==='review'&&c?.answer)c.review={outcome:!publish?'one-off':action.decision===c.answer.decision&&action.reasoning===c.answer.reasoning&&String(action.exception||'')===c.answer.exception?'approved':'amended',at:now};
 if(c)c.actionIds.push(id);return s;
}
