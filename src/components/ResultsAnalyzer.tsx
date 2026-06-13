import * as Label from '@radix-ui/react-label'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useMemo, useState } from 'react'
import type {
  AnalysisSettings,
  AnalyzerState,
  BadActorListItem,
  ConditionOperator,
  MatchCondition,
  ResultsTable,
} from '../features/sampler/types'
import { analyzeResults, calculateMetrics, metricsByTag } from '../utils/resultReader'
import { MetricCard } from './MetricCard'

const operators: Array<{ value: ConditionOperator; label: string }> = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'greater_than_or_equal', label: 'greater than or equal' },
  { value: 'less_than', label: 'less than' },
  { value: 'less_than_or_equal', label: 'less than or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
]

interface ResultsAnalyzerProps {
  analyzer: AnalyzerState
  onResultsLoaded: (fileName: string, table: ResultsTable) => void
  onBadActorsLoaded: (fileName: string, rows: BadActorListItem[]) => void
  onSettingsChange: (settings: Partial<AnalysisSettings>) => void
  parseResultsFile: (file: File) => Promise<ResultsTable>
  parseBadActorsFile: (file: File) => Promise<BadActorListItem[]>
  generatedBadActors: BadActorListItem[]
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export function ResultsAnalyzer({
  analyzer,
  onResultsLoaded,
  onBadActorsLoaded,
  onSettingsChange,
  parseResultsFile,
  parseBadActorsFile,
  generatedBadActors,
}: ResultsAnalyzerProps) {
  const [error, setError] = useState('')
  const rows = useMemo(
    () => analyzeResults(analyzer.results, analyzer.badActors, analyzer.settings),
    [analyzer],
  )
  const metrics = useMemo(() => calculateMetrics(rows), [rows])
  const tagMetrics = useMemo(() => metricsByTag(rows), [rows])

  const updateCondition = (id: string, patch: Partial<MatchCondition>) => {
    onSettingsChange({
      conditions: analyzer.settings.conditions.map((condition) =>
        condition.id === id ? { ...condition, ...patch } : condition,
      ),
    })
  }

  const loadResultsFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      onResultsLoaded(file.name, await parseResultsFile(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read the selected file.')
    }
  }

  const loadBadActorsFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      onBadActorsLoaded(file.name, await parseBadActorsFile(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read the selected file.')
    }
  }

  return (
    <div className="analyzer">
      {error ? <div className="alert-banner">{error}</div> : null}
      <div className="upload-grid analyzer__uploads">
        <div className="upload-card">
          <div>
            <span className="field-label">Screening results CSV</span>
            <p className="field-hint">Any tabular CSV where one row represents one payment result.</p>
          </div>
          <label className="file-picker">
            <input
              accept=".csv,text/csv"
              type="file"
              onChange={(event) => {
                void loadResultsFile(event.target.files?.[0])
                event.currentTarget.value = ''
              }}
            />
            <span>Load results CSV</span>
          </label>
          <span className="upload-card__meta">
            {analyzer.resultsFileName || 'No file loaded'} · {analyzer.results.rows.length} rows
          </span>
        </div>
        <div className="upload-card">
          <div>
            <span className="field-label">Bad actor list CSV</span>
            <p className="field-hint">Requires actor_id, value, payment_id, and message_id. Tags are optional.</p>
          </div>
          <label className="file-picker">
            <input
              accept=".csv,text/csv"
              type="file"
              onChange={(event) => {
                void loadBadActorsFile(event.target.files?.[0])
                event.currentTarget.value = ''
              }}
            />
            <span>Load bad actors CSV</span>
          </label>
          <button
            className="button button--ghost button--small"
            disabled={generatedBadActors.length === 0}
            type="button"
            onClick={() => onBadActorsLoaded('Generated payments', generatedBadActors)}
          >
            Use generated bad actors
          </button>
          <span className="upload-card__meta">
            {analyzer.badActorsFileName || 'No file loaded'} · {analyzer.badActors.length} rows
          </span>
        </div>
      </div>

      <div className="analyzer__builder">
        <div className="source-manager__header">
          <div>
            <p className="section-card__eyebrow">Match conditions</p>
            <h3>Define a screening hit</h3>
          </div>
          <button
            className="button button--ghost button--small"
            disabled={analyzer.results.header.length === 0}
            type="button"
            onClick={() =>
              onSettingsChange({
                conditions: [
                  ...analyzer.settings.conditions,
                  {
                    id: crypto.randomUUID(),
                    field: analyzer.results.header[0] ?? '',
                    operator: 'equals',
                    value: '',
                  },
                ],
              })
            }
          >
            Add condition
          </button>
        </div>
        <div className="form-grid">
          <div className="field">
            <Label.Root className="field-label">Payment ID column</Label.Root>
            <select
              value={analyzer.settings.paymentIdColumn}
              onChange={(event) => onSettingsChange({ paymentIdColumn: event.target.value })}
            >
              <option value="">Select column</option>
              {analyzer.results.header.map((column) => <option key={column}>{column}</option>)}
            </select>
          </div>
          <div className="field">
            <Label.Root className="field-label">Condition mode</Label.Root>
            <select
              value={analyzer.settings.conditionMode}
              onChange={(event) =>
                onSettingsChange({ conditionMode: event.target.value as 'all' | 'any' })
              }
            >
              <option value="all">All conditions (AND)</option>
              <option value="any">Any condition (OR)</option>
            </select>
          </div>
        </div>
        <div className="condition-list">
          {analyzer.settings.conditions.map((condition) => (
            <div className="condition-row" key={condition.id}>
              <select value={condition.field} onChange={(event) => updateCondition(condition.id, { field: event.target.value })}>
                {analyzer.results.header.map((column) => <option key={column}>{column}</option>)}
              </select>
              <select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value as ConditionOperator })}>
                {operators.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}
              </select>
              <input
                aria-label="Condition value"
                placeholder='Literal, result.column, or getBadActor(payment_id)'
                value={condition.value}
                onChange={(event) => updateCondition(condition.id, { value: event.target.value })}
              />
              <button
                className="button button--ghost button--small button--danger"
                type="button"
                onClick={() => onSettingsChange({ conditions: analyzer.settings.conditions.filter((item) => item.id !== condition.id) })}
              >
                Remove
              </button>
            </div>
          ))}
          {analyzer.settings.conditions.length === 0 ? (
            <p className="field-hint">Add at least one condition. Rows are not treated as screening hits until a condition is configured.</p>
          ) : null}
        </div>
      </div>

      <div className="metrics-grid analyzer__metrics">
        <MetricCard label="True positive" value={String(metrics.truePositive)} tone="accent" />
        <MetricCard label="False positive" value={String(metrics.falsePositive)} tone="alert" />
        <MetricCard label="True negative" value={String(metrics.trueNegative)} />
        <MetricCard label="False negative" value={String(metrics.falseNegative)} tone="alert" />
        <MetricCard label="Accuracy" value={percent(metrics.accuracy)} />
        <MetricCard label="Precision" value={percent(metrics.precision)} />
        <MetricCard label="Recall" value={percent(metrics.recall)} />
        <MetricCard label="F1 score" value={percent(metrics.f1)} tone="accent" />
      </div>

      <ScrollArea.Root className="table-scroll">
        <ScrollArea.Viewport>
          <table className="data-table">
            <thead><tr><th>Tag</th><th>TP</th><th>FP</th><th>TN</th><th>FN</th><th>Accuracy</th><th>Precision</th><th>F1</th></tr></thead>
            <tbody>
              {tagMetrics.length === 0 ? <tr><td colSpan={8}>No tagged bad actor results available.</td></tr> :
                tagMetrics.map((item) => <tr key={item.tag}><td>{item.tag}</td><td>{item.truePositive}</td><td>{item.falsePositive}</td><td>{item.trueNegative}</td><td>{item.falseNegative}</td><td>{percent(item.accuracy)}</td><td>{percent(item.precision)}</td><td>{percent(item.f1)}</td></tr>)}
            </tbody>
          </table>
        </ScrollArea.Viewport>
      </ScrollArea.Root>

      <ScrollArea.Root className="table-scroll">
        <ScrollArea.Viewport>
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Assigned label</th>
                <th>Tags</th>
                {analyzer.results.header.slice(0, 3).map((column) => <th key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={6}>No analyzed result rows available.</td></tr> :
                rows.slice(0, 50).map((row, index) => (
                  <tr key={`${row.paymentId}-${index}`}>
                    <td className="cell-code">{row.paymentId || 'Missing'}</td>
                    <td><span className={`pill ${row.label.includes('FALSE') ? 'pill--bad' : 'pill--good'}`}>{row.label.replaceAll('_', ' ')}</span></td>
                    <td>{row.tags.join(', ') || 'None'}</td>
                    {analyzer.results.header.slice(0, 3).map((column) => <td key={column}>{row.result[column]}</td>)}
                  </tr>
                ))}
            </tbody>
          </table>
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    </div>
  )
}
