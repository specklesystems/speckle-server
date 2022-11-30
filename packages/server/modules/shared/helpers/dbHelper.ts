/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Knex } from 'knex'

export type BatchedSelectOptions = {
  /**
   * Maximum amount of items to pull in one batch
   * Defaults to: 100
   */
  batchSize: number
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
  const { batchSize = 100 } = options || {}

  selectQuery.limit(batchSize)

  let hasMorePages = true
  let currentOffset = 0
  while (hasMorePages) {
    const q = selectQuery.clone().offset(currentOffset)
    const results = (await q) as TResult
    yield results

    if (!results.length) {
      hasMorePages = false
      break
    } else {
      currentOffset += results.length
    }
  }
}
