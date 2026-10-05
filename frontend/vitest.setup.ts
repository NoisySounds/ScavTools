import { webcrypto } from "node:crypto"

// jsdom does not implement SubtleCrypto, so borrow Node's for hash tests.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  })
}