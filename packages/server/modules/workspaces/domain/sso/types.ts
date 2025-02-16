import { oidcProvider } from '@/modules/workspaces/domain/sso/models'
import type { infer as Infer } from 'zod'

type ProviderBaseRecord = {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type OidcProvider = Infer<typeof oidcProvider>

export type OidcProviderRecord = {
  providerType: 'oidc'
  provider: OidcProvider
} & ProviderBaseRecord

// since storage is encrypted and provider data should be stored as a json string,
// this record type could be extended to be a union for other provider types too, like SAML
export type SsoProviderRecord = OidcProviderRecord

export type WorkspaceSsoProviderRecord = {
  workspaceId: string
  // Matches `id` in `SsoProviderRecord`
  providerId: string
}

export type WorkspaceSsoProvider = WorkspaceSsoProviderRecord & SsoProviderRecord

export type UserSsoSessionRecord = {
  userId: string
  providerId: string
  createdAt: Date
  validUntil: Date
}

export type OidcProviderValidationRequest = {
  token: string
  provider: OidcProvider
}

/** shim */
export type OidcProviderAttributes = {
  issuer: {
    claimsSupported: string[]
    grantTypesSupported: string[]
    responseTypesSupported: string[]
  }
  client: {
    grantTypes: string[]
  }
}

export type SsoSessionState = {
  isValidationFlow: boolean
}

export type OidcProfile = {
  sub: string
} & (SpeckleOidcProfile | MicrosoftEntraIdProfile)

/**
 * OIDC profile properties required by Speckle SSO logic.
 */
export type SpeckleOidcProfile = {
  email: string
}

/**
 * Because of course.
 */
export type MicrosoftEntraIdProfile = {
  upn: string
}
