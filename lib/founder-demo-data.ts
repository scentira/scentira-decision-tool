import type { Entry, Situation } from './domain';
import { demoEntries } from './public-demo.ts';

// Entirely invented fixture data. Never sourced from staff records or the database.
export const founderDemoEntries: Entry[] = demoEntries.map(entry => ({
  ...entry, seed: false, createdAt: Date.UTC(2026, 7, 28, 9),
}));
export const founderDemoRequests: Situation[] = [
  { id: 'demo-request-lantern', submitter: 'Mira Lantern', createdAt: Date.UTC(2026, 7, 29, 10), routedAt: Date.UTC(2026, 7, 29, 11),
    situation: 'A customer asks after 12pm to change the address on a packed birthday order and says even a one-day delay will miss the occasion.',
    priority: 'Medium', founderOnly: false, actionIds: [] },
  { id: 'demo-request-meadow', submitter: 'Arin Meadow', createdAt: Date.UTC(2026, 7, 30, 11),
    situation: 'A customer reports a damaged bottle without an unboxing video and has now posted a public complaint while the packing evidence is still being checked.',
    priority: 'High', founderOnly: true, actionIds: [] },
  { id: 'demo-request-cloud', submitter: 'Tara Cloudwell', createdAt: Date.UTC(2026, 7, 31, 12),
    situation: 'A creator asks for ₹3,800 for a reel and story but wants the collaboration treated as a one-off rather than a long-term partnership.',
    priority: 'Low', founderOnly: false, actionIds: [],
    answer: { role: 'cos', at: Date.UTC(2026, 7, 31, 13), decision: 'Offer ₹3,800 only if the creator agrees to discuss a longer-term partnership.',
      reasoning: 'The amount is within the allowed negotiation ceiling, but the one-off structure conflicts with the preferred partnership model.', exception: 'Decline if the final commercial rises above ₹4,000.' } },
];
export function founderDemoSnapshot(role:'founder'|'cos'='founder') {
  return { entries: structuredClone(founderDemoEntries), cases: structuredClone(founderDemoRequests), role, people: [] };
}
