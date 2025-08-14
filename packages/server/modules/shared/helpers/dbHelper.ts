/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Knex } from 'knex'
import { postgresMaxConnections } from '@/modules/shared/helpers/envHelper'
import {
  EnvironmentResourceError,
  LogicError,
  RegionalTransactionFatalError,
  RegionalTransactionError
} from '@/modules/shared/errors'
import type { MaybeAsync } from '@speckle/shared'
import { isNonNullable } from '@speckle/shared'
import { base64Decode, base64Encode } from '@/modules/shared/helpers/cryptoHelper'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import type { SchemaConfig } from '@/modules/core/dbSchema'
import { has, isObjectLike, isString, mapValues, pick, times } from 'lodash-es'
import cryptoRandomString from 'crypto-random-string'
import { logger } from '@/observability/logging'
import { isEqual } from 'lodash-es'

export type Collection<T> = {
  cursor: string | null
  totalCount: number
  items: T[]
}

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
  operation: (args: { db: Knex; trx: Knex }) => MaybeAsync<T>,
  params: {
    db: Knex
  }
) => {
  const { db } = params
  const trx = await db.transaction()

  try {
    // db and trx are just aliases, you can use whichever is more convenient
    const result = await operation({ db: trx, trx })
    await trx.commit()
    return result
  } catch (e) {
    await trx.rollback()
    throw e
  }
}

/**
 * Encode cursor to turn it into an opaque & obfuscated value
 */
export function encodeCursor(value: string): string {
  return base64Encode(value)
}

/**
 * Decode obfuscated cursor value
 */
export function decodeCursor(value: string): string {
  return base64Decode(value)
}

export function decodeIsoDateCursor(value: string): string | null {
  const decoded = decodeCursor(value)
  if (!decoded) return null

  const date = dayjs(decoded)
  if (!date.isValid()) return null

  return date.toISOString()
}

export function encodeIsoDateCursor(date: Date | Dayjs): string {
  const str = date.toISOString()
  return encodeCursor(str)
}

export const encodeCompositeCursor = <C extends object>(val: C): string => {
  const json = JSON.stringify(val)
  return encodeCursor(json)
}

export const decodeCompositeCursor = <C extends object>(
  cursor: MaybeNullOrUndefined<string>,
  /**
   * Users can feed in any kind of garbage into the cursor, this predicate will validate
   * that its the expected format and if it isn't, null will be returned
   */
  validate: (obj: unknown) => boolean
): Nullable<C> => {
  if (!cursor) return null

  let decodedJson: unknown
  try {
    decodedJson = JSON.parse(decodeCursor(cursor))
  } catch {
    // swallow - user error
    return null
  }

  if (validate(decodedJson)) {
    return decodedJson as C
  }

  return null
}

// This is to allow custom column/alias support for compositeCursorTools() - we don't want
// to force the user to pass in the entire schema config, just the data we need
type LimitedSchemaConfig = Pick<SchemaConfig<any, any, any>, 'col'>

/**
 * Simplifies working with composite cursors in SQL queries. Composite cursors are better because they
 * allow duplicate values (e.g. updatedAt date) in different rows
 */
export const compositeCursorTools = <
  Config extends LimitedSchemaConfig,
  SelectedCols extends Array<keyof Config['col']>
