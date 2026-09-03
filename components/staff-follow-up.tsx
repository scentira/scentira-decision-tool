'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {DiscountDecision,type CheckedDiscount} from '@/components/discount-decision';
type Guide={kind?:string|null;question?:string;options?:string[];result?:{title:string;message:string}|null;context?:string};
export function StaffFollowUp({entryId,situation,onContext}:{entryId:string;situation:string;onContext:(value:string)=>void}){
 const [answers,setAnswers]=useState<string[]>([]);const [guide,setGuide]=useState<Guide>({});const [error,setError]=useState(false);const [retry,setRetry]=useState(0);
 useEffect(()=>{const abort=new AbortController();setGuide(previous=>({...previous,result:null}));onContext('');fetch('/api/guide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entryId,situation,value:'',answers}),signal:abort.signal}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then((data:Guide)=>{if(abort.signal.aborted)return;setGuide(data);setError(false);onContext(data.context||'');}).catch(()=>{if(!abort.signal.aborted)setError(true);});return ()=>abort.abort();},[entryId,situation,answers,retry,onContext]);
 if(error)return <p className="error">Could not load follow-up.<Button onClick={()=>setRetry(n=>n+1)}>Retry</Button></p>;
 if(guide.kind===undefined)return <p role="status">Checking whether this rule needs more details…</p>;
 if(!guide.kind)return <p className="muted">Review the precedent below and check its conditions before applying it.</p>;
 if(guide.kind==='discount')return <DiscountDecision key={`${entryId}-${situation}`} onReset={()=>onContext('')} onChecked={result=>onContext(result.context?`${situation}\n\n${result.context}`:situation)} onCheck={async value=>{
  const response=await fetch('/api/guide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entryId,situation,value})});
  if(!response.ok)throw Error();const data=await response.json();
  if(data.kind!=='discount')throw Error();
  // Context is carried by the currently visible checked decision only.
  return data.result as CheckedDiscount|null;
 }}/>;
 return <section className="discount-follow-up"><h4>ONE DETAIL TO APPLY THIS RULE</h4><p>{guide.question}</p><div className="card-bottom">{guide.options?.map(option=><Button key={option} variant="outline" onClick={()=>setAnswers(a=>[...a,option])}>{option}</Button>)}{answers.length>0&&<Button variant="ghost" onClick={()=>setAnswers(a=>a.slice(0,-1))}>Back</Button>}</div>{guide.result&&<div className="rule-box"><strong>{guide.result.title}</strong><p>{guide.result.message}</p></div>}</section>;
}
