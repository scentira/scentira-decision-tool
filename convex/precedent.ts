import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';

// Only the app server holds this key. Browser callers cannot bypass its PIN checks.
function authorized(secret:string){const expected=process.env.PRECEDENT_BRIDGE_SECRET;if(!expected||expected.length<32||secret.length!==expected.length)return false;let difference=0;for(let i=0;i<expected.length;i++)difference|=secret.charCodeAt(i)^expected.charCodeAt(i);return difference===0;}
const denied={error:{message:'Not authorized.',status:401}};
function validState(data:string){try{const state=JSON.parse(data);return state&&Array.isArray(state.entries)&&Array.isArray(state.cases)&&Array.isArray(state.notices);}catch{return false;}}
export const read=query({args:{secret:v.string()},handler:async(ctx,args)=>{
 if(!authorized(args.secret))return denied;
 const row=await ctx.db.query('app_state').withIndex('by_key',q=>q.eq('key','main')).unique();
 if(!row)return {error:{message:'Saved decisions have not been imported yet.',status:503}};
 return {revision:row.revision,data:row.data};
}});
export const compareAndSwap=mutation({args:{secret:v.string(),revision:v.number(),data:v.string()},handler:async(ctx,args)=>{
 if(!authorized(args.secret))return denied;
 if(!validState(args.data))return {error:{message:'Invalid saved state.',status:400}};
 const row=await ctx.db.query('app_state').withIndex('by_key',q=>q.eq('key','main')).unique();
 if(!row)return {error:{message:'Saved decisions have not been imported yet.',status:503}};
 if(row.revision!==args.revision)return {saved:false};
 await ctx.db.patch(row._id,{revision:row.revision+1,data:args.data});return {saved:true,revision:row.revision+1};
}});
export const loginAttempt=mutation({args:{secret:v.string(),key:v.string()},handler:async(ctx,args)=>{
 if(!authorized(args.secret))return denied;
 const now=Date.now();const previous=await ctx.db.query('login_attempts').withIndex('by_key',q=>q.eq('key',args.key)).unique();
 const active=previous&&previous.until>=now;const attempts=active?previous.attempts+1:1;const until=active?previous.until:now+600000;
 if(previous)await ctx.db.patch(previous._id,{attempts,until});else await ctx.db.insert('login_attempts',{key:args.key,attempts,until});
 return {attempts};
}});
// CLI/admin-only, refuses to replace data. Safe to repeat with the identical backup.
export const importInitial=internalMutation({args:{revision:v.number(),data:v.string()},handler:async(ctx,args)=>{
 if(!validState(args.data)||!Number.isSafeInteger(args.revision)||args.revision<0)throw Error('Invalid backup.');
 const existing=await ctx.db.query('app_state').withIndex('by_key',q=>q.eq('key','main')).unique();
 if(existing){if(existing.data===args.data&&existing.revision===args.revision)return {imported:false,alreadyPresent:true};throw Error('Destination contains different data. Import stopped.');}
 await ctx.db.insert('app_state',{key:'main',revision:args.revision,data:args.data});const state=JSON.parse(args.data);
 return {imported:true,entries:state.entries.length,cases:state.cases.length,notices:state.notices.length};
}});
