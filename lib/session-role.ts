import type { Role } from './domain';

export async function sessionRole(cookie:string|null,secret:string|undefined,now=Date.now()):Promise<Role>{
 const token=cookie?.match(/(?:^|;\s*)precedent_session=([^;]+)/)?.[1];
 if(!token||!secret)return 'team';
 const parts=token.split('.');if(parts.length!==3)return 'team';
 const [role,expires,signature]=parts;const expiry=Number(expires);
 if(!['founder','cos'].includes(role)||!/^\d+$/.test(expires)||!Number.isSafeInteger(expiry)||expiry<=now||! /^[a-f0-9]{64}$/.test(signature))return 'team';
 try{const enc=new TextEncoder();const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);const bytes=Uint8Array.from(signature.match(/../g)!,v=>parseInt(v,16));return await crypto.subtle.verify('HMAC',key,bytes,enc.encode(`${role}.${expires}`))?role as Role:'team';}catch{return 'team';}
}
