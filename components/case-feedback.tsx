'use client';
import {useRef} from 'react';
import {DecisionFeedback} from '@/components/decision-feedback';
import type {Situation} from '@/lib/domain';

export function CaseFeedback({item,onSave,readOnly=false}:{item:Situation;readOnly?:boolean;onSave:(action:Record<string,unknown>)=>Promise<void>}){
 const id=useRef(crypto.randomUUID());
 if(item.callFeedback)return <section className="case-feedback" aria-label="Decision feedback"><strong>Feedback recorded</strong><p>{item.callFeedback.value==='not_sure'?'Not sure':item.callFeedback.value==='yes'?'Worked':"Didn't work"}</p></section>;
 return <DecisionFeedback onChoose={readOnly?undefined:value=>onSave({kind:'caseFeedback',id:id.current,caseId:item.id,value,note:''})}/>;
}
