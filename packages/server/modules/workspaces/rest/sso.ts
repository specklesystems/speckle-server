/* eslint-disable camelcase */

import { db } from '@/db/knex'
import { validateRequest } from 'zod-express'
import { Request, RequestHandler, Router } from 'express'
import { z } from 'zod'
import {
  createWorkspaceUserFromSsoProfileFactory,
  linkUserWithSsoProviderFactory,
  saveSsoProviderRegistrationFactory,
  startOidcSsoProviderValidationFactory
} from '@/modules/workspaces/services/sso'
import {
  getOIDCProviderAttributes,
  getProviderAuthorizationUrl,
  initializeIssuerAndClient
} from '@/modules/workspaces/clients/oidcProvider'
import { getFeatureFlags, isProdEnv } from '@/modules/shared/helpers/envHelper'
import {
  storeOIDCProviderValidationRequestFactory,
  getOIDCProviderValidationRequestFactory,
  associateSsoProviderWithWorkspaceFactory,
  storeSsoProviderRecordFactory,
  upsertUserSsoSessionFactory,
  getWorkspaceSsoProviderFactory
} from '@/modules/workspaces/repositories/sso'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { generators, UserinfoResponse } from 'openid-client'
import { oidcProvider } from '@/modules/workspaces/domain/sso/models'
import {
  OidcProvider,
  WorkspaceSsoProvider
} from '@/modules/workspaces/domain/sso/types'
import {
  getWorkspaceBySlugFactory,
  getWorkspaceRolesFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  WorkspaceNotFoundError,
  WorkspacesNotAuthorizedError
} from '@/modules/workspaces/errors/workspace'
import { authorizeResolver } from '@/modules/shared'
import { Roles } from '@speckle/shared'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory,
  findEmailsByUserIdFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import {
  countAdminUsersFactory,
  getUserFactory,
  legacyGetUserFactory,
  storeUserAclFactory,
  storeUserFactory,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import {
  finalizeAuthMiddlewareFactory,
  moveAuthParamsToSessionMiddlewareFactory,
  sessionMiddlewareFactory
} from '@/modules/auth/middleware'
import {
  deleteInviteFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { createUserFactory } from '@/modules/core/services/users/management'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { sendEmail } from '@/modules/emails/services/sending'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { createAuthorizationCodeFactory } from '@/modules/auth/repositories/apps'
import { getDefaultSsoSessionExpirationDate } from '@/modules/workspaces/domain/sso/logic'
import {
  GetWorkspaceBySlug,
  GetWorkspaceRoles
} from '@/modules/workspaces/domain/operations'
import {
  GetWorkspaceSsoProvider,
  UpsertUserSsoSession
} from '@/modules/workspaces/domain/sso/operations'
import { GetUser } from '@/modules/core/domain/users/operations'
import { FindEmail } from '@/modules/core/domain/userEmails/operations'
import {
  buildAuthRedirectUrl,
  buildErrorUrl,
  buildFinalizeUrl,
  getDecryptor,
  getEncryptor,
  parseCodeVerifier
} from '@/modules/workspaces/helpers/sso'
import {
  SsoGenericAuthenticationError,
  SsoGenericProviderValidationError,
  SsoProviderMissingError,
  SsoProviderProfileMissingError,
  SsoUserClaimedError,
  SsoUserEmailUnverifiedError,
  SsoVerificationCodeMissingError
} from '@/modules/workspaces/errors/sso'
import { FeatureAccessForbiddenError } from '@/modules/gatekeeper/errors/features'
import { canWorkspaceUseOidcSsoFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'

const moveAuthParamsToSessionMiddleware = moveAuthParamsToSessionMiddlewareFactory()
const sessionMiddleware = sessionMiddlewareFactory()
const finalizeAuthMiddleware = finalizeAuthMiddlewareFactory({
  createAuthorizationCode: createAuthorizationCodeFactory({ db }),
  getUser: legacyGetUserFactory({ db })
})

const moveWorkspaceIdToSessionMiddleware: RequestHandler<
  WorkspaceSsoAuthRequestParams
> = async (req, _res, next) => {
  const workspace = await getWorkspaceBySlugFactory({ db })({
    workspaceSlug: req.params.workspaceSlug
  })
  req.session.workspaceId = workspace?.id
  next()
}

const validateFeatureAccessMiddlewareFactory: RequestHandler<
  WorkspaceSsoAuthRequestParams
> = async (req, res, next) => {
  try {
    if (!req.session.workspaceId) throw new FeatureAccessForbiddenError()

    const isGatekeeperEnabled =
      getFeatureFlags().FF_GATEKEEPER_MODULE_ENABLED && isProdEnv()
    if (!isGatekeeperEnabled) return next()

    const isAllowed = await canWorkspaceUseOidcSsoFactory({
      getWorkspacePlan: getWorkspacePlanFactory({ db })
    })({ workspaceId: req.session.workspaceId })
    if (!isAllowed) throw new FeatureAccessForbiddenError()

    next()
  } catch (e) {
    res?.redirect(buildErrorUrl(e, req.params.workspaceSlug))
  }
}

export const getSsoRouter = (): Router => {
  const router = Router()

  router.get(
    '/api/v1/workspaces/:workspaceSlug/sso',
    validateRequest({
      params: z.object({
        workspaceSlug: z.string().min(1)
      })
    }),
    handleGetLimitedWorkspaceRequestFactory({
      getWorkspaceBySlug: getWorkspaceBySlugFactory({ db }),
      getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
        db,
        decrypt: getDecryptor()
      })
    })
  )

  router.get(
    '/api/v1/workspaces/:workspaceSlug/sso/auth',
    sessionMiddleware,
    moveAuthParamsToSessionMiddleware,
    moveWorkspaceIdToSessionMiddleware,
    validateFeatureAccessMiddlewareFactory,
    validateRequest({
      params: z.object({
        workspaceSlug: z.string().min(1)
      })
    }),
    handleSsoAuthRequestFactory({
      getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
        db,
        decrypt: getDecryptor()
      })
    })
  )

  router.get(
    '/api/v1/workspaces/:workspaceSlug/sso/oidc/validate',
    sessionMiddleware,
    moveAuthParamsToSessionMiddleware,
    moveWorkspaceIdToSessionMiddleware,
    validateFeatureAccessMiddlewareFactory,
    validateRequest({
      params: z.object({
        workspaceSlug: z.string().min(1)
      }),
      query: oidcProvider
    }),
    handleSsoValidationRequestFactory({
      startOidcSsoProviderValidation: startOidcSsoProviderValidationFactory({
        getOidcProviderAttributes: getOIDCProviderAttributes,
        storeOidcProviderValidationRequest: storeOIDCProviderValidationRequestFactory({
          redis: getGenericRedis(),
          encrypt: getEncryptor()
        }),
        generateCodeVerifier: generators.codeVerifier
      })
    })
  )

  router.get(
    '/api/v1/workspaces/:workspaceSlug/sso/oidc/callback',
    sessionMiddleware,
    validateRequest({
      params: z.object({
        workspaceSlug: z.string().min(1)
      }),
      query: oidcCallbackRequestQuery
    }),
    async (req, res, next) => {
      const trx = await db.transaction()
      const handleOidcCallback = handleOidcCallbackFactory({
        getWorkspaceRoles: getWorkspaceRolesFactory({ db: trx }),
        getWorkspaceBySlug: getWorkspaceBySlugFactory({ db: trx }),
        createOidcProvider: createOidcProviderFactory({
          getOIDCProviderValidationRequest: getOIDCProviderValidationRequestFactory({
            redis: getGenericRedis(),
            decrypt: getDecryptor()
          }),
          saveSsoProviderRegistration: saveSsoProviderRegistrationFactory({
            getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
              db: trx,
              decrypt: getDecryptor()
            }),
            storeProviderRecord: storeSsoProviderRecordFactory({
              db: trx,
              encrypt: getEncryptor()
            }),
            associateSsoProviderWithWorkspace: associateSsoProviderWithWorkspaceFactory(
              {
                db: trx
              }
            )
          })
        }),
        getOidcProvider: getOidcProviderFactory({
          getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
            db: trx,
            decrypt: getDecryptor()
          })
        }),
        getOidcProviderUserData: getOidcProviderUserDataFactory(),
        tryGetSpeckleUserData: tryGetSpeckleUserDataFactory({
          findEmail: findEmailFactory({ db: trx }),
          getUser: getUserFactory({ db: trx })
        }),
        createWorkspaceUserFromSsoProfile: createWorkspaceUserFromSsoProfileFactory({
          createUser: createUserFactory({
            getServerInfo: getServerInfoFactory({ db: trx }),
            findEmail: findEmailFactory({ db: trx }),
            storeUser: storeUserFactory({ db: trx }),
            countAdminUsers: countAdminUsersFactory({ db: trx }),
            storeUserAcl: storeUserAclFactory({ db: trx }),
            validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
              createUserEmail: createUserEmailFactory({ db: trx }),
              ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({
                db: trx
              }),
              findEmail: findEmailFactory({ db: trx }),
              updateEmailInvites: finalizeInvitedServerRegistrationFactory({
                deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db: trx }),
                updateAllInviteTargets: updateAllInviteTargetsFactory({ db: trx })
              }),
              requestNewEmailVerification: requestNewEmailVerificationFactory({
                findEmail: findEmailFactory({ db: trx }),
                getUser: getUserFactory({ db: trx }),
                getServerInfo: getServerInfoFactory({ db: trx }),
                deleteOldAndInsertNewVerification:
                  deleteOldAndInsertNewVerificationFactory({ db: trx }),
                renderEmail,
                sendEmail
              })
            }),
            usersEventsEmitter: UsersEmitter.emit
          }),
          upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db: trx }),
          findInvite: findInviteFactory({ db: trx }),
          deleteInvite: deleteInviteFactory({ db: trx })
        }),
        linkUserWithSsoProvider: linkUserWithSsoProviderFactory({
          findEmailsByUserId: findEmailsByUserIdFactory({ db: trx }),
          createUserEmail: createUserEmailFactory({ db: trx }),
          updateUserEmail: updateUserEmailFactory({ db: trx })
        }),
        upsertUserSsoSession: upsertUserSsoSessionFactory({ db: trx })
      })

      try {
        await withTransaction(handleOidcCallback(req, res, next), trx)
        return next()
      } catch (e) {
        res?.redirect(buildErrorUrl(e, req.params.workspaceSlug))
      }
    },
    finalizeAuthMiddleware
  )

  return router
}

