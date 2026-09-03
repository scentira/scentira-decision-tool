import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
const forbidden=['Lovish','Gazal','Neha','Hemanshi','@scentira.in','MIGRATION TEST ONLY','DEMO TEST ONLY','discount-policy-2026-08-31','Customers with 1–10 previous orders','Customers with 1–9 previous orders','packing team\'s records/images'];
for(const key of ['FOUNDER_PIN','COS_PIN','SESSION_SECRET','PRECEDENT_BRIDGE_SECRET','JOB_SECRET'])if(process.env[key])forbidden.push(process.env[key]);
let files=0;const failures=[];
async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())await scan(file);else{files++;const content=await readFile(file,'utf8');if(forbidden.some(value=>content.includes(value)))failures.push(file);}}}
await scan('.next/static');
if(failures.length){console.error(JSON.stringify({passed:false,files,filesWithPrivateContent:failures}));process.exitCode=1;}else console.log(JSON.stringify({passed:true,filesScanned:files,privateNamesPoliciesOrSecretsFound:false}));
