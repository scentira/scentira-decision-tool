'use client';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { damageQuestions, damageGuidance, validDamageAnswers } from '@/lib/damage-guide';

export function DamageFollowUp({answers,onChange}:{answers:string[];onChange:(answers:string[])=>void}){
 const valid=validDamageAnswers(answers);const step=valid.length;const question=damageQuestions[step];const result=damageGuidance(valid);const heading=useRef<HTMLHeadingElement>(null);const lastStep=useRef(step);
 useEffect(()=>{if(lastStep.current!==step)heading.current?.focus();lastStep.current=step;},[step]);
 return <section className="discount-follow-up" aria-label="Damaged product follow-up">
  <h4>CHECK THE EVIDENCE · {question?`STEP ${step+1} OF ${damageQuestions.length}`:'CHECKS RECORDED'}</h4>
  <p className="muted">For damage complaints without an unboxing video. Review photos and records outside this app; nothing is uploaded here.</p>
  <h3 ref={heading} tabIndex={-1}>{question?.question||result?.title}</h3>
  {question?<div className="discount-answer">{question.options.map(option=><Button key={`${step}-${option}`} type="button" variant="outline" className="h-auto min-h-10 whitespace-normal py-2" onClick={()=>onChange([...valid,option])}>{option}</Button>)}</div>:<div className="rule-box"><p>{result?.message}</p></div>}
  {step>0&&<><details className="rule-details"><summary>Answers so far</summary>{valid.map((answer,i)=><p key={i}><strong>{damageQuestions[i].question}</strong><br/>{answer}</p>)}</details><Button type="button" variant="ghost" onClick={()=>onChange(valid.slice(0,-1))}>Back — change previous answer</Button></>}
  <p className="muted">Need a decision? Use “Ask founder” below at any point. Your answers carry over automatically.</p>
 </section>;
}
