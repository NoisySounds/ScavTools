import { describe, expect, it } from "vitest"
import { normalizeTag, hasTag } from "./normalize-tag"

describe("normalizeTag", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeTag("  react  ")).toBe("react")
  })

  it("leaves an already trimmed tag untouched", () => {
    expect(normalizeTag("react")).toBe("react")
  })

  it("preserves inner spaces", () => {
    expect(normalizeTag("  web  dev  ")).toBe("web  dev")
  })

  it("reduces a whitespace-only tag to an empty string", () => {
    expect(normalizeTag("   ")).toBe("")
  })
})

describe("hasTag", () => {
  it("finds an exact match", () => {
    expect(hasTag(["react", "vue"], "react")).toBe(true)
  })

  it("matches without regard to case", () => {
    expect(hasTag(["React"], "react")).toBe(true)
    expect(hasTag(["react"], "REACT")).toBe(true)
  })

  it("trims the tag before comparing", () => {
    expect(hasTag(["react"], "  react  ")).toBe(true)
  })

  it("returns false for a tag that is not in the list", () => {
    expect(hasTag(["react"], "vue")).toBe(false)
  })

  it("does not match on a prefix", () => {
    expect(hasTag(["react"], "react-router")).toBe(false)
  })

  it("returns false for an empty list", () => {
    expect(hasTag([], "react")).toBe(false)
  })
})