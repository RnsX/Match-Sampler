interface ExportPanelProps {
  disabled: boolean
  onExportBadActorIds: () => void
  onExportCsv: () => void
  onExportZip: () => void
}

export function ExportPanel({
  disabled,
  onExportBadActorIds,
  onExportCsv,
  onExportZip,
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
    </div>
  )
}
