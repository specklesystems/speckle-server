import {
  oidcProvider,
  GetOIDCProviderData,
  StoreOIDCProviderValidationRequest,
  StoreProviderRecord,
  ProviderRecord,
  AssociateSsoProviderWithWorkspace,
  StoreUserSsoSession,
  UserSsoSession,
  GetWorkspaceSsoProvider
} from '@/modules/workspaces/domain/sso'
import Redis from 'ioredis'
import { Knex } from 'knex'
import { omit } from 'lodash'

type Crypt = (input: string) => Promise<string>

type StoredSsoProvider = Omit<ProviderRecord, 'provider'> & {
  encryptedProviderData: string
}
type WorkspaceSsoProvider = { workspaceId: string; providerId: string }

const tables = {
  ssoProviders: (db: Knex) => db<StoredSsoProvider>('sso_providers'),
  userSsoSessions: (db: Knex) => db<UserSsoSession>('user_sso_sessions'),
  workspaceSsoProviders: (db: Knex) =>
    db<WorkspaceSsoProvider>('workspace_sso_providers')
}

export const storeOIDCProviderValidationRequestFactory =
  ({
    redis,
    encrypt
  }: {
    redis: Redis
    encrypt: Crypt
  }): StoreOIDCProviderValidationRequest =>
  async ({ provider, token }) => {
    const providerData = await encrypt(JSON.stringify(provider))
    await redis.set(token, providerData)
  }

export const getOIDCProviderFactory =
  ({ redis, decrypt }: { redis: Redis; decrypt: Crypt }): GetOIDCProviderData =>
  async ({ validationToken }: { validationToken: string }) => {
    const encryptedProviderData = await redis.get(validationToken)
    if (!encryptedProviderData) return null
    const provider = oidcProvider.parse(
      JSON.parse(await decrypt(encryptedProviderData))
    )
    return provider
  }

export const getWorkspaceSsoProviderFactory =
  ({ db, decrypt }: { db: Knex; decrypt: Crypt }): GetWorkspaceSsoProvider =>
  async ({ workspaceId }) => {
    const maybeProvider = await db<WorkspaceSsoProvider & StoredSsoProvider>(
      'workspace_sso_providers'
    )
      .where({ workspaceId })
      .first()
    if (!maybeProvider) return null
    const decryptedProviderData = await decrypt(maybeProvider.encryptedProviderData)
    switch (maybeProvider.providerType) {
      case 'oidc':
        return {
          ...omit(maybeProvider),
          provider: oidcProvider.parse(decryptedProviderData)
        }
      default:
        // this is an internal error
        throw new Error('Provider type not supported')
    }
  }

export const storeProviderRecordFactory =
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

// this should be an upsert, if the session exists, we just update the createdAt and lifespan
export const storeUserSsoSessionFactory =
  ({ db }: { db: Knex }): StoreUserSsoSession =>
  async ({ userSsoSession }) => {
    await tables.userSsoSessions(db).insert(userSsoSession)
  }
