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

export function parseCsvTable(content: string): { header: string[]; rows: Record<string, string>[] } {
  const matrix: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field.trim())
    field = ''
  }
  const pushRow = () => {
    pushField()
    if (row.some(Boolean)) {
      matrix.push(row)
    }
    row = []
  }

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    const nextCharacter = content[index + 1]
    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (character === ',' && !inQuotes) {
      pushField()
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      pushRow()
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
    } else {
      field += character
    }
  }
  if (field || row.length > 0) {
    pushRow()
  }

  const header = (matrix.shift() ?? []).map((column, index) =>
    column.replace(/^\uFEFF/, '') || `column_${index + 1}`,
  )
  return {
    header,
    rows: matrix.map((values) =>
      Object.fromEntries(header.map((column, index) => [column, values[index] ?? ''])),
    ),
  }
}

export function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
