/**
 * Returns true if a string is empty or contains only whitespace.
 * Used to treat whitespace-only pastes the same as an empty input.
 */
export function isBlank(value: string): boolean {
  return value.trim().length === 0
}
