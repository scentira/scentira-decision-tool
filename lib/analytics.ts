'use client';
import posthog from 'posthog-js';

export type Surface='demo'|'real';
export type AnalyticsEvent='case_submitted'|'decision_approved'|'precedent_search'|'precedent_matched'|'condition_row_selected'|'decision_applied'|'precedent_added'|'escalation_submitted';
export type FeedbackValue='yes'|'no'|'not_sure';

// This is the only analytics capture surface. Never add case or policy data here.
function capture(event:string,properties:Record<string,string|number>){
  if(process.env.NODE_ENV==='development')console.info('[Scentira analytics]',JSON.stringify({event,...properties}));
  if(posthog.__loaded)posthog.capture(event,properties);
}
export function captureEvent(event:AnalyticsEvent,surface:Surface){capture(event,{surface});}
export function capturePageview(surface:Surface){capture('$pageview',{surface});}
export function captureFeedback(value:FeedbackValue,surface:Surface){
  capture('feedback_given',{feedback:value,surface});
}
export function capturePrecedentRejected(surface:Surface,precedentId:string,matchScore:number){
  capture('precedent_rejected_by_user',{surface,precedent_id:precedentId,match_score:matchScore});
}