const workspaceSsoAuthRequestParams = z.object({
  workspaceSlug: z.string().min(1)
})

type WorkspaceSsoAuthRequestParams = z.infer<typeof workspaceSsoAuthRequestParams>

/**
 * Fetch public information about the workspace, including SSO provider metadata
 */
const handleGetLimitedWorkspaceRequestFactory =
  ({
    getWorkspaceBySlug,
    getWorkspaceSsoProvider
  }: {
    getWorkspaceBySlug: GetWorkspaceBySlug
    getWorkspaceSsoProvider: GetWorkspaceSsoProvider
  }): RequestHandler<WorkspaceSsoAuthRequestParams> =>
  async ({ params, res }) => {
    const workspace = await getWorkspaceBySlug({ workspaceSlug: params.workspaceSlug })
    if (!workspace) throw new WorkspaceNotFoundError()

    const ssoProviderData = await getWorkspaceSsoProvider({ workspaceId: workspace.id })

    const limitedWorkspace = {
      name: workspace.name,
      logo: workspace.logo,
      defaultLogoIndex: workspace.defaultLogoIndex,
      ssoProviderName: ssoProviderData?.provider?.providerName
    }

    res?.json(limitedWorkspace)
  }

/**
 * Start SSO sign-in or sign-up flow
 */
