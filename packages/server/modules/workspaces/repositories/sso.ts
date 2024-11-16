import { oidcProvider } from '@/modules/workspaces/domain/sso/models'
import {
  AssociateSsoProviderWithWorkspace,
  GetOidcProviderData,
  GetWorkspaceSsoProvider,
  StoreOidcProviderValidationRequest,
  StoreProviderRecord,
  UpsertUserSsoSession,
  ListWorkspaceSsoMemberships,
  GetWorkspaceSsoProviderRecord,
  ListUserSsoSessions,
  GetUserSsoSession,
  DeleteSsoProvider
} from '@/modules/workspaces/domain/sso/operations'
import {
  SsoProviderRecord,
  UserSsoSessionRecord,
  WorkspaceSsoProviderRecord
} from '@/modules/workspaces/domain/sso/types'
import { SsoProviderTypeNotSupportedError } from '@/modules/workspaces/errors/sso'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import Redis from 'ioredis'
import { Knex } from 'knex'
import { omit } from 'lodash'

type Crypt = (input: string) => Promise<string>

type EncryptedSsoProviderRecord = Omit<SsoProviderRecord, 'provider'> & {
  encryptedProviderData: string
}

const tables = {
  ssoProviders: (db: Knex) => db<EncryptedSsoProviderRecord>('sso_providers'),
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
      .select<WorkspaceSsoProviderRecord & EncryptedSsoProviderRecord>('*')
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

export const getWorkspaceSsoProviderRecordFactory =
  ({ db }: { db: Knex }): GetWorkspaceSsoProviderRecord =>
  async ({ workspaceId }) => {
    return (
      (await tables.workspaceSsoProviders(db).where({ workspaceId }).first()) ?? null
    )
  }

export const storeSsoProviderRecordFactory =
  ({ db, encrypt }: { db: Knex; encrypt: Crypt }): StoreProviderRecord =>
  async ({ providerRecord }) => {
    const encryptedProviderData = await encrypt(JSON.stringify(providerRecord.provider))
    const insertModel = { ...omit(providerRecord, 'provider'), encryptedProviderData }
    await tables.ssoProviders(db).insert(insertModel)
  }

export const deleteSsoProviderFactory =
  ({ db }: { db: Knex }): DeleteSsoProvider =>
  async ({ workspaceId }) => {
    await tables
      .ssoProviders(db)
      .join<WorkspaceSsoProviderRecord>(
        'workspace_sso_providers',
        'workspace_sso_providers.providerId',
        'sso_providers.id'
      )
      .where({ workspaceId })
      .delete()
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

const listUserSsoSessionsBaseQuery =
  ({ db }: { db: Knex }) =>
  (args: { userId: string; workspaceIds?: string[] }) => {
    const q = tables
      .userSsoSessions(db)
      .select('*')
      .join<WorkspaceSsoProviderRecord>(
        'workspace_sso_providers',
        'workspace_sso_providers.providerId',
        'user_sso_sessions.providerId'
      )
      .where({ userId: args.userId })

    if (args.workspaceIds) {
      q.whereIn('workspaceId', args.workspaceIds)
    }

    return q
  }

export const listUserSsoSessionsFactory =
  ({ db }: { db: Knex }): ListUserSsoSessions =>
  async ({ userId, workspaceIds }) => {
    return await listUserSsoSessionsBaseQuery({ db })({ userId, workspaceIds })
  }

export const getUserSsoSessionFactory =
  ({ db }: { db: Knex }): GetUserSsoSession =>
  async ({ userId, workspaceId }) => {
    const sessions = await listUserSsoSessionsBaseQuery({ db })({
      userId,
      workspaceIds: [workspaceId]
    })
    return sessions[0] ?? null
  }

export const listWorkspaceSsoMembershipsFactory =
  ({ db }: { db: Knex }): ListWorkspaceSsoMemberships =>
  async ({ userId }) => {
    const workspaces = await tables
      .workspaceAcl(db)
      .select('*')
      .join<WorkspaceSsoProviderRecord>(
        'workspace_sso_providers',
        'workspace_sso_providers.workspaceId',
        'workspace_acl.workspaceId'
      )
      .join<Workspace>('workspaces', 'id', 'workspace_sso_providers.workspaceId')
      .where((builder) => {
        builder.where({ userId })
        builder.whereNotNull('providerId')
        builder.whereNot('role', 'workspace:guest')
      })
    return workspaces
  }
