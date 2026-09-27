// mergerun.js：按合并预算并段并留账
import { sortWords, mergeDocs } from "./segments.js";

function fail(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function codes(spec) {
  return {
    seg: spec.seg_error_code || "E_NOT_ENOUGH_SEGMENTS",
    doc: spec.doc_error_code || "E_DUPLICATE_DOC",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function cloneState(state) {
  state = state || {};
  return {
    segs: (state.segs || []).map(function (seg) {
      return seg.map(function (row) { return [row[0], row[1].slice()]; });
    }),
    ledger: (state.ledger || []).slice(),
    applied: (state.applied || []).slice()
  };
}

function docNames(segs) {
  const names = new Set();
  segs.forEach(function (seg) {
    seg.forEach(function (row) { names.add(row[0]); });
  });
  return names;
}

function mergeOldest(state, segCode) {
  if (state.segs.length < 2) throw fail(segCode, "not enough segments to merge");
  const merged = mergeDocs(state.segs[0], state.segs[1]);
  state.segs = [merged].concat(state.segs.slice(2));
}

function validateEvent(event, eventCode) {
  if (!event || typeof event !== "object") throw fail(eventCode, "bad event");
  if (event.id === undefined || event.id === null) throw fail(eventCode, "bad event");
  if (event.kind === "index") {
    if (typeof event.doc !== "string" || !Array.isArray(event.words)) {
      throw fail(eventCode, "bad event");
    }
  } else if (event.kind !== "merge") {
    throw fail(eventCode, "bad event");
  }
}

export function step(spec) {
  const err = codes(spec);
  const state = cloneState(spec.state);
  const events = spec.events || [];
  let budget = spec.budget || 0;
  let merged = 0;
  let judged = 0;
  const applied = new Set(state.applied);

  // 先清账：上一轮压下的合并请求用本轮预算先做，做不完的继续压账
  const pending = state.ledger.slice();
  state.ledger = [];
  pending.forEach(function (id) {
    if (budget > 0) {
      budget -= 1;
      mergeOldest(state, err.seg);
      merged += 1;
    } else {
      state.ledger.push(id);
    }
  });

  events.forEach(function (event) {
    validateEvent(event, err.event);
    if (applied.has(event.id)) return;
    judged += 1;
    applied.add(event.id);
    state.applied.push(event.id);
    if (event.kind === "index") {
      if (docNames(state.segs).has(event.doc)) {
        throw fail(err.doc, "duplicate doc " + event.doc);
      }
      state.segs.push([[event.doc, sortWords(event.words)]]);
    } else if (budget > 0) {
      budget -= 1;
      mergeOldest(state, err.seg);
      merged += 1;
    } else {
      state.ledger.push(event.id);
    }
  });

  return { state: state, merged: merged, ledger_before: state.ledger.length,
           ledger: state.ledger.slice(), judged: judged, judged_bound: events.length };
}

export function close(spec) {
  const err = codes(spec);
  const state = cloneState(spec.state);
  let catchup = 0;
  const pending = state.ledger.slice();
  state.ledger = [];
  pending.forEach(function () {
    mergeOldest(state, err.seg);
    catchup += 1;
  });
  return { state: state, catchup: catchup };
}
