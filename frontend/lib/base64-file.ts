export const MAX_BASE64_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Reads a File (text or binary) and returns its Base64 encoding.
 * Uses FileReader.readAsDataURL so binary bytes are encoded correctly
 * (no lossy string round-trip), then strips the "data:...;base64," prefix.
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_BASE64_FILE_SIZE_BYTES) {
      reject(
        new Error(
          `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max size is ${
            MAX_BASE64_FILE_SIZE_BYTES / (1024 * 1024)
          } MB.`,
        ),
      )
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.slice(result.indexOf(",") + 1)
      resolve(base64)
    }
    reader.onerror = () => reject(new Error("Failed to read the file."))
    reader.readAsDataURL(file)
  })
}
