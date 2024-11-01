import type {
  ProviderRecord,
  WorkspaceSsoProvider,
  UserSsoSessionRecord,
  OidcProvider,
  OidcProviderAttributes,
  OidcProviderValidationRequest
} from '@/modules/workspaces/domain/sso/types'
import { Workspace } from '@/modules/workspacesCore/domain/types'

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

/**
 * List workspaces where:
 * (1) User is a member
 * (2) Workspace has SSO configured
 */
export type ListWorkspaceSsoMemberships = (args: {
  userId: string
}) => Promise<Workspace[]>

export type UpsertUserSsoSession = (args: {
  userSsoSession: UserSsoSessionRecord
}) => Promise<void>

// OIDC validation flow

export type GetOidcProviderAttributes = (args: {
  provider: OidcProvider
}) => Promise<OidcProviderAttributes>

export type StoreOidcProviderValidationRequest = (
  args: OidcProviderValidationRequest
) => Promise<void>

export type GetOidcProviderData = (args: {
  validationToken: string
}) => Promise<OidcProvider | null>
