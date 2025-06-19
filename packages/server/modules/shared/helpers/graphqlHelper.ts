/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthContext } from '@/modules/shared/authz'
import { base64Decode, base64Encode } from '@/modules/shared/helpers/cryptoHelper'
import DataLoader from 'dataloader'
import dayjs, { Dayjs } from 'dayjs'
import { ApolloServerErrorCode } from '@apollo/server/errors'
import { GraphQLError } from 'graphql'
import {
  BadRequestError,
  ForbiddenError,
  InvalidArgumentError,
  NotFoundError,
  UnauthorizedError
} from '@/modules/shared/errors'
import { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import { Knex } from 'knex'
import { SchemaConfig } from '@/modules/core/dbSchema'
import { has, isObjectLike, isString, mapValues, pick, times } from 'lodash'

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

/**
 * All dataloaders must at the very least follow this type
 */
export type ModularizedDataLoadersConstraint = {
  [group: string]: Optional<{
    [loader: string]: DataLoader<any, any> | { clearAll: () => unknown }
  }>
}

export type RequestDataLoadersBuilder<T extends ModularizedDataLoadersConstraint> =
  (params: {
    ctx: AuthContext
    createLoader: <K, V, C = K>(
      batchLoadFn: DataLoader.BatchLoadFn<K, V>,
      options?: DataLoader.Options<K, V, C>
    ) => DataLoader<K, V, C>
    deps: {
      db: Knex
    }
  }) => T

export const defineRequestDataloaders = <T extends ModularizedDataLoadersConstraint>(
  builder: RequestDataLoadersBuilder<T>
): RequestDataLoadersBuilder<T> => {
  return builder
}

export const simpleTupleCacheKey = (key: [string, string]) => `${key[0]}:${key[1]}`

/**
 * Is a lower significance error, caused by user error (and thus - not a bug in our code)
 */
export const isUserGraphqlError = (error: GraphQLError): boolean => {
  const userCodes = [
    ForbiddenError.code,
    UnauthorizedError.code,
    BadRequestError.code,
    NotFoundError.code,
    InvalidArgumentError.code,
    ApolloServerErrorCode.BAD_REQUEST,
    ApolloServerErrorCode.BAD_USER_INPUT,
    ApolloServerErrorCode.GRAPHQL_PARSE_FAILED,
    ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
    ApolloServerErrorCode.OPERATION_RESOLUTION_FAILURE,
    ApolloServerErrorCode.PERSISTED_QUERY_NOT_FOUND,
    ApolloServerErrorCode.PERSISTED_QUERY_NOT_SUPPORTED
  ]
  const code = error.extensions?.code as string
  return userCodes.includes(code)
}

export type Collection<T> = {
  cursor: string | null
  totalCount: number
  items: T[]
}
