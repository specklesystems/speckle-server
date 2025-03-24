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

/**
 * All dataloaders must at the very least follow this type
 */
export type ModularizedDataLoadersConstraint = {
  [group: string]: Optional<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
