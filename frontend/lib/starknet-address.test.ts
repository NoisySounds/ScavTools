import { describe, expect, it } from "vitest"
import { validateStarknetAddress, shortenAddress } from "./starknet-address"

describe("validateStarknetAddress", () => {
  it("accepts a typical address", () => {
    expect(validateStarknetAddress("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc6")).toBeNull()
  })

  it("accepts the shortest valid address", () => {
    expect(validateStarknetAddress("0x1")).toBeNull()
  })

  it("accepts an address of exactly 64 hex digits", () => {
    expect(validateStarknetAddress("0x" + "f".repeat(64))).toBeNull()
  })

  it("accepts uppercase hex digits", () => {
    expect(validateStarknetAddress("0xABCDEF")).toBeNull()
  })

  it("rejects a missing 0x prefix", () => {
    expect(validateStarknetAddress("1234")).toMatch(/must start with 0x/)
  })

  it("rejects an empty string", () => {
    expect(validateStarknetAddress("")).toMatch(/must start with 0x/)
  })

  it("rejects an empty hex part", () => {
    expect(validateStarknetAddress("0x")).toMatch(/hex digits after 0x/)
  })

  it("rejects non-hex characters", () => {
    expect(validateStarknetAddress("0xzz")).toMatch(/only hex characters/)
  })

  it("rejects an uppercase 0X prefix", () => {
    expect(validateStarknetAddress("0Xabc")).toMatch(/must start with 0x/)
  })

  it("rejects addresses longer than 64 hex digits", () => {
    expect(validateStarknetAddress("0x" + "f".repeat(65))).toMatch(/too long/)
  })
})

describe("shortenAddress", () => {
  it("keeps the requested prefix and suffix lengths", () => {
    expect(shortenAddress("0x1234567890abcdef", 6, 4)).toBe("0x1234...cdef")
  })

  it("handles zero-length affixes", () => {
    expect(shortenAddress("0x1234", 0, 0)).toBe("...")
  })

  it("repeats the whole address when the affixes overlap", () => {
    expect(shortenAddress("0xab", 6, 4)).toBe("0xab...0xab")
  })
})
