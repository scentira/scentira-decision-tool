'use client';
import posthog from 'posthog-js';

export type Surface='demo'|'real';
export type AnalyticsEvent='case_submitted'|'decision_approved'|'precedent_search'|'precedent_matched'|'condition_row_selected'|'decision_applied'|'precedent_added';
export type FeedbackValue='yes'|'no'|'not_sure';

// This is the only analytics capture surface. Never add case or policy data here.
function capture(event:string,properties:Record<string,string>){
  if(process.env.NODE_ENV==='development')console.info('[Scentira analytics]',JSON.stringify({event,...properties}));
  if(posthog.__loaded)posthog.capture(event,properties);
}
export function captureEvent(event:AnalyticsEvent,surface:Surface){capture(event,{surface});}
export function capturePageview(surface:Surface){capture('$pageview',{surface});}
export function captureFeedback(value:FeedbackValue,surface:Surface){
  capture('feedback_given',{feedback:value,surface});
}
