'use client';
import posthog from 'posthog-js';

export type AnalyticsEvent='case_submitted'|'decision_approved'|'precedent_matched';
export type FeedbackValue='yes'|'no'|'not_sure';

// This is the only analytics capture surface. Never add case or policy data here.
export function captureEvent(event:AnalyticsEvent){
  if(posthog.__loaded)posthog.capture(event);
}
export function captureFeedback(value:FeedbackValue){
  if(posthog.__loaded)posthog.capture('feedback_given',{feedback:value});
}
