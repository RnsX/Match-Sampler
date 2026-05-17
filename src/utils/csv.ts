export function parseCsvRows(content: string): string[] {
  const rows: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    const nextCharacter = content[index + 1]

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && (character === '\n' || character === '\r')) {
      const normalized = current.trim()
      if (normalized) {
        rows.push(normalized.replace(/^,|,$/g, '').trim())
      }
      current = ''
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      continue
    }

    current += character
  }

  const normalized = current.trim()
  if (normalized) {
    rows.push(normalized.replace(/^,|,$/g, '').trim())
  }

  return rows
    .map((row) => row.split(',')[0]?.trim() ?? '')
    .map((row) => row.replace(/^"|"$/g, '').trim())
    .filter(Boolean)
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
