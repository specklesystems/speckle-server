import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { BaseError } from '@/modules/shared/errors'
import { Nullable } from '@speckle/shared'
import type { ApolloServerPlugin } from '@apollo/server'
import type { GraphQLError } from 'graphql'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'

const getErrorCode = (e: GraphQLError): Nullable<string> => {
  const extensionsCode = e.extensions?.code as string
  if (extensionsCode?.length) return extensionsCode

  const ogError = e.originalError
  if (!(ogError instanceof BaseError)) return null

  const infoCode = (ogError.info().code || null) as Nullable<string>
  return infoCode
}

export const statusCodePlugin: ApolloServerPlugin<GraphQLContext> = {
  requestDidStart: async () => {
    return {
      willSendResponse: async (reqCtx) => {
        const resHttp = reqCtx.response.http
        if (!resHttp) return

        const hasRateLimitError = reqCtx.errors?.some(
          (e) => getErrorCode(e) === RateLimitError.code
        )
        if (hasRateLimitError) {
          resHttp.status = RateLimitError.statusCode
        }

        // For now not handling 401, 403, 500, cause these will change how Apollo Client reports the error in some scenarios and thus - break our error handling
      }
    }
  }
}
