/**
 * Trims a raw tag input string for storage/display.
 */
export function normalizeTag(rawTag: string): string {
  return rawTag.trim()
}

/**
 * Case-insensitive check for whether a tag is already present in a list,
 * so "React" and "react" are treated as duplicates.
 */
export function hasTag(tags: string[], tag: string): boolean {
  const normalized = normalizeTag(tag).toLowerCase()
  return tags.some((existing) => existing.toLowerCase() === normalized)
}
