'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { categories, currentRule, type Entry, type Role, type Situation } from '@/lib/domain';

type Save = (action:Record<string,unknown>)=>Promise<void>;
function OriginalRule({entry}:{entry:Entry}) {
 return <details className="old-rule"><summary>Rule followed: {entry.title}</summary><p>{entry.decision}</p><p><strong>Reasoning:</strong> {entry.reasoning||'Not recorded'}</p><p><strong>Exception:</strong> {entry.exception||'None recorded'}</p></details>;
}

export function ReportRuleForm({entry,onSave,onClose,people}:{entry:Entry;onSave:Save;onClose:()=>void;people:{name:string}[]}) {
 const [situation,setSituation]=useState('');const [outcome,setOutcome]=useState('');
 const [submitter,setSubmitter]=useState('');const [priority,setPriority]=useState('');
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);const id=useRef(crypto.randomUUID());
 async function submit(e:FormEvent){e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await onSave({kind:'reportFeedback',id:id.current,sourceId:entry.id,situation,outcome,submitter,priority});}catch(e){setError((e as Error).message);}finally{lock.current=false;setBusy(false);}}
 return <section className="edit-panel" aria-label="Report a decision that did not work">
  <div className="section-heading"><h2>This decision didn’t work</h2><Button variant="ghost" disabled={busy} onClick={()=>{if(!situation&&!outcome||window.confirm('Discard this unsaved report?'))onClose();}}>Close</Button></div>
  <OriginalRule entry={entry}/>
  <p className="notice">This report goes to founder review and is visible to the team. It does not change or retire the rule automatically. If you need an immediate case decision, also use the normal escalation flow; this policy review has no timed CoS fallback.</p>
  <form className="fields" onSubmit={submit}>
   <label>What situation did you use this rule for?<Textarea required value={situation} onChange={e=>setSituation(e.target.value)}/></label>
   <label>What happened after you followed it?<Textarea required value={outcome} onChange={e=>setOutcome(e.target.value)} placeholder="Describe what went wrong or the result you did not expect."/></label>
   <label>Submitted by<NativeSelect required value={submitter} onChange={e=>setSubmitter(e.target.value)}><NativeSelectOption value="">Choose your name</NativeSelectOption>{people.map(p=><NativeSelectOption key={p.name}>{p.name}</NativeSelectOption>)}</NativeSelect></label>
   <label>Review priority<NativeSelect required value={priority} onChange={e=>setPriority(e.target.value)}><NativeSelectOption value="">Choose High, Medium or Low</NativeSelectOption>{['High','Medium','Low'].map(p=><NativeSelectOption key={p}>{p}</NativeSelectOption>)}</NativeSelect></label>
   {error&&<p className="error" role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy?'Saving…':error?'Retry':'Send to founder review'}</Button>
  </form>
 </section>;
}

