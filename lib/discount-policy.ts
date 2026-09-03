import type { State } from './domain';

export const discountPolicyId='discount-policy-2026-08-31-corrected';
export const discountDecision='First-time purchasers (0 previous orders) → 5% off. Customers with 1–9 previous orders → no discount. Customers with 10 or more previous orders → 10% off.';
export const discountReasoning='The first-order 5% offer is meant to earn a second purchase. At 10 or more orders, the larger offer recognises the customer’s contribution. Between those points, customers are already buying, so no additional discount is needed.';
export const discountException='';
export function updateDiscountPolicy(state:State,now=Date.now()):State{
 if(state.entries.some(e=>e.id===discountPolicyId))return state;
 const old=state.entries.find(e=>e.id==='discount-policy-2026-08-31')||state.entries.find(e=>e.id==='discount-policy-2026-08-30')||state.entries.find(e=>e.id==='1');
 const expected=old?.id==='1'?'First-time customer → no additional discount. Customer with 10+ orders → additional discount can be offered.':old?.id==='discount-policy-2026-08-31'?'First-time purchasers (0 previous orders) → 5% off. Customers with 1–10 previous orders → no discount. Customers with more than 10 previous orders → 10% off.':'First-time purchasers (0 previous orders) → 5% off. Customers with more than 10 previous orders → 10% off.';
 if(!old||old.status!=='Active'||old.decision!==expected)return state;
 const next=structuredClone(state);
 const prior=next.entries.find(e=>e.id===old.id)!;
 prior.status='Superseded';prior.replacementId=discountPolicyId;
 next.entries.push({...prior,id:discountPolicyId,status:'Active',seed:false,createdAt:now,decision:discountDecision,reasoning:discountReasoning,exception:discountException,supersedesId:prior.id,replacementId:undefined,changeReason:'Corrected the larger-offer boundary to 10 or more previous orders and recorded the founder’s reasoning.'});
 return next;
}
