/** Word-level n-gram shingles, lowercased and punctuation-stripped. */
export function shingles(text: string, n = 3): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const set = new Set<string>();
  if (words.length === 0) return set;
  if (words.length < n) {
    set.add(words.join(" "));
    return set;
  }
  for (let i = 0; i + n <= words.length; i += 1) {
    set.add(words.slice(i, i + n).join(" "));
  }
  return set;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Maximum n-gram (Jaccard) similarity of `text` against any corpus document. */
export function ipRisk(text: string, corpus: readonly string[]): number {
  const target = shingles(text);
  let max = 0;
  for (const doc of corpus) {
    max = Math.max(max, jaccard(target, shingles(doc)));
  }
  return max;
}
