import type { Entry } from './domain';
import { discountPolicyId, discountDecision, discountException, discountReasoning } from './discount-policy.ts';

// This interpretation belongs only to this exact approved seed rule, never a future revision.
export function supportsDiscountGuide(entry:Entry|undefined){return !!entry&&entry.id===discountPolicyId&&entry.status==='Active'&&entry.decision===discountDecision&&entry.exception===discountException;}
export function discountGuidance(value:string){
 if(value==='unknown')return {title:'Check the customer’s order history first',basis:'Previous orders: unknown — no eligibility assumed.',message:'Scentira’s rule requires the previous order count. Check the order records or ask the founder with the missing information clearly noted.',branches:'0 prior orders → 5%; 1–9 → none; 10+ → 10%.',context:'Previous orders: unknown (not verified). Policy check: eligibility could not be determined.'};
 if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value)))return null;
 const count=Number(value);
 const judgment=discountReasoning;
 const basis=`Based on the ${count} previous orders you entered — team-provided, not independently verified.`;
 if(count===0)return {title:'Offer 5% off',basis,message:'Scentira’s rule: first purchase, 0 prior orders → 5% off. '+judgment,branches:'1–9 prior orders → none; 10+ → the larger 10% offer.',reply:'Thanks for asking! As this is your first purchase, we can offer 5% off.',context:'Previous orders: 0 (team-provided). Policy check: first-time purchaser — 5% off.'};
 if(count<10)return {title:'No discount',basis,message:'Scentira’s rule: 1–9 prior orders → no discount. '+judgment,branches:'0 prior orders → 5%; 10+ → the larger 10% offer.',reply:'Thanks for asking! Based on your order history, we cannot offer an additional discount on this purchase.',context:`Previous orders: ${count} (team-provided). Policy check: 1–9 previous orders — no discount.`};
 return {title:'Offer 10% off',basis,message:'Scentira’s rule: 10 or more prior orders → 10% off. '+judgment,branches:'0 prior orders → 5%; 1–9 → no discount.',reply:'Thanks for asking! Based on your order history, we can offer 10% off this purchase.',context:`Previous orders: ${count} (team-provided). Policy check: 10 or more previous orders — 10% off.`};
}
export function discountEscalationText(situation:string,value:string){const result=discountGuidance(value);return result?`${situation}\n\nAdditional-discount follow-up\n${result.context}`:situation;}
