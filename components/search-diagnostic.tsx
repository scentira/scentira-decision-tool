import type {MeaningDiagnostic} from '@/lib/meaning-match-client';

export type SearchDiagnosticData=MeaningDiagnostic&{query:string;count:number;ids:string[]};
export function formatSearchDiagnostic(data:SearchDiagnosticData){return [
    `query: ${data.query}`,
    `precedent_count_before_matching: ${data.count}`,
    `precedent_ids: ${JSON.stringify(data.ids)}`,
    `ai_matching_attempted: ${data.aiAttempted}`,
    `ai_matching_succeeded: ${data.aiSucceeded}`,
    `matching_path: ${data.path}`,
    `raw_model_reply: ${data.rawModelReply===null?'null':data.rawModelReply}`,
    `model_loaded_before_search: ${data.modelLoadedBeforeSearch}`,
    `model_fetch_source: ${data.modelFetchSource}`,
    `model_weights_source: ${data.modelWeightsSource}`,
    `model_error_name: ${data.modelErrorName===null?'null':data.modelErrorName}`,
    `model_error_message: ${data.modelErrorMessage===null?'null':data.modelErrorMessage}`,
    `model_error_stack: ${data.modelErrorStack===null?'null':data.modelErrorStack}`,
  ].join('\n');}
export function printSearchDiagnostic(data:SearchDiagnosticData){
  const output=formatSearchDiagnostic(data);
  if(process.env.NODE_ENV==='development')console.info(`[Scentira search diagnosis]\n${output}`);return output;
}
export function SearchDiagnostic({data}:{data:SearchDiagnosticData|null}){
  if(process.env.NODE_ENV!=='development'||!data)return null;
  return <details className="rule-details search-diagnostic" open><summary>Temporary search diagnosis</summary><pre>{formatSearchDiagnostic(data)}</pre><p className="muted">Raw model reply is null because this build uses a local embedding model, which returns number vectors rather than a text reply.</p></details>;
}
