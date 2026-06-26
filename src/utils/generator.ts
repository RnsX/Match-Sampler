import type {
  CustomerSide,
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

function randomOptionalItem<T>(items: T[]): T | null {
  return items.length > 0 ? randomItem(items) : null
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

function countBadActors(entries: SourceEntry[]) {
  return entries.filter((entry) => entry.isBadActor).length
}

function partyHasBadActor(party: Party) {
  return hasBadActor(party.sourceEntries)
}

function withCustomerSideBic(party: Party, bicCode: string): Party {
  const sourceEntries = party.sourceEntries.filter((entry) => entry.value !== party.bic)

  return {
    ...party,
    bic: bicCode,
    sourceEntries,
    isBadActor: hasBadActor(sourceEntries),
  }
}

function buildPerson(pool: SamplerState['datasets'], index = 0): PersonProfile {
  const givenName = randomOptionalItem(pool.names)
  const surname = randomOptionalItem(pool.surnames)
  const sourceEntries = [givenName, surname].filter((entry): entry is SourceEntry =>
    Boolean(entry),
  )
  const generatedName = `Synthetic Person ${index + 1}`
  const fullName =
    [givenName?.value, surname?.value].filter(Boolean).join(' ') || generatedName

  return {
    id: crypto.randomUUID(),
    givenName: givenName?.value ?? generatedName,
    surname: surname?.value ?? '',
    fullName,
    sourceEntries,
    isBadActor: hasBadActor(sourceEntries),
  }
}

function buildPredefinedPerson(fullName: SourceEntry): PersonProfile {
  const sourceEntries = [fullName]
  return {
    id: crypto.randomUUID(),
    givenName: 'intentionally empty',
    surname: 'intentionally empty',
    fullName: fullName.value,
    sourceEntries,
    isBadActor: hasBadActor(sourceEntries),
  }
}

export function validateGenerationInputs(
  state: SamplerState,
  options: { requireCustomerSideBicCode?: boolean } = {},
): string[] {
  const messages: string[] = []

  if (state.generationSettings.amountMin > state.generationSettings.amountMax) {
    messages.push('Minimum amount must be less than or equal to maximum amount.')
  }

  if (state.generationSettings.personCount < 2) {
    messages.push('Generate at least 2 people to create distinct debtor and creditor pairs.')
  }

  if (state.generationSettings.paymentCount < 1) {
    messages.push('Generate at least 1 payment sample.')
  }

  if (
    options.requireCustomerSideBicCode &&
    state.generationSettings.customerSideBicCode.trim().length === 0
  ) {
    messages.push('Enter a customer side BIC code before generating samples.')
  }

  return messages
}

export function getPredefinedPersons(datasets: SamplerState['datasets']) {
  return datasets.people.map(buildPredefinedPerson)
}

export function generatePersons(
  datasets: SamplerState['datasets'],
  settings: GenerationSettings,
) {
  return Array.from({ length: settings.personCount }, (_item, index) =>
    buildPerson(datasets, index),
  )
}

function buildPartyFromPerson(
  person: PersonProfile,
  datasets: SamplerState['datasets'],
): Party {
  const bic = randomOptionalItem(datasets.bics)
  const address = randomOptionalItem(datasets.addresses)
  const country = randomOptionalItem(datasets.countries)
  const sourceEntries = [person.sourceEntries, bic, address, country]
    .flat()
    .filter((entry): entry is SourceEntry => Boolean(entry))

  return {
    id: person.id,
    name: person.fullName,
    bic: bic?.value ?? '',
    address: address?.value ?? '',
    country: country ? normalizeCountry(country.value) : '',
    iban: buildIban(),
    type: 'person',
    sourceEntries,
    isBadActor: person.isBadActor || hasBadActor(sourceEntries),
  }
}

function buildCompanyParty(datasets: SamplerState['datasets']): Party {
  const company = randomOptionalItem(datasets.companies)
  const bic = randomOptionalItem(datasets.bics)
  const address = randomOptionalItem(datasets.addresses)
  const country = randomOptionalItem(datasets.countries)
  const sourceEntries = [company, bic, address, country].filter(
    (entry): entry is SourceEntry => Boolean(entry),
  )

  return {
    id: crypto.randomUUID(),
    name: company?.value ?? 'Synthetic Company',
    bic: bic?.value ?? '',
    address: address?.value ?? '',
    country: country ? normalizeCountry(country.value) : '',
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
  const canUsePersons = persons.length > 0
  const canUseCompanies = datasets.companies.length > 0 || !canUsePersons
  const debtorIsCompany = canUseCompanies && (!canUsePersons || Math.random() > 0.55)
  const creditorIsCompany = canUseCompanies && (!canUsePersons || Math.random() > 0.45)

  const debtor =
    debtorIsCompany || !canUsePersons
      ? buildCompanyParty(datasets)
      : buildPartyFromPerson(randomItem(persons), datasets)

  const creditor =
    creditorIsCompany || !canUsePersons
      ? buildCompanyParty(datasets)
      : buildPartyFromPerson(randomItem(persons), datasets)

  if (debtor.name === creditor.name) {
    creditor.name = `${creditor.name} Counterparty`
  }

  return { debtor, creditor }
}

function capEntryBadActors(
  entries: SourceEntry[],
  allowedBadActorId: string | null,
  keepAllowedBadActor: boolean,
) {
  let hasKeptAllowedBadActor = !keepAllowedBadActor

  return entries.map((entry) => {
    if (!entry.isBadActor) {
      return entry
    }

    if (entry.id === allowedBadActorId && !hasKeptAllowedBadActor) {
      hasKeptAllowedBadActor = true
      return entry
    }

    return { ...entry, isBadActor: false }
  })
}

function capPartyBadActors(
  party: Party,
  allowedBadActorId: string | null,
  keepAllowedBadActor: boolean,
): Party {
  const sourceEntries = capEntryBadActors(
    party.sourceEntries,
    allowedBadActorId,
    keepAllowedBadActor,
  )

  return {
    ...party,
    sourceEntries,
    isBadActor: hasBadActor(sourceEntries),
  }
}

function capPaymentBadActors(
  debtor: Party,
  creditor: Party,
  narrative: SourceEntry | null,
  customerSide: CustomerSide,
) {
  const customerParty = customerSide === 'debit' ? debtor : creditor
  const nonCustomerParty = customerSide === 'debit' ? creditor : debtor
  const badActorIds = Array.from(
    new Set(
      [...nonCustomerParty.sourceEntries, narrative]
        .filter((entry): entry is SourceEntry => Boolean(entry?.isBadActor))
        .map((entry) => entry.id),
    ),
  )
  const allowedBadActorId = badActorIds[0] ?? null
  const cappedCustomerParty = capPartyBadActors(customerParty, null, false)
  const cappedNonCustomerParty = capPartyBadActors(nonCustomerParty, allowedBadActorId, true)
  const keptInNonCustomerParty = cappedNonCustomerParty.sourceEntries.some(
    (entry) => entry.isBadActor,
  )
  const cappedNarrative = narrative
    ? capEntryBadActors([narrative], allowedBadActorId, !keptInNonCustomerParty)[0]
    : null
  const cappedDebtor = customerSide === 'debit' ? cappedCustomerParty : cappedNonCustomerParty
  const cappedCreditor = customerSide === 'credit' ? cappedCustomerParty : cappedNonCustomerParty
  const cappedBadActorIds = Array.from(
    new Set(
      [...cappedDebtor.sourceEntries, ...cappedCreditor.sourceEntries, cappedNarrative]
        .filter((entry): entry is SourceEntry => Boolean(entry?.isBadActor))
        .map((entry) => entry.id),
    ),
  )

  return {
    debtor: cappedDebtor,
    creditor: cappedCreditor,
    narrative: cappedNarrative,
    badActorIds: cappedBadActorIds.slice(0, 1),
  }
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
      <AccptncDtTm>${new Date().toISOString()}</AccptncDtTm>
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
        <Ustrd>${escapeXml(payment.remittanceInformation)} | has_bad_actors:${payment.badActorIds.length}</Ustrd>
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
    const parties = buildDebtorAndCreditor(persons, datasets)
    const customerSideBicCode = settings.customerSideBicCode.trim().toUpperCase()
    const debtor =
      settings.customerSide === 'debit'
        ? withCustomerSideBic(parties.debtor, customerSideBicCode)
        : parties.debtor
    const creditor =
      settings.customerSide === 'credit'
        ? withCustomerSideBic(parties.creditor, customerSideBicCode)
        : parties.creditor
    const narrative = randomOptionalItem(datasets.narratives)
    const capped = capPaymentBadActors(debtor, creditor, narrative, settings.customerSide)
    const paymentId = `SCTINST-${Date.now()}-${index + 1}`
    const badActorIds = capped.badActorIds
    const payment: Omit<PaymentSample, 'xml' | 'fileName'> = {
      id: paymentId,
      messageId: `MSG-${Date.now()}-${index + 1}`,
      amount: randomAmount(settings.amountMin, settings.amountMax),
      currency: settings.currency,
      settlementDate: new Date().toISOString().slice(0, 10),
      debtor: capped.debtor,
      creditor: capped.creditor,
      remittanceInformation: capped.narrative?.value ?? '',
      sourceEntries: capped.narrative ? [capped.narrative] : [],
      badActorIds,
    }
    if (
      countBadActors([
        ...payment.debtor.sourceEntries,
        ...payment.creditor.sourceEntries,
        ...payment.sourceEntries,
      ]) > 1
    ) {
      throw new Error('Generated payment contains more than one bad actor.')
    }
    const customerParty =
      settings.customerSide === 'debit' ? payment.debtor : payment.creditor
    if (partyHasBadActor(customerParty)) {
      throw new Error('Generated payment contains a bad actor on the customer side.')
    }
    const xml = buildSepaXml(payment)

    return {
      ...payment,
      xml,
      fileName: `${String(index + 1).padStart(4, '0')}-${slugify(payment.messageId)}.xml`,
    }
  })
}
