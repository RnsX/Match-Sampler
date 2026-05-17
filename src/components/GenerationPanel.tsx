import * as Label from '@radix-ui/react-label'
import type { ChangeEvent } from 'react'
import type { GenerationSettings } from '../features/sampler/types'

interface GenerationPanelProps {
  settings: GenerationSettings
  onChange: (field: keyof GenerationSettings, value: number | string) => void
  onGeneratePersons: () => void
  onGeneratePayments: () => void
}

export function GenerationPanel({
  settings,
  onChange,
  onGeneratePersons,
  onGeneratePayments,
}: GenerationPanelProps) {
  const handleNumberChange =
    (field: keyof GenerationSettings) => (event: ChangeEvent<HTMLInputElement>) =>
      onChange(field, Number(event.target.value))

  return (
    <div className="generation-layout">
      <div className="form-grid">
        <div className="field">
          <Label.Root className="field-label" htmlFor="personCount">
            Synthetic people
          </Label.Root>
          <input
            id="personCount"
            min={2}
            type="number"
            value={settings.personCount}
            onChange={handleNumberChange('personCount')}
          />
        </div>
        <div className="field">
          <Label.Root className="field-label" htmlFor="paymentCount">
            Payment samples
          </Label.Root>
          <input
            id="paymentCount"
            min={1}
            type="number"
            value={settings.paymentCount}
            onChange={handleNumberChange('paymentCount')}
          />
        </div>
        <div className="field">
          <Label.Root className="field-label" htmlFor="amountMin">
            Minimum amount
          </Label.Root>
          <input
            id="amountMin"
            min={0}
            step="0.01"
            type="number"
            value={settings.amountMin}
            onChange={handleNumberChange('amountMin')}
          />
        </div>
        <div className="field">
          <Label.Root className="field-label" htmlFor="amountMax">
            Maximum amount
          </Label.Root>
          <input
            id="amountMax"
            min={0}
            step="0.01"
            type="number"
            value={settings.amountMax}
            onChange={handleNumberChange('amountMax')}
          />
        </div>
        <div className="field">
          <Label.Root className="field-label" htmlFor="currency">
            Currency
          </Label.Root>
          <input
            id="currency"
            maxLength={3}
            type="text"
            value={settings.currency}
            onChange={(event) =>
              onChange('currency', event.target.value.toUpperCase().slice(0, 3))
            }
          />
        </div>
      </div>
      <div className="button-row button-row--generation">
        <button className="button button--secondary" type="button" onClick={onGeneratePersons}>
          Generate people
        </button>
        <button className="button" type="button" onClick={onGeneratePayments}>
          Generate payment samples
        </button>
      </div>
    </div>
  )
}
