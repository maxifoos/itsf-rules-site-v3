// Isomorphic glossary matching: used both at build time (remark plugin, Node)
// and at render time (GlossaryTerm component, browser) so the two stay in sync.

export type GlossaryEntry = {term: string; definition: string};

export type GlossaryIndex = {
  matcher: RegExp;
  lookup: Map<string, GlossaryEntry>;
};

export type GlossarySegment = {text: string; match?: GlossaryEntry};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildGlossaryIndex(entries: GlossaryEntry[]): GlossaryIndex {
  const lookup = new Map<string, GlossaryEntry>();
  for (const entry of entries) {
    lookup.set(entry.term.toLowerCase(), entry);
    // Support simple plural usage of the same term (e.g. "teams", "referees").
    if (!/s$/i.test(entry.term)) {
      lookup.set(`${entry.term.toLowerCase()}s`, entry);
    }
  }
  // Longest key first, so multi-word terms win over a shorter term they contain
  // (e.g. "Possession clock figure" is preferred over "Possession clock" over "Possession").
  const keys = Array.from(lookup.keys()).sort((a, b) => b.length - a.length);
  const matcher = new RegExp(`\\b(${keys.map(escapeRegExp).join('|')})\\b`, 'gi');
  return {matcher, lookup};
}

/**
 * Splits `text` into plain and matched segments against the glossary index.
 * `excludeTerms` (lowercased) skips re-highlighting any term already shown
 * higher up a chain of nested tooltips — a term's own tooltip excludes
 * itself, and a tooltip nested inside another also excludes every ancestor,
 * so a cycle of cross-referencing definitions can't recurse forever.
 */
export function splitByGlossaryMatches(
  text: string,
  index: GlossaryIndex,
  excludeTerms?: ReadonlySet<string>,
): GlossarySegment[] {
  const {matcher, lookup} = index;
  matcher.lastIndex = 0;
  if (!matcher.test(text)) {
    return [{text}];
  }
  matcher.lastIndex = 0;

  const segments: GlossarySegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text)) !== null) {
    const matchedText = match[0];
    const start = match.index;
    if (start > lastIndex) {
      segments.push({text: text.slice(lastIndex, start)});
    }
    const entry = lookup.get(matchedText.toLowerCase());
    if (entry && !excludeTerms?.has(entry.term.toLowerCase())) {
      segments.push({text: matchedText, match: entry});
    } else {
      segments.push({text: matchedText});
    }
    lastIndex = start + matchedText.length;
  }
  if (lastIndex < text.length) {
    segments.push({text: text.slice(lastIndex)});
  }
  return segments;
}
