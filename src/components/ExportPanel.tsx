interface ExportPanelProps {
  disabled: boolean
  onExportBadActorIds: () => void
  onExportCsv: () => void
  onExportZip: () => void
  onExportState: () => void
  onImportState: (file: File | null) => void
}

export function ExportPanel({
  disabled,
  onExportBadActorIds,
  onExportCsv,
  onExportZip,
  onExportState,
  onImportState,
}: ExportPanelProps) {
  return (
    <div className="button-row button-row--exports">
      <button
        className="button button--ghost"
        disabled={disabled}
        type="button"
        onClick={onExportBadActorIds}
      >
        Export bad actor IDs
      </button>
      <button
        className="button button--secondary"
        disabled={disabled}
        type="button"
        onClick={onExportCsv}
      >
        Export base64 CSV
      </button>
      <button className="button" disabled={disabled} type="button" onClick={onExportZip}>
        Export XML zip
      </button>
      <button className="button button--ghost" type="button" onClick={onExportState}>
        Export app state JSON
      </button>
      <label className="button button--ghost file-input-button">
        <input
          accept=".json,application/json"
          type="file"
          onChange={(event) => {
            onImportState(event.target.files?.[0] ?? null)
            event.currentTarget.value = ''
          }}
        />
        Import app state JSON
      </label>
    </div>
  )
}
