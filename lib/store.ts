import type { Role } from './domain';
import { convexRead, convexMutate, convexLoginAttempt } from './convex-store';

// Server-only runtime settings. Never import this module from client components.
export const settings=process.env;
export async function readState(){return convexRead(settings);}
export async function mutate(action:Record<string,unknown>,role:Role){return convexMutate(settings,action,role);}
export async function recordLoginAttempt(key:string,_now:number){return convexLoginAttempt(settings,key);}
