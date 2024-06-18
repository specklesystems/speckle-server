/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Knex } from 'knex'
import { isString } from 'lodash'

export type BatchedSelectOptions = {
  /**
   * Maximum amount of items to pull in one batch
   * Defaults to: 100
   */
  batchSize: number
  trx: Knex.Transaction
}

/**
 * Batches a SELECT query through the use of LIMIT/OFFSET
 */
export async function* executeBatchedSelect<
  TRecord extends {},
  TResult extends Array<any>
>(
  selectQuery: Knex.QueryBuilder<TRecord, TResult>,
  options?: Partial<BatchedSelectOptions>
): AsyncGenerator<TResult, void, unknown> {
  const { batchSize = 100, trx } = options || {}

  if (trx) selectQuery.transacting(trx)

  selectQuery.limit(batchSize)

  let hasMorePages = true
  let currentOffset = 0
  while (hasMorePages) {
    const q = selectQuery.clone().offset(currentOffset)
    const results = (await q) as TResult

    if (!results.length) {
      hasMorePages = false
      break
    } else {
      currentOffset += results.length
    }

    yield results
  }
}

const iso8601TimestampRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2}/

/**
 * When rows are grouped and returned as an array through array_agg(row_to_json(...)), the fields don't get formatted as they would
 * if the rows were returned directly. For example, date strings don't get converted to Date objects.
 *
 * This function will handle that.
 */
export const formatJsonArrayRecords = <V extends Record<string, unknown>>(
  records: V[]
) =>
  records.map((r) => {
    const res: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(r)) {
      // Check if value is an ISO date string or matches common date keys
      if (
        isString(value) &&
        (key.endsWith('At') || iso8601TimestampRegex.test(value))
      ) {
        res[key] = new Date(value)
      } else {
        res[key] = value
      }
    }

    return res as V
  })
