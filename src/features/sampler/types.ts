export type DatasetKind =
  | 'names'
  | 'surnames'
  | 'companies'
  | 'bics'
  | 'addresses'
  | 'countries'
  | 'narratives'
  | 'people'

export type CustomerSide = 'debit' | 'credit'

export interface SourceEntry {
  id: string
  value: string
  isBadActor: boolean
  tags: string[]
}

export type ResultLabel =
  | 'TRUE_POSITIVE'
  | 'FALSE_POSITIVE'
  | 'TRUE_NEGATIVE'
  | 'FALSE_NEGATIVE'

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'

export interface MatchCondition {
  id: string
  field: string
  operator: ConditionOperator
  value: string
}

export interface ResultsTable {
  header: string[]
  rows: Record<string, string>[]
}

export interface BadActorListItem {
  actor_id: string
  value: string
  payment_id: string
  message_id: string
  tags: string[]
}

export interface AnalysisSettings {
  paymentIdColumn: string
  conditionMode: 'all' | 'any'
  conditions: MatchCondition[]
}

export interface AnalyzerState {
  resultsFileName: string
  results: ResultsTable
  badActorsFileName: string
  badActors: BadActorListItem[]
  settings: AnalysisSettings
}

export interface PersonProfile {
  id: string
  givenName: string
  surname: string
  fullName: string
  sourceEntries: SourceEntry[]
  isBadActor: boolean
}

export interface Party {
  id: string
  name: string
  bic: string
  address: string
  country: string
  iban: string
  type: 'person' | 'company'
  sourceEntries: SourceEntry[]
  isBadActor: boolean
}

export interface PaymentSample {
  id: string
  messageId: string
  amount: number
  currency: string
  settlementDate: string
  debtor: Party
  creditor: Party
  remittanceInformation: string
  sourceEntries: SourceEntry[]
  badActorIds: string[]
  xml: string
  fileName: string
}

export interface GenerationSettings {
  personCount: number
  paymentCount: number
  amountMin: number
  amountMax: number
  currency: string
  customerSide: CustomerSide
  customerSideBicCode: string
}

export interface SamplerState {
  datasets: Record<DatasetKind, SourceEntry[]>
  generatedPersons: PersonProfile[]
  payments: PaymentSample[]
  generationSettings: GenerationSettings
  validationMessages: string[]
  analyzer: AnalyzerState
}
