import { logger, moduleLogger } from '@/logging/logging'
import { getDefaultApp } from '@/modules/auth/defaultApps'
import {
  CreateApp,
  CreateAuthorizationCode,
  CreateRefreshToken,
  DeleteApp,
  DeleteAuthorizationCode,
  GetAllAppsAuthorizedByUser,
  GetAllAppsCreatedByUser,
  GetAllPublicApps,
  GetAllScopes,
  GetApp,
  GetAuthorizationCode,
  GetRefreshToken,
  GetTokenAppInfo,
  RegisterDefaultApp,
  RevokeExistingAppCredentials,
  RevokeExistingAppCredentialsForUser,
  RevokeRefreshToken,
  UpdateApp,
  UpdateDefaultApp
} from '@/modules/auth/domain/operations'
import {
  ScopeRecord,
  ServerAppsScopesRecord,
  TokenScopeRecord,
  UserServerAppTokenRecord
} from '@/modules/auth/helpers/types'
import {
  ApiTokenRecord,
  AuthorizationCodeRecord,
  RefreshTokenRecord
} from '@/modules/auth/repositories'
import {
  ApiTokens,
  AuthorizationCodes,
  RefreshTokens,
  Scopes,
  ServerApps,
  ServerAppsScopes,
  TokenScopes,
  Users,
  UserServerAppTokens
} from '@/modules/core/dbSchema'
import { ServerAppRecord, UserRecord } from '@/modules/core/helpers/types'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'
import { difference, omit } from 'lodash'

const tables = {
  serverApps: (db: Knex) => db<ServerAppRecord>(ServerApps.name),
  scopes: (db: Knex) => db<ScopeRecord>(Scopes.name),
  serverAppsScopes: (db: Knex) => db<ServerAppsScopesRecord>(ServerAppsScopes.name),
  users: (db: Knex) => db<UserRecord>(Users.name),
  userServerAppTokens: (db: Knex) =>
    db<UserServerAppTokenRecord>(UserServerAppTokens.name),
  tokenScopes: (db: Knex) => db<TokenScopeRecord>(TokenScopes.name),
  authorizationCodes: (db: Knex) =>
    db<AuthorizationCodeRecord>(AuthorizationCodes.name),
  refreshTokens: (db: Knex) => db<RefreshTokenRecord>(RefreshTokens.name),
  apiTokens: (db: Knex) => db<ApiTokenRecord>(ApiTokens.name)
}

const getAppRedirectUrl = (app: Pick<ServerAppRecord, 'redirectUrl' | 'id'>) => {
  const defaultApp = getDefaultApp({ id: app.id })
  return defaultApp ? defaultApp.redirectUrl : app.redirectUrl
}

export const getAppFactory =
  (deps: { db: Knex }): GetApp =>
  async (params) => {
    const { id } = params

    const allScopes = await getAllScopesFactory(deps)()

    const app = await tables.serverApps(deps.db).select('*').where({ id }).first()
    if (!app) return null

    const appScopeNames = (
      await tables.serverAppsScopes(deps.db).select('scopeName').where({ appId: id })
    ).map((s) => s.scopeName)

    const appScopes = allScopes.filter(
      (scope) => appScopeNames.indexOf(scope.name) !== -1
    )
    const appAuthor = await tables
      .users(deps.db)
      .select('id', 'name', 'avatar')
      .where({ id: app.authorId })
      .first()

    return {
      ...app,
      scopes: appScopes,
      author: appAuthor || null,
      redirectUrl: getAppRedirectUrl(app)
    }
  }

export const getAllPublicAppsFactory =
  (deps: { db: Knex }): GetAllPublicApps =>
  async () => {
    const apps: Array<
      Pick<
        ServerAppRecord,
        | 'id'
        | 'name'
        | 'description'
        | 'trustByDefault'
        | 'redirectUrl'
        | 'logo'
        | 'termsAndConditionsLink'
      > &
        Partial<{ authorName: string; authorId: string }>
    > = await tables
      .serverApps(deps.db)
      .select(
        'server_apps.id',
        'server_apps.name',
        'server_apps.description',
        'server_apps.trustByDefault',
        'server_apps.redirectUrl',
        'server_apps.logo',
        'server_apps.termsAndConditionsLink',
        'users.name as authorName',
        'users.id as authorId'
      )
      .where({ public: true })
      .leftJoin('users', 'users.id', '=', 'server_apps.authorId')
      .orderBy('server_apps.trustByDefault', 'DESC')

    return apps.map((app) => ({
      ...app,
      redirectUrl: getAppRedirectUrl(app),
      author:
        app.authorId && app.authorName
          ? { name: app.authorName, id: app.authorId, avatar: null }
          : null
    }))
  }

