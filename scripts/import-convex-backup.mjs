import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const path=process.argv[2];if(!path)throw Error('Provide the reviewed backup path.');
const backup=JSON.parse(await readFile(path,'utf8'));
const result=spawnSync(process.execPath,['node_modules/convex/bin/main.js','run','precedent:importInitial',JSON.stringify({revision:backup.revision,data:backup.data}),'--deployment','polite-sardine-31'],{encoding:'utf8',maxBuffer:1024*1024});
if(result.status!==0){console.error('Import failed. Original backup and database are unchanged.');process.exit(1);}
console.log(result.stdout.trim());
