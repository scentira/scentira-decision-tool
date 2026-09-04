export type ExamplePrecedent = {
  id: string;
  title: string;
  category: string;
  situation: string;
  status: string;
};

export type SearchExample = {
  label: string;
  precedentId: string;
  precedentTitle: string;
  category: string;
};

function shortenSituation(situation: string) {
  const plain = situation
    .replace(/^On \d{1,2} [A-Za-z]+ \d{4},\s*/i, "")
    .replace(/\bfictional\s+(customer|employee|creator)\s+[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)?\s*/gu, "$1 ")
    .replace(/\s+(?:for|under|about|from)\s+(?:order|request|collaboration|complaint|quote)\s+DEMO-\d+\b/gi, "")
    .replace(/\b(?:order|request|collaboration|complaint|quote)\s+DEMO-\d+\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.?!])/g, "$1")
    .trim();
  const words = plain.split(" ");
  const clipped = words.length > 12 ? `${words.slice(0, 12).join(" ")}…` : plain;
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

export function buildSearchExamples(
  precedents: ExamplePrecedent[],
  limit = 4,
): SearchExample[] {
  const active = precedents.filter((precedent) => precedent.status === "Active");
  const categories = [...new Set(active.map((precedent) => precedent.category))];

  return categories
    .map((category) =>
      active
        .filter((precedent) => precedent.category === category)
        .sort(
          (a, b) =>
            a.situation.length - b.situation.length || a.id.localeCompare(b.id),
        )[0],
    )
    .filter((precedent): precedent is ExamplePrecedent => Boolean(precedent))
    .slice(0, limit)
    .map((precedent) => ({
      label: shortenSituation(precedent.situation),
      precedentId: precedent.id,
      precedentTitle: precedent.title,
      category: precedent.category,
    }));
}
