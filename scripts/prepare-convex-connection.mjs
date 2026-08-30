// Creates private app-server settings without printing secrets or enabling Convex yet.
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';
const original=await readFile('.dev.vars','utf8');
const existing=parseEnv(original);
const local=parseEnv(await readFile('.env.local','utf8'));
const url=local.VITE_CONVEX_URL;
if(url!=='https://polite-sardine-31.convex.cloud')throw Error('Deployment does not match the approved development database.');
const secret=existing.PRECEDENT_BRIDGE_SECRET||randomBytes(32).toString('hex');
let updated=original;
for(const [key,value] of Object.entries({CONVEX_URL:url,PRECEDENT_BRIDGE_SECRET:secret})){const line=`${key}=${value}`;const re=new RegExp(`^${key}=.*$`,'m');updated=re.test(updated)?updated.replace(re,line):`${updated.trimEnd()}\n${line}\n`;}
await writeFile('.dev.vars',updated);
await writeFile('.env.convex-bridge',`PRECEDENT_BRIDGE_SECRET=${secret}\n`);
console.log('Private server connection prepared; local D1 remains active.');