export const getAllAppsCreatedByUserFactory =
  (deps: { db: Knex }): GetAllAppsCreatedByUser =>
  async ({ userId }) => {
    const apps: Array<
      ServerAppRecord & Partial<{ authorName: string; authorId: string }>
    > = await tables
      .serverApps(deps.db)
      .select('server_apps.*', 'users.name as authorName', 'users.id as authorId')
      .where({ authorId: userId })
      .leftJoin('users', 'users.id', '=', 'server_apps.authorId')

    return apps.map((app) => ({
      ...app,
      redirectUrl: getAppRedirectUrl(app),
      author:
        app.authorId && app.authorName
          ? { name: app.authorName, id: app.authorId, avatar: null }
          : null
    }))
  }

export const getAllAppsAuthorizedByUserFactory =
  (deps: { db: Knex }): GetAllAppsAuthorizedByUser =>
  async ({ userId }) => {
    const query = deps.db.raw(
      `
      SELECT DISTINCT ON (a."appId") a."appId" as id, sa."name", sa."description",  sa."trustByDefault", sa."redirectUrl" as "redirectUrl", sa.logo, sa."termsAndConditionsLink", json_build_object('name', u.name, 'id', sa."authorId") as author
      FROM user_server_app_tokens a
      LEFT JOIN server_apps sa ON sa.id = a."appId"
      LEFT JOIN users u ON sa."authorId" = u.id
      WHERE a."userId" = ?
      `,
      [userId]
    )

    const { rows } = (await query) as {
      rows: Array<ServerAppRecord & { author: Pick<UserRecord, 'name' | 'id'> }>
    }
    return rows.map((r) => ({
      ...r,
      redirectUrl: getAppRedirectUrl(r),
      author: r.author?.id ? { ...r.author, avatar: null } : null
    }))
  }

export const getAllScopesFactory =
  (deps: { db: Knex }): GetAllScopes =>
  async () => {
    return tables.scopes(deps.db).select('*')
  }

export const registerDefaultAppFactory =
  (deps: { db: Knex }): RegisterDefaultApp =>
  async (app) => {
    const scopes = app.scopes.map((s) => ({ appId: app.id, scopeName: s }))

    await tables.serverApps(deps.db).insert(omit(app, 'scopes'))
    await tables.serverAppsScopes(deps.db).insert(scopes)
  }

export const updateDefaultAppFactory =
  (deps: { db: Knex }): UpdateDefaultApp =>
  async (app, existingApp) => {
    const { db: knex } = deps

    const existingAppScopes = existingApp.scopes.map((s) => s.name)

    const newScopes = difference(app.scopes, existingAppScopes)
    const removedScopes = difference(existingAppScopes, app.scopes)

    let affectedTokenIds: string[] = []

    if (newScopes.length || removedScopes.length) {
      moduleLogger.info(`🔑 Updating default app ${app.name}`)
      affectedTokenIds = await tables
        .userServerAppTokens(knex)
        .where({ appId: app.id })
        .pluck('tokenId')
    }

    // the internal code block makes sure if an error occurred, the trx gets rolled back
    await knex.transaction(async (trx) => {
      // add new scopes to the app
      if (newScopes.length)
        await tables
          .serverAppsScopes(knex)
          .insert(newScopes.map((s) => ({ appId: app.id, scopeName: s })))
          .transacting(trx)

      // remove scopes from the app
      if (removedScopes.length)
        await tables
          .serverAppsScopes(knex)
          .where({ appId: app.id })
          .whereIn('scopeName', removedScopes)
          .delete()
          .transacting(trx)

      //update user tokens with scope changes
      if (affectedTokenIds.length)
        await Promise.all(
          affectedTokenIds.map(async (tokenId) => {
            if (newScopes.length)
              await tables
                .tokenScopes(knex)
                .insert(newScopes.map((s) => ({ tokenId, scopeName: s })))
                .transacting(trx)

            if (removedScopes.length)
              await tables
                .tokenScopes(knex)
                .where({ tokenId })
                .whereIn('scopeName', removedScopes)
                .delete()
                .transacting(trx)
          })
        )

      // not writing the redirect url to the DB anymore
      // it will be patched on an application level from the default app definitions
      await tables
        .serverApps(knex)
        .where({ id: app.id })
        .update(omit(app, ['scopes', 'redirectUrl']))
        .transacting(trx)
    })
  }

export const createAppFactory =
  (deps: { db: Knex }): CreateApp =>
  async (app) => {
    const id = cryptoRandomString({ length: 10 })
    const secret = cryptoRandomString({ length: 10 })
    const scopes = (app.scopes || []).filter((s) => !!s?.length)

    if (!scopes.length) {
      throw new Error('Cannot create an app with no scopes.')
    }

    const insertableApp = {
      ...omit(app, ['scopes', 'firstparty', 'trustByDefault']),
      id,
      secret
    }

    await tables.serverApps(deps.db).insert(insertableApp)
    await tables
      .serverAppsScopes(deps.db)
      .insert(scopes.map((s) => ({ appId: id, scopeName: s })))

    return { id, secret }
  }

