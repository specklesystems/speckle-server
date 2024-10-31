import { oidcProvider } from '@/modules/workspaces/domain/sso/models'
import {
  AssociateSsoProviderWithWorkspace,
  GetOidcProviderData,
  GetWorkspaceSsoProvider,
  StoreOidcProviderValidationRequest,
  StoreProviderRecord,
  UpsertUserSsoSession,
  ListWorkspaceSsoMemberships
} from '@/modules/workspaces/domain/sso/operations'
import {
  ProviderRecord,
  UserSsoSessionRecord
} from '@/modules/workspaces/domain/sso/types'
import { SsoProviderTypeNotSupportedError } from '@/modules/workspaces/errors/sso'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import Redis from 'ioredis'
import { Knex } from 'knex'
import { omit } from 'lodash'

type Crypt = (input: string) => Promise<string>

type SsoProviderRecord = Omit<ProviderRecord, 'provider'> & {
  encryptedProviderData: string
}
type WorkspaceSsoProviderRecord = { workspaceId: string; providerId: string }

const tables = {
  ssoProviders: (db: Knex) => db<SsoProviderRecord>('sso_providers'),
  userSsoSessions: (db: Knex) => db<UserSsoSessionRecord>('user_sso_sessions'),
  workspaceAcl: (db: Knex) => db<WorkspaceAcl>('workspace_acl'),
  workspaceSsoProviders: (db: Knex) =>
    db<WorkspaceSsoProviderRecord>('workspace_sso_providers')
}

export const storeOIDCProviderValidationRequestFactory =
  ({
    redis,
    encrypt
  }: {
    redis: Redis
    encrypt: Crypt
  }): StoreOidcProviderValidationRequest =>
    async ({ provider, token }) => {
      const providerData = await encrypt(JSON.stringify(provider))
      await redis.set(token, providerData)
    }

export const getOIDCProviderValidationRequestFactory =
  ({ redis, decrypt }: { redis: Redis; decrypt: Crypt }): GetOidcProviderData =>
    async ({ validationToken }: { validationToken: string }) => {
      const encryptedProviderData = await redis.get(validationToken)
      if (!encryptedProviderData) return null
      const providerDataString = await decrypt(encryptedProviderData)
      const provider = oidcProvider.parse(JSON.parse(providerDataString))
      return provider
    }

export const getWorkspaceSsoProviderFactory =
  ({ db, decrypt }: { db: Knex; decrypt: Crypt }): GetWorkspaceSsoProvider =>
    async ({ workspaceId }) => {
      const maybeProvider = await tables
        .workspaceSsoProviders(db)
        .select<WorkspaceSsoProviderRecord & SsoProviderRecord>('*')
        .where({ workspaceId })
        .join<SsoProviderRecord>('sso_providers', 'id', 'providerId')
        .first()
      if (!maybeProvider) return null

      const providerDataString = await decrypt(maybeProvider.encryptedProviderData)
      const providerData = JSON.parse(providerDataString)

      switch (maybeProvider.providerType) {
        case 'oidc':
          return {
            ...omit(maybeProvider, ['encryptedProviderData']),
            provider: oidcProvider.parse(providerData)
          }
        default:
          throw new SsoProviderTypeNotSupportedError()
      }
    }

export const storeSsoProviderRecordFactory =
  ({ db, encrypt }: { db: Knex; encrypt: Crypt }): StoreProviderRecord =>
    async ({ providerRecord }) => {
      const encryptedProviderData = await encrypt(JSON.stringify(providerRecord.provider))
      const insertModel = { ...omit(providerRecord, 'provider'), encryptedProviderData }
      await tables.ssoProviders(db).insert(insertModel)
    }

export const associateSsoProviderWithWorkspaceFactory =
  ({ db }: { db: Knex }): AssociateSsoProviderWithWorkspace =>
    async ({ providerId, workspaceId }) => {
      await tables.workspaceSsoProviders(db).insert({ providerId, workspaceId })
    }

export const upsertUserSsoSessionFactory =
  ({ db }: { db: Knex }): UpsertUserSsoSession =>
    async ({ userSsoSession }) => {
      await tables
        .userSsoSessions(db)
        .insert(userSsoSession)
        .onConflict(['userId', 'providerId'])
        .merge(['createdAt', 'validUntil'])
    }

export const listWorkspaceSsoMembershipsFactory =
  ({ db }: { db: Knex }): ListWorkspaceSsoMemberships =>
    async ({ userId }) => {
      const workspaces = await tables
        .workspaceAcl(db)
        .select('*')
        .join<WorkspaceSsoProviderRecord>('workspace_sso_providers', 'workspace_sso_providers.workspaceId', 'workspace_acl.workspaceId')
        .join<Workspace>('workspaces', 'id', 'workspace_sso_providers.workspaceId')
        .where((builder) => {
          builder.where({ userId })
          builder.whereNotNull('providerId')
        })
      return workspaces
    }