export function RuleFeedbackCase({item,entries,role,onSave}:{item:Situation;entries:Entry[];role:Role;onSave:Save}){
 const feedback=item.feedback!;const current=currentRule(entries,feedback.source.id);
 const [editing,setEditing]=useState(false);
 return <article className="precedent-card">
  <div className="card-meta"><span>Rule didn’t work · {item.priority}</span><strong>{feedback.resolution?'Reviewed':'Pending founder review'}</strong></div>
  <h3>{item.situation}</h3><p className="muted">Reported by {item.submitter} · {new Date(item.createdAt).toLocaleString('en-IN')}</p>
  <OriginalRule entry={feedback.source}/>
  <div className="rule-box"><h4>WHAT HAPPENED</h4><p>{feedback.outcome}</p></div>
  {!feedback.resolution&&<p className="notice">Founder policy review · No automatic CoS handoff. The current rule remains unchanged until reviewed.</p>}
  {current&&current.id!==feedback.source.id&&<p className="notice">The rule has changed since this report. Review the current version below; the original is preserved above.</p>}
  {current&&<details className="linked-precedent"><summary>Current rule: {current.title}</summary><p>{current.decision}</p><p><strong>Reasoning:</strong> {current.reasoning}</p><p><strong>Exception:</strong> {current.exception||'None recorded'}</p>{current.changeReason&&<p><strong>Why it changed:</strong> {current.changeReason}</p>}</details>}
  {feedback.resolution&&<div className="rule-box"><h4>FOUNDER REVIEW — {feedback.resolution.choice==='keep'?'RULE KEPT':feedback.resolution.choice==='clarify'?'RULE CLARIFIED':'RULE REPLACED'}</h4><p>{feedback.resolution.reason}</p><p>Reviewed {new Date(feedback.resolution.at).toLocaleString('en-IN')}. The reported outcome remains recorded above.</p></div>}
  {role==='founder'&&!feedback.resolution&&current&&(editing?<ReviewRuleForm item={item} current={current} onSave={onSave} onClose={()=>setEditing(false)}/>:<Button onClick={()=>setEditing(true)}>Review this rule report</Button>)}
  {!current&&<p className="error">The current rule could not be loaded. Refresh before reviewing.</p>}
 </article>;
}

function ReviewRuleForm({item,current,onSave,onClose}:{item:Situation;current:Entry;onSave:Save;onClose:()=>void}){
 // Retain the reviewed version ID so a concurrent replacement is rejected by the server.
 const reviewed=useRef(current);const [choice,setChoice]=useState('');const [reason,setReason]=useState('');
 const [decision,setDecision]=useState(current.decision);const [reasoning,setReasoning]=useState(current.reasoning);const [exception,setException]=useState(current.exception);const [category,setCategory]=useState<string>(current.category);
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);const id=useRef(crypto.randomUUID());
 const stale=current.id!==reviewed.current.id;
 async function submit(e:FormEvent){e.preventDefault();if(lock.current||stale)return;lock.current=true;setBusy(true);setError('');try{await onSave({kind:'resolveFeedback',id:id.current,caseId:item.id,entryId:reviewed.current.id,choice,reason,decision,reasoning,exception,category});}catch(e){setError((e as Error).message);}finally{lock.current=false;setBusy(false);}}
 return <form className="fields edit-panel" onSubmit={submit}>
  <label>What should happen to the rule?<NativeSelect required value={choice} onChange={e=>setChoice(e.target.value)}><NativeSelectOption value="">Choose an outcome</NativeSelectOption><NativeSelectOption value="keep">Keep the rule unchanged</NativeSelectOption><NativeSelectOption value="clarify">Clarify the wording or exception</NativeSelectOption><NativeSelectOption value="replace">Replace the rule</NativeSelectOption></NativeSelect></label>
  <label>Explain your review to the team<Textarea required value={reason} onChange={e=>setReason(e.target.value)}/></label>
  {(choice==='clarify'||choice==='replace')&&<><p className="notice">This publishes a linked replacement. The previous wording stays attached as Superseded; it is not overwritten.</p><label>Decision<Textarea required value={decision} onChange={e=>setDecision(e.target.value)}/></label><label>Reasoning<Textarea required value={reasoning} onChange={e=>setReasoning(e.target.value)}/></label><label>Exception (optional)<Textarea value={exception} onChange={e=>setException(e.target.value)}/></label><label>Category<NativeSelect required value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><NativeSelectOption key={c}>{c}</NativeSelectOption>)}</NativeSelect></label></>}
  {stale&&<p className="error">This rule changed while you were reviewing. Close this form and reopen it to review the current rule.</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="filters"><Button type="submit" disabled={busy||stale}>{busy?'Saving…':error?'Retry':'Save founder review'}</Button><Button type="button" variant="ghost" disabled={busy} onClick={()=>{if(window.confirm('Discard unsaved review changes?'))onClose();}}>Close review</Button></div>
 </form>;
}
