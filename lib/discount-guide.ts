import type { Entry } from './domain';
import { discountPolicyId, discountDecision, discountException } from './discount-policy.ts';

// This interpretation belongs only to this exact approved seed rule, never a future revision.
export function supportsDiscountGuide(entry:Entry|undefined){return !!entry&&entry.id===discountPolicyId&&entry.status==='Active'&&entry.decision===discountDecision&&entry.exception===discountException;}
export function discountGuidance(value:string){
 if(value==='unknown')return {title:'Check the customer’s order history first',message:'Without the previous order count, this rule cannot determine eligibility. Check the order records or ask the founder with the missing information clearly noted.',context:'Previous orders: unknown (not verified). Policy check: eligibility could not be determined.'};
 if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value)))return null;
 const count=Number(value);
 if(count===0)return {title:'Offer 5% off',message:'You entered 0 previous orders. The saved rule allows 5% off for a first-time purchaser.',context:'Previous orders: 0 (team-provided). Policy check: first-time purchaser — 5% off.'};
 if(count<=10)return {title:'No discount',message:'The saved rule says customers with 1–10 previous orders receive no discount.',context:`Previous orders: ${count} (team-provided). Policy check: 1–10 previous orders — no discount.`};
 return {title:'Offer 10% off',message:'The customer has more than 10 previous orders and qualifies for 10% off under the saved rule.',context:`Previous orders: ${count} (team-provided). Policy check: more than 10 previous orders — 10% off.`};
}
export function discountEscalationText(situation:string,value:string){const result=discountGuidance(value);return result?`${situation}\n\nAdditional-discount follow-up\n${result.context}`:situation;}
