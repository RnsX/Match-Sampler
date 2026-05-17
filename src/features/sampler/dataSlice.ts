import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { initialGenerationSettings } from './constants'
import type {
  DatasetKind,
  GenerationSettings,
  PaymentSample,
  PersonProfile,
  SamplerState,
  SourceEntry,
} from './types'

function buildSourceEntry(value: string, isBadActor = false): SourceEntry {
  return {
    id: crypto.randomUUID(),
    value,
    isBadActor,
  }
}

const initialState: SamplerState = {
  datasets: {
    names: [],
    surnames: [],
    companies: [],
    bics: [],
    addresses: [],
    countries: [],
    narratives: [],
  },
  generatedPersons: [],
  payments: [],
  generationSettings: initialGenerationSettings,
  validationMessages: [],
}

const samplerSlice = createSlice({
  name: 'sampler',
  initialState,
  reducers: {
    datasetLoaded: (
      state,
      action: PayloadAction<{ kind: DatasetKind; values: string[] }>,
    ) => {
      state.datasets[action.payload.kind] = action.payload.values.map((value) =>
        buildSourceEntry(value),
      )
      state.generatedPersons = []
      state.payments = []
      state.validationMessages = []
    },
    datasetEntryAdded: (
      state,
      action: PayloadAction<{ kind: DatasetKind; value: string; isBadActor?: boolean }>,
    ) => {
      state.datasets[action.payload.kind].push(
        buildSourceEntry(action.payload.value, action.payload.isBadActor ?? false),
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
    stateReset: () => initialState,
  },
})

export const {
  datasetLoaded,
  datasetEntryAdded,
  datasetEntryBadActorToggled,
  datasetEntryRemoved,
  datasetEntryUpdated,
  generationSettingsUpdated,
  personsGenerated,
  paymentsGenerated,
  validationMessagesSet,
  stateReset,
} = samplerSlice.actions

export const samplerReducer = samplerSlice.reducer
