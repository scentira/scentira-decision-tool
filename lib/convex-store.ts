import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { AppError, type Role, type State } from './domain';
import { updateDiscountPolicy } from './discount-policy';

import { applyAction } from './domain-actions';

type Settings=Record<string,string|undefined>;
function connection(settings:Settings){const url=settings.CONVEX_URL;const secret=settings.PRECEDENT_BRIDGE_SECRET;if(!url||!secret)throw new AppError('Convex connection is not configured.',503);return {client:new ConvexHttpClient(url,{logger:false}),secret};}
function checked<T>(result:T&{error?:{message:string;status:number}}):T{if(result.error)throw new AppError(result.error.message,result.error.status);return result;}
export async function convexRead(settings:Settings){const {client,secret}=connection(settings);const result=checked(await client.query(makeFunctionReference<'query'>('precedent:read'),{secret})) as {revision:number;data:string};return {revision:result.revision,state:updateDiscountPolicy(JSON.parse(result.data) as State)};}
export async function convexMutate(settings:Settings,action:Record<string,unknown>,role:Role){const {client,secret}=connection(settings);for(let attempt=0;attempt<8;attempt++){const {revision,state}=await convexRead(settings);const next=applyAction(updateDiscountPolicy(state),action,role);const result=checked(await client.mutation(makeFunctionReference<'mutation'>('precedent:compareAndSwap'),{secret,revision,data:JSON.stringify(next)})) as {saved:boolean};if(result.saved)return next;}throw new AppError('Another update is in progress. Please retry.',409);}
export async function convexLoginAttempt(settings:Settings,key:string){const {client,secret}=connection(settings);const result=checked(await client.mutation(makeFunctionReference<'mutation'>('precedent:loginAttempt'),{secret,key})) as {attempts:number};return result.attempts;}
