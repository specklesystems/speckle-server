import type {
  ProviderRecord,
  WorkspaceSsoProvider,
  UserSsoSessionRecord,
  OIDCProvider,
  OIDCProviderAttributes,
  OIDCProviderValidationRequest
} from '@/modules/workspaces/domain/sso/types'

// Workspace SSO provider management

export type AssociateSsoProviderWithWorkspace = (args: {
  workspaceId: string
  providerId: string
}) => Promise<void>

export type GetWorkspaceSsoProvider = (args: {
  workspaceId: string
}) => Promise<WorkspaceSsoProvider | null>

export type StoreProviderRecord = (args: {
  providerRecord: ProviderRecord
}) => Promise<void>

// User session management

export type UpsertUserSsoSession = (args: {
  userSsoSession: UserSsoSessionRecord
}) => Promise<void>

// OIDC validation flow

export type GetOIDCProviderAttributes = (args: {
  provider: OIDCProvider
}) => Promise<OIDCProviderAttributes>

export type StoreOIDCProviderValidationRequest = (
  args: OIDCProviderValidationRequest
) => Promise<void>

export type GetOIDCProviderData = (args: {
  validationToken: string
}) => Promise<OIDCProvider | null>
