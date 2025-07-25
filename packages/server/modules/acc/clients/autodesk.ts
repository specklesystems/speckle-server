import type { ModelDerivativeServiceDesignManifest } from '@/modules/acc/domain/types'

const invokeRequest = async <T>(params: {
  url: string
  token: string
  method?: RequestInit['method']
  body?: URLSearchParams
}) => {
  const { url, method = 'get', body, token } = params

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type':
        body && body instanceof URLSearchParams
          ? 'application/x-www-form-urlencoded'
          : 'application/json',
      Authorization: `Bearer ${token}`
    },
    body
  })

  return (await response.json()) as T
}

export const getManifestByUrn = async (
  urn: string
): Promise<ModelDerivativeServiceDesignManifest> => {
  const clientId = '5Y2LzxsL3usaD1xAMyElBY8mcN6XKyfHfulZDV3up0jfhN5Y'
  const clientSecret =
    'qHyGqaP4zCWLyS2lp04qBDOC1giIupPzJPmLFKGFHKZrPYYpan27zF8vlhQr1RYL'

  const token = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')
  const tokens = await fetch(
    'https://developer.api.autodesk.com/authentication/v2/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        /* eslint-disable-next-line */
        grant_type: 'client_credentials',
        scope: 'data:read account:read viewables:read'
      }),
      headers: {
        Authorization: `Basic ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  const data = await tokens.json()

  const { access_token: accessToken } = data

  return await invokeRequest({
    url: `https://developer.api.autodesk.com/modelderivative/v2/regions/eu/designdata/${urn}/manifest`,
    token: accessToken,
    method: 'GET'
  })
}
