import { oidcProvider } from '@/modules/workspaces/domain/sso/models'
import type { infer as Infer } from 'zod'

type ProviderBaseRecord = {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type OIDCProvider = Infer<typeof oidcProvider>

export type OIDCProviderRecord = {
  providerType: 'oidc'
  provider: OIDCProvider
} & ProviderBaseRecord

// since storage is encrypted and provider data should be stored as a json string,
// this record type could be extended to be a union for other provider types too, like SAML
export type ProviderRecord = OIDCProviderRecord

export type WorkspaceSsoProvider = {
  workspaceId: string
  // Equals id in `ProviderRecord` (used for join)
  providerId: string
} & ProviderRecord

export type UserSsoSessionRecord = {
  userId: string
  providerId: string
  createdAt: Date
  validUntil: Date
}

// export const oidcProviderValidationRequest = z.object({
//   token: z.string(),
//   provider: oidcProvider
// })
export type OIDCProviderValidationRequest = {
  token: string
  provider: OIDCProvider
}

/** shim */
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
