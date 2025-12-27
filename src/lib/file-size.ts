type FileSizeOptions = {
  bytesLabel?: string
  precisionKb?: number
  precisionMb?: number
  unknownLabel?: string
}

export function formatFileSize(
  bytes: number | null | undefined,
  options: FileSizeOptions = {},
): string {
  const {
    bytesLabel = 'B',
    precisionKb = 1,
    precisionMb = 1,
    unknownLabel,
  } = options

  if (bytes === null || bytes === undefined || bytes <= 0) {
    return unknownLabel ?? `${bytes ?? 0} ${bytesLabel}`
  }

  if (bytes < 1024) return `${bytes} ${bytesLabel}`
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(precisionKb)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(precisionMb)} MB`
}
