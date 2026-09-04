import { Button } from "@/components/ui/button";
import type { SearchExample } from "@/lib/search-examples";

export function SearchExamples({
  examples,
  onSelect,
}: {
  examples: SearchExample[];
  onSelect: (example: SearchExample) => void;
}) {
  if (!examples.length) return null;
  return (
    <div className="search-examples">
      <span>Try one of these</span>
      <div>
        {examples.map((example) => (
          <Button
            key={example.precedentId}
            type="button"
            variant="outline"
            onClick={() => onSelect(example)}
          >
            {example.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
