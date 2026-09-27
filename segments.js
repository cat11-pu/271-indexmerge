// segments.js：文档条目与词表整理
export function sortWords(words) {
  return Array.from(new Set(words)).sort();
}

export function mergeDocs(left, right) {
  const byDoc = new Map();
  left.concat(right).forEach(function (row) {
    const doc = row[0];
    const words = row[1];
    byDoc.set(doc, byDoc.has(doc) ? sortWords(byDoc.get(doc).concat(words)) : sortWords(words));
  });
  return Array.from(byDoc.keys()).sort().map(function (doc) {
    return [doc, byDoc.get(doc)];
  });
}
