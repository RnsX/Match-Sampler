import * as Label from '@radix-ui/react-label'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useState } from 'react'
import { datasetLabels } from '../features/sampler/constants'
import type { DatasetKind, SourceEntry } from '../features/sampler/types'

interface SourceListManagerProps {
  activeKind: DatasetKind
  datasets: Record<DatasetKind, SourceEntry[]>
  onActiveKindChange: (kind: DatasetKind) => void
  onAddEntry: (kind: DatasetKind, value: string, isBadActor: boolean) => void
  onUpdateEntry: (kind: DatasetKind, id: string, value: string) => void
  onToggleBadActor: (kind: DatasetKind, id: string) => void
  onDeleteEntry: (kind: DatasetKind, id: string) => void
}

export function SourceListManager({
  activeKind,
  datasets,
  onActiveKindChange,
  onAddEntry,
  onUpdateEntry,
  onToggleBadActor,
  onDeleteEntry,
}: SourceListManagerProps) {
  const [draftValue, setDraftValue] = useState('')
  const [draftIsBadActor, setDraftIsBadActor] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const activeDataset = datasets[activeKind]

  const resetEditing = () => {
    setEditingIndex(null)
    setEditingValue('')
  }

  return (
    <div className="source-manager">
      <div className="source-manager__sidebar">
        <span className="field-label">Editable lists</span>
        <div className="source-manager__kind-list">
          {Object.entries(datasetLabels).map(([kind, label]) => (
            <button
              key={kind}
              className="dataset-chip"
              data-active={kind === activeKind}
              type="button"
              onClick={() => {
                onActiveKindChange(kind as DatasetKind)
                resetEditing()
              }}
            >
              <span>{label}</span>
              <strong>{datasets[kind as DatasetKind].length}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="source-manager__editor">
        <div className="source-manager__header">
          <div>
            <p className="section-card__eyebrow">List preview and maintenance</p>
            <h3>{datasetLabels[activeKind]}</h3>
          </div>
          <div className="source-manager__summary">
            <span>{activeDataset.length} entries</span>
          </div>
        </div>

        <div className="source-manager__add-row">
          <div className="field">
            <Label.Root className="field-label" htmlFor="new-source-entry">
              Add entry
            </Label.Root>
            <input
              id="new-source-entry"
              placeholder={`Add ${datasetLabels[activeKind].toLowerCase()} entry`}
              type="text"
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
            />
          </div>
          <button
            className="button"
            type="button"
            onClick={() => {
              const normalized = draftValue.trim()
              if (!normalized) {
                return
              }
              onAddEntry(activeKind, normalized, draftIsBadActor)
              setDraftValue('')
              setDraftIsBadActor(false)
            }}
          >
            Add entry
          </button>
        </div>
        <label className="checkbox-field">
          <input
            checked={draftIsBadActor}
            type="checkbox"
            onChange={(event) => setDraftIsBadActor(event.target.checked)}
          />
          <span>Mark new row as bad actor</span>
        </label>

        <ScrollArea.Root className="table-scroll source-manager__table">
          <ScrollArea.Viewport>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Source row ID</th>
                  <th>Value</th>
                  <th>Bad actor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDataset.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No entries loaded yet.</td>
                  </tr>
                ) : (
                  activeDataset.map((entry, index) => {
                    const isEditing = editingIndex === index

                    return (
                      <tr key={entry.id}>
                        <td>{index + 1}</td>
                        <td className="cell-code">{entry.id}</td>
                        <td>
                          {isEditing ? (
                            <input
                              className="table-input"
                              type="text"
                              value={editingValue}
                              onChange={(event) => setEditingValue(event.target.value)}
                            />
                          ) : (
                            <span>{entry.value}</span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`pill-button ${entry.isBadActor ? 'pill-button--active' : ''}`}
                            type="button"
                            onClick={() => onToggleBadActor(activeKind, entry.id)}
                          >
                            {entry.isBadActor ? 'Tagged' : 'Not tagged'}
                          </button>
                        </td>
                        <td>
                          <div className="table-actions">
                            {isEditing ? (
                              <>
                                <button
                                  className="button button--ghost button--small"
                                  type="button"
                                  onClick={() => {
                                    const normalized = editingValue.trim()
                                    if (!normalized) {
                                      return
                                    }
                                    onUpdateEntry(activeKind, entry.id, normalized)
                                    resetEditing()
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className="button button--ghost button--small"
                                  type="button"
                                  onClick={resetEditing}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="button button--ghost button--small"
                                  type="button"
                                  onClick={() => {
                                    setEditingIndex(index)
                                    setEditingValue(entry.value)
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="button button--ghost button--small button--danger"
                                  type="button"
                                  onClick={() => {
                                    onDeleteEntry(activeKind, entry.id)
                                    if (editingIndex === index) {
                                      resetEditing()
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="scrollbar" orientation="vertical">
            <ScrollArea.Thumb className="scrollbar__thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>
    </div>
  )
}
