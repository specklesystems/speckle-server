import { z } from 'zod'

export const oidcProvider = z.object({
  providerName: z.string().min(1),
  clientId: z.string().min(5),
  clientSecret: z.string().min(1),
  issuerUrl: z.string().min(1).url()
})

export type OIDCProvider = z.infer<typeof oidcProvider>

type ProviderBaseRecord = {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type OIDCProviderRecord = {
  providerType: 'oidc'
  provider: OIDCProvider
} & ProviderBaseRecord

// since storage is encrypted and provider data should be stored as a json string,
// this record type could be extended to be a union for other provider types too, like SAML
export type ProviderRecord = OIDCProviderRecord

export type StoreProviderRecord = (args: {
  providerRecord: ProviderRecord
}) => Promise<void>

export type WorkspaceSsoProvider = {
  workspaceId: string
  providerId: string
} & ProviderRecord

export type GetWorkspaceSsoProvider = (args: {
  workspaceId: string
}) => Promise<WorkspaceSsoProvider | null>

export type UserSsoSession = {
  userId: string
  providerId: string
  createdAt: Date
  validUntil: Date
}

export type UpsertUserSsoSession = (args: {
  userSsoSession: UserSsoSession
}) => Promise<void>

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

export type AssociateSsoProviderWithWorkspace = (args: {
  workspaceId: string
  providerId: string
}) => Promise<void>

// TODO: Is one week good?
export const getDefaultSsoSessionExpirationDate = (): Date => {
  const now = new Date()
  now.setDate(now.getDate() + 7)
  return now
}