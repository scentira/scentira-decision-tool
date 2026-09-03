import {readState} from '@/lib/store';
import {realUsageCounts} from '@/lib/usage-metrics';

export const dynamic='force-dynamic';
export async function GET(){try{const {state}=await readState();return Response.json(realUsageCounts(state),{headers:{'Cache-Control':'public, max-age=30, stale-while-revalidate=60'}});}catch(error){console.error('Could not read public usage totals.',error);return Response.json({error:'Usage counts are temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
