import { describe, expect, it } from "vitest"
import { formatByteSavings } from "./json-size"

describe("formatByteSavings", () => {
  it("returns an empty string when there is no original input", () => {
    expect(formatByteSavings("", "{}")).toBe("")
    expect(formatByteSavings("", "")).toBe("")
  })

  it("reports the byte reduction and percentage", () => {
    expect(formatByteSavings('{ "a": 1 }', '{"a":1}')).toBe("10 B -> 7 B (30% smaller)")
  })

  it("reports no reduction when the sizes match", () => {
    expect(formatByteSavings('{"a":1}', '{"a":1}')).toBe("7 B -> 7 B (no size reduction)")
  })

  it("reports no reduction when the output grew", () => {
    expect(formatByteSavings("{}", '{"a":1}')).toBe("2 B -> 7 B (no size reduction)")
  })

  it("counts bytes rather than characters for multibyte text", () => {
    // The emoji is a surrogate pair: 9 UTF-16 units but 12 UTF-8 bytes.
    expect(formatByteSavings('{"a":"🎉"}', '{"a":""}')).toBe("12 B -> 8 B (33% smaller)")
  })

  it("handles a large reduction", () => {
    expect(formatByteSavings("a".repeat(100), "a")).toBe("100 B -> 1 B (99% smaller)")
  })
})