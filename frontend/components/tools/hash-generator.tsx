"use client"

import { useState } from "react"
import { Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateHashes as computeHashes } from "@/lib/hash"

export function HashGenerator() {
  const [input, setInput] = useState("")
  const [hashes, setHashes] = useState<Record<string, string>>({
    md5: "",
    sha1: "",
    sha256: "",
    sha512: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const generateHashes = async () => {
    if (!input) return

    setIsGenerating(true)
    try {
      const result = await computeHashes(input)
      setHashes(result)
    } finally {
      setIsGenerating(false)
    }
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
            onChange={(e) => setInput(e.target.value)}
            className="min-h-32"
          />
          <Button onClick={generateHashes} disabled={!input || isGenerating}>
            {isGenerating ? "Generating..." : "Generate Hashes"}
          </Button>
        </div>

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
