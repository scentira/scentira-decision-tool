'use client';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export type QueueItem = {id:string;title:string;summary:string;pending:boolean;label:string;action:string};
export function DecisionQueue({items,renderDetail,onSelect,roleDescription}:{items:QueueItem[];renderDetail:(id:string)=>ReactNode;onSelect:(id:string|null)=>void;roleDescription?:string}) {
 const [filter,setFilter]=useState<'Pending'|'Answered'>('Pending');
 const [selected,setSelected]=useState<string|null>(null);
 const detail=useRef<HTMLElement>(null);
 const list=useRef<HTMLDivElement>(null);
 const visible=items.filter(item=>item.pending===(filter==='Pending'));
 const current=items.find(item=>item.id===selected);
 function select(id:string){setSelected(id);onSelect(id);requestAnimationFrame(()=>{detail.current?.focus();detail.current?.scrollIntoView({block:'start',behavior:'instant'});});}
 function back(){setSelected(null);onSelect(null);requestAnimationFrame(()=>list.current?.focus());}
 return <section aria-label="Decision queue"><h1>Decision queue</h1>{roleDescription&&<p className="role-mode-description">{roleDescription}</p>}<p className="intro">One queue for submitted situations and decisions. Pending includes CoS answers awaiting founder review.</p>
  <div className="queue-filters" role="group" aria-label="Queue status">{(['Pending','Answered'] as const).map(value=><Button key={value} aria-pressed={filter===value} variant={filter===value?'secondary':'outline'} onClick={()=>{setFilter(value);back();}}>{value} ({items.filter(i=>i.pending===(value==='Pending')).length})</Button>)}</div>
  <div className={`queue-layout ${current?'has-selection':''}`}>
   <div className="queue-list" aria-label={`${filter} decisions`} ref={list} tabIndex={-1}>{visible.length?visible.map(item=><article key={item.id} className={`queue-card ${selected===item.id?'is-selected':''}`}><span className="status-pill">{item.label}</span><h3>{item.title}</h3><p className="muted">{item.summary}</p><Button variant={selected===item.id?'default':'outline'} aria-pressed={selected===item.id} onClick={()=>select(item.id)}>{item.action}</Button></article>):<p className="empty">No {filter.toLowerCase()} decisions.</p>}</div>
   <section className="queue-detail" aria-label="Selected decision review" ref={detail} tabIndex={-1}>
    {current?<><Button className="back-to-queue" variant="outline" onClick={back}>Back to queue</Button>{renderDetail(current.id)}</>:<div className="empty"><h2>Select a decision</h2><p>Its details and review form will appear here.</p></div>}
   </section>
  </div>
 </section>;
}
