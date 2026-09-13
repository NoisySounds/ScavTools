/**
 * Compares the byte size of the original input against the minified
 * output and returns a short, human-readable summary of the savings.
 */
export function formatByteSavings(original: string, minified: string): string {
  const originalBytes = new TextEncoder().encode(original).length
  const minifiedBytes = new TextEncoder().encode(minified).length

  if (originalBytes === 0) {
    return ""
  }

  const savedBytes = originalBytes - minifiedBytes
  const savedPercent = Math.round((savedBytes / originalBytes) * 100)

  if (savedBytes <= 0) {
    return `${originalBytes} B -> ${minifiedBytes} B (no size reduction)`
  }

  return `${originalBytes} B -> ${minifiedBytes} B (${savedPercent}% smaller)`
}
