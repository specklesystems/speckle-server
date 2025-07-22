/* eslint-disable camelcase */
// modules/accIntegration/oidcHelper.ts
import crypto from 'crypto'

interface BuildAuthorizeUrlOptions {
  clientId: string
  redirectUri: string
  codeChallenge: string
  scopes: string[]
}

interface ExchangeCodeOptions {
  code: string
  codeVerifier: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function createAccOidcFlow() {
  return {
    generateCodeVerifier() {
      const codeVerifier = crypto.randomBytes(32).toString('base64url')
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url')
      return { codeVerifier, codeChallenge }
    },

    buildAuthorizeUrl({
      clientId,
      redirectUri,
      codeChallenge,
      scopes
    }: BuildAuthorizeUrlOptions) {
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })

      return `https://developer.api.autodesk.com/authentication/v2/authorize?${params.toString()}`
    },

    async exchangeCodeForTokens({
      code,
      codeVerifier,
      clientId,
      clientSecret,
      redirectUri
    }: ExchangeCodeOptions) {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        code_verifier: codeVerifier
      })

      const response = await fetch(
        'https://developer.api.autodesk.com/authentication/v2/token',
        {
          method: 'POST',
          body: params.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await response.json() // includes access_token, refresh_token, expires_in, token_type, etc.
    }
  }
}
