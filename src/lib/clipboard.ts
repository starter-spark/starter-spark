export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (typeof document === "undefined" || typeof navigator === "undefined") return false

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
