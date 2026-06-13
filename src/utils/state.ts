import { initialAnalyzerState, initialState } from '../features/sampler/dataSlice'
import type { SamplerState, SourceEntry } from '../features/sampler/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeEntry(entry: SourceEntry): SourceEntry {
  return {
    ...entry,
    tags: Array.isArray(entry.tags) ? entry.tags.filter((tag) => typeof tag === 'string') : [],
  }
}

export function parseAppState(content: string): SamplerState {
  const parsed: unknown = JSON.parse(content)
  if (!isRecord(parsed) || !isRecord(parsed.datasets) || !Array.isArray(parsed.payments)) {
    throw new Error('The selected JSON file is not a Screening Sampler state export.')
  }

  const fallback = structuredClone(initialState)
  const state = parsed as unknown as SamplerState
  for (const kind of Object.keys(fallback.datasets) as Array<keyof SamplerState['datasets']>) {
    state.datasets[kind] = Array.isArray(state.datasets[kind])
      ? state.datasets[kind].map(normalizeEntry)
      : []
  }
  state.generatedPersons = Array.isArray(state.generatedPersons)
    ? state.generatedPersons.map((person) => ({
        ...person,
        sourceEntries: person.sourceEntries.map(normalizeEntry),
      }))
    : []
  state.payments = state.payments.map((payment) => ({
    ...payment,
    sourceEntries: payment.sourceEntries.map(normalizeEntry),
    debtor: { ...payment.debtor, sourceEntries: payment.debtor.sourceEntries.map(normalizeEntry) },
    creditor: { ...payment.creditor, sourceEntries: payment.creditor.sourceEntries.map(normalizeEntry) },
  }))
  state.generationSettings = { ...fallback.generationSettings, ...state.generationSettings }
  state.validationMessages = Array.isArray(state.validationMessages) ? state.validationMessages : []
  state.analyzer = {
    ...structuredClone(initialAnalyzerState),
    ...(state.analyzer ?? {}),
    settings: {
      ...structuredClone(initialAnalyzerState.settings),
      ...(state.analyzer?.settings ?? {}),
    },
  }
  state.analyzer.results = {
    header: Array.isArray(state.analyzer.results?.header) ? state.analyzer.results.header : [],
    rows: Array.isArray(state.analyzer.results?.rows) ? state.analyzer.results.rows : [],
  }
  state.analyzer.badActors = (Array.isArray(state.analyzer.badActors) ? state.analyzer.badActors : []).map((actor) => ({
    ...actor,
    tags: Array.isArray(actor.tags) ? actor.tags : [],
  }))
  state.analyzer.settings.conditions = Array.isArray(state.analyzer.settings.conditions)
    ? state.analyzer.settings.conditions
    : []
  return state
}
