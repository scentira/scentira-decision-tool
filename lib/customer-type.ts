export type CustomerType='direct'|'reseller';
// Records created before customer type existed remain direct-customer rules.
export function customerTypeMatches(record:unknown,type:CustomerType){
  const tagged=record&&typeof record==='object'&&'customerType' in record?(record as {customerType?:CustomerType}).customerType:undefined;
  return (tagged??'direct')===type;
}
