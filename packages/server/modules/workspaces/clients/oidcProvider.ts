/* eslint-disable camelcase */
import { BaseError } from '@/modules/shared/errors'
import { OIDCProvider, OIDCProviderAttributes } from '@/modules/workspaces/domain/sso'
import { generators, Issuer, type Client } from 'openid-client'

export const getProviderAuthorizationUrl = async ({
  provider,
  redirectUrl,
  codeVerifier
}: {
  provider: OIDCProvider
  redirectUrl: URL
  codeVerifier: string
}): Promise<URL> => {
  const { client } = await initializeIssuerAndClient({ provider, redirectUrl })
  const code_challenge = generators.codeChallenge(codeVerifier)
  return new URL(
    client.authorizationUrl({
      scope: 'openid email profile',
      redirect_uri: redirectUrl.toString(),
      code_challenge,
      code_challenge_method: 'S256'
    })
  )
}

export const initializeIssuerAndClient = async ({
  provider,
  redirectUrl
}: {
  provider: OIDCProvider
  redirectUrl?: URL
}): Promise<{ issuer: Issuer; client: Client }> => {
  const issuer = await Issuer.discover(provider.issuerUrl)
  const client = new issuer.Client({
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    redirect_uris: redirectUrl ? [redirectUrl.toString()] : [],
    response_types: ['code']
  })
  return { issuer, client }
}

export const getOIDCProviderAttributes = async ({
  provider
}: {
  provider: OIDCProvider
}): Promise<OIDCProviderAttributes> => {
  try {
    const { issuer, client } = await initializeIssuerAndClient({ provider })
    return {
      issuer: {
        claimsSupported: (issuer.claims_supported as string[] | undefined) ?? [],
        grantTypesSupported:
          (issuer.grant_types_supported as string[] | undefined) ?? [],
        responseTypesSupported:
          (issuer.response_types_supported as string[] | undefined) ?? []
      },
      client: {
        grantTypes: (client.grant_types as string[] | undefined) ?? []
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      if ('code' in err) {
        if (err.code === 'ECONNREFUSED')
          throw new BaseError(
            'cannot connect to the provider, pls check the connection url',
            err
          )
      } else if ('error' in err) {
        if (err.error === 'Realm does not exist')
          throw new BaseError(
            "The realm doesn't exist, please check your url and OIDC config",
            err
          )
      }
    }
    throw err
  }
}
