export const mondayLeaveDecision='Approve Monday leave only when every checklist item is confirmed.';
export const mondayLeaveConditions=[
  'Days covered: at least one additional working or non-working day was covered.',
  'Lookback window: the covered day was within the previous 30 days.',
  'Verification: the founder or CoS verifies the attendance or duty record.',
  'Emergency exception: if these checks are not met but it is an emergency, ask the founder.',
] as const;

export function isMondayLeavePrecedent(entry:{id:string;title:string}){return entry.id==='11'||entry.id==='fictional-policy-11'||entry.title.trim().toLowerCase()==='monday leave';}
