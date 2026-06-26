import * as Label from '@radix-ui/react-label'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useState } from 'react'
import { datasetLabels } from '../features/sampler/constants'
import type { DatasetKind, SourceEntry } from '../features/sampler/types'

interface SourceListManagerProps {
  activeKind: DatasetKind
  datasets: Record<DatasetKind, SourceEntry[]>
  onActiveKindChange: (kind: DatasetKind) => void
  onAddEntry: (kind: DatasetKind, value: string, isBadActor: boolean, tags: string[]) => void
  onUpdateEntry: (kind: DatasetKind, id: string, value: string) => void
  onUpdateTags: (kind: DatasetKind, id: string, tags: string[]) => void
  onToggleBadActor: (kind: DatasetKind, id: string) => void
  onDeleteEntry: (kind: DatasetKind, id: string) => void
  onClearList: (kind: DatasetKind) => void
}

export function SourceListManager({
  activeKind,
  datasets,
  onActiveKindChange,
  onAddEntry,
  onUpdateEntry,
  onUpdateTags,
  onToggleBadActor,
  onDeleteEntry,
  onClearList,
}: SourceListManagerProps) {
  const [draftValue, setDraftValue] = useState('')
  const [draftIsBadActor, setDraftIsBadActor] = useState(false)
  const [draftTags, setDraftTags] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const activeDataset = datasets[activeKind]
  const normalizedFilter = tagFilter.trim().toLocaleLowerCase()
  const visibleDataset = activeDataset.filter(
    (entry) =>
      !normalizedFilter ||
      entry.tags.some((tag) => tag.toLocaleLowerCase().includes(normalizedFilter)),
  )

  const resetEditing = () => {
    setEditingId(null)
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
                setTagFilter('')
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
          <div className="source-manager__header-actions">
            <div className="source-manager__summary">
              <span>{activeDataset.length} entries</span>
            </div>
            <button
              className="button button--ghost button--small button--danger"
              disabled={activeDataset.length === 0}
              type="button"
              onClick={() => {
                onClearList(activeKind)
                resetEditing()
              }}
            >
              Clear list
            </button>
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
              onAddEntry(
                activeKind,
                normalized,
                draftIsBadActor,
                draftTags.split(',').map((tag) => tag.trim()).filter(Boolean),
              )
              setDraftValue('')
              setDraftIsBadActor(false)
              setDraftTags('')
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
        <div className="form-grid form-grid--compact">
          <div className="field">
            <Label.Root className="field-label" htmlFor="new-source-entry-tags">
              New row tags
            </Label.Root>
            <input
              id="new-source-entry-tags"
              placeholder="Comma-separated, optional"
              type="text"
              value={draftTags}
              onChange={(event) => setDraftTags(event.target.value)}
            />
          </div>
          <div className="field">
            <Label.Root className="field-label" htmlFor="source-tag-filter">
              Filter list by tag
            </Label.Root>
            <input
              id="source-tag-filter"
              placeholder="Type a tag"
              type="search"
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
            />
          </div>
        </div>

        <ScrollArea.Root className="table-scroll source-manager__table">
          <ScrollArea.Viewport>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Source row ID</th>
                  <th>Value</th>
                  <th>Bad actor</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDataset.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      {activeDataset.length === 0 ? 'No entries loaded yet.' : 'No entries match this tag.'}
                    </td>
                  </tr>
                ) : (
                  visibleDataset.map((entry, index) => {
                    const isEditing = editingId === entry.id

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
                          <input
                            aria-label={`Tags for ${entry.value}`}
                            className="table-input"
                            defaultValue={entry.tags.join(', ')}
                            key={`${entry.id}-${entry.tags.join(',')}`}
                            placeholder="No tags"
                            type="text"
                            onBlur={(event) => {
                              const tags = event.target.value
                                .split(',')
                                .map((tag) => tag.trim())
                                .filter(Boolean)
                              if (tags.join(',') !== entry.tags.join(',')) {
                                onUpdateTags(activeKind, entry.id, tags)
                              }
                            }}
                          />
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
                                    setEditingId(entry.id)
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
                                    if (editingId === entry.id) {
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
