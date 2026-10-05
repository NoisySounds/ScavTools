import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center")
  })

  it("drops falsy values", () => {
    expect(cn("flex", false && "hidden", null, undefined, "gap-2")).toBe("flex gap-2")
  })

  it("lets a later conflicting utility win", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("keeps utilities that do not conflict", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4")
  })

  it("returns an empty string with no input", () => {
    expect(cn()).toBe("")
  })

  it("flattens array input", () => {
    expect(cn(["flex", "gap-2"])).toBe("flex gap-2")
  })
})