import {isNormalRecord} from './public-demo.ts';
import type {State} from './domain.ts';

export type UsageMetrics={casesSubmitted:number;decisionsApproved:number;precedentsMatched:number;feedback:{yes:number;no:number;not_sure:number}};
export function realUsageCounts(state:State):UsageMetrics{
 const cases=state.cases.filter(isNormalRecord);
 return {casesSubmitted:cases.length,decisionsApproved:cases.filter(item=>item.precedentId).length,precedentsMatched:state.usage?.precedentMatches||0,feedback:{
  yes:cases.filter(item=>item.callFeedback?.value==='yes').length,
  no:cases.filter(item=>item.callFeedback?.value==='no').length,
  not_sure:cases.filter(item=>item.callFeedback?.value==='not_sure').length,
 }};
}
