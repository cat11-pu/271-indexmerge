// mergerun.js：按合并预算并段并留账
import { sortWords, mergeDocs } from "./segments.js";

function fail(code, message) {
  const error = new Error(message || code);
  error.code = code;
  throw error;
}

function errorCodes(spec) {
  return {
    notEnough: (spec && spec.seg_error_code) || "E_NOT_ENOUGH_SEGMENTS",
    duplicateDoc: (spec && spec.doc_error_code) || "E_DUPLICATE_DOC",
    badEvent: (spec && spec.event_error_code) || "E_BAD_EVENT"
  };
}

function validEvent(event) {
  if (!event || typeof event !== "object") return false;
  if (typeof event.id !== "number") return false;
  if (event.kind === "merge") return true;
  if (event.kind === "index") {
    return typeof event.doc === "string" && Array.isArray(event.words);
  }
  return false;
}

function hasDoc(segs, doc) {
  return segs.some(function (seg) {
    return seg.some(function (row) { return row[0] === doc; });
  });
}

function mergeOldest(segs, notEnoughCode) {
  if (segs.length < 2) fail(notEnoughCode, "not enough segments to merge");
  return [mergeDocs(segs[0], segs[1])].concat(segs.slice(2));
}

export function step(spec) {
  const codes = errorCodes(spec || {});
  const events = (spec && spec.events) || [];
  const source = (spec && spec.state) || { segs: [], ledger: [], applied: [] };
  let segs = source.segs.slice();
  let ledger = source.ledger.slice();
  let applied = source.applied.slice();
  let budget = (spec && typeof spec.budget === "number" ? spec.budget : 0);
  let merged = 0;
  let judged = 0;

  events.forEach(function (event) {
    if (!validEvent(event)) fail(codes.badEvent, "illegal event");
    if (applied.indexOf(event.id) !== -1) return;
    judged += 1;
    if (event.kind === "index") {
      if (hasDoc(segs, event.doc)) fail(codes.duplicateDoc, "duplicate document name");
      segs = segs.concat([[[event.doc, sortWords(event.words)]]]);
    } else {
      if (segs.length < 2) fail(codes.notEnough, "not enough segments to merge");
      if (budget > 0) {
        budget -= 1;
        segs = mergeOldest(segs, codes.notEnough);
        merged += 1;
      } else {
        ledger = ledger.concat([event.id]);
      }
    }
    applied = applied.concat([event.id]);
  });

  return {
    state: { segs: segs, ledger: ledger, applied: applied },
    merged: merged,
    ledger_before: ledger.length,
    ledger: ledger,
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const codes = errorCodes(spec || {});
  const source = (spec && spec.state) || { segs: [], ledger: [], applied: [] };
  let segs = source.segs.slice();
  let catchup = 0;

  source.ledger.forEach(function () {
    segs = mergeOldest(segs, codes.notEnough);
    catchup += 1;
  });

  return {
    state: { segs: segs, ledger: [], applied: source.applied.slice() },
    catchup: catchup
  };
}
