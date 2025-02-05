import type {
  SsoProviderRecord,
  WorkspaceSsoProvider,
  UserSsoSessionRecord,
  OidcProvider,
  OidcProviderAttributes,
  OidcProviderValidationRequest,
  WorkspaceSsoProviderRecord
} from '@/modules/workspaces/domain/sso/types'
import { Workspace } from '@/modules/workspacesCore/domain/types'

// Workspace SSO provider management

export type AssociateSsoProviderWithWorkspace = (args: {
  workspaceId: string
  providerId: string
}) => Promise<void>

/** Get and decrypt the full set of information about a given workspace's SSO provider */
export type GetWorkspaceSsoProvider = (args: {
  workspaceId: string
}) => Promise<WorkspaceSsoProvider | null>

export type GetWorkspaceSsoProviderRecord = (args: {
  workspaceId: string
}) => Promise<WorkspaceSsoProviderRecord | null>

export type StoreProviderRecord = (args: {
  providerRecord: SsoProviderRecord
}) => Promise<void>

export type DeleteSsoProvider = (args: { workspaceId: string }) => Promise<void>

// User session management

/**
 * List workspaces where:
 * (1) User is a member
 * (2) Workspace has SSO configured
 */
export type ListWorkspaceSsoMemberships = (args: {
  userId: string
}) => Promise<Workspace[]>

export type ListUserSsoSessions = (args: {
  userId: string
  // Optional workspaces to limit search to
  workspaceIds?: string[]
}) => Promise<(UserSsoSessionRecord & WorkspaceSsoProviderRecord)[]>

export type GetUserSsoSession = (args: {
  userId: string
  workspaceId: string
}) => Promise<(UserSsoSessionRecord & WorkspaceSsoProviderRecord) | null>

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
