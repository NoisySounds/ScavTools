"use client"

import type React from "react"

import { useState } from "react"
import { Copy, Upload, ArrowLeftRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [error, setError] = useState("")

  const encodeBase64 = () => {
    try {
      setError("")
      const encoded = btoa(inputText)
      setOutputText(encoded)
    } catch (err) {
      setError("Error encoding to Base64. Make sure the input contains valid characters.")
    }
  }

  const decodeBase64 = () => {
    try {
      setError("")
      const decoded = atob(inputText)
      setOutputText(decoded)
    } catch (err) {
      setError("Error decoding from Base64. Make sure the input is valid Base64.")
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText)
  }

  const swapMode = () => {
    setError("")
    setMode((prev) => (prev === "encode" ? "decode" : "encode"))
    setInputText(outputText)
    setOutputText(inputText)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === "string") {
        // For text files
        setInputText(result)
      } else if (result instanceof ArrayBuffer) {
        // For binary files
        const bytes = new Uint8Array(result)
        let binary = ""
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        setInputText(binary)
      }
    }

    reader.readAsText(file)
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Base64 Encoder/Decoder</CardTitle>
        <CardDescription>Encode or decode Base64 strings and files</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={(value) => setMode(value as "encode" | "decode")}>
          <div className="flex items-center gap-2">
            <TabsList className="grid flex-1 grid-cols-2">
              <TabsTrigger value="encode">Encode</TabsTrigger>
              <TabsTrigger value="decode">Decode</TabsTrigger>
            </TabsList>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={swapMode}
              title="Swap input/output and toggle mode"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="sr-only">Swap encode/decode</span>
            </Button>
          </div>

          <TabsContent value="encode" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-encode">Text to Encode</Label>
              <Textarea
                id="input-encode"
                placeholder="Enter text to encode to Base64..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-32"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={encodeBase64} disabled={!inputText}>
                Encode to Base64
              </Button>
              <div className="relative">
                <Button variant="outline" className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="decode" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-decode">Base64 to Decode</Label>
              <Textarea
                id="input-decode"
                placeholder="Enter Base64 to decode..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-32 font-mono"
              />
            </div>

            <Button onClick={decodeBase64} disabled={!inputText}>
              Decode from Base64
            </Button>
          </TabsContent>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}

          {outputText && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Result</Label>
                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-md overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap break-all">{outputText}</pre>
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
