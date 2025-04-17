/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from 'knex'
import { isString } from 'lodash'
import { postgresMaxConnections } from '@/modules/shared/helpers/envHelper'
import { EnvironmentResourceError } from '@/modules/shared/errors'
import { isNonNullable, MaybeAsync } from '@speckle/shared'

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
): AsyncGenerator<Awaited<typeof selectQuery>, void, unknown> {
  const { batchSize = 100, trx } = options || {}

  if (trx) selectQuery.transacting(trx)

  selectQuery.limit(batchSize)

  let hasMorePages = true
  let currentOffset = 0
  while (hasMorePages) {
    const q = selectQuery.clone().offset(currentOffset)
    const results = (await q) as Awaited<typeof selectQuery>

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
  records
    .map((r): typeof r | undefined => {
      // PG can sometimes retuern `[null]` for an empty array_agg
      if (!r) return r

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
    .filter(isNonNullable)

export const numberOfUsedOrPendingConnections = (db: Knex) => {
  if (!(db && 'client' in db && db.client))
    throw new EnvironmentResourceError('knex is not defined or does not have a client.')

  const dbClient: Knex.Client = db.client
  if (!('pool' in dbClient && dbClient.pool))
    throw new EnvironmentResourceError('knex client does not have a connection pool')

  const pool = dbClient.pool

  return (
    pool.numUsed() +
    pool.numPendingCreates() +
    pool.numPendingValidations() +
    pool.numPendingAcquires()
  )
}

export const numberOfFreeConnections = (knex: Knex) => {
  const pgMaxConnections = postgresMaxConnections()

  const demand = numberOfUsedOrPendingConnections(knex)

  return Math.max(pgMaxConnections - demand, 0)
}

export const withTransaction = async <T>(
  operation: (args: { db: Knex }) => MaybeAsync<T>,
  params: {
    db: Knex
  }
) => {
  const { db } = params
  const trx = await db.transaction()

  try {
    const result = await operation({ db: trx })
    await trx.commit()
    return result
  } catch (e) {
    await trx.rollback()
    throw e
  }
}
