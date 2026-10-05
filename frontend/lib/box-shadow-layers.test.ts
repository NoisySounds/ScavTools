import { describe, expect, it } from "vitest"
import { createShadowLayer, combineShadowLayers, type ShadowLayer } from "./box-shadow-layers"

const layer = (overrides: Partial<ShadowLayer> = {}): ShadowLayer =>
  createShadowLayer({ id: "fixed", ...overrides })

describe("createShadowLayer", () => {
  it("applies sensible defaults", () => {
    const result = createShadowLayer()
    expect(result.horizontalOffset).toBe(5)
    expect(result.verticalOffset).toBe(5)
    expect(result.blur).toBe(10)
    expect(result.spread).toBe(0)
    expect(result.color).toBe("#000000")
    expect(result.opacity).toBe(20)
    expect(result.inset).toBe(false)
  })

  it("generates an id when none is supplied", () => {
    expect(createShadowLayer().id).toBeTruthy()
  })

  it("generates a distinct id per layer", () => {
    const ids = new Set(Array.from({ length: 25 }, () => createShadowLayer().id))
    expect(ids.size).toBe(25)
  })

  it("applies overrides without dropping defaults", () => {
    const result = createShadowLayer({ blur: 30, inset: true })
    expect(result.blur).toBe(30)
    expect(result.inset).toBe(true)
    expect(result.color).toBe("#000000")
  })
})

describe("combineShadowLayers", () => {
  it("returns an empty string for no layers", () => {
    expect(combineShadowLayers([])).toBe("")
  })

  it("converts a single layer to CSS", () => {
    expect(combineShadowLayers([layer()])).toBe("5px 5px 10px 0px rgba(0, 0, 0, 0.2)")
  })

  it("prefixes inset layers", () => {
    expect(combineShadowLayers([layer({ inset: true })])).toBe(
      "inset 5px 5px 10px 0px rgba(0, 0, 0, 0.2)",
    )
  })

  it("converts the colour hex triplet to rgba", () => {
    expect(combineShadowLayers([layer({ color: "#ff8000", opacity: 50 })])).toBe(
      "5px 5px 10px 0px rgba(255, 128, 0, 0.5)",
    )
  })

  it("joins multiple layers with a comma", () => {
    const result = combineShadowLayers([layer(), layer({ blur: 20 })])
    expect(result).toBe("5px 5px 10px 0px rgba(0, 0, 0, 0.2), 5px 5px 20px 0px rgba(0, 0, 0, 0.2)")
  })

  it("supports negative offsets", () => {
    expect(combineShadowLayers([layer({ horizontalOffset: -2, verticalOffset: -3 })])).toBe(
      "-2px -3px 10px 0px rgba(0, 0, 0, 0.2)",
    )
  })
})