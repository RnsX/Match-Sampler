import type { DatasetKind, GenerationSettings } from './types'

export const datasetLabels: Record<DatasetKind, string> = {
  names: 'Person names',
  surnames: 'Person surnames',
  companies: 'Company names',
  bics: 'BIC codes',
  addresses: 'Addresses',
  countries: 'Countries',
  narratives: 'Narratives',
  people: 'People'
}

export const datasetDescriptions: Record<DatasetKind, string> = {
  names: 'One given name per row.',
  surnames: 'One surname per row.',
  companies: 'One legal entity name per row.',
  bics: 'One valid BIC per row.',
  addresses: 'One postal address line per row.',
  countries: 'One ISO country code or country name per row.',
  narratives: 'One payment narrative or remittance text per row.',
  people: 'Predefined person names/surnames'
}

export const datasetAccept = '.csv,text/csv'

export const initialGenerationSettings: GenerationSettings = {
  personCount: 250,
  paymentCount: 120,
  amountMin: 25,
  amountMax: 25000,
  currency: 'EUR',
}
