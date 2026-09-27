// segments.js：文档条目与词表整理
export function sortWords(words) {
  return Array.from(new Set(words)).sort();
}

export function mergeDocs(left, right) {
  const byDoc = new Map();
  [left, right].forEach(function (docs) {
    docs.forEach(function (row) {
      const name = row[0];
      const words = row[1];
      if (byDoc.has(name)) {
        byDoc.set(name, sortWords(byDoc.get(name).concat(words)));
      } else {
        byDoc.set(name, sortWords(words.slice()));
      }
    });
  });
  return Array.from(byDoc.entries())
    .sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; })
    .map(function (entry) { return [entry[0], entry[1]]; });
}
