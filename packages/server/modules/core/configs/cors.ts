import cors, { CorsOptions } from 'cors'
import { RequestHandler } from 'express'

/**
 * Main CORS config to use everywhere
 * (NB. Default config for 'cors' module is to allow all origins https://github.com/expressjs/cors/blob/1cfb3709dec33dfa7ae95a3a554f2dd10498c7f9/lib/index.js#L8-L13)
 */
const defaultCorsConfig: CorsOptions = {
  origin: '*'
}

export const corsMiddlewareFactory = (deps?: {
  corsConfig: CorsOptions
}): RequestHandler => {
  const { corsConfig } = deps || { corsConfig: defaultCorsConfig }
  return cors(corsConfig)
}
