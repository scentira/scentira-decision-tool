import {spawn} from 'node:child_process';

const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3107'],{stdio:'inherit'});
let serverExit;
const exited=new Promise(resolve=>{serverExit=resolve;server.once('exit',resolve);});

async function waitForServer(){
 const deadline=Date.now()+30_000;
 while(Date.now()<deadline){
  try{const response=await fetch('http://127.0.0.1:3107');if(response.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error('The local test server did not start within 30 seconds.');
}

let code=1;
try{
 await Promise.race([waitForServer(),exited.then(()=>{throw new Error('The local test server stopped before the tests started.');})]);
 code=await new Promise(resolve=>{
  const tests=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test'],{stdio:'inherit'});
  tests.once('exit',result=>resolve(result??1));
 });
}finally{
 if(server.exitCode===null){server.kill('SIGTERM');await Promise.race([exited,new Promise(resolve=>setTimeout(resolve,3000))]);}
}
process.exitCode=code;
