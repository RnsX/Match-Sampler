import JSZip from 'jszip'
import type { BadActorListItem, PaymentSample, SamplerState } from '../features/sampler/types'
import { csvCell, downloadBlob } from './csv'

function encodeBase64(value: string) {
  return btoa(unescape(encodeURIComponent(value)))
}

export async function exportPaymentsZip(payments: PaymentSample[]) {
  const archive = new JSZip()
  payments.forEach((payment) => {
    archive.file(payment.fileName, payment.xml)
  })

  const blob = await archive.generateAsync({ type: 'blob' })
  downloadBlob(blob, 'screening-sampler-sepa-xml.zip')
}

export function exportPaymentsCsv(payments: PaymentSample[]) {
  const header = [
    'message_id',
    'debtor_name',
    'creditor_name',
    'amount',
    'currency',
    'payload_base64',
  ].join(',')
  const rows = payments.map((payment) =>
    [
      payment.messageId,
      payment.debtor.name,
      payment.creditor.name,
      payment.amount.toFixed(2),
      payment.currency,
      encodeBase64(payment.xml),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','),
  )

  const blob = new Blob([[header, ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  downloadBlob(blob, 'screening-sampler-sepa-messages.csv')
}

export function getBadActorIds(payments: PaymentSample[]) : BadActorListItem[] {
    return payments.flatMap((payment) =>
        [
            ...payment.debtor.sourceEntries,
            ...payment.creditor.sourceEntries,
            ...payment.sourceEntries,
        ]
            .filter((entry) => entry.isBadActor)
            .map((entry) => ({
                actor_id: entry.id,
                value: entry.value,
                payment_id: payment.id,
                message_id: payment.messageId,
                tags: entry.tags ?? [],
            })),
    )
}

export function exportBadActorIds(payments: PaymentSample[]) {
    const rows = getBadActorIds(payments)

    const header = ['actor_id', 'value', 'payment_id', 'message_id', 'tags'].join(',')
    const csvRows = rows.map((row) =>
        [row.actor_id, row.value, row.payment_id, row.message_id, row.tags.join(',')]
          .map(csvCell)
          .join(','),
    )

    const blob = new Blob([[header, ...csvRows].join('\n')], {
        type: 'text/csv;charset=utf-8',
    })
    downloadBlob(blob, 'screening-sampler-bad-actor-ids.csv')
}

export function exportAppState(state: SamplerState) {
  downloadBlob(
    new Blob([JSON.stringify(state, null, 2)], { type: 'application/json;charset=utf-8' }),
    'screening-sampler-state.json',
  )
}
