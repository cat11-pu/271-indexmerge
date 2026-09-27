// mergerun.js：按合并预算并段并留账（基线：一律给空表）
import { sortWords, mergeDocs } from "./segments.js";

export function step(spec) {
  return { state: spec.state, merged: 0, ledger_before: 0, ledger: [], judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
