"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function JsonFormatter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [indentation, setIndentation] = useState("2")
  const [copied, setCopied] = useState(false)

  const formatJson = () => {
    try {
      setError("")
      if (!input) {
        setOutput("")
        return
      }

      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, Number.parseInt(indentation))
      setOutput(formatted)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const minifyJson = () => {
    try {
      setError("")
      if (!input) {
        setOutput("")
        return
      }

      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const validateJson = () => {
    try {
      setError("")
      if (!input) {
        setOutput("Please enter JSON to validate")
        return
      }

      JSON.parse(input)
      setOutput("JSON is valid")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>JSON Formatter & Validator</CardTitle>
        <CardDescription>Format, validate, and beautify JSON data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="json-input">JSON Input</Label>
          <Textarea
            id="json-input"
            placeholder="Paste your JSON here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono min-h-32"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="indentation">Indentation:</Label>
            <Select value={indentation} onValueChange={setIndentation}>
              <SelectTrigger id="indentation" className="w-20">
                <SelectValue placeholder="2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="8">8</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 ml-auto">
            <Button onClick={formatJson} disabled={!input}>
              Format
            </Button>
            <Button onClick={minifyJson} disabled={!input} variant="outline">
              Minify
            </Button>
            <Button onClick={validateJson} disabled={!input} variant="outline">
              Validate
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            <p className="font-mono text-sm">{error}</p>
          </div>
        )}

        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="flex bg-muted p-4 rounded-md overflow-x-auto">
              <pre
                aria-hidden="true"
                className="text-sm text-muted-foreground select-none pr-4 mr-4 border-r border-border text-right"
              >
                {output
                  .split("\n")
                  .map((_, i) => i + 1)
                  .join("\n")}
              </pre>
              <pre className="text-sm whitespace-pre flex-1">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
