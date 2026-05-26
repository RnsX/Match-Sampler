import * as Tabs from '@radix-ui/react-tabs'
import { useState } from 'react'
import './App.css'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { DatasetOverview } from './components/DatasetOverview'
import { ExportPanel } from './components/ExportPanel'
import { FileUploadCard } from './components/FileUploadCard'
import { GenerationPanel } from './components/GenerationPanel'
import { MetricCard } from './components/MetricCard'
import { PaymentsOverview } from './components/PaymentsOverview'
import { SectionCard } from './components/SectionCard'
import { SourceListManager } from './components/SourceListManager'
import {
  datasetDescriptions,
  datasetLabels,
} from './features/sampler/constants'
import {
  datasetEntryAdded,
  datasetEntryBadActorToggled,
  datasetEntryRemoved,
  datasetEntryUpdated,
  datasetLoaded,
  generationSettingsUpdated,
  paymentsGenerated,
  personsGenerated,
  stateReset,
  validationMessagesSet,
} from './features/sampler/dataSlice'
import type { DatasetKind } from './features/sampler/types'
import { downloadBlob, parseCsvRows } from './utils/csv'
import {
  exportBadActorIds,
  exportPaymentsCsv,
  exportPaymentsZip,
} from './utils/export'
import {
  generatePayments,
  generatePersons,
  getPredefinedPersons,
  validateGenerationInputs,
} from './utils/generator'
import { formatCount } from './utils/format'

const datasetOrder: DatasetKind[] = [
  'names',
  'surnames',
  'companies',
  'bics',
  'addresses',
  'countries',
  'narratives',
  'people'
]