const handleSsoAuthRequestFactory =
  ({
    getWorkspaceSsoProvider
  }: {
    getWorkspaceSsoProvider: GetWorkspaceSsoProvider
  }): RequestHandler<WorkspaceSsoAuthRequestParams> =>
  async ({ params, session, res }) => {
    try {
      if (!session.workspaceId) throw new WorkspaceNotFoundError()

      const { provider } =
        (await getWorkspaceSsoProvider({ workspaceId: session.workspaceId })) ?? {}
      if (!provider) throw new SsoProviderMissingError()

      const codeVerifier = generators.codeVerifier()
      const redirectUrl = buildAuthRedirectUrl(params.workspaceSlug, false)
      const authorizationUrl = await getProviderAuthorizationUrl({
        provider,
        redirectUrl,
        codeVerifier
      })

      session.codeVerifier = await getEncryptor()(codeVerifier)
      res?.redirect(authorizationUrl.toString())
    } catch (e) {
      res?.redirect(buildErrorUrl(e, params.workspaceSlug))
    }
  }

type WorkspaceSsoValidationRequestQuery = z.infer<typeof oidcProvider>

/**
 * Begin SSO configuration flow
 */
const handleSsoValidationRequestFactory =
  ({
    startOidcSsoProviderValidation
  }: {
    startOidcSsoProviderValidation: ReturnType<
      typeof startOidcSsoProviderValidationFactory
    >
  }): RequestHandler<
    WorkspaceSsoAuthRequestParams,
    never,
    never,
    WorkspaceSsoValidationRequestQuery
  > =>
  async ({ session, params, query: provider, res, context }) => {
    try {
      if (!session.workspaceId) throw new WorkspaceNotFoundError()

      await authorizeResolver(
        context.userId,
        session.workspaceId,
        Roles.Workspace.Admin,
        context.resourceAccessRules
      )

      const codeVerifier = await startOidcSsoProviderValidation({ provider })

      const redirectUrl = buildAuthRedirectUrl(params.workspaceSlug, true)
      const authorizationUrl = await getProviderAuthorizationUrl({
        provider,
        redirectUrl,
        codeVerifier
      })

      session.codeVerifier = await getEncryptor()(codeVerifier)

      res?.redirect(authorizationUrl.toString())
    } catch (e) {
      res?.redirect(buildErrorUrl(e, params.workspaceSlug))
    }
  }

