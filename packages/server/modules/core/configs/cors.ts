import { CorsMiddlewareError } from '@/modules/shared/errors/middleware'
import { handleErrors } from '@/modules/shared/helpers/expressHelper'
import cors, { CorsOptions } from 'cors'

/**
 * Main CORS config to use everywhere
 */
export const corsConfig: CorsOptions = {
  origin: '*'
}

export const corsMiddlewareWithDefaultConfig = () =>
  handleErrors({
    handler: cors(),
    verbPhraseForErrorMessage: 'applying CORS',
    defaultErrorType: CorsMiddlewareError
  })

/**
 * CORS express middleware with our CORS config applied
 */
export const corsMiddlewareAllowingAllOrigins = () =>
  handleErrors({
    handler: cors(corsConfig),
    verbPhraseForErrorMessage: 'applying CORS',
    defaultErrorType: CorsMiddlewareError
  })
