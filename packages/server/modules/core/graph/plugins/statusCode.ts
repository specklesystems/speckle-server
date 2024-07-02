import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { BaseError, ForbiddenError, UnauthorizedError } from '@/modules/shared/errors'
import { Nullable } from '@speckle/shared'
import type { ApolloServerPlugin } from 'apollo-server-plugin-base'
import type { GraphQLError } from 'graphql'

const getErrorCode = (e: GraphQLError): Nullable<string> => {
  const extensionsCode = e.extensions?.code as string
  if (extensionsCode?.length) return extensionsCode

  const ogError = e.originalError
  if (!(ogError instanceof BaseError)) return null

  const infoCode = (ogError.info().code || null) as Nullable<string>
  return infoCode
}

export const statusCodePlugin: ApolloServerPlugin = {
  requestDidStart: async () => {
    return {
      willSendResponse: async (reqCtx) => {
        const resHttp = reqCtx.response.http
        if (!resHttp) return

        const hasForbiddenError = reqCtx.errors?.some(
          (e) => getErrorCode(e) === ForbiddenError.code
        )
        const hasUnauthenticatedError = reqCtx.errors?.some((e) =>
          ['UNAUTHENTICATED', UnauthorizedError.code].includes(getErrorCode(e) || '')
        )
        const hasRateLimitError = reqCtx.errors?.some(
          (e) => getErrorCode(e) === RateLimitError.code
        )
        const hasInternalServerError = reqCtx.errors?.some(
          (e) => getErrorCode(e) === 'INTERNAL_SERVER_ERROR'
        )

        if (hasForbiddenError) {
          resHttp.status = ForbiddenError.statusCode
        } else if (hasUnauthenticatedError) {
          resHttp.status = UnauthorizedError.statusCode
        } else if (hasRateLimitError) {
          resHttp.status = RateLimitError.statusCode
        } else if (hasInternalServerError) {
          resHttp.status = 500
        }
      }
    }
  }
}
