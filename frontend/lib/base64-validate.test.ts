import { describe, expect, it } from "vitest"
import { validateBase64 } from "./base64-validate"

describe("validateBase64", () => {
  it("accepts standard Base64 text", () => {
    expect(validateBase64("SGVsbG8=")).toBeNull()
  })

  it("accepts text with no padding", () => {
    expect(validateBase64("SGVsbG8")).toBeNull()
  })

  it("accepts the + and / characters", () => {
    expect(validateBase64("a+b/")).toBeNull()
    expect(validateBase64("+/+/")).toBeNull()
  })

  it("rejects empty input", () => {
    expect(validateBase64("")).toMatch(/Enter some Base64 text/)
  })

  it("rejects characters outside the alphabet", () => {
    expect(validateBase64("hello!")).toMatch(/outside the Base64 alphabet/)
  })

  it("rejects whitespace", () => {
    expect(validateBase64("SGVs bG8=")).toMatch(/outside the Base64 alphabet/)
  })

  it("rejects unpadded lengths that leave a remainder of 1", () => {
    expect(validateBase64("A")).toMatch(/invalid length/)
    expect(validateBase64("SGVsb")).toMatch(/invalid length/)
    expect(validateBase64("SGVsbG8xy")).toMatch(/invalid length/)
  })

  it("accepts unpadded lengths that pad cleanly", () => {
    expect(validateBase64("SGVsbG")).toBeNull()
    expect(validateBase64("SGVsbG8")).toBeNull()
    expect(validateBase64("SGVsbG8x")).toBeNull()
  })

  it("ignores padding when measuring length", () => {
    expect(validateBase64("SGVsbG8=")).toBeNull()
    expect(validateBase64("SGVsbG9=")).toBeNull()
    expect(validateBase64("SGVsbG9")).toBeNull()
  })

  it("accepts a padding-only string as trivially empty", () => {
    expect(validateBase64("=")).toBeNull()
    expect(validateBase64("==")).toBeNull()
  })

  it("rejects more than two padding characters", () => {
    expect(validateBase64("SGVsbG8===")).toMatch(/outside the Base64 alphabet/)
  })
})