export interface ShadowLayer {
  id: string
  horizontalOffset: number
  verticalOffset: number
  blur: number
  spread: number
  color: string
  opacity: number
  inset: boolean
}

export function createShadowLayer(overrides: Partial<ShadowLayer> = {}): ShadowLayer {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    horizontalOffset: 5,
    verticalOffset: 5,
    blur: 10,
    spread: 0,
    color: "#000000",
    opacity: 20,
    inset: false,
    ...overrides,
  }
}

function layerToCss(layer: ShadowLayer): string {
  const r = Number.parseInt(layer.color.slice(1, 3), 16)
  const g = Number.parseInt(layer.color.slice(3, 5), 16)
  const b = Number.parseInt(layer.color.slice(5, 7), 16)
  const rgba = `rgba(${r}, ${g}, ${b}, ${layer.opacity / 100})`
  return `${layer.inset ? "inset " : ""}${layer.horizontalOffset}px ${layer.verticalOffset}px ${layer.blur}px ${layer.spread}px ${rgba}`
}

/** Combines all layers into a single comma-separated box-shadow value. */
export function combineShadowLayers(layers: ShadowLayer[]): string {
  return layers.map(layerToCss).join(", ")
}
