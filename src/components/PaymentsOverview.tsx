import * as ScrollArea from '@radix-ui/react-scroll-area'
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
          <strong>{Math.min(payments.length, 18)}</strong>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 18).map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.messageId}</td>
                  <td>{payment.debtor.name}</td>
                  <td>{payment.creditor.name}</td>
                  <td>{formatCurrency(payment.amount, payment.currency)}</td>
                  <td>{payment.settlementDate}</td>
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
