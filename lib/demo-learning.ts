// Fictional presentation of the supplied "Swapped orders" no-rule scenario.
export const learningExample = {
  employee: 'Sana Vale', customer: 'Elio Hart', orderId: 'DEMO-1006', date: '31 August 2026',
  futureCustomer: 'Oren Wren', futureOrderId: 'DEMO-1016', futureDate: '1 September 2026',
  situation: 'Two orders were swapped and one has reached the final delivery station. Should it be returned to origin, or delivered and collected afterward?',
  paraphrase: 'The parcels went to the wrong customers and one is already at the last-mile hub. Do we recall it now or complete delivery and arrange pickup later?',
  title: 'Swapped orders at the final delivery station',
  decision: 'Hold the affected parcel at the final station while the order identities and safest recovery route are confirmed.',
  reasoning: 'Pausing the parcel prevents a known wrong delivery while the team confirms how both swapped orders can be recovered.',
  conditions: 'Confirmed swapped orders; one parcel is at the final delivery station and has not been delivered.',
} as const;

export type LearningCase = {
  id: string; situation: string; employee: string; customer: string; orderId: string; date: string;
  status: 'Pending founder approval' | 'Approved in demo';
};
export type LearningApproval = { title: string; decision: string; reasoning: string; conditions: string };
export type LearnedPrecedent = LearningApproval & {
  id: string; status: 'Approved'; approvedBy: 'Fictional demo approval'; approvalDate: string;
  sourceCase: LearningCase; matchTerms: string[];
};
export type DemoLearningState = { cases: LearningCase[]; precedents: LearnedPrecedent[] };
export const emptyLearningState = (): DemoLearningState => ({ cases: [], precedents: [] });

// General wording normalization, not per-case training or an AI model.
// A new approval is searchable immediately from its source and conditions.
const aliases: Record<string,string> = {
  divide:'split', divided:'split', splitting:'split', separate:'split', separated:'split',
  presents:'gift', present:'gift', gifts:'gift', gifting:'gift',
  packages:'parcel', package:'parcel', parcels:'parcel', boxes:'parcel', box:'parcel',
  packing:'pack', packed:'pack', unpacked:'pack',
  purchase:'order', purchases:'order', orders:'order',
  client:'customer', buyer:'customer', customers:'customer',
  shipping:'delivery', shipment:'delivery', shipments:'delivery', courier:'delivery',
  damaged:'damage', broken:'damage', cracked:'damage',
  refunding:'refund', refunded:'refund', reimbursement:'refund',
  replace:'replacement', replacing:'replacement', photographs:'photo', photos:'photo',
  swapped:'swap', wrong:'swap',
  recall:'return', recalled:'return', origin:'return', rto:'return',
  hub:'station', last:'final', mile:'delivery', pickup:'collect', collected:'collect',
  collab:'collaboration', collaborations:'collaboration', collaborating:'collaboration',
};
const ignored = new Set('a an the to of in into on at and or for with without we i my me our their it its this that these those is are was were be been being has have had can could would should please need needs want wants asks ask requested request change one two not no before after yet already customer order how much do does doing'.split(' '));
export function learningTerms(text: string) {
  return [...new Set((text.toLowerCase().match(/[a-z]+/g)||[])
    .map(word=>aliases[word]||word).filter(word=>!ignored.has(word)))];
}
function packingState(text: string): 'unpacked'|'packed'|'unknown' {
  const lower=text.toLowerCase().replace(/[’']/g,'');
  if(/not (?:been )?packed|hasnt been packed|before packing|unpacked|packing (?:has not|hasnt) started/.test(lower))return 'unpacked';
  if(/already packed|after packing|has been packed|is packed|sealed/.test(lower))return 'packed';
  return 'unknown';
}
export function findLearnedPrecedent(precedents: LearnedPrecedent[], sentence: string) {
  const query=learningTerms(sentence);
  if(query.length<2)return null;
  const ranked=precedents.filter(p=>p.status==='Approved'&&p.approvedBy==='Fictional demo approval')
    .filter(p=>!(packingState(p.conditions)==='unpacked'&&packingState(sentence)==='packed'))
    .map(precedent=>{
      const shared=query.filter(term=>precedent.matchTerms.includes(term));
      const shortQuery=query.length<=3;
      const score=shortQuery?shared.length/query.length:shared.length/Math.sqrt(query.length*Math.max(1,precedent.matchTerms.length));
      return {precedent,score,shared,shortQuery};
    }).filter(result=>result.shared.length>=(result.shortQuery?2:3)&&result.score>=(result.shortQuery?0.6:0.55))
    .sort((a,b)=>b.score-a.score);
  if(!ranked.length||(ranked[1]&&ranked[0].score-ranked[1].score<0.1))return null;
  return ranked[0];
}
export function submitLearningCase(state: DemoLearningState, situation: string): DemoLearningState {
  const text=situation.trim();
  if(!text||text.length>2000)throw new Error('Enter a situation of 1–2,000 characters.');
  if(state.cases.some(c=>c.situation===text))return state;
  const number=state.cases.length+1;
  const item: LearningCase={id:`demo-learning-case-${number}`,situation:text,
    employee:learningExample.employee,customer:text===learningExample.paraphrase?learningExample.futureCustomer:learningExample.customer,
    orderId:`DEMO-${4820+number}`,date:text===learningExample.paraphrase?learningExample.futureDate:learningExample.date,status:'Pending founder approval'};
  return {...state,cases:[...state.cases,item]};
}
export function approveLearningCase(state: DemoLearningState, caseId: string, approval: LearningApproval): DemoLearningState {
  const source=state.cases.find(c=>c.id===caseId);
  if(!source||source.status!=='Pending founder approval')throw new Error('Choose a pending demo case.');
  const fields: LearningApproval={title:approval.title.trim(),decision:approval.decision.trim(),reasoning:approval.reasoning.trim(),conditions:approval.conditions.trim()};
  if(['title','decision','reasoning','conditions'].some(key=>!fields[key as keyof LearningApproval]))throw new Error('Complete the decision, reasoning and conditions before approving.');
  const precedent: LearnedPrecedent={...fields,id:`demo-precedent-${state.precedents.length+1}`,
    status:'Approved',approvedBy:'Fictional demo approval',approvalDate:'1 September 2026',
    sourceCase:{...source},matchTerms:learningTerms(source.situation+' '+fields.conditions)};
  return {cases:state.cases.map(c=>c.id===caseId?{...c,status:'Approved in demo'}:c),precedents:[...state.precedents,precedent]};
}
