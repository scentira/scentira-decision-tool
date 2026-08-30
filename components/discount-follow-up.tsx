'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { discountGuidance } from '@/lib/discount-guide';

export function DiscountFollowUp({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const result=discountGuidance(value);
 return <section className="discount-follow-up" aria-label="Additional discount follow-up">
  <h4>ONE DETAIL TO APPLY THIS RULE</h4>
  <label htmlFor="discount-previous-orders">How many previous orders has this customer placed?</label>
  <p className="muted">Check their order history. Count previous orders, not the current request.</p>
  <div className="discount-answer"><Input id="discount-previous-orders" type="text" inputMode="numeric" value={value==='unknown'?'':value} onChange={e=>onChange(e.target.value)} placeholder="For example, 0 or 12" aria-describedby="discount-result"/><Button type="button" variant="outline" aria-pressed={value==='unknown'} onClick={()=>onChange('unknown')}>I don’t know yet</Button></div>
  {value&&!result&&<p className="error" role="alert">Enter a whole number of 0 or more.</p>}
  <div id="discount-result" aria-live="polite">{result&&<div className="rule-box"><strong>{result.title}</strong><p>{result.message}</p><p className="muted">Based on the saved rule and the count you provided—not an independently verified customer record. Use “Ask founder” below if you need a decision; this answer will be included.</p></div>}</div>
 </section>;
}