const revokeExistingAppCredentialsForMaybeUserFactory =
  (deps: { db: Knex }) =>
  async ({ appId, userId }: { appId: string; userId?: string }) => {
    const maybeUserContext = userId ? { userId, appId } : { appId }

    await tables
      .authorizationCodes(deps.db)
      .where({ ...maybeUserContext })
      .del()
    await tables
      .refreshTokens(deps.db)
      .where({ ...maybeUserContext })
      .del()

    const q = tables
      .apiTokens(deps.db)
      .whereIn('id', (qb) => {
        qb.select('tokenId')
          .from('user_server_app_tokens')
          .where({ ...maybeUserContext })
      })
      .del()

    const resApiTokenDelete = await q
    return resApiTokenDelete
  }

export const revokeExistingAppCredentialsForUserFactory =
  ({ db }: { db: Knex }): RevokeExistingAppCredentialsForUser =>
  async ({ appId, userId }) =>
    await revokeExistingAppCredentialsForMaybeUserFactory({ db })({ appId, userId })

export const revokeExistingAppCredentialsFactory =
  ({ db }: { db: Knex }): RevokeExistingAppCredentials =>
  async ({ appId }) =>
    await revokeExistingAppCredentialsForMaybeUserFactory({ db })({ appId })

export const updateAppFactory =
  (deps: { db: Knex }): UpdateApp =>
  async ({ app }) => {
    // any app update should nuke everything and force users to re-authorize it.
    await revokeExistingAppCredentialsFactory({ db: deps.db })({ appId: app.id })

    if (app.scopes) {
      logger.debug(app.scopes, app.id)
      // Flush existing app scopes
      await tables.serverAppsScopes(deps.db).where({ appId: app.id }).del()
      // Update new scopes
      await tables
        .serverAppsScopes(deps.db)
        .insert(app.scopes.map((s) => ({ appId: app.id, scopeName: s })))
    }

    const updatableApp = omit(app, ['secret', 'scopes'])

    const [{ id }] = await tables
      .serverApps(deps.db)
      .returning('id')
      .where({ id: app.id })
      .update<ServerAppRecord[]>(updatableApp)

    return id
  }

export const deleteAppFactory =
  (deps: { db: Knex }): DeleteApp =>
  async ({ id }) => {
    await revokeExistingAppCredentialsFactory({ db: deps.db })({ appId: id })

    return await tables.serverApps(deps.db).where({ id }).del()
  }

export const revokeRefreshTokenFactory =
  (deps: { db: Knex }): RevokeRefreshToken =>
  async ({ tokenId }) => {
    tokenId = tokenId.slice(0, 10)
    await tables.refreshTokens(deps.db).where({ id: tokenId }).del()
    return true
  }

export const createAuthorizationCodeFactory =
  (deps: { db: Knex }): CreateAuthorizationCode =>
  async ({ appId, userId, challenge }) => {
    if (!challenge) throw new Error('Please provide a valid challenge.')

    const ac = {
      id: cryptoRandomString({ length: 42 }),
      appId,
      userId,
      challenge
    }

    await tables.authorizationCodes(deps.db).insert(ac)
    return ac.id
  }

export const getAuthorizationCodeFactory =
  (deps: { db: Knex }): GetAuthorizationCode =>
  async ({ id }) => {
    return await tables.authorizationCodes(deps.db).select().where({ id }).first()
  }

export const deleteAuthorizationCodeFactory =
  (deps: { db: Knex }): DeleteAuthorizationCode =>
  async ({ id }) => {
    return await tables.authorizationCodes(deps.db).where({ id }).del()
  }

export const createRefreshTokenFactory =
  (deps: { db: Knex }): CreateRefreshToken =>
  async ({ token }) => {
    const [ret] = await tables.refreshTokens(deps.db).insert(token, '*')
    return ret
  }

export const getRefreshTokenFactory =
  (deps: { db: Knex }): GetRefreshToken =>
  async ({ id }) => {
    return await tables.refreshTokens(deps.db).select('*').where({ id }).first()
  }

export const getTokenAppInfoFactory =
  (deps: { db: Knex }): GetTokenAppInfo =>
  async (params: { token: string; appId?: string }) => {
    const { token, appId } = params
    const tokenId = token.slice(0, 10)

    const q = tables
      .apiTokens(deps.db)
      .select<ServerAppRecord[]>(ServerApps.cols)
      .where({
        [ApiTokens.col.id]: tokenId,
        ...(appId
          ? {
              [UserServerAppTokens.col.appId]: appId
            }
          : {})
      })
      .innerJoin(
        UserServerAppTokens.name,
        ApiTokens.col.id,
        UserServerAppTokens.col.tokenId
      )
      .innerJoin(ServerApps.name, ServerApps.col.id, UserServerAppTokens.col.appId)
      .first()

    return await q
  }