>(args: {
  /**
   * Db table schema config OR in case of aliased columns - manual column mapping between final aliases
   * as keys and table-prefixed column names as values
   */
  schema: Config
  /**
   * Order of columns matters - put the primary ordering column first (e.g. updatedAt), then the secondary
   * ones like the ID.
   */
  cols: SelectedCols
}) => {
  type Cursor = {
    [Col in SelectedCols[number]]: string
  }

  type CursorRecord = {
    [Col in SelectedCols[number]]: string | Date | number | boolean
  }

  const encode = (val: Cursor) => encodeCompositeCursor(val)
  const decode = (cursor: MaybeNullOrUndefined<string>): Nullable<Cursor> =>
    decodeCompositeCursor(
      cursor,
      (c) => isObjectLike(c) && args.cols.every((col) => has(c, col))
    )

  /**
   * Invoke this on the knex querybuilder to filter the query by the cursor and apply
   * appropriate ordering
   */
  const applyCursorSortAndFilter = <Query extends Knex.QueryBuilder>(params: {
    query: Query
    /**
     * If falsy, filter will be skipped
     */
    cursor: MaybeNullOrUndefined<Cursor | string>
    /**
     * How the results are sorted. Descending by default.
     */
    sort?: 'desc' | 'asc'
  }) => {
    const { query, sort = 'desc' } = params

    // Apply orderBy for each cursor column w/ proper sort direction
    args.cols.forEach((col) => {
      query.orderBy(args.schema.col[col], sort)
    })

    const cursor = isString(params.cursor) ? decode(params.cursor) : params.cursor
    if (!cursor) return query

    // Apply cursor filter
    const colCount = args.cols.length

    const sql = `(${times(colCount, () => '??').join(', ')}) ${
      sort === 'desc' ? '<' : '>'
    } (${times(colCount, () => '?').join(', ')})` // string like (??, ??) < (?, ?)

    // e.g. WHERE (table.updatedAt, table.id) < ('2023-10-01T00:00:00.000Z', '12345')
    query.andWhereRaw(sql, [
      ...args.cols.map((col) => args.schema.col[col]),
      ...args.cols.map((col) => cursor[col].toString())
    ])

    return query
  }

  /**
   * Feed in an entire page of items and this will build the next cursor accordingly
   */
  const resolveNewCursor = (items: Array<CursorRecord>) => {
    if (!items.length) return null
    const lastItem = items.at(-1)
    if (!lastItem) return null

    const cursor: Cursor = mapValues(pick(lastItem, args.cols), (value) => {
      if (value instanceof Date) {
        return value.toISOString()
      }

      return `${value}`
    })

    return encode(cursor)
  }

  return {
    encode,
    decode,
    applyCursorSortAndFilter,
    resolveNewCursor
  }
}

export const prepareTransaction = async (db: Knex): Promise<string> => {
  if (!db.isTransaction) {
    throw new LogicError('Cannot PREPARE postgres operation outside of a transaction')
  }

  const preparedId = cryptoRandomString({ length: 10 })

  await db.raw(`PREPARE TRANSACTION '${preparedId}';`)

  return preparedId
}

export const commitPreparedTransaction = async (
  db: Knex,
  gid: string
): Promise<void> => {
  await db.raw(`COMMIT PREPARED '${gid}';`)
}

export const rollbackPreparedTransaction = async (
  db: Knex,
  gid: string
): Promise<void> => {
  await db.raw(`ROLLBACK PREPARED '${gid}';`)
}

export const replicateQuery = <T, U>(
  dbs: Knex[],
  factory: ({ db }: { db: Knex }) => (params: T) => Promise<U>
) => {
  return async (params: T) => {
    const preparedTransactions: {
      knex: Knex
      preparedId: string
    }[] = []

    const returnValues: U[] = []

    try {
      // Phase 1: Prepare transaction across all specified db instances
      for (const db of dbs) {
        const trx = await db.transaction()
        const returnValue = await factory({ db: trx })(params)
        returnValues.push(returnValue)
        const preparedId = await prepareTransaction(trx)
        preparedTransactions.push({ knex: db, preparedId })
      }

      // Phase 2: Attempt commit of all prepared transactions
      const results = await Promise.allSettled(
        preparedTransactions.map(({ knex, preparedId }) => {
          return commitPreparedTransaction(knex, preparedId)
        })
      )

      const errors = results.filter((result): result is PromiseRejectedResult => {
        return result.status === 'rejected'
      })

      if (errors.length > 0) {
        logger.error(
          {
            params,
            errors
          },
          `Failed ${errors.length} of ${results.length} transactions in 2PC operation.`
        )
        throw new RegionalTransactionError()
      }

      // TODO: Do we need this validation?
      if (!returnValues.every((value) => isEqual(value, returnValues[0]))) {
        throw new RegionalTransactionError(
          'Return values of 2PC transactions do not match'
        )
      }

      return returnValues[0]
    } catch (err) {
      const rollbacks = preparedTransactions.map(async ({ knex, preparedId }) => {
        try {
          await rollbackPreparedTransaction(knex, preparedId)
        } catch {
          logger.error(
            { preparedId },
            'Failed to rollback prepared transaction {preparedId}'
          )
        }
      })

      console.warn(err, 'Error during 2PC operation. Rolling back all transactions.')

      const results = await Promise.allSettled(rollbacks)

      if (results.some((result) => result.status === 'rejected')) {
        throw new RegionalTransactionFatalError()
      }

      throw new RegionalTransactionError()
    }
  }
}