const oidcCallbackRequestQuery = z.object({ validate: z.string().optional() })

type WorkspaceSsoOidcCallbackRequestQuery = z.infer<typeof oidcCallbackRequestQuery>

/**
 * Finalize SSO flow for all OIDC paths
 */
const handleOidcCallbackFactory =
  ({
    getWorkspaceRoles,
    getWorkspaceBySlug,
    createOidcProvider,
    getOidcProvider,
    getOidcProviderUserData,
    tryGetSpeckleUserData,
    createWorkspaceUserFromSsoProfile,
    linkUserWithSsoProvider,
    upsertUserSsoSession
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    getWorkspaceBySlug: GetWorkspaceBySlug
    createOidcProvider: ReturnType<typeof createOidcProviderFactory>
    getOidcProvider: ReturnType<typeof getOidcProviderFactory>
    getOidcProviderUserData: ReturnType<typeof getOidcProviderUserDataFactory>
    tryGetSpeckleUserData: ReturnType<typeof tryGetSpeckleUserDataFactory>
    createWorkspaceUserFromSsoProfile: ReturnType<
      typeof createWorkspaceUserFromSsoProfileFactory
    >
    linkUserWithSsoProvider: ReturnType<typeof linkUserWithSsoProviderFactory>
    upsertUserSsoSession: UpsertUserSsoSession
  }): RequestHandler<
    WorkspaceSsoAuthRequestParams,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    any,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    any,
    WorkspaceSsoOidcCallbackRequestQuery
  > =>
  async (req) => {
    const workspace = await getWorkspaceBySlug({
      workspaceSlug: req.params.workspaceSlug
    })
    if (!workspace) throw new WorkspaceNotFoundError()

    const decryptedOidcProvider: WorkspaceSsoProvider =
      req.query.validate === 'true'
        ? await createOidcProvider(req, workspace.id)
        : await getOidcProvider(workspace.id)

    const oidcProviderUserData = await getOidcProviderUserData(
      req,
      decryptedOidcProvider.provider
    )
    const speckleUserData = await tryGetSpeckleUserData(req, oidcProviderUserData)

    if (!speckleUserData) {
      const newSpeckleUser = await createWorkspaceUserFromSsoProfile({
        ssoProfile: oidcProviderUserData,
        workspaceId: decryptedOidcProvider.workspaceId
      })
      req.user = { id: newSpeckleUser.id, email: newSpeckleUser.email, isNewUser: true }
    }

    req.user ??= { id: speckleUserData!.id, email: speckleUserData!.email }

    if (!req.user || !req.user.id) throw new SsoGenericAuthenticationError()

    await linkUserWithSsoProvider({
      userId: req.user.id,
      ssoProfile: oidcProviderUserData
    })

    // TODO: Implicitly consume invite here, if one exists
    const workspaceRoles = await getWorkspaceRoles({ workspaceId: workspace.id })
    if (!workspaceRoles.some((role) => role.userId === req.user?.id))
      throw new SsoGenericAuthenticationError()

    // BTW there is a bit of an issue with PATs and sso sessions, if the session expires, the PAT fails to work
    await upsertUserSsoSession({
      userSsoSession: {
        userId: req.user.id,
        providerId: decryptedOidcProvider.providerId,
        createdAt: new Date(),
        validUntil: getDefaultSsoSessionExpirationDate()
      }
    })

    req.authRedirectPath = buildFinalizeUrl(req.params.workspaceSlug).toString()
  }