function App() {
  const dispatch = useAppDispatch()
  const sampler = useAppSelector((state) => state.sampler)
  const [activeTab, setActiveTab] = useState('inputs')
  const [activeDatasetKind, setActiveDatasetKind] = useState<DatasetKind>('names')

  const loadDataset = async (
    kind: DatasetKind,
    file: File | null,
    isBadActor: boolean,
  ) => {
    if (!file) {
      return
    }

    const content = await file.text()
    const values = parseCsvRows(content)
    dispatch(datasetLoaded({ kind, values, isBadActor }))
  }

  const runPersonGeneration = () => {
    const messages = validateGenerationInputs(sampler)
    if (messages.length > 0) {
      dispatch(validationMessagesSet(messages))
      setActiveTab('inputs')
      return
    }

    dispatch(personsGenerated(generatePersons(sampler.datasets, sampler.generationSettings)))
    setActiveTab('generation')
  }

  const runPaymentGeneration = () => {
    const messages = validateGenerationInputs(sampler)
    if (messages.length > 0) {
      dispatch(validationMessagesSet(messages))
      setActiveTab('inputs')
      return
    }

    const people =
      sampler.generatedPersons.length > 0
        ? [...sampler.generatedPersons, ...getPredefinedPersons(sampler.datasets)]
        : [...generatePersons(sampler.datasets, sampler.generationSettings), ...getPredefinedPersons(sampler.datasets)]

    const payments = generatePayments(
      people,
      sampler.datasets,
      sampler.generationSettings,
    )

    dispatch(personsGenerated(people))
    dispatch(paymentsGenerated(payments))
    setActiveTab('exports')
  }

  const loadedRows = Object.values(sampler.datasets).reduce(
    (total, rows) => total + rows.length,
    0,
  )
  const badActorRows = Object.values(sampler.datasets).reduce(
    (total, rows) => total + rows.filter((entry) => entry.isBadActor).length,
    0,
  )
  const readyDatasets = Object.values(sampler.datasets).filter((rows) => rows.length > 0).length
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">Screening Sampler</p>
          <h1>SEPA SCT INST Sample Generator</h1>
          <p className="hero-panel__body">
            Load names, surnames, companies, BIC codes, addresses, countries, and narratives.
            Generate synthetic people and payment messages, then export XML or base64 CSV.
          </p>
        </div>
        <div className="metrics-grid">
          <MetricCard label="Datasets loaded" value={`${readyDatasets}/${datasetOrder.length}`} tone="accent" />
          <MetricCard label="Reference rows" value={formatCount(loadedRows)} />
          <MetricCard label="Bad actor rows" value={formatCount(badActorRows)} />
          <MetricCard label="Generated payments" value={formatCount(sampler.payments.length)} tone="alert" />
        </div>
      </section>

      {sampler.validationMessages.length > 0 ? (
        <section className="alert-banner" aria-live="polite">
          <strong>Generation blocked</strong>
          <ul>
            {sampler.validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <Tabs.Root className="workspace" value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="tab-list" aria-label="Sampler workspaces">
          <Tabs.Trigger className="tab-trigger" value="inputs">
            Inputs
          </Tabs.Trigger>
          <Tabs.Trigger className="tab-trigger" value="generation">
            Generation
          </Tabs.Trigger>
          <Tabs.Trigger className="tab-trigger" value="exports">
            Exports
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="tab-panel" value="inputs">
          <SectionCard
            eyebrow="Reference data"
            title="Upload source lists"
            description="Each dataset is loaded in-browser and retained in Redux state. Files are not sent to any backend."
            actions={
              <button className="button button--ghost" type="button" onClick={() => dispatch(stateReset())}>
                Reset workspace
              </button>
            }
          >
            <div className="upload-grid">
              {datasetOrder.map((kind) => (
                <FileUploadCard
                  key={kind}
                  description={datasetDescriptions[kind]}
                  label={datasetLabels[kind]}
                  rowCount={sampler.datasets[kind].length}
                  onFileSelected={(file, isBadActor) => {
                    void loadDataset(kind, file, isBadActor)
                  }}
                />
              ))}
            </div>
            <DatasetOverview datasets={sampler.datasets} />
            <SourceListManager
              activeKind={activeDatasetKind}
              datasets={sampler.datasets}
              onActiveKindChange={setActiveDatasetKind}
              onAddEntry={(kind, value, isBadActor) => {
                dispatch(datasetEntryAdded({ kind, value, isBadActor }))
              }}
              onUpdateEntry={(kind, id, value) => {
                dispatch(datasetEntryUpdated({ kind, id, value }))
              }}
              onToggleBadActor={(kind, id) => {
                dispatch(datasetEntryBadActorToggled({ kind, id }))
              }}
              onDeleteEntry={(kind, id) => {
                dispatch(datasetEntryRemoved({ kind, id }))
              }}
            />
          </SectionCard>
        </Tabs.Content>

        <Tabs.Content className="tab-panel" value="generation">
          <SectionCard
            eyebrow="Synthetic generation"
            title="Generate synthetic data"
            description="Set counts, generate synthetic person records from the loaded lists, and create SEPA SCT INST payment messages."
          >
            <GenerationPanel
              settings={sampler.generationSettings}
              onChange={(field, value) => {
                dispatch(generationSettingsUpdated({ [field]: value }))
              }}
              onGeneratePersons={runPersonGeneration}
              onGeneratePayments={runPaymentGeneration}
            />
            <PaymentsOverview
              payments={sampler.payments}
              persons={sampler.generatedPersons}
            />
          </SectionCard>
        </Tabs.Content>

        <Tabs.Content className="tab-panel" value="exports">
          <SectionCard
            eyebrow="Export"
            title="Export generated messages"
            description="Download the generated messages as XML files in a zip archive or as a CSV file with one base64-encoded message per row."
            actions={
              sampler.payments.length > 0 ? (
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([sampler.payments[0].xml], {
                        type: 'application/xml;charset=utf-8',
                      }),
                      sampler.payments[0].fileName,
                    )
                  }
                >
                  Download sample XML
                </button>
              ) : null
            }
          >
            <ExportPanel
              disabled={sampler.payments.length === 0}
              onExportBadActorIds={() => exportBadActorIds(sampler.payments)}
              onExportCsv={() => exportPaymentsCsv(sampler.payments)}
              onExportZip={() => {
                void exportPaymentsZip(sampler.payments)
              }}
            />
            <PaymentsOverview
              payments={sampler.payments}
              persons={sampler.generatedPersons}
            />
          </SectionCard>
        </Tabs.Content>
      </Tabs.Root>
    </main>
  )
}

export default App
