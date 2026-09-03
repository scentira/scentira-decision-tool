import { sessionRole } from './session-role';
import { AppError, type Role } from './domain';
import { recordLoginAttempt, settings } from './store';
const enc=new TextEncoder();
async function sign(text:string){if(!settings.SESSION_SECRET)throw new AppError('Access PINs are not configured yet.',503);const key=await crypto.subtle.importKey('raw',enc.encode(settings.SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);return {key,signature:await crypto.subtle.sign('HMAC',key,enc.encode(text))};}
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function getRole(req:Request):Promise<Role>{return sessionRole(req.headers.get('cookie'),settings.SESSION_SECRET);}
export function checkOrigin(req:Request){const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw new AppError('Request origin is not allowed.',403);}
export async function login(req:Request,role:string,pin:string){if(!['founder','cos'].includes(role))throw new AppError('Choose Founder or CoS.');const expected=role==='founder'?settings.FOUNDER_PIN:settings.COS_PIN;if(!expected||!settings.SESSION_SECRET)throw new AppError('Access PINs are not configured yet.',503);const key=`pin:${role}`;const now=Date.now();const attempts=await recordLoginAttempt(key,now);if(attempts>5)throw new AppError('Too many attempts. Wait ten minutes and try again.',429);const a=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(pin)));const b=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(expected)));let different=0;for(let i=0;i<a.length;i++)different|=a[i]^b[i];if(different)throw new AppError('That PIN is incorrect.',401);const payload=`${role}.${now+8*3600000}`;return `${payload}.${hex((await sign(payload)).signature)}`;}
export const cookieOptions=(req:Request)=>`Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${new URL(req.url).protocol==='https:'?'; Secure':''}`;
