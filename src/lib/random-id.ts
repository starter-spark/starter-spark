let fallbackIdCounter = 0

export function randomId(): string {
  const cryptoApi = globalThis.crypto
  if ("randomUUID" in cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID()
  }
  if ("getRandomValues" in cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    const bytes = new Uint8Array(16)
    cryptoApi.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  }

  fallbackIdCounter += 1
  return `${Date.now().toString(16)}-${fallbackIdCounter.toString(16)}`
}
