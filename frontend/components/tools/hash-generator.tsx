"use client"

import { useState } from "react"
import type React from "react"
import { Copy, UploadCloud } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateHashes as computeHashes, generateHashesFromBuffer } from "@/lib/hash"

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export function HashGenerator() {
  const [input, setInput] = useState("")
  const [hashes, setHashes] = useState<Record<string, string>>({
    md5: "",
    sha1: "",
    sha256: "",
    sha512: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [fileError, setFileError] = useState("")

  const generateHashes = async () => {
    if (!input) return

    setIsGenerating(true)
    try {
      const result = await computeHashes(input)
      setFileName("")
      setHashes(result)
    } finally {
      setIsGenerating(false)
    }
  }

  const hashFile = async (file: File) => {
    setFileError("")

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
      )
      return
    }

    setIsGenerating(true)
    try {
      const buffer = await file.arrayBuffer()
      const result = await generateHashesFromBuffer(buffer)
      setInput("")
      setFileName(file.name)
      setHashes(result)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) hashFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) hashFile(file)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Hash Generator</CardTitle>
        <CardDescription>Generate MD5, SHA-1, SHA-256, and SHA-512 hashes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter text to hash..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setFileName("")
            }}
            className="min-h-32"
          />
          <Button onClick={generateHashes} disabled={!input || isGenerating}>
            {isGenerating ? "Generating..." : "Generate Hashes"}
          </Button>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {fileName ? `Hashed file: ${fileName}` : "Drag and drop a file here, or click to select one"}
          </p>
          <input type="file" className="hidden" onChange={handleFileSelect} />
        </label>
        {fileError && <p className="text-sm text-destructive">{fileError}</p>}

        <Tabs defaultValue="md5">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="md5">MD5</TabsTrigger>
            <TabsTrigger value="sha1">SHA-1</TabsTrigger>
            <TabsTrigger value="sha256">SHA-256</TabsTrigger>
            <TabsTrigger value="sha512">SHA-512</TabsTrigger>
          </TabsList>

          {Object.entries(hashes).map(([algorithm, hash]) => (
            <TabsContent key={algorithm} value={algorithm} className="relative">
              <div className="bg-muted p-4 rounded-md overflow-x-auto">
                <pre className="text-sm break-all whitespace-pre-wrap">{hash || "Hash will appear here"}</pre>
              </div>
              {hash && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(hash)}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy to clipboard</span>
                </Button>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
