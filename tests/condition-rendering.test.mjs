import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  conditionItems,
  hasConditionSeparators,
} from "../lib/condition-display.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("condition tables label both columns on desktop and stacked phone layouts", async () => {
  const [component, css] = await Promise.all([
    read("../components/condition-selector.tsx"),
    read("../app/product.css"),
  ]);
  assert.match(component, />Check this</);
  assert.match(component, />Then do this</);
  assert.match(component, /condition-mobile-label/);
  assert.match(css, /\.condition-columns-header\{display:grid/);
  assert.match(css, /\.condition-columns-header\{display:none\}/);
  assert.match(css, /\.condition-mobile-label\{display:block/);
});

test("condition cells split newline, dash and bullet items without changing stored text", async () => {
  const [component, formatter] = await Promise.all([
    read("../components/condition-selector.tsx"),
    read("../lib/condition-display.ts"),
  ]);
  assert.match(formatter, /split\(\/\\r\?\\n\+/);
  assert.match(formatter, /•●▪◦/);
  assert.match(component, /condition-items/);
  assert.doesNotMatch(`${component}${formatter}`, /update|mutation|\/api\/state/);
});

test("separate founder-written condition lines render as separate clean items", () => {
  const stored =
    "- Creator changes the price after more work is requested\n• The expanded scope is documented\n- The revised quote is much higher";
  assert.equal(hasConditionSeparators(stored), true);
  assert.deepEqual(conditionItems(stored), [
    "Creator changes the price after more work is requested",
    "The expanded scope is documented",
    "The revised quote is much higher",
  ]);
  assert.equal(
    stored,
    "- Creator changes the price after more work is requested\n• The expanded scope is documented\n- The revised quote is much higher",
  );
});

test("ordinary condition text remains one unchanged line", () => {
  const stored = "The creator's scope has expanded.";
  assert.equal(hasConditionSeparators(stored), false);
  assert.deepEqual(conditionItems(stored), [stored]);
});
