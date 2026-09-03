'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {fragranceConditions} from '@/lib/fragrance-conditions';

export function ConditionSelector({onApply}:{onApply:(row:typeof fragranceConditions[number])=>void|Promise<void>}){
 const [selected,setSelected]=useState('');const [applied,setApplied]=useState(false);const [busy,setBusy]=useState(false);
 const row=fragranceConditions.find(item=>item.id===selected);
 return <><div className="condition-list" role="radiogroup" aria-label="Choose the condition that matches">{fragranceConditions.map(item=><button type="button" role="radio" aria-checked={selected===item.id} className={`condition-row condition-choice ${selected===item.id?'selected':''}`} key={item.id} onClick={()=>{setSelected(item.id);setApplied(false);}}><span>{item.situation}</span><strong>{item.decision}</strong></button>)}</div>
 <Button disabled={!row||busy||applied} onClick={async()=>{if(!row)return;setBusy(true);await onApply(row);setApplied(true);setBusy(false);}}>{applied?'Decision applied':busy?'Saving…':'Apply selected decision'}</Button>{applied&&row&&<p className="notice" role="status">Selected: {row.situation} — {row.decision}</p>}</>;
}
