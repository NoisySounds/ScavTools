import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { md5, generateHashes, generateHashesFromBuffer } from "./hash"

const encoder = new TextEncoder()

describe("md5", () => {
  it("matches the RFC1321 test vectors", () => {
    expect(md5("")).toBe("d41d8cd98f00b204e9800998ecf8427e")
    expect(md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661")
    expect(md5("abc")).toBe("900150983cd24fb0d6963f7d28e17f72")
    expect(md5("message digest")).toBe("f96b697d7cb7938d525a2f31aaf161d0")
    expect(md5("abcdefghijklmnopqrstuvwxyz")).toBe("c3fcd3d76192e4007dfb496cca67e13b")
    expect(md5("12345678901234567890123456789012345678901234567890123456789012345678901234567890")).toBe(
      "57edf4a22be3c955ac49da2e2107b67a",
    )
  })

  it("matches node's md5 for multibyte and long input", () => {
    const reference = (input: string) => createHash("md5").update(input, "utf8").digest("hex")
    for (const input of ["café", "日本語", "a".repeat(200), "🎉 party 🎉"]) {
      expect(md5(input)).toBe(reference(input))
    }
  })

  it("spans multiple 64-byte blocks", () => {
    expect(md5("a".repeat(64))).toHaveLength(32)
    expect(md5("a".repeat(65))).toHaveLength(32)
  })
})

describe("generateHashes", () => {
  it("produces the SHA digests for a known input", async () => {
    const result = await generateHashes("abc")
    expect(result.sha1).toBe("a9993e364706816aba3e25717850c26c9cd0d89d")
    expect(result.sha256).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
    expect(result.md5).toBe("900150983cd24fb0d6963f7d28e17f72")
  })

  it("returns digests of the expected lengths", async () => {
    const result = await generateHashes("scavtools")
    expect(result.sha1).toHaveLength(40)
    expect(result.sha256).toHaveLength(64)
    expect(result.sha512).toHaveLength(128)
    expect(result.md5).toHaveLength(32)
  })

  it("matches node's sha digests for every algorithm", async () => {
    const reference = (algo: string, input: string) =>
      createHash(algo).update(input, "utf8").digest("hex")
    const result = await generateHashes("café 🎉")
    expect(result.sha1).toBe(reference("sha1", "café 🎉"))
    expect(result.sha256).toBe(reference("sha256", "café 🎉"))
    expect(result.sha512).toBe(reference("sha512", "café 🎉"))
  })

  it("hashes the empty string", async () => {
    const result = await generateHashes("")
    expect(result.md5).toBe("d41d8cd98f00b204e9800998ecf8427e")
  })
})

describe("generateHashesFromBuffer", () => {
  it("matches the text hash for ASCII input", async () => {
    const buffer = encoder.encode("abc").buffer as ArrayBuffer
    const fromBuffer = await generateHashesFromBuffer(buffer)
    const fromText = await generateHashes("abc")
    expect(fromBuffer).toEqual(fromText)
  })

  it("hashes raw bytes rather than their decoded text", async () => {
    const buffer = new Uint8Array([0xff, 0xfe, 0x00, 0x01]).buffer as ArrayBuffer
    const result = await generateHashesFromBuffer(buffer)
    expect(result.sha1).toHaveLength(40)
    expect(result.md5).toHaveLength(32)
  })

  it("handles an empty buffer", async () => {
    const result = await generateHashesFromBuffer(new ArrayBuffer(0))
    expect(result.md5).toBe("d41d8cd98f00b204e9800998ecf8427e")
  })
})