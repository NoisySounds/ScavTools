/**
 * Copies text to the clipboard and reports success/failure instead of
 * letting a rejected promise (unsupported browser, denied permission,
 * insecure context) go unhandled.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      return false
    }
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
