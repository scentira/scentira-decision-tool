import type { State } from './domain';

export const discountPolicyId='discount-policy-2026-08-31';
export const discountDecision='First-time purchasers (0 previous orders) → 5% off. Customers with 1–10 previous orders → no discount. Customers with more than 10 previous orders → 10% off.';
export const discountException='';
export function updateDiscountPolicy(state:State,now=Date.now()):State{
 if(state.entries.some(e=>e.id===discountPolicyId))return state;
 const old=state.entries.find(e=>e.id==='discount-policy-2026-08-30')||state.entries.find(e=>e.id==='1');
 const expected=old?.id==='1'?'First-time customer → no additional discount. Customer with 10+ orders → additional discount can be offered.':'First-time purchasers (0 previous orders) → 5% off. Customers with more than 10 previous orders → 10% off.';
 if(!old||old.status!=='Active'||old.decision!==expected)return state;
 const next=structuredClone(state);
 const prior=next.entries.find(e=>e.id===old.id)!;
 prior.status='Superseded';prior.replacementId=discountPolicyId;
 next.entries.push({...prior,id:discountPolicyId,status:'Active',seed:false,createdAt:now,decision:discountDecision,reasoning:'Discount policy confirmed by Gazal: 5% for first-time purchasers, no discount for 1–10 previous orders, and 10% for more than 10 previous orders. No further business reasoning was supplied.',exception:discountException,supersedesId:prior.id,replacementId:undefined,changeReason:'Clarified that customers with 1–10 previous orders receive no discount. First-time purchasers retain 5% off; customers with more than 10 previous orders retain 10% off.'});
 return next;
}
