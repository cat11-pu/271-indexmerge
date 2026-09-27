import assert from "node:assert";
import { sortWords, mergeDocs } from "../segments.js";
import { step, close } from "../mergerun.js";
import { render } from "../app.js";

const base = {
  budget: 1,
  state: { segs: [], ledger: [], applied: [] },
  events: [],
  seg_error_code: "E_NOT_ENOUGH_SEGMENTS", doc_error_code: "E_DUPLICATE_DOC",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("sortWords returns a list", () => {
  assert.ok(Array.isArray(sortWords(["b", "a"])));
});

check("mergeDocs returns a list", () => {
  assert.ok(Array.isArray(mergeDocs([], [])));
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
