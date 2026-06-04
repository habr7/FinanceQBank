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

function intersectionSize(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n += 1;
  return n;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const inter = intersectionSize(a, b);
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Overlap (containment) coefficient: |A ∩ B| / min(|A|, |B|). Unlike Jaccard this
 * stays high when a short source is copied verbatim into a much longer text, which
 * is the copying pattern an IP check must catch.
 */
export function overlapCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  return intersectionSize(a, b) / Math.min(a.size, b.size);
}

/**
 * Maximum n-gram overlap of `text` against any corpus document. Uses the overlap
 * coefficient so a copied passage embedded in a longer question still scores high.
 */
export function ipRisk(text: string, corpus: readonly string[]): number {
  const target = shingles(text);
  let max = 0;
  for (const doc of corpus) {
    max = Math.max(max, overlapCoefficient(target, shingles(doc)));
  }
  return max;
}
