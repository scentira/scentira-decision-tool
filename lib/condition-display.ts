export function conditionItems(text: string) {
  return text
    .split(/\r?\n+|\s+(?=[•●▪◦]\s+)|\s+(?=-\s+)/)
    .map((part) => part.replace(/^[\s•●▪◦*-]+/, "").trim())
    .filter(Boolean);
}

export function hasConditionSeparators(text: string) {
  return /\r?\n|^[\s•●▪◦*-]+|\s[•●▪◦]\s+|\s-\s+/.test(text);
}
