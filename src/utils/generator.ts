import type {
  GenerationSettings,
  Party,
  PaymentSample,
  PersonProfile,
  SamplerState,
  SourceEntry,
} from '../features/sampler/types'

const xmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomInteger(min: number, max: number) {
  const lower = Math.ceil(min)
  const upper = Math.floor(max)
  return Math.floor(Math.random() * (upper - lower + 1)) + lower
}

function randomAmount(min: number, max: number) {
  const raw = Math.random() * (max - min) + min
  return Number(raw.toFixed(2))
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => xmlEscapes[character])
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildIban() {
  const bankCode = String(randomInteger(1000, 9999))
  const accountNumber = String(randomInteger(1000000000, 9999999999))
  return `LV97BANK${bankCode}${accountNumber}`
}

function normalizeCountry(country: string) {
  const trimmed = country.trim()
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

function hasBadActor(entries: SourceEntry[]) {
  return entries.some((entry) => entry.isBadActor)
}

function buildPerson(pool: SamplerState['datasets']): PersonProfile {
  const givenName = randomItem(pool.names)
  const surname = randomItem(pool.surnames)
  const sourceEntries = [givenName, surname]
  return {
    id: crypto.randomUUID(),
    givenName: givenName.value,
    surname: surname.value,
    fullName: `${givenName.value} ${surname.value}`,
    sourceEntries,
    isBadActor: hasBadActor(sourceEntries),
  }
}

function buildPredefinedPerson(pool: SamplerState['datasets']) : PersonProfile {
  const fullName = randomItem(pool.people)
  const sourceEntries = [fullName]
  return {
    id: crypto.randomUUID(),
    givenName: 'intentionally empty',
    surname: 'intentionally empty',
    fullName: fullName.value,
    sourceEntries:sourceEntries,
    isBadActor: hasBadActor(sourceEntries),
  }
}

export function validateGenerationInputs(state: SamplerState): string[] {
  const messages: string[] = []
  const requiredDatasetKinds = [
    'names',
    'surnames',
    'companies',
    'bics',
    'addresses',
    'countries',
    'narratives',
  ] as const

  for (const kind of requiredDatasetKinds) {
    if (state.datasets[kind].length === 0) {
      messages.push(`Load ${kind} before generating samples.`)
    }
  }

  if (state.generationSettings.amountMin > state.generationSettings.amountMax) {
    messages.push('Minimum amount must be less than or equal to maximum amount.')
  }

  if (state.generationSettings.personCount < 2) {
    messages.push('Generate at least 2 people to create distinct debtor and creditor pairs.')
  }

  if (state.generationSettings.paymentCount < 1) {
    messages.push('Generate at least 1 payment sample.')
  }

  return messages
}

export function getPredefinedPersons(
    datasets: SamplerState['datasets'],
) {
  return Array.from({length: datasets.people.length}, () =>
      buildPredefinedPerson(datasets)
  )
}

export function generatePersons(
  datasets: SamplerState['datasets'],
  settings: GenerationSettings,
) {
  return Array.from({ length: settings.personCount }, () =>
    buildPerson(datasets),
  )
}

function buildPartyFromPerson(
  person: PersonProfile,
  datasets: SamplerState['datasets'],
): Party {
  const bic = randomItem(datasets.bics)
  const address = randomItem(datasets.addresses)
  const country = randomItem(datasets.countries)
  const sourceEntries = [...person.sourceEntries, bic, address, country]

  return {
    id: person.id,
    name: person.fullName,
    bic: bic.value,
    address: address.value,
    country: normalizeCountry(country.value),
    iban: buildIban(),
    type: 'person',
    sourceEntries,
    isBadActor: person.isBadActor || hasBadActor(sourceEntries),
  }
}

function buildCompanyParty(datasets: SamplerState['datasets']): Party {
  const company = randomItem(datasets.companies)
  const bic = randomItem(datasets.bics)
  const address = randomItem(datasets.addresses)
  const country = randomItem(datasets.countries)
  const sourceEntries = [company, bic, address, country]

  return {
    id: crypto.randomUUID(),
    name: company.value,
    bic: bic.value,
    address: address.value,
    country: normalizeCountry(country.value),
    iban: buildIban(),
    type: 'company',
    sourceEntries,
    isBadActor: hasBadActor(sourceEntries),
  }
}

function buildDebtorAndCreditor(
  persons: PersonProfile[],
  datasets: SamplerState['datasets'],
) {
  const debtorIsCompany = Math.random() > 0.55
  const creditorIsCompany = Math.random() > 0.45

  const debtor = debtorIsCompany
    ? buildCompanyParty(datasets)
    : buildPartyFromPerson(randomItem(persons), datasets)

  const creditor = creditorIsCompany
    ? buildCompanyParty(datasets)
    : buildPartyFromPerson(randomItem(persons), datasets)

  if (debtor.name === creditor.name) {
    return buildDebtorAndCreditor(persons, datasets)
  }

  return { debtor, creditor }
}

function buildSepaXml(payment: Omit<PaymentSample, 'xml' | 'fileName'>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${escapeXml(payment.messageId)}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>${escapeXml(payment.id)}</InstrId>
        <EndToEndId>${escapeXml(payment.id)}</EndToEndId>
        <TxId>${escapeXml(payment.id)}</TxId>
      </PmtId>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>INST</Cd>
        </LclInstrm>
      </PmtTpInf>
      <IntrBkSttlmAmt Ccy="${escapeXml(payment.currency)}">${payment.amount.toFixed(2)}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${payment.settlementDate}</IntrBkSttlmDt>
      <Dbtr>
        <Nm>${escapeXml(payment.debtor.name)}</Nm>
        <PstlAdr>
          <AdrLine>${escapeXml(payment.debtor.address)}</AdrLine>
          <Ctry>${escapeXml(payment.debtor.country)}</Ctry>
        </PstlAdr>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${escapeXml(payment.debtor.iban)}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>${escapeXml(payment.debtor.bic)}</BICFI>
        </FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId>
          <BICFI>${escapeXml(payment.creditor.bic)}</BICFI>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>${escapeXml(payment.creditor.name)}</Nm>
        <PstlAdr>
          <AdrLine>${escapeXml(payment.creditor.address)}</AdrLine>
          <Ctry>${escapeXml(payment.creditor.country)}</Ctry>
        </PstlAdr>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${escapeXml(payment.creditor.iban)}</IBAN>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>${escapeXml(payment.remittanceInformation)}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`
}

export function generatePayments(
  persons: PersonProfile[],
  datasets: SamplerState['datasets'],
  settings: GenerationSettings,
) {
  return Array.from({ length: settings.paymentCount }, (_, index) => {
    const { debtor, creditor } = buildDebtorAndCreditor(persons, datasets)
    const narrative = randomItem(datasets.narratives)
    const paymentId = `SCTINST-${Date.now()}-${index + 1}`
    const badActorIds = Array.from(new Set(
      [...debtor.sourceEntries, ...creditor.sourceEntries, narrative]
        .filter((entry) => entry.isBadActor)
        .map((entry) => entry.id),
    ))
    const payment: Omit<PaymentSample, 'xml' | 'fileName'> = {
      id: paymentId,
      messageId: `MSG-${Date.now()}-${index + 1}`,
      amount: randomAmount(settings.amountMin, settings.amountMax),
      currency: settings.currency,
      settlementDate: new Date().toISOString().slice(0, 10),
      debtor,
      creditor,
      remittanceInformation: narrative.value,
      sourceEntries: [narrative],
      badActorIds,
    }
    const xml = buildSepaXml(payment)

    return {
      ...payment,
      xml,
      fileName: `${String(index + 1).padStart(4, '0')}-${slugify(payment.messageId)}.xml`,
    }
  })
}
