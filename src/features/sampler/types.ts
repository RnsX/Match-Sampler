export type DatasetKind =
  | 'names'
  | 'surnames'
  | 'companies'
  | 'bics'
  | 'addresses'
  | 'countries'
  | 'narratives'
  | 'people'

export interface SourceEntry {
  id: string
  value: string
  isBadActor: boolean
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
}

export interface SamplerState {
  datasets: Record<DatasetKind, SourceEntry[]>
  generatedPersons: PersonProfile[]
  payments: PaymentSample[]
  generationSettings: GenerationSettings
  validationMessages: string[]
}
