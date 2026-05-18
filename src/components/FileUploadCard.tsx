import * as Label from '@radix-ui/react-label'
import { useState } from 'react'
import { datasetAccept } from '../features/sampler/constants'

interface FileUploadCardProps {
  description: string
  label: string
  onFileSelected: (file: File | null, isBadActor: boolean) => void
  rowCount: number
}

export function FileUploadCard({
  description,
  label,
  onFileSelected,
  rowCount,
}: FileUploadCardProps) {
  const [sourceType, setSourceType] = useState<'good' | 'bad'>('good')

  return (
    <div className="upload-card">
      <div>
        <Label.Root className="field-label">{label}</Label.Root>
        <p className="field-hint">{description}</p>
      </div>
      <div className="source-type-toggle" role="group" aria-label={`${label} source type`}>
        <button
          className={`source-type-toggle__button ${
            sourceType === 'good' ? 'source-type-toggle__button--active' : ''
          }`}
          type="button"
          onClick={() => setSourceType('good')}
        >
          Good actors
        </button>
        <button
          className={`source-type-toggle__button ${
            sourceType === 'bad' ? 'source-type-toggle__button--active source-type-toggle__button--danger' : ''
          }`}
          type="button"
          onClick={() => setSourceType('bad')}
        >
          Bad actors
        </button>
      </div>
      <label className="file-picker">
        <input
          accept={datasetAccept}
          type="file"
          onChange={(event) => {
            onFileSelected(event.target.files?.[0] ?? null, sourceType === 'bad')
            event.currentTarget.value = ''
          }}
        />
        <span>Load CSV</span>
      </label>
      <span className="upload-card__meta">{rowCount} rows available</span>
    </div>
  )
}
