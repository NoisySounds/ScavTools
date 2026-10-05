import { describe, expect, it } from "vitest"
import { getJwtStructureWarning } from "./jwt-validate"

describe("getJwtStructureWarning", () => {
  it("accepts a well-formed three segment token", () => {
    expect(getJwtStructureWarning("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123")).toBeNull()
  })

  it("accepts the base64url - and _ characters", () => {
    expect(getJwtStructureWarning("a-b_.c-d_.e-f_")).toBeNull()
  })

  it("reports the segment count when there are too few", () => {
    expect(getJwtStructureWarning("a.b")).toMatch(/expected 3 dot-separated segments, found 2/)
  })

  it("reports the segment count when there are too many", () => {
    expect(getJwtStructureWarning("a.b.c.d")).toMatch(/found 4/)
  })

  it("reports an empty token as a single segment", () => {
    expect(getJwtStructureWarning("")).toMatch(/found 1/)
  })

  it("names the header when it is empty", () => {
    expect(getJwtStructureWarning(".b.c")).toMatch(/the header segment is empty/)
  })

  it("names the payload when it is empty", () => {
    expect(getJwtStructureWarning("a..c")).toMatch(/the payload segment is empty/)
  })

  it("names the signature when it is empty", () => {
    expect(getJwtStructureWarning("a.b.")).toMatch(/the signature segment is empty/)
  })

  it("names the segment holding characters outside base64url", () => {
    expect(getJwtStructureWarning("a.b.c+d")).toMatch(
      /the signature segment contains characters outside the base64url alphabet/,
    )
  })

  it("rejects standard base64 + and / characters", () => {
    expect(getJwtStructureWarning("a+b.c.d")).toMatch(/the header segment contains characters/)
  })
})