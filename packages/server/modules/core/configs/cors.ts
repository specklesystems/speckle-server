import cors, { CorsOptions } from 'cors'

/**
 * Main CORS config to use everywhere
 */
export const corsConfig: CorsOptions = {
  origin: '*'
}

/**
 * CORS express middleware with our CORS config applied
 */
export const corsMiddleware = () => cors(corsConfig)
