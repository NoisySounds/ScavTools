"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { JwtTokenHighlight } from "@/components/tools/jwt-token-highlight"
import { getJwtStructureWarning } from "@/lib/jwt-validate"

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(" ")
}

function expiryStatus(expSeconds: number): { expired: boolean; label: string } {
  const diffMs = expSeconds * 1000 - Date.now()
  if (diffMs <= 0) {
    return { expired: true, label: `Expired ${formatDuration(diffMs)} ago` }
  }
  return { expired: false, label: `Expires in ${formatDuration(diffMs)}` }
}

export function JwtDecoder() {
  const [jwt, setJwt] = useState("")
  const [decodedHeader, setDecodedHeader] = useState<any>(null)
  const [decodedPayload, setDecodedPayload] = useState<any>(null)
  const [error, setError] = useState("")
  const [copiedHeader, setCopiedHeader] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)

  const decodeJwt = () => {
    try {
      setError("")

      if (!jwt) {
        setDecodedHeader(null)
        setDecodedPayload(null)
        return
      }

      const structureWarning = getJwtStructureWarning(jwt)
      if (structureWarning) {
        throw new Error(structureWarning)
      }

      const parts = jwt.split(".")

      // Decode header
      const headerBase64 = parts[0]
      const headerJson = atob(headerBase64.replace(/-/g, "+").replace(/_/g, "/"))
      const header = JSON.parse(headerJson)
      setDecodedHeader(header)

      // Decode payload
      const payloadBase64 = parts[1]
      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
      const payload = JSON.parse(payloadJson)
      setDecodedPayload(payload)

      // Check if token is expired
      if (payload.exp) {
        const expiryDate = new Date(payload.exp * 1000)
        const now = new Date()
        if (now > expiryDate) {
          setError(`Token expired on ${expiryDate.toLocaleString()}`)
        }
      }
    } catch (err) {
      setError((err as Error).message)
      setDecodedHeader(null)
      setDecodedPayload(null)
    }
  }

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  const copyHeader = () => {
    if (!decodedHeader) return
    navigator.clipboard.writeText(formatJson(decodedHeader))
    setCopiedHeader(true)
    setTimeout(() => setCopiedHeader(false), 2000)
  }

  const copyPayload = () => {
    if (!decodedPayload) return
    navigator.clipboard.writeText(formatJson(decodedPayload))
    setCopiedPayload(true)
    setTimeout(() => setCopiedPayload(false), 2000)
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>JWT Decoder</CardTitle>
        <CardDescription>Decode and verify JSON Web Tokens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Textarea
            placeholder="Paste your JWT here..."
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            className="font-mono text-sm min-h-24"
          />
          <Button onClick={decodeJwt} disabled={!jwt}>
            Decode
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {(decodedHeader || decodedPayload) && <JwtTokenHighlight token={jwt} />}

        {(decodedHeader || decodedPayload) && (
          <Tabs defaultValue="payload">
            <TabsList>
              <TabsTrigger value="payload">Payload</TabsTrigger>
              <TabsTrigger value="header">Header</TabsTrigger>
            </TabsList>

            <TabsContent value="payload">
              <div className="relative bg-muted p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">{decodedPayload ? formatJson(decodedPayload) : "No payload data"}</pre>
                {decodedPayload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={copyPayload}
                  >
                    {copiedPayload ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="sr-only">Copy payload</span>
                  </Button>
                )}
              </div>
              {decodedPayload?.exp && (
                <div className="mt-4 text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={expiryStatus(decodedPayload.exp).expired ? "destructive" : "default"}>
                      {expiryStatus(decodedPayload.exp).expired ? "Expired" : "Valid"}
                    </Badge>
                    <span>{expiryStatus(decodedPayload.exp).label}</span>
                  </div>
                  <p>
                    <strong>Expires:</strong> {new Date(decodedPayload.exp * 1000).toLocaleString()}
                  </p>
                  {decodedPayload.iat && (
                    <p>
                      <strong>Issued At:</strong> {new Date(decodedPayload.iat * 1000).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="header">
              <div className="relative bg-muted p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">{decodedHeader ? formatJson(decodedHeader) : "No header data"}</pre>
                {decodedHeader && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={copyHeader}
                  >
                    {copiedHeader ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="sr-only">Copy header</span>
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
