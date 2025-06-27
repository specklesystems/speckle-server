import { RelativeURL } from '@speckle/shared'

const corsRoutes = ['/', '/authn/login']

/**
 * CORS settings in nuxt config routeRules suck - with those, OPTIONS requests can still trigger redirects as if the
 * req is a normal GET request, which is not supported. So we're implementing CORS ourselves here.
 */
export default defineEventHandler((event) => {
  const optionsResponse = (code: number) => new Response(null, { status: code })

  // Get path w/o querystring
  const path = new RelativeURL(event.path).pathname

  // For CORS routes - allow all origins on GET (necessary for authentication fetch calls)
  if (corsRoutes.includes(path)) {
    setHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Expose-Headers': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '0'
    })

    if (event.method === 'OPTIONS') return optionsResponse(204)
  }

  // For other routes CORS is disabled
  if (event.method === 'OPTIONS') {
    return optionsResponse(403)
  }
})
