import * as Label from '@radix-ui/react-label'
import { datasetAccept } from '../features/sampler/constants'

interface FileUploadCardProps {
  description: string
  label: string
  onFileSelected: (file: File | null) => void
  rowCount: number
}

export function FileUploadCard({
  description,
  label,
  onFileSelected,
  rowCount,
}: FileUploadCardProps) {
  return (
    <div className="upload-card">
      <div>
        <Label.Root className="field-label">{label}</Label.Root>
        <p className="field-hint">{description}</p>
      </div>
      <label className="file-picker">
        <input
          accept={datasetAccept}
          type="file"
          onChange={(event) => {
            onFileSelected(event.target.files?.[0] ?? null)
            event.currentTarget.value = ''
          }}
        />
        <span>Load CSV</span>
      </label>
      <span className="upload-card__meta">{rowCount} rows available</span>
    </div>
  )
}
