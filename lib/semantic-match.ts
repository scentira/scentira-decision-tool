export type MatchCandidate = { id: string; title: string; summary: string };
export type MeaningMatch = { id: string; reason: string; score?: number };

const channelDiscountPattern=/\b(?:reseller|wholesale|distributor|retailer|channel\s+partner|bulk\s+discount|volume\s+discount|resale\s+margin|volume\s+commitment)\b/i;
const channelScopePattern=/\b(?:reseller|wholesale|distributor|retailer|channel\s+partner|bulk|volume|resale)\b/i;
const discountPattern=/\b(?:discount|price\s+reduction|lower\s+price)\b/i;

export function isCommercialScopeCompatible(query:string,candidate:string){
  return !channelDiscountPattern.test(query)||(channelScopePattern.test(candidate)&&(!discountPattern.test(query)||discountPattern.test(candidate)));
}

const conceptPatterns: Array<[string, RegExp]> = [
  ['swapped order', /\b(?:swapp?ed?|cross(?:ed)?|mixed?\s+(?:up|between)|labels?\s+(?:got\s+)?mixed|wrong\s+(?:customer|buyer)|meant\s+for\s+another|each\s+other'?s)\b/i],
  ['final delivery station', /\b(?:final|last[- ]?mile|destination|last\s+local)\s+(?:delivery\s+)?(?:station|hub|depot|branch|cent(?:er|re))\b/i],
  ['return route', /\b(?:return(?:ed)?\s+to\s+origin|origin|recall|send\s+it\s+back|reverse\s+it|immediate\s+return)\b/i],
  ['deliver then collect', /\b(?:deliver(?:ed|y)?[^.?!]{0,45}(?:collect|pickup|pick\s+it\s+up|retrieve|recovery)|hand\s+it\s+over[^.?!]{0,35}(?:pick|collect|retrieve))\b/i],
  ['damaged product', /\b(?:damag(?:e|ed)|broken|cracked|leak(?:ing)?)\b/i],
  ['missing unboxing proof', /\b(?:no|without|missing|lack(?:s|ing)?)\s+(?:an?\s+)?(?:unboxing|opening)\s+(?:video|recording|proof|clip)|\bunboxing\s+(?:video|recording|proof|clip)\s+(?:is\s+)?(?:missing|unavailable)\b/i],
  ['additional discount', /\b(?:additional|extra|further|more)\s+(?:customer\s+)?discount|\bdiscount\s+(?:beyond|on top of)\b/i],
  ['customer history', /\b(?:repeat|regular|returning|loyal|long[- ]?term)\s+(?:buyer|customer)|\b(?:order|purchase)\s+history|\b10\+?\s+(?:previous\s+)?orders?\b/i],
  ['warehouse visit', /\b(?:warehouse|store|shop|offline|in person|walk[- ]?in)\b/i],
  ['discount', /\b(?:discount|price\s+reduction|lower\s+price|promo(?:tion)?\s+code)\b/i],
  ['opened product', /\b(?:opened|used|sprayed|tested|seal\s+(?:is\s+)?broken)\b/i],
  ['unsuitable fragrance', /\b(?:fragrance|perfume|scent|smell)[^.?!]{0,35}(?:doesn'?t\s+suit|not\s+suit|dislike|doesn'?t\s+like|not\s+for\s+them)|(?:dislike|doesn'?t\s+like)[^.?!]{0,20}(?:fragrance|perfume|scent|smell)\b/i],
  ['reverse shipment', /\b(?:reverse\s+(?:shipment|parcel|pickup)|return\s+(?:shipment|parcel|package)|pickup\s+agent)\b/i],
  ['wrong return contents', /\b(?:stones?|rocks?|empty|different\s+(?:item|product)|wrong\s+(?:item|product))\b/i],
  ['logistics unresponsive', /\b(?:logistics|courier|delivery\s+(?:team|partner))[^.?!]{0,45}(?:no\s+(?:reply|response)|not\s+respond|unresponsive|silent|waiting)\b/i],
  ['public complaint', /\b(?:post|complain|escalate|review)[^.?!]{0,35}(?:publicly|online|social\s+media|instagram|viral)|(?:publicly|online|social\s+media|instagram|viral)[^.?!]{0,35}(?:post|complain|escalate|review)\b/i],
  ['reputation threat', /\b(?:threaten(?:s|ed|ing)?|threat|reputation|go\s+viral|expose)\b/i],
  ['stock mismatch', /\b(?:website|online|site)[^.?!]{0,40}(?:shows?|listed|says?)[^.?!]{0,30}(?:stock|available)|(?:stock|available)[^.?!]{0,30}(?:website|online|site)[^.?!]{0,30}(?:wrong|incorrect|but|not)\b/i],
  ['physically unavailable', /\b(?:out\s+of\s+stock|sold\s+out|not\s+(?:physically\s+)?available|no\s+(?:physical\s+)?stock|inventory\s+missing)\b/i],
  ['last unit', /\b(?:last|final|only|one\s+remaining)\s+(?:unit|piece|item)|\bone\s+(?:unit|piece|item)\s+left\b/i],
  ['online offline conflict', /\b(?:online|website)[^.?!]{0,55}(?:offline|warehouse|walk[- ]?in|in[- ]?store)|(?:offline|warehouse|walk[- ]?in|in[- ]?store)[^.?!]{0,55}(?:online|website)\b/i],
  ['bulk request', /\b(?:bulk|large\s+quantity|many\s+units|wholesale)\b/i],
  ['tools', /\b(?:tools?|equipment|implements?|accessories)\b/i],
  ['influencer', /\b(?:influencer|creator|reel|content\s+creator)\b/i],
  ['paid collaboration', /\b(?:paid|payment|fee|commercials?|charges?|rate\s+card|compensation)[^.?!]{0,35}(?:collaboration|partnership|campaign|reel)|(?:collaboration|partnership|campaign|reel)[^.?!]{0,35}(?:paid|payment|fee|commercials?|charges?|compensation)\b/i],
  ['leave request', /\b(?:leave|day\s+off|absence|time\s+off)\b/i],
  ['monday', /\bmonday\b/i],
  ['address change', /\b(?:change|update|correct)[^.?!]{0,24}\baddress\b|\bwrong\s+address\b/i],
  ['packed order', /\b(?:packed|sealed|after\s+packing|ready\s+to\s+dispatch)\b/i],
  ['college event', /\b(?:college|university|campus|student)[^.?!]{0,45}(?:event|fest|festival|competition|sponsor(?:ship)?)|(?:event|fest|festival|competition|sponsor(?:ship)?)[^.?!]{0,45}(?:college|university|campus|student)\b/i],
  ['sponsorship', /\b(?:sponsor(?:ship|ed)?|brand\s+support|event\s+funding)\b/i],
];

function concepts(text: string) {
  return new Set(conceptPatterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name));
}

export function hasConceptOverlap(left:string,right:string){
  const leftConcepts=concepts(left);return [...leftConcepts].some(concept=>concepts(right).has(concept));
}

export function findConceptMatch(query: string, candidates: MatchCandidate[]): MeaningMatch | null {
  const queryConcepts = concepts(query);
  if (queryConcepts.size < 2) return null;
  const ranked = candidates.filter(candidate=>isCommercialScopeCompatible(query,`${candidate.title} ${candidate.summary}`)).map(candidate => {
    const candidateConcepts = concepts(`${candidate.title} ${candidate.summary}`);
    const shared = [...queryConcepts].filter(concept => candidateConcepts.has(concept));
    return { candidate, shared, score: shared.length / Math.max(queryConcepts.size, candidateConcepts.size, 1) };
  }).filter(result => result.shared.length >= 2 && result.score >= 0.4)
    .sort((a, b) => b.score - a.score || b.shared.length - a.shared.length);
  if (!ranked.length || (ranked[1] && ranked[0].score - ranked[1].score < 0.1)) return null;
  return { id: ranked[0].candidate.id, reason: `Same situation: ${ranked[0].shared.join(', ')}.` };
}
