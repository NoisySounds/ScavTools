"use client";

import { useState } from "react";
import { CopyCssButton } from "@/components/tools/copy-css-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { type ShadowLayer, createShadowLayer, combineShadowLayers } from "@/lib/box-shadow-layers";

interface ShadowPreset {
  name: string;
  horizontalOffset: number;
  verticalOffset: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

const SHADOW_PRESETS: ShadowPreset[] = [
  { name: "Material", horizontalOffset: 0, verticalOffset: 4, blur: 6, spread: -1, color: "#000000", opacity: 20, inset: false },
  { name: "Soft", horizontalOffset: 0, verticalOffset: 2, blur: 16, spread: 0, color: "#000000", opacity: 10, inset: false },
  { name: "Hard", horizontalOffset: 4, verticalOffset: 4, blur: 0, spread: 0, color: "#000000", opacity: 100, inset: false },
  { name: "Neumorphism", horizontalOffset: 8, verticalOffset: 8, blur: 16, spread: 0, color: "#a3b1c6", opacity: 60, inset: false },
];

export function BoxShadowGenerator() {
  const [layers, setLayers] = useState<ShadowLayer[]>([createShadowLayer()]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [previewBg, setPreviewBg] = useState("#f4f4f5");

  const activeLayer = layers[activeLayerIndex];

  const updateActiveLayer = (patch: Partial<ShadowLayer>) => {
    setLayers((prev) => prev.map((layer, i) => (i === activeLayerIndex ? { ...layer, ...patch } : layer)));
  };

  const addLayer = () => {
    setLayers((prev) => {
      const next = [...prev, createShadowLayer()];
      setActiveLayerIndex(next.length - 1);
      return next;
    });
  };

  const removeLayer = (index: number) => {
    setLayers((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setActiveLayerIndex((current) => Math.min(current, next.length - 1));
      return next;
    });
  };

  const applyPreset = (preset: ShadowPreset) => {
    updateActiveLayer(preset);
  };

  const boxShadow = combineShadowLayers(layers);
  const cssCode = `box-shadow: ${boxShadow};`;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Box Shadow Generator</CardTitle>
          <CardDescription>
            Create and customize CSS box shadows with live preview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Layers</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLayer}>
                <Plus className="mr-1 h-3 w-3" />
                Add Layer
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {layers.map((layer, index) => (
                <Button
                  key={layer.id}
                  type="button"
                  variant={index === activeLayerIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLayerIndex(index)}
                  className="gap-2"
                >
                  Layer {index + 1}
                  {layers.length > 1 && (
                    <X
                      className="h-3 w-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLayer(index);
                      }}
                    />
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Presets (applies to selected layer)</Label>
            <div className="flex flex-wrap gap-2">
              {SHADOW_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Horizontal Offset: {activeLayer.horizontalOffset}px</Label>
              </div>
              <Slider
                value={[activeLayer.horizontalOffset]}
                min={-50}
                max={50}
                step={1}
                onValueChange={(value) => updateActiveLayer({ horizontalOffset: value[0] })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Vertical Offset: {activeLayer.verticalOffset}px</Label>
              </div>
              <Slider
                value={[activeLayer.verticalOffset]}
                min={-50}
                max={50}
                step={1}
                onValueChange={(value) => updateActiveLayer({ verticalOffset: value[0] })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Blur Radius: {activeLayer.blur}px</Label>
              </div>
              <Slider
                value={[activeLayer.blur]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => updateActiveLayer({ blur: value[0] })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Spread Radius: {activeLayer.spread}px</Label>
              </div>
              <Slider
                value={[activeLayer.spread]}
                min={-50}
                max={50}
                step={1}
                onValueChange={(value) => updateActiveLayer({ spread: value[0] })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shadow Color</Label>
                <div className="flex">
                  <Input
                    type="color"
                    value={activeLayer.color}
                    onChange={(e) => updateActiveLayer({ color: e.target.value })}
                    className="w-12 p-1 h-10"
                  />
                  <Input
                    type="text"
                    value={activeLayer.color}
                    onChange={(e) => updateActiveLayer({ color: e.target.value })}
                    className="flex-1 ml-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Opacity: {activeLayer.opacity}%</Label>
                <Slider
                  value={[activeLayer.opacity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => updateActiveLayer({ opacity: value[0] })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="inset"
                checked={activeLayer.inset}
                onCheckedChange={(checked) => updateActiveLayer({ inset: checked })}
              />
              <Label htmlFor="inset">Inset Shadow</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Shadow visibility depends heavily on background contrast — try changing it below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex items-center justify-center p-12 rounded-md"
              style={{ backgroundColor: previewBg }}
            >
              <div
                className="h-32 w-32 bg-white rounded-md"
                style={{ boxShadow }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="preview-bg" className="shrink-0">
                Preview Background
              </Label>
              <Input
                id="preview-bg"
                type="color"
                value={previewBg}
                onChange={(e) => setPreviewBg(e.target.value)}
                className="w-12 p-1 h-10"
              />
              <Input
                type="text"
                value={previewBg}
                onChange={(e) => setPreviewBg(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSS Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="css">
              <TabsList className="mb-4">
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
              </TabsList>
              <TabsContent value="css" className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{cssCode}</code>
                </pre>
                <CopyCssButton css={cssCode} className="absolute top-2 right-2" />
              </TabsContent>
              <TabsContent value="tailwind" className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{"/* Custom Tailwind CSS required */"}</code>
                </pre>
                <CopyCssButton css={cssCode} className="absolute top-2 right-2" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
