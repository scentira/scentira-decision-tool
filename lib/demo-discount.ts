// Independent fictional example. Never reads or imports private team policies.
export function demoDiscount(value:string){
 if(value==='unknown')return {title:'Check order history first',basis:'Previous orders: unknown — no eligibility assumed.',message:'The rule needs an order count before an additional discount can be selected.',branches:'Fewer than 10 previous orders → no additional discount; 10+ → an additional discount may be offered.',reply:undefined};
 if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value)))return null;
 const count=Number(value);
 const eligible=count>=10;
 return {
  title:eligible?'Additional discount may be offered':'No additional discount',
  basis:`Based on the ${count} previous orders you entered — entered order count.`,
  message:eligible?'The customer has 10 or more previous orders and has demonstrated the loyalty required by this rule.':'The rule reserves an additional discount for customers with at least 10 previous orders.',
  branches:'Fewer than 10 previous orders → no additional discount; 10+ → an additional discount may be offered.',
  reply:eligible?'Thanks for asking! Based on your order history, an additional discount may be offered on this purchase. Please confirm the amount through the usual approval process.':'Thanks for asking! Based on your order history, we cannot offer an additional discount on this purchase.',
 };
}
