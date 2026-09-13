"use client"

import type React from "react"

import { useState } from "react"
import { Copy, Upload, ArrowLeftRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { validateBase64 } from "@/lib/base64-validate"
import { readFileAsBase64 } from "@/lib/base64-file"

export function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const encodeBase64 = () => {
    try {
      setError("")
      setFileName("")
      const encoded = btoa(inputText)
      setOutputText(encoded)
    } catch (err) {
      setError("Error encoding to Base64. Make sure the input contains valid characters.")
    }
  }

  const decodeBase64 = () => {
    const validationError = validateBase64(inputText)
    if (validationError) {
      setError(validationError)
      setOutputText("")
      return
    }

    try {
      setError("")
      const decoded = atob(inputText)
      setOutputText(decoded)
    } catch (err) {
      setError("Error decoding from Base64. Make sure the input is valid Base64.")
      setOutputText("")
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

  const encodeFile = async (file: File) => {
    try {
      setError("")
      const encoded = await readFileAsBase64(file)
      setFileName(file.name)
      setInputText("")
      setOutputText(encoded)
    } catch (err) {
      setFileName("")
      setError((err as Error).message)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) encodeFile(file)
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) encodeFile(file)
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
              <p className="text-xs text-muted-foreground">{inputText.length} characters</p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={encodeBase64} disabled={!inputText}>
                Encode to Base64
              </Button>
            </div>

            <label
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {fileName ? `Encoded file: ${fileName}` : "Drag and drop a file here, or click to select one (max 10 MB)"}
              </p>
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
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
              <p className="text-xs text-muted-foreground">{inputText.length} characters</p>
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
              <p className="text-xs text-muted-foreground">
                {new TextEncoder().encode(outputText).length} bytes
              </p>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
