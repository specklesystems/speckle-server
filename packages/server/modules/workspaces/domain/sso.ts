import { z } from 'zod'

export const oidcProvider = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  issuerUrl: z.string()
})

export type OIDCProvider = z.infer<typeof oidcProvider>

export const oidcProviderValidationRequest = z.object({
  token: z.string(),
  provider: oidcProvider
})
export type OIDCProviderValidationRequest = z.infer<
  typeof oidcProviderValidationRequest
>

export type OIDCProviderAttributes = {
  issuer: {
    claimsSupported: string[]
    grantTypesSupported: string[]
    responseTypesSupported: string[]
  }
  client: {
    grantTypes: string[]
  }
}

export type GetOIDCProviderAttributes = (args: {
  provider: OIDCProvider
}) => Promise<OIDCProviderAttributes>

export type StoreOIDCProviderValidationRequest = (
  args: OIDCProviderValidationRequest
) => Promise<void>

export type GetOIDCProviderData = (args: {
  validationToken: string
}) => Promise<OIDCProvider | null>

export type OIDCCallbackParams = {
  code: string
  session_state: string
}

export type GetOIDCUserData = (args: {
  codeVerifier: string
  provider: OIDCProvider
  callbackParams: OIDCCallbackParams
}) => Promise<void>
