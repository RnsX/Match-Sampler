import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Label from '@radix-ui/react-label'
import { useState } from 'react'
import type { PaymentSample, PersonProfile } from '../features/sampler/types'
import { formatCurrency } from '../utils/format'

interface PaymentsOverviewProps {
  payments: PaymentSample[]
  persons: PersonProfile[]
}

export function PaymentsOverview({
  payments,
  persons,
}: PaymentsOverviewProps) {
  const [tagFilter, setTagFilter] = useState('')
  const normalizedFilter = tagFilter.trim().toLocaleLowerCase()
  const visiblePayments = payments.filter(
    (payment) =>
      !normalizedFilter ||
      [...payment.debtor.sourceEntries, ...payment.creditor.sourceEntries, ...payment.sourceEntries]
        .some((entry) =>
          entry.tags.some((tag) => tag.toLocaleLowerCase().includes(normalizedFilter)),
        ),
  )

  return (
    <div className="overview-stack">
      <div className="status-strip">
        <div>
          <span className="status-strip__label">Generated people</span>
          <strong>{persons.length}</strong>
        </div>
        <div>
          <span className="status-strip__label">Generated payments</span>
          <strong>{payments.length}</strong>
        </div>
        <div>
          <span className="status-strip__label">Preview rows</span>
          <strong>{Math.min(visiblePayments.length, 18)}</strong>
        </div>
      </div>
      <div className="field sample-filter">
        <Label.Root className="field-label" htmlFor="payment-tag-filter">
          Filter payment samples by source tag
        </Label.Root>
        <input
          id="payment-tag-filter"
          placeholder="Type a tag"
          type="search"
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
        />
      </div>

      <ScrollArea.Root className="table-scroll">
        <ScrollArea.Viewport>
          <table className="data-table">
            <thead>
              <tr>
                <th>Message</th>
                <th>Debtor</th>
                <th>Creditor</th>
                <th>Amount</th>
                <th>Settlement date</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.slice(0, 18).map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.messageId}</td>
                  <td>{payment.debtor.name}</td>
                  <td>{payment.creditor.name}</td>
                  <td>{formatCurrency(payment.amount, payment.currency)}</td>
                  <td>{payment.settlementDate}</td>
                  <td>
                    {Array.from(
                      new Set(
                        [
                          ...payment.debtor.sourceEntries,
                          ...payment.creditor.sourceEntries,
                          ...payment.sourceEntries,
                        ].flatMap((entry) => entry.tags),
                      ),
                    ).join(', ') || 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className="scrollbar" orientation="vertical">
          <ScrollArea.Thumb className="scrollbar__thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  )
}
