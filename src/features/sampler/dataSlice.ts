import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { initialGenerationSettings } from './constants'
import type {
  DatasetKind,
  AnalyzerState,
  AnalysisSettings,
  BadActorListItem,
  GenerationSettings,
  PaymentSample,
  PersonProfile,
  SamplerState,
  SourceEntry,
} from './types'

function buildSourceEntry(value: string, isBadActor = false, tags: string[] = []): SourceEntry {
  return {
    id: crypto.randomUUID(),
    value,
    isBadActor,
    tags,
  }
}

export const initialAnalyzerState: AnalyzerState = {
  resultsFileName: '',
  results: { header: [], rows: [] },
  badActorsFileName: '',
  badActors: [],
  settings: {
    paymentIdColumn: '',
    conditionMode: 'all',
    conditions: [],
  },
}

export const initialState: SamplerState = {
  datasets: {
    names: [],
    surnames: [],
    companies: [],
    bics: [],
    addresses: [],
    countries: [],
    narratives: [],
    people: [],
  },
  generatedPersons: [],
  payments: [],
  generationSettings: initialGenerationSettings,
  validationMessages: [],
  analyzer: initialAnalyzerState,
}

const samplerSlice = createSlice({
  name: 'sampler',
  initialState,
  reducers: {
    datasetLoaded: (
      state,
      action: PayloadAction<{
        kind: DatasetKind
        values: string[]
        isBadActor?: boolean
        tags?: string[]
      }>,
    ) => {
      state.datasets[action.payload.kind].push(
        ...action.payload.values.map((value) =>
          buildSourceEntry(value, action.payload.isBadActor ?? false, action.payload.tags ?? []),
        ),
      )
      state.generatedPersons = []
      state.payments = []
      state.validationMessages = []
    },
    datasetEntryAdded: (
      state,
      action: PayloadAction<{ kind: DatasetKind; value: string; isBadActor?: boolean; tags?: string[] }>,
    ) => {
      state.datasets[action.payload.kind].push(
        buildSourceEntry(
          action.payload.value,
          action.payload.isBadActor ?? false,
          action.payload.tags ?? [],
        ),
      )
      state.generatedPersons = []
      state.payments = []
      state.validationMessages = []
    },
    datasetEntryUpdated: (
      state,
      action: PayloadAction<{ kind: DatasetKind; id: string; value: string }>,
    ) => {
      const entry = state.datasets[action.payload.kind].find(
        (item) => item.id === action.payload.id,
      )
      if (entry) {
        entry.value = action.payload.value
      }
      state.generatedPersons = []
      state.payments = []
      state.validationMessages = []
    },
    datasetEntryBadActorToggled: (
      state,
      action: PayloadAction<{ kind: DatasetKind; id: string }>,
    ) => {
      const entry = state.datasets[action.payload.kind].find(
        (item) => item.id === action.payload.id,
      )
      if (entry) {
        entry.isBadActor = !entry.isBadActor
      }
      state.generatedPersons = []
      state.payments = []
      state.validationMessages = []
    },
    datasetEntryTagsUpdated: (
      state,
      action: PayloadAction<{ kind: DatasetKind; id: string; tags: string[] }>,
    ) => {
      const entry = state.datasets[action.payload.kind].find(
        (item) => item.id === action.payload.id,
      )
      if (entry) {
        entry.tags = Array.from(
          new Set(action.payload.tags.map((tag) => tag.trim()).filter(Boolean)),
        )
      }
      state.generatedPersons = []
      state.payments = []
      state.validationMessages = []
    },
    datasetEntryRemoved: (
      state,
      action: PayloadAction<{ kind: DatasetKind; id: string }>,
    ) => {
      state.datasets[action.payload.kind] = state.datasets[action.payload.kind].filter(
        (item) => item.id !== action.payload.id,
      )
      state.generatedPersons = []
      state.payments = []
      state.validationMessages = []
    },
    datasetCleared: (state, action: PayloadAction<{ kind: DatasetKind }>) => {
      state.datasets[action.payload.kind] = []
      state.generatedPersons = []
      state.payments = []
      state.validationMessages = []
    },
    generationSettingsUpdated: (
      state,
      action: PayloadAction<Partial<GenerationSettings>>,
    ) => {
      state.generationSettings = {
        ...state.generationSettings,
        ...action.payload,
      }
    },
    personsGenerated: (state, action: PayloadAction<PersonProfile[]>) => {
      state.generatedPersons = action.payload
      state.validationMessages = []
    },
    paymentsGenerated: (state, action: PayloadAction<PaymentSample[]>) => {
      state.payments = action.payload
      state.validationMessages = []
    },
    validationMessagesSet: (state, action: PayloadAction<string[]>) => {
      state.validationMessages = action.payload
    },
    analyzerResultsLoaded: (
      state,
      action: PayloadAction<AnalyzerState['results'] & { fileName: string }>,
    ) => {
      state.analyzer.resultsFileName = action.payload.fileName
      state.analyzer.results = {
        header: action.payload.header,
        rows: action.payload.rows,
      }
      if (!action.payload.header.includes(state.analyzer.settings.paymentIdColumn)) {
        state.analyzer.settings.paymentIdColumn = action.payload.header[0] ?? ''
      }
    },
    analyzerBadActorsLoaded: (
      state,
      action: PayloadAction<{ fileName: string; rows: BadActorListItem[] }>,
    ) => {
      state.analyzer.badActorsFileName = action.payload.fileName
      state.analyzer.badActors = action.payload.rows
    },
    analyzerSettingsUpdated: (
      state,
      action: PayloadAction<Partial<AnalysisSettings>>,
    ) => {
      state.analyzer.settings = {
        ...state.analyzer.settings,
        ...action.payload,
      }
    },
    stateImported: (_state, action: PayloadAction<SamplerState>) => action.payload,
    stateReset: () => initialState,
  },
})

export const {
  datasetLoaded,
  datasetEntryAdded,
  datasetEntryBadActorToggled,
  datasetEntryTagsUpdated,
  datasetEntryRemoved,
  datasetEntryUpdated,
  datasetCleared,
  generationSettingsUpdated,
  personsGenerated,
  paymentsGenerated,
  validationMessagesSet,
  analyzerResultsLoaded,
  analyzerBadActorsLoaded,
  analyzerSettingsUpdated,
  stateImported,
  stateReset,
} = samplerSlice.actions

export const samplerReducer = samplerSlice.reducer
