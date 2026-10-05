import { describe, expect, it, vi } from "vitest"
import { readFileAsBase64, MAX_BASE64_FILE_SIZE_BYTES } from "./base64-file"

const makeFile = (content: string) => new File([content], "test.txt", { type: "text/plain" })

// A FileReader stub that behaves like the real thing: the consumer assigns
// onload/onerror after construction, then triggers the read via readAsDataURL.
const stubFileReader = (outcome: { result?: string; fail?: boolean }) => {
  class StubFileReader {
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null
    onerror: ((event: ProgressEvent<FileReader>) => void) | null = null
    result: string | ArrayBuffer | null = null

    readAsDataURL() {
      if (outcome.fail) {
        this.onerror?.(new ProgressEvent("error") as ProgressEvent<FileReader>)
        return
      }
      this.result = outcome.result ?? null
      this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)
    }
  }
  vi.stubGlobal("FileReader", StubFileReader)
}

describe("readFileAsBase64", () => {
  it("encodes text content", async () => {
    await expect(readFileAsBase64(makeFile("Hello"))).resolves.toBe("SGVsbG8=")
  })

  it("encodes an empty file", async () => {
    await expect(readFileAsBase64(makeFile(""))).resolves.toBe("")
  })

  it("strips the data url prefix from the reader result", async () => {
    const result = await readFileAsBase64(makeFile("any carnal pleasure."))
    expect(result).toBe("YW55IGNhcm5hbCBwbGVhc3VyZS4=")
    expect(result).not.toContain("data:")
  })

  it("encodes non-ascii characters as UTF-8 bytes", async () => {
    await expect(readFileAsBase64(makeFile("café"))).resolves.toBe("Y2Fmw6k=")
  })

  it("rejects a file over the size limit", async () => {
    const oversized = { size: MAX_BASE64_FILE_SIZE_BYTES + 1 } as File
    await expect(readFileAsBase64(oversized)).rejects.toThrow(/File is too large/)
  })

  it("names the limit in the rejection message", async () => {
    const oversized = { size: MAX_BASE64_FILE_SIZE_BYTES + 1 } as File
    await expect(readFileAsBase64(oversized)).rejects.toThrow(/10 MB/)
  })

  it("accepts a file exactly at the size limit", async () => {
    const atLimit = { size: MAX_BASE64_FILE_SIZE_BYTES } as File
    stubFileReader({ result: "data:text/plain;base64,QQ==" })

    await expect(readFileAsBase64(atLimit)).resolves.toBe("QQ==")
    vi.unstubAllGlobals()
  })

  it("rejects when the reader fails", async () => {
    stubFileReader({ fail: true })

    await expect(readFileAsBase64(makeFile("x"))).rejects.toThrow("Failed to read the file.")
    vi.unstubAllGlobals()
  })
})