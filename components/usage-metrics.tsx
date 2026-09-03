'use client';
import {useEffect,useState} from 'react';
import type {UsageMetrics} from '@/lib/usage-metrics';

export function UsageMetricsPanel(){const [data,setData]=useState<UsageMetrics|null>(null);const [error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch('/api/metrics',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error();return response.json();}).then(setData).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();},[]);
 const total=data?data.casesSubmitted+data.decisionsApproved+data.precedentsMatched+data.feedback.yes+data.feedback.no+data.feedback.not_sure:0;
 if(!data||error||total===0)return null;
 return <section className="usage-metrics" aria-labelledby="usage-title"><div><p className="eyebrow">REAL USAGE</p><h2 id="usage-title">Usage from the live decision record</h2><p className="muted">Fictional demo activity is excluded.</p></div>
  <div className="usage-grid"><div><strong>{data.casesSubmitted}</strong><span>Cases submitted</span></div><div><strong>{data.decisionsApproved}</strong><span>Decisions approved</span></div><div><strong>{data.precedentsMatched}</strong><span>Precedents matched</span></div><div><strong>{data.feedback.yes} / {data.feedback.no} / {data.feedback.not_sure}</strong><span>Feedback: Yes / No / Not sure</span></div></div>
 </section>;
}
