"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { copyTextToClipboard } from "@/lib/clipboard"

interface ContractFunction {
  name: string
  inputs: string[]
  outputs: string[]
}

interface ContractEvent {
  name: string
  params: string[]
}

interface ContractData {
  address: string
  name: string
  symbol: string
  totalSupply: string
  decimals: number
  functions: ContractFunction[]
  events: ContractEvent[]
}

export function StarknetReader() {
  const [contractAddress, setContractAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [contractData, setContractData] = useState<ContractData | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  // copyTextToClipboard resolves false rather than throwing when the clipboard
  // is unavailable or the write is denied, so surface that to the user.
  const copy = async (key: string, value: string, label: string) => {
    const ok = await copyTextToClipboard(value)
    if (!ok) {
      toast.error(`Could not copy ${label}`)
      return
    }
    setCopied(key)
    toast.success(`${label} copied`)
    setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500)
  }

  const fetchContractData = async () => {
    setLoading(true)
    setError("")

    try {
      // In a real implementation, this would connect to StarkNet
      // For this demo, we'll simulate the response
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock data
      setContractData({
        address: contractAddress,
        name: "MockERC20",
        symbol: "MOCK",
        totalSupply: "1000000000000000000000000",
        decimals: 18,
        functions: [
          { name: "balanceOf", inputs: ["address"], outputs: ["uint256"] },
          { name: "transfer", inputs: ["address", "uint256"], outputs: ["bool"] },
          { name: "approve", inputs: ["address", "uint256"], outputs: ["bool"] },
          { name: "transferFrom", inputs: ["address", "address", "uint256"], outputs: ["bool"] },
        ],
        events: [
          { name: "Transfer", params: ["address indexed from", "address indexed to", "uint256 value"] },
          { name: "Approval", params: ["address indexed owner", "address indexed spender", "uint256 value"] },
        ],
      })
    } catch {
      setError("Failed to fetch contract data")
      setContractData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>StarkNet Contract Reader</CardTitle>
          <Badge className="bg-purple-600 hover:bg-purple-700">StarkNet</Badge>
        </div>
        <CardDescription>Read and interact with StarkNet smart contracts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="contract-address">Contract Address</Label>
          <div className="flex gap-2">
            <Input
              id="contract-address"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Copy contract address"
              disabled={!contractAddress}
              onClick={() => copy("address", contractAddress, "Contract address")}
            >
              {copied === "address" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button onClick={fetchContractData} disabled={!contractAddress || loading}>
              {loading ? "Loading..." : "Read Contract"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {contractData && (
          <Tabs defaultValue="overview">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="grid flex-1 grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="functions">Functions</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copy(
                      "functions",
                      contractData.functions
                        .map((fn) => `${fn.name}(${fn.inputs.join(", ")}) → ${fn.outputs.join(", ")}`)
                        .join("\n"),
                      "All functions",
                    )
                  }
                >
                  {copied === "functions" ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                  Copy ABI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copy(
                      "events",
                      contractData.events
                        .map((ev) => `${ev.name}(${ev.params.join(", ")})`)
                        .join("\n"),
                      "All events",
                    )
                  }
                >
                  {copied === "events" ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                  Copy Events
                </Button>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Contract Address</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Copy contract address"
                      onClick={() => copy("address", contractData.address, "Contract address")}
                    >
                      {copied === "address" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="font-mono text-sm break-all">{contractData.address}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Copy contract name"
                      onClick={() => copy("name", contractData.name, "Contract name")}
                    >
                      {copied === "name" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p>{contractData.name}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Symbol</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Copy symbol"
                      onClick={() => copy("symbol", contractData.symbol, "Symbol")}
                    >
                      {copied === "symbol" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p>{contractData.symbol}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Decimals</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Copy decimals"
                      onClick={() => copy("decimals", String(contractData.decimals), "Decimals")}
                    >
                      {copied === "decimals" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p>{contractData.decimals}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Total Supply</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Copy total supply"
                      onClick={() => copy("supply", contractData.totalSupply, "Total supply")}
                    >
                      {copied === "supply" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="font-mono">{contractData.totalSupply}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="functions" className="space-y-4">
              <div className="space-y-2">
                {contractData.functions.map((func, index) => (
                  <div key={index} className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm">
                      {func.name}({func.inputs.join(", ")}) → {func.outputs.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <div className="space-y-2">
                {contractData.events.map((event, index) => (
                  <div key={index} className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm">
                      {event.name}({event.params.join(", ")})
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="text-sm text-muted-foreground">
          <p>Note: This tool would connect to StarkNet in a production environment to fetch real contract data.</p>
        </div>
      </CardContent>
    </Card>
  )
}
