"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { validateStarknetAddress, shortenAddress } from "@/lib/starknet-address"
import { copyTextToClipboard } from "@/lib/clipboard"

const MIN_AFFIX_LENGTH = 2
const MAX_AFFIX_LENGTH = 20

export function AddressShortener() {
  const [address, setAddress] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [prefixLength, setPrefixLength] = useState(6)
  const [suffixLength, setSuffixLength] = useState(4)
  const [copyError, setCopyError] = useState("")

  const isValid = address.length > 0 && validateStarknetAddress(address) === null

  // Derived live from address + prefix/suffix length so the output updates
  // immediately as the sliders move, without needing to re-click "Shorten".
  const shortAddress = showResult && isValid ? shortenAddress(address, prefixLength, suffixLength) : ""

  const handleShorten = () => {
    try {
      setError("")

      const validationError = validateStarknetAddress(address)
      if (validationError) {
        throw new Error(validationError)
      }

      setShowResult(true)
    } catch (err) {
      setError((err as Error).message)
      setShowResult(false)
    }
  }

  const copyToClipboard = async () => {
    setCopyError("")
    const success = await copyTextToClipboard(shortAddress)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopyError("Couldn't copy to clipboard. Please copy the address manually.")
    }
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Contract Address Shortener</CardTitle>
        <CardDescription>Create shortened versions of blockchain addresses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="address">StarkNet Address</Label>
          <Input
            id="address"
            placeholder="0x..."
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              setError("")
              setShowResult(false)
            }}
            className="font-mono"
          />
          {address.length > 0 && validateStarknetAddress(address) && (
            <p className="text-sm text-destructive">{validateStarknetAddress(address)}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Prefix length: {prefixLength}</Label>
            <Slider
              value={[prefixLength]}
              min={MIN_AFFIX_LENGTH}
              max={MAX_AFFIX_LENGTH}
              step={1}
              onValueChange={(value) => setPrefixLength(value[0])}
            />
          </div>
          <div className="space-y-2">
            <Label>Suffix length: {suffixLength}</Label>
            <Slider
              value={[suffixLength]}
              min={MIN_AFFIX_LENGTH}
              max={MAX_AFFIX_LENGTH}
              step={1}
              onValueChange={(value) => setSuffixLength(value[0])}
            />
          </div>
        </div>

        <Button onClick={handleShorten} disabled={!isValid}>
          Shorten Address
        </Button>

        {shortAddress && (
          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <p className="font-mono">{shortAddress}</p>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
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
            {copyError && <p className="mt-2 text-sm text-destructive">{copyError}</p>}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>
            Note: In a production environment, this tool would connect to a backend service to store and retrieve
            shortened addresses.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
