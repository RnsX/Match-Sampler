export function formatCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}
