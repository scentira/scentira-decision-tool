// Checks the files Git would publish without printing any private values.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {parseEnv} from 'node:util';
const directory=process.cwd().replaceAll('\\','/');
const files=execFileSync('C:/Program Files/Git/cmd/git.exe',['-c',`safe.directory=${directory}`,'ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const keys=['FOUNDER_PIN','COS_PIN','SESSION_SECRET','JOB_SECRET','PRECEDENT_BRIDGE_SECRET'];
const settings=parseEnv(await readFile('.env.local','utf8'));
const problems=[];
for(const file of new Set(files)){
 if((/(^|\/)\.env/.test(file)&&file!=='.env.example')||/(^|\/)\.dev\.vars|\.sqlite(?:-|$)|\.zip$/.test(file))problems.push(`${file}: private file`);
 const body=await readFile(file);for(const key of keys){const value=settings[key];if(!value)continue;const text=body.toString('utf8');const present=value.length>=8?text.includes(value):text.includes(JSON.stringify(value))||text.includes("'"+value+"'");if(present)problems.push(`${file}: contains ${key}`);}
}
if(problems.length){console.error(problems.join('\n'));process.exit(1);}
console.log(`Checked ${new Set(files).size} source files: no configured secrets or private data files found.`);
