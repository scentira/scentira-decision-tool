import assert from "node:assert/strict";
import test from "node:test";
import { demoEntries } from "../lib/public-demo.ts";
import { buildSearchExamples } from "../lib/search-examples.ts";

test("search examples come from the shortest active situation in each category", () => {
  const examples = buildSearchExamples(demoEntries);
  assert.equal(examples.length, 3);
  assert.equal(new Set(examples.map((example) => example.category)).size, 3);
  for (const example of examples) {
    const source = demoEntries.find((entry) => entry.id === example.precedentId);
    assert.equal(source?.status, "Active");
    const categoryEntries = demoEntries.filter(
      (entry) => entry.status === "Active" && entry.category === example.category,
    );
    assert.equal(
      source?.situation.length,
      Math.min(...categoryEntries.map((entry) => entry.situation.length)),
    );
    assert.ok(example.label.length > 0);
    assert.ok(example.label.split(" ").length <= 12);
    assert.ok(!example.label.includes("DEMO-"));
  }
});

test("inactive precedents never generate examples", () => {
  const examples = buildSearchExamples([
    {
      id: "old",
      title: "Old rule",
      category: "Operations",
      situation: "An old situation",
      status: "Superseded",
    },
  ]);
  assert.deepEqual(examples, []);
});
