import { findConceptMatch, hasConceptOverlap, type MatchCandidate, type MeaningMatch } from '@/lib/semantic-match';

const MODEL='Xenova/all-MiniLM-L6-v2';
const MODEL_SOURCE=`https://huggingface.co/${MODEL}`;
const RUNTIME_SOURCE='/ort/';
type Extractor=(texts:string[],options:{pooling:'mean';normalize:true})=>Promise<{tolist:()=>number[][]}>;
export type MeaningDiagnostic={aiAttempted:boolean;aiSucceeded:boolean;path:'word-list path'|'meaning-model path'|'no match'|'model error';rawModelReply:string|null;modelLoadedBeforeSearch:boolean;modelFetchSource:string;modelWeightsSource:string;modelErrorName:string|null;modelErrorMessage:string|null;modelErrorStack:string|null};
let extractorPromise:Promise<Extractor>|null=null;
let extractorLoaded=false;
let candidateCache:{key:string;titles:number[][];summaries:number[][]}|null=null;
export function meaningRuntimeStatus(){return{modelLoadedBeforeSearch:extractorLoaded,modelFetchSource:typeof location==='undefined'?RUNTIME_SOURCE:`${location.origin}${RUNTIME_SOURCE}`,modelWeightsSource:MODEL_SOURCE,modelErrorName:null,modelErrorMessage:null,modelErrorStack:null};}

async function extractor():Promise<Extractor>{
  if(!extractorPromise)extractorPromise=import('@huggingface/transformers').then(async({env,pipeline})=>{
    env.allowLocalModels=false;
    env.backends.onnx.wasm!.wasmPaths=RUNTIME_SOURCE;
    const loaded=await pipeline('feature-extraction',MODEL,{dtype:'q8'}) as unknown as Extractor;extractorLoaded=true;return loaded;
  });
  return extractorPromise;
}

function dot(a:number[],b:number[]){let total=0;for(let i=0;i<a.length;i++)total+=a[i]*b[i];return total;}

export async function findMeaningMatch(query: string, precedents: MatchCandidate[],onDiagnostic?:(diagnostic:MeaningDiagnostic)=>void): Promise<MeaningMatch | null> {
  if(!query.trim()||!precedents.length)return null;
  const runtime=meaningRuntimeStatus();
  const knownMatch=findConceptMatch(query,precedents);if(knownMatch){onDiagnostic?.({aiAttempted:false,aiSucceeded:false,path:'word-list path',rawModelReply:null,...runtime});return knownMatch;}
  try{
    const encode=await extractor();
    const count=precedents.length;
    const key=JSON.stringify(precedents);let queryVector:number[];
    if(candidateCache?.key===key)queryVector=(await encode([query],{pooling:'mean',normalize:true})).tolist()[0];
    else{const vectors=(await encode([query,...precedents.map(item=>item.title),...precedents.map(item=>item.summary)],{pooling:'mean',normalize:true})).tolist();queryVector=vectors[0];candidateCache={key,titles:vectors.slice(1,count+1),summaries:vectors.slice(count+1)};}
    const ranked=precedents.map((item,index)=>{const title=dot(queryVector,candidateCache!.titles[index]);const summary=dot(queryVector,candidateCache!.summaries[index]);return{item,title,summary,score:title*.7+summary*.3};}).sort((a,b)=>b.score-a.score);
    const best=ranked[0];const margin=best&&ranked[1]?best.score-ranked[1].score:best?.score??0;
    const guarded=best&&best.score>=0.18&&hasConceptOverlap(query,`${best.item.title} ${best.item.summary}`);
    if(best&&margin>=0.05&&(best.score>=0.45||guarded)){const result={id:best.item.id,reason:`Closest meaning match (${Math.round(best.score*100)}%).`,score:best.score};onDiagnostic?.({aiAttempted:true,aiSucceeded:true,path:'meaning-model path',rawModelReply:null,...runtime});return result;}
    onDiagnostic?.({aiAttempted:true,aiSucceeded:false,path:'no match',rawModelReply:null,...runtime});
    return null;
  }catch(error){
    // If the local model cannot load, fail closed instead of showing a wrong precedent.
    const actual=error instanceof Error?error:new Error(String(error));
    onDiagnostic?.({aiAttempted:true,aiSucceeded:false,path:'model error',rawModelReply:null,...runtime,modelErrorName:actual.name,modelErrorMessage:actual.message,modelErrorStack:actual.stack||null});
    return null;
  }
}
