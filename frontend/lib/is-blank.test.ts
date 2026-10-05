import { describe, expect, it } from "vitest"
import { isBlank } from "./is-blank"

describe("isBlank", () => {
  it("treats an empty string as blank", () => {
    expect(isBlank("")).toBe(true)
  })

  it("treats whitespace-only input as blank", () => {
    expect(isBlank(" ")).toBe(true)
    expect(isBlank("   \t\n  ")).toBe(true)
  })

  it("treats text as non-blank", () => {
    expect(isBlank("a")).toBe(false)
    expect(isBlank("  a  ")).toBe(false)
  })

  it("treats a zero character as non-blank", () => {
    expect(isBlank("0")).toBe(false)
  })
})