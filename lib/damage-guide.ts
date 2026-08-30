import type { Entry } from './domain';

export const damageQuestions=[
 {question:'What can you see in the customer’s photos?',options:['Damage is visible','Photos are blurry or inconclusive','No photos available','Not checked yet']},
 {question:'Have you checked the packing team’s records or images?',options:['Checked the records','Records unavailable','Not checked yet']},
 {question:'Have you checked the customer’s order and complaint history?',options:['Checked the history','History unavailable','Not checked yet']},
 {question:'Based on the evidence you checked, was the product securely packed?',options:['Confirmed: not securely packed','Confirmed: securely packed','Cannot tell from the evidence']},
];
export function supportsDamageGuide(entry:Entry|undefined){return !!entry&&entry.id==='2'&&entry.status==='Active'&&entry.decision==="Check customer photos, packaging team's records/images, customer's order/complaint history, and whether the product was securely packed."&&entry.exception==="If the product wasn't securely packed → company fault → offer replacement/refund.";}
export function validDamageAnswers(answers:string[]){const valid:string[]=[];for(let i=0;i<damageQuestions.length;i++){if(!damageQuestions[i].options.includes(answers[i]))break;valid.push(answers[i]);}return valid;}
export function damageGuidance(answers:string[]){const valid=validDamageAnswers(answers);if(valid.length!==damageQuestions.length)return null;
 if(valid[3]==='Confirmed: not securely packed')return {title:'Offer a replacement or refund',message:'You confirmed that packing was not secure. The saved rule treats this as company fault and allows a replacement or refund. This is based on your evidence check, not an app verification.'};
 return {title:valid[3]==='Confirmed: securely packed'?'The rule does not decide this outcome':'Packing responsibility is still unclear',message:'Review any missing evidence or ask the founder with these checks attached. Secure packing, missing photos, or customer history alone do not establish fault or justify rejecting the claim under this rule.'};
}
export function damageEscalationText(situation:string,answers:string[]){const valid=validDamageAnswers(answers);if(!valid.length)return situation;const result=damageGuidance(valid);return `${situation}\n\nDamaged-product follow-up (team-provided, not independently verified)\n${damageQuestions.map((q,i)=>`${q.question} ${valid[i]||'Not answered'}`).join('\n')}\n${result?`${result.title}. ${result.message}`:'Checks incomplete — no outcome determined.'}`;}
