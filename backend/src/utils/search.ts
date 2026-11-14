/**
 * Search strategy
 * ---------------
 * Each searchable document stores a `keywords` array of lowercase tokens
 * (name parts, email, phone digits, hospital, etc.) backed by a multikey index.
 * A query term is tokenised the same way and every token must prefix-match a keyword:
 *
 *   { keywords: { $regex: '^car' } }   // anchored + case-sensitive => uses index bounds
 *
 * This gives "search-as-you-type" partial matching (unlike $text, which only matches
 * whole stemmed words) while still being an index scan rather than a collection scan
 * (unlike an unanchored /term/i regex).
 */

const TOKEN_SPLIT = /[^\p{L}\p{N}@.+]+/u;

export function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(TOKEN_SPLIT)
    .map((t) => t.replace(/^[.@+]+|[.@+]+$/g, ''))
    .filter(Boolean);
}

export function buildKeywords(...values: Array<string | undefined | null>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const token of tokenize(value)) set.add(token);
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 4) set.add(digits); // phone numbers searchable regardless of formatting
  }
  return [...set];
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function keywordFilter(search?: string) {
  if (!search) return {};
  const tokens = tokenize(search).slice(0, 5);
  if (tokens.length === 0) return {};
  return { $and: tokens.map((t) => ({ keywords: { $regex: `^${escapeRegex(t)}` } })) };
}
