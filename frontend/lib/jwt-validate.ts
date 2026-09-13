const BASE64URL_SEGMENT = /^[A-Za-z0-9_-]+$/

/**
 * Checks whether a string has the basic shape of a JWT (three
 * dot-separated, non-empty base64url segments) without decoding it.
 * Returns a clear, human-readable warning if not, or null if the shape
 * looks valid.
 */
export function getJwtStructureWarning(token: string): string | null {
  const parts = token.split(".")

  if (parts.length !== 3) {
    return `Malformed JWT: expected 3 dot-separated segments, found ${parts.length}.`
  }

  const emptyIndex = parts.findIndex((part) => part.length === 0)
  if (emptyIndex !== -1) {
    const segmentName = ["header", "payload", "signature"][emptyIndex]
    return `Malformed JWT: the ${segmentName} segment is empty.`
  }

  const invalidIndex = parts.findIndex((part) => !BASE64URL_SEGMENT.test(part))
  if (invalidIndex !== -1) {
    const segmentName = ["header", "payload", "signature"][invalidIndex]
    return `Malformed JWT: the ${segmentName} segment contains characters outside the base64url alphabet.`
  }

  return null
}