const createOidcProviderFactory =
  ({
    getOIDCProviderValidationRequest,
    saveSsoProviderRegistration
  }: {
    getOIDCProviderValidationRequest: ReturnType<
      typeof getOIDCProviderValidationRequestFactory
    >
    saveSsoProviderRegistration: ReturnType<typeof saveSsoProviderRegistrationFactory>
  }) =>
  async (
    req: Request<WorkspaceSsoAuthRequestParams>,
    workspaceId: string
  ): Promise<WorkspaceSsoProvider> => {
    if (!req.context.userId)
      throw new WorkspacesNotAuthorizedError('You must be signed in to configure SSO')

    const encryptedCodeVerifier = req.session.codeVerifier
    if (!encryptedCodeVerifier) throw new SsoVerificationCodeMissingError()

    const codeVerifier = await parseCodeVerifier(req)

    const oidcProvider = await getOIDCProviderValidationRequest({
      validationToken: codeVerifier
    })
    if (!oidcProvider)
      throw new SsoGenericProviderValidationError(
        'Validation request not found. Restart flow.'
      )

    await authorizeResolver(
      req.context.userId,
      workspaceId,
      Roles.Workspace.Admin,
      req.context.resourceAccessRules
    )

    const workspaceProviderRecord = await saveSsoProviderRegistration({
      provider: oidcProvider,
      workspaceId
    })

    return {
      ...workspaceProviderRecord,
      providerId: workspaceProviderRecord.id,
      workspaceId
    }
  }

const getOidcProviderFactory =
  ({ getWorkspaceSsoProvider }: { getWorkspaceSsoProvider: GetWorkspaceSsoProvider }) =>
  async (workspaceId: string): Promise<WorkspaceSsoProvider> => {
    const provider = await getWorkspaceSsoProvider({ workspaceId })
    if (!provider) throw new SsoProviderMissingError()
    return provider
  }

const getOidcProviderUserDataFactory =
  () =>
  async (
    req: Request<
      WorkspaceSsoAuthRequestParams,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      any,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      any,
      WorkspaceSsoOidcCallbackRequestQuery
    >,
    provider: OidcProvider
  ): Promise<UserinfoResponse<{ email: string }>> => {
    const codeVerifier = await parseCodeVerifier(req)
    const { client } = await initializeIssuerAndClient({ provider })
    const callbackParams = client.callbackParams(req)
    const tokenSet = await client.callback(
      buildAuthRedirectUrl(
        req.params.workspaceSlug,
        req.query.validate === 'true'
      ).toString(),
      callbackParams,
      { code_verifier: codeVerifier }
    )

    const oidcProviderUserData = await client.userinfo(tokenSet)
    if (!oidcProviderUserData || !oidcProviderUserData.email) {
      throw new SsoProviderProfileMissingError()
    }

    return oidcProviderUserData as UserinfoResponse<{ email: string }>
  }

const tryGetSpeckleUserDataFactory =
  ({ findEmail, getUser }: { findEmail: FindEmail; getUser: GetUser }) =>
  async (
    req: Request<WorkspaceSsoAuthRequestParams>,
    oidcProviderUserData: UserinfoResponse<{ email: string }>
  ): Promise<UserWithOptionalRole | null> => {
    // Get currently signed-in user, if available
    const currentSessionUser = await getUser(req.context.userId ?? '')

    // Get user with email that matches OIDC provider user email, if match exists
    const userEmail = await findEmail({ email: oidcProviderUserData.email })
    if (!!userEmail && !userEmail.verified) throw new SsoUserEmailUnverifiedError()
    const existingSpeckleUser = await getUser(userEmail?.userId ?? '')

    // Confirm existing user matches signed-in user, if both are present
    if (!!currentSessionUser && !!existingSpeckleUser) {
      if (currentSessionUser.id !== existingSpeckleUser.id) {
        throw new SsoUserClaimedError()
      }
    }

    // Return target user of sign in flow
    return currentSessionUser ?? existingSpeckleUser
  }
