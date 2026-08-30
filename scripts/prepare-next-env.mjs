// Copy only this app's private settings into Next.js's ignored local env file.
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
const old=parseEnv(await readFile('.dev.vars','utf8'));
let local=await readFile('.env.local','utf8');
for(const key of ['FOUNDER_PIN','COS_PIN','SESSION_SECRET','JOB_SECRET','CONVEX_URL','PRECEDENT_BRIDGE_SECRET']){
 if(!old[key])throw Error('Missing required local server setting: '+key);
 const line=key+'='+JSON.stringify(old[key]);const re=new RegExp('^'+key+'=.*$','m');
 local=re.test(local)?local.replace(re,line):local.trimEnd()+'\n'+line+'\n';
}
await writeFile('.env.local',local);
console.log('Private local settings prepared for Next.js. No values printed.');
