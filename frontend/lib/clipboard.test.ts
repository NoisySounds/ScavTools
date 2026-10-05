import { describe, expect, it, vi, afterEach } from "vitest"
import { copyTextToClipboard } from "./clipboard"

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value,
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("copyTextToClipboard", () => {
  it("writes the text and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })

    await expect(copyTextToClipboard("0xabc123")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("0xabc123")
  })

  it("returns false when the clipboard API is unavailable", async () => {
    setClipboard(undefined)
    await expect(copyTextToClipboard("hello")).resolves.toBe(false)
  })

  it("returns false instead of throwing when writing is denied", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("denied")) })
    await expect(copyTextToClipboard("hello")).resolves.toBe(false)
  })

  it("returns false for a missing clipboard API in an insecure context", async () => {
    setClipboard(undefined)
    await expect(copyTextToClipboard("")).resolves.toBe(false)
  })

  it("copies an empty string without error", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })

    await expect(copyTextToClipboard("")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("")
  })
})