import type {
  AnalysisSettings,
  BadActorListItem,
  MatchCondition,
  ResultLabel,
  ResultsTable,
} from '../features/sampler/types'

export interface AnalysisRow {
  result: Record<string, string>
  paymentId: string
  label: ResultLabel
  tags: string[]
  predictedPositive: boolean
}

export interface ConfusionMatrix {
  truePositive: number
  falsePositive: number
  trueNegative: number
  falseNegative: number
}

export interface AnalysisMetrics extends ConfusionMatrix {
  accuracy: number
  precision: number
  recall: number
  f1: number
}

function parseComparable(value: string) {
  const number = Number(value)
  return value.trim() !== '' && Number.isFinite(number) ? number : value.toLocaleLowerCase()
}

function getRightValues(
  condition: MatchCondition,
  result: Record<string, string>,
  badActors: BadActorListItem[],
  paymentId: string,
) {
  const functionMatch = condition.value.match(/^getBadActor(?:Value)?\(([^)]+)\)$/i)
  if (functionMatch) {
    const referencedIdentifier = result[functionMatch[1].trim()] ?? paymentId
    return badActors
      .filter(
        (actor) =>
          actor.payment_id === referencedIdentifier ||
          actor.message_id === referencedIdentifier,
      )
      .map((actor) => actor.value)
  }
  const fieldMatch = condition.value.match(/^result\.(.+)$/)
  return [fieldMatch ? result[fieldMatch[1]] ?? '' : condition.value]
}

function compare(leftRaw: string, rightRaw: string, operator: MatchCondition['operator']) {
  const left = parseComparable(leftRaw)
  const right = parseComparable(rightRaw)
  switch (operator) {
    case 'equals': return left === right
    case 'not_equals': return left !== right
    case 'greater_than': return left > right
    case 'greater_than_or_equal': return left >= right
    case 'less_than': return left < right
    case 'less_than_or_equal': return left <= right
    case 'contains': return String(left).includes(String(right))
    case 'not_contains': return !String(left).includes(String(right))
  }
}

function conditionMatches(
  condition: MatchCondition,
  result: Record<string, string>,
  badActors: BadActorListItem[],
  paymentId: string,
) {
  const rightValues = getRightValues(condition, result, badActors, paymentId)
  const comparisons = rightValues.map((rightValue) =>
    compare(result[condition.field] ?? '', rightValue, condition.operator),
  )
  return condition.operator === 'not_equals' || condition.operator === 'not_contains'
    ? comparisons.length > 0 && comparisons.every(Boolean)
    : comparisons.some(Boolean)
}

export function analyzeResults(
  results: ResultsTable,
  badActors: BadActorListItem[],
  settings: AnalysisSettings,
): AnalysisRow[] {
  const badActorsByIdentifier = new Map<string, BadActorListItem[]>()
  const badActorPayments = new Map<string, BadActorListItem[]>()
  const appendActor = (map: Map<string, BadActorListItem[]>, key: string, actor: BadActorListItem) => {
    if (!key) {
      return
    }

    const existingActors = map.get(key) ?? []
    if (!existingActors.some((item) => item.actor_id === actor.actor_id)) {
      map.set(key, [...existingActors, actor])
    }
  }

  badActors.forEach((actor) => {
    appendActor(badActorsByIdentifier, actor.payment_id, actor)
    appendActor(badActorsByIdentifier, actor.message_id, actor)
    appendActor(badActorPayments, actor.payment_id || actor.message_id, actor)
  })

  const analyzedIdentifiers = new Set<string>()
  const analyzedRows = results.rows.map((result) => {
    const paymentId = result[settings.paymentIdColumn] ?? ''
    if (paymentId) {
      analyzedIdentifiers.add(paymentId)
    }

    const checks = settings.conditions.map((condition) =>
      conditionMatches(condition, result, badActors, paymentId),
    )
    const predictedPositive =
      checks.length > 0 &&
      (settings.conditionMode === 'all' ? checks.every(Boolean) : checks.some(Boolean))
    const actualActors = badActorsByIdentifier.get(paymentId) ?? []
    const actualPositive = actualActors.length > 0
    const label: ResultLabel = predictedPositive
      ? actualPositive ? 'TRUE_POSITIVE' : 'FALSE_POSITIVE'
      : actualPositive ? 'FALSE_NEGATIVE' : 'TRUE_NEGATIVE'

    return {
      result,
      paymentId,
      label,
      tags: Array.from(new Set(actualActors.flatMap((actor) => actor.tags))),
      predictedPositive,
    }
  })

  const missingBadActorRows = Array.from(badActorPayments.entries())
    .filter(([, actors]) =>
      actors.every(
        (actor) =>
          !analyzedIdentifiers.has(actor.payment_id) &&
          !analyzedIdentifiers.has(actor.message_id),
      ),
    )
    .map(([paymentKey, actors]) => ({
      result: {},
      paymentId: paymentKey,
      label: 'FALSE_NEGATIVE' as ResultLabel,
      tags: Array.from(new Set(actors.flatMap((actor) => actor.tags))),
      predictedPositive: false,
    }))

  return [...analyzedRows, ...missingBadActorRows]
}

export function calculateMetrics(rows: AnalysisRow[]): AnalysisMetrics {
  const matrix = {
    truePositive: rows.filter((row) => row.label === 'TRUE_POSITIVE').length,
    falsePositive: rows.filter((row) => row.label === 'FALSE_POSITIVE').length,
    trueNegative: rows.filter((row) => row.label === 'TRUE_NEGATIVE').length,
    falseNegative: rows.filter((row) => row.label === 'FALSE_NEGATIVE').length,
  }
  const total = rows.length
  const precisionDenominator = matrix.truePositive + matrix.falsePositive
  const recallDenominator = matrix.truePositive + matrix.falseNegative
  const accuracy = total ? (matrix.truePositive + matrix.trueNegative) / total : 0
  const precision = precisionDenominator ? matrix.truePositive / precisionDenominator : 0
  const recall = recallDenominator ? matrix.truePositive / recallDenominator : 0
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
  return { ...matrix, accuracy, precision, recall, f1 }
}

export function metricsByTag(rows: AnalysisRow[]) {
  const tags = Array.from(new Set(rows.flatMap((row) => row.tags))).sort()
  return tags.map((tag) => ({
    tag,
    ...calculateMetrics(
      rows.map((row) => {
        const actualPositive = row.tags.includes(tag)
        return {
          ...row,
          label: row.predictedPositive
            ? actualPositive ? 'TRUE_POSITIVE' : 'FALSE_POSITIVE'
            : actualPositive ? 'FALSE_NEGATIVE' : 'TRUE_NEGATIVE',
        }
      }),
    ),
  }))
}

export function parseBadActorTable(table: ResultsTable): BadActorListItem[] {
  const required = ['actor_id', 'value', 'payment_id', 'message_id']
  const missing = required.filter((column) => !table.header.includes(column))
  if (missing.length > 0) {
    throw new Error(`Bad actor CSV is missing required columns: ${missing.join(', ')}`)
  }
  return table.rows.map((row) => ({
    actor_id: row.actor_id,
    value: row.value,
    payment_id: row.payment_id,
    message_id: row.message_id,
    tags: (row.tags ?? '').split(',').map((tag) => tag.trim()).filter(Boolean),
  }))
}
