/* eslint-disable camelcase */

import { db } from '@/db/knex'
import { validateRequest } from 'zod-express'
import { Request, RequestHandler, Router } from 'express'
import { z } from 'zod'
import {
  saveSsoProviderRegistrationFactory,
  startOIDCSsoProviderValidationFactory
} from '@/modules/workspaces/services/sso'
import {
  getOIDCProviderAttributes,
  getProviderAuthorizationUrl,
  initializeIssuerAndClient
} from '@/modules/workspaces/clients/oidcProvider'
import {
  adminOverrideEnabled,
  getFrontendOrigin,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import {
  storeOIDCProviderValidationRequestFactory,
  getOIDCProviderValidationRequestFactory,
  associateSsoProviderWithWorkspaceFactory,
  storeProviderRecordFactory,
  upsertUserSsoSessionFactory,
  getWorkspaceSsoProviderFactory
} from '@/modules/workspaces/repositories/sso'
import { buildDecryptor, buildEncryptor } from '@/modules/shared/utils/libsodium'
import { getEncryptionKeyPair } from '@/modules/automate/services/encryption'
import { getGenericRedis } from '@/modules/core'
import { generators, UserinfoResponse } from 'openid-client'
import { oidcProvider } from '@/modules/workspaces/domain/sso/models'
import {
  OIDCProvider,
  WorkspaceSsoProvider
} from '@/modules/workspaces/domain/sso/types'
import {
  getWorkspaceBySlugFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
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
import { isWorkspaceRole } from '@/modules/workspaces/helpers/roles'
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
import { WorkspaceWithOptionalRole } from '@/modules/workspacesCore/domain/types'
import {
  GetWorkspaceBySlug,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import {
  GetWorkspaceSsoProvider,
  UpsertUserSsoSession
} from '@/modules/workspaces/domain/sso/operations'
import { CreateValidatedUser, GetUser } from '@/modules/core/domain/users/operations'
import {
  CreateUserEmail,
  FindEmail,
  FindEmailsByUserId,
  UpdateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import { DeleteInvite, FindInvite } from '@/modules/serverinvites/domain/operations'
import { AuthorizeResolver } from '@/modules/shared/domain/operations'
import { authorizeResolverFactory } from '@/modules/shared/services/auth'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import {
  getUserAclRoleFactory,
  getUserServerRoleFactory
} from '@/modules/shared/repositories/acl'
import { getStreamFactory } from '@/modules/core/repositories/streams'

const router = Router()

const moveAuthParamsToSessionMiddleware = moveAuthParamsToSessionMiddlewareFactory()
const sessionMiddleware = sessionMiddlewareFactory()
const finalizeAuthMiddleware = finalizeAuthMiddlewareFactory({
  createAuthorizationCode: createAuthorizationCodeFactory({ db }),
  getUser: legacyGetUserFactory({ db })
})

/**
 * Generate Speckle URL to redirect users to after they complete authorization
 * with the given SSO provider.
 */
const buildAuthRedirectUrl = (
  workspaceSlug: string,
  isValidationFlow: boolean
): URL => {
  const urlFragments = [`/api/v1/workspaces/${workspaceSlug}/sso/oidc/callback`]

  if (isValidationFlow) {
    urlFragments.push('?validate=true')
  }

  return new URL(urlFragments.join(''), getServerOrigin())
}

/**
 * Generate Speckle URL to redirect users to after successfully completing the
 * SSO authorization flow.
 * @remarks Append params to this URL to preserve information about errors
 */
const buildFinalizeUrl = (workspaceSlug: string): URL => {
  const urlFragments = [`workspaces/${workspaceSlug}/authn`]

  return new URL(urlFragments.join(''), getFrontendOrigin())
}

const buildErrorUrl = (err: unknown, workspaceSlug: string) => {
  const errorRedirectUrl = buildFinalizeUrl(workspaceSlug)
  const errorMessage = err instanceof Error ? err.message : `Unknown error: ${err}`
  errorRedirectUrl.searchParams.set('error', errorMessage)
  return errorRedirectUrl.toString()
}

const encryptorFactory = () => async (data: string) => {
  const encryptionKeyPair = await getEncryptionKeyPair()
  const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
  const encryptedData = await encryptor.encrypt(data)

  encryptor.dispose()

  return encryptedData
}

const decryptorFactory = () => async (data: string) => {
  const encryptionKeyPair = await getEncryptionKeyPair()
  const decryptor = await buildDecryptor(encryptionKeyPair)
  const decryptedData = await decryptor.decrypt(data)

  decryptor.dispose()

  return decryptedData
}

const parseCodeVerifier = async (req: Request<unknown>): Promise<string> => {
  const encryptedCodeVerifier = req.session.codeVerifier
  if (!encryptedCodeVerifier)
    throw new Error('Cannot find verification token. Restart flow.')
  const codeVerifier = await decryptorFactory()(encryptedCodeVerifier)
  return codeVerifier
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
      decrypt: decryptorFactory()
    })
  })
)

/**
 * Start SSO sign-in or sign-up flow
 */
const handleSsoAuthRequestFactory =
  ({
    getWorkspaceBySlug,
    getWorkspaceSsoProvider
  }: {
    getWorkspaceBySlug: GetWorkspaceBySlug
    getWorkspaceSsoProvider: GetWorkspaceSsoProvider
  }): RequestHandler<WorkspaceSsoAuthRequestParams> =>
  async ({ params, session, res }) => {
    try {
      const workspace = await getWorkspaceBySlug({
        workspaceSlug: params.workspaceSlug
      })
      if (!workspace) throw new WorkspaceNotFoundError()

      const { provider } =
        (await getWorkspaceSsoProvider({ workspaceId: workspace.id })) ?? {}
      if (!provider) throw new Error('No SSO provider registered for the workspace')

      const codeVerifier = generators.codeVerifier()
      const redirectUrl = buildAuthRedirectUrl(params.workspaceSlug, false)
      const authorizationUrl = await getProviderAuthorizationUrl({
        provider,
        redirectUrl,
        codeVerifier
      })

      session.codeVerifier = await encryptorFactory()(codeVerifier)
      res?.redirect(authorizationUrl.toString())
    } catch (e) {
      res?.redirect(buildErrorUrl(e, params.workspaceSlug))
    }
  }

router.get(
  '/api/v1/workspaces/:workspaceSlug/sso/auth',
  sessionMiddleware,
  moveAuthParamsToSessionMiddleware,
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    })
  }),
  handleSsoAuthRequestFactory({
    getWorkspaceBySlug: getWorkspaceBySlugFactory({ db }),
    getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
      db,
      decrypt: decryptorFactory()
    })
  })
)

type WorkspaceSsoValidationRequestQuery = z.infer<typeof oidcProvider>

/**
 * Begin SSO configuration flow
 */
const handleSsoValidationRequestFactory =
  ({
    getWorkspaceBySlug,
    startOIDCSsoProviderValidation
  }: {
    getWorkspaceBySlug: GetWorkspaceBySlug
    startOIDCSsoProviderValidation: ReturnType<
      typeof startOIDCSsoProviderValidationFactory
    >
  }): RequestHandler<
    WorkspaceSsoAuthRequestParams,
    never,
    never,
    WorkspaceSsoValidationRequestQuery
  > =>
  async ({ session, params, query: provider, res, context }) => {
    try {
      const workspace = await getWorkspaceBySlug({
        workspaceSlug: params.workspaceSlug
      })
      if (!workspace) throw new WorkspaceNotFoundError()

      await authorizeResolver(
        context.userId,
        workspace.id,
        Roles.Workspace.Admin,
        context.resourceAccessRules
      )

      const codeVerifier = await startOIDCSsoProviderValidation({ provider })

      const redirectUrl = buildAuthRedirectUrl(params.workspaceSlug, true)
      const authorizationUrl = await getProviderAuthorizationUrl({
        provider,
        redirectUrl,
        codeVerifier
      })

      session.codeVerifier = await encryptorFactory()(codeVerifier)

      res?.redirect(authorizationUrl.toString())
    } catch (e) {
      res?.redirect(buildErrorUrl(e, params.workspaceSlug))
    }
  }

router.get(
  '/api/v1/workspaces/:workspaceSlug/sso/oidc/validate',
  sessionMiddleware,
  moveAuthParamsToSessionMiddleware,
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    }),
    query: oidcProvider
  }),
  handleSsoValidationRequestFactory({
    getWorkspaceBySlug: getWorkspaceBySlugFactory({ db }),
    startOIDCSsoProviderValidation: startOIDCSsoProviderValidationFactory({
      getOIDCProviderAttributes,
      storeOIDCProviderValidationRequest: storeOIDCProviderValidationRequestFactory({
        redis: getGenericRedis,
        encrypt: encryptorFactory()
      }),
      generateCodeVerifier: generators.codeVerifier
    })
  })
)

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
    workspace: WorkspaceWithOptionalRole
  ): Promise<WorkspaceSsoProvider> => {
    if (!req.context.userId) throw new Error('Must be signed in to configure SSO')

    const encryptedCodeVerifier = req.session.codeVerifier
    if (!encryptedCodeVerifier)
      throw new Error('Cannot find verification token. Restart flow.')

    const codeVerifier = await parseCodeVerifier(req)

    const oidcProvider = await getOIDCProviderValidationRequest({
      validationToken: codeVerifier
    })
    if (!oidcProvider) throw new Error('Validation request not found. Restart flow.')

    await authorizeResolver(
      req.context.userId,
      workspace.id,
      Roles.Workspace.Admin,
      req.context.resourceAccessRules
    )

    const workspaceProviderRecord = await saveSsoProviderRegistration({
      provider: oidcProvider,
      workspaceId: workspace.id
    })

    return {
      ...workspaceProviderRecord,
      providerId: workspaceProviderRecord.id,
      workspaceId: workspace.id
    }
  }

const getOidcProviderFactory =
  ({ getWorkspaceSsoProvider }: { getWorkspaceSsoProvider: GetWorkspaceSsoProvider }) =>
  async (
    req: Request<WorkspaceSsoAuthRequestParams>,
    workspace: WorkspaceWithOptionalRole
  ): Promise<WorkspaceSsoProvider> => {
    const provider = await getWorkspaceSsoProvider({ workspaceId: workspace.id })
    if (!provider) throw new Error('Could not find SSO provider')
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
    provider: OIDCProvider
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
      throw new Error('Failed to get user profile from SSO provider.')
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
    if (!!userEmail && !userEmail.verified)
      throw new Error('Cannot sign in with SSO using unverified email.')
    const existingSpeckleUser = await getUser(userEmail?.userId ?? '')

    // Confirm existing user matches signed-in user, if both are present
    if (!!currentSessionUser && !!existingSpeckleUser) {
      if (currentSessionUser.id !== existingSpeckleUser.id) {
        throw new Error(
          'OIDC provider user already associated with another Speckle account.'
        )
      }
    }

    // Return target user of sign in flow
    return currentSessionUser ?? existingSpeckleUser
  }

const createWorkspaceUserFromSsoProfileFactory =
  ({
    createUser,
    upsertWorkspaceRole,
    findInvite,
    deleteInvite
  }: {
    createUser: CreateValidatedUser
    upsertWorkspaceRole: UpsertWorkspaceRole
    findInvite: FindInvite
    deleteInvite: DeleteInvite
  }) =>
  async (args: {
    ssoProfile: UserinfoResponse<{ email: string }>
    workspaceId: string
  }): Promise<Pick<UserWithOptionalRole, 'id' | 'email'>> => {
    // Check if user has email-based invite to given workspace
    const invite = await findInvite({
      target: args.ssoProfile.email,
      resourceFilter: {
        resourceId: args.workspaceId,
        resourceType: 'workspace'
      }
    })

    if (!invite) {
      throw new Error('Cannot sign up with SSO without a valid workspace invite.')
    }

    // Create Speckle user
    const { name, email, email_verified } = args.ssoProfile

    if (!name) {
      throw new Error('SSO provider user requires a name')
    }

    if (!email_verified) {
      throw new Error('Cannot sign in with unverified email')
    }

    const newSpeckleUser = {
      name,
      email,
      verified: true,
      role: invite.resource.secondaryResourceRoles?.server
    }
    const newSpeckleUserId = await createUser(newSpeckleUser)

    // Add user to workspace with role specified in invite
    const { role: workspaceRole } = invite.resource

    if (!isWorkspaceRole(workspaceRole)) throw new Error('Invalid role')

    await upsertWorkspaceRole({
      userId: newSpeckleUserId,
      workspaceId: args.workspaceId,
      role: workspaceRole,
      createdAt: new Date()
    })

    // Delete invite (implicitly used during sign up flow)
    await deleteInvite(invite.id)

    return {
      ...newSpeckleUser,
      id: newSpeckleUserId
    }
  }

const linkUserWithSsoProviderFactory =
  ({
    findEmailsByUserId,
    createUserEmail,
    updateUserEmail
  }: {
    findEmailsByUserId: FindEmailsByUserId
    createUserEmail: CreateUserEmail
    updateUserEmail: UpdateUserEmail
  }) =>
  async (args: {
    userId: string
    ssoProfile: UserinfoResponse<{ email: string }>
  }): Promise<void> => {
    // TODO: Chuck's soapbox -
    //
    // Assert link between req.user.id & { providerId: decryptedOidcProvider.id, email: oidcProviderUserData.email }
    // Create link implicitly if req.context.userId exists (user performed SSO flow while signed in)
    // If req.context.userId does not exist, and link does not exist, throw and require user to sign in before SSO

    // Add oidcProviderUserData.email to req.user.id verified emails, if not already present
    const userEmails = await findEmailsByUserId({ userId: args.userId })
    const maybeSsoEmail = userEmails.find(
      (entry) => entry.email === args.ssoProfile.email
    )

    if (!maybeSsoEmail) {
      await createUserEmail({
        userEmail: {
          userId: args.userId,
          email: args.ssoProfile.email,
          verified: true
        }
      })
    }

    if (!!maybeSsoEmail && !maybeSsoEmail.verified) {
      await updateUserEmail({
        query: {
          id: maybeSsoEmail.id,
          userId: args.userId
        },
        update: {
          verified: true
        }
      })
    }
  }

const oidcCallbackRequestQuery = z.object({ validate: z.string().optional() })

type WorkspaceSsoOidcCallbackRequestQuery = z.infer<typeof oidcCallbackRequestQuery>

/**
 * Finalize SSO flow for all OIDC paths
 */
const handleOidcCallbackFactory =
  ({
    authorizeResolver,
    getWorkspaceBySlug,
    createOidcProvider,
    getOidcProvider,
    getOidcProviderUserData,
    tryGetSpeckleUserData,
    createWorkspaceUserFromSsoProfile,
    linkUserWithSsoProvider,
    upsertUserSsoSession
  }: {
    authorizeResolver: AuthorizeResolver
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
        ? await createOidcProvider(req, workspace)
        : await getOidcProvider(req, workspace)

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

    if (!req.user || !req.user.id)
      throw new Error('Unhandled failure signing in with SSO.')

    await linkUserWithSsoProvider({
      userId: req.user.id,
      ssoProfile: oidcProviderUserData
    })

    // TODO: Implicitly consume invite here, if one exists
    await authorizeResolver(
      req.user.id,
      workspace.id,
      Roles.Workspace.Member,
      req.context.resourceAccessRules
    )

    // BTW there is a bit of an issue with PATs and sso sessions, if the session expires, the PAT fails to work
    await upsertUserSsoSession({
      userSsoSession: {
        userId: req.user.id,
        providerId: decryptedOidcProvider.providerId,
        createdAt: new Date(),
        validUntil: getDefaultSsoSessionExpirationDate()
      }
    })

    req.authRedirectPath = buildFinalizeUrl(workspace.slug).toString()
  }

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
      authorizeResolver: authorizeResolverFactory({
        adminOverrideEnabled,
        getRoles: getRolesFactory({ db: trx }),
        getUserServerRole: getUserServerRoleFactory({ db: trx }),
        getStream: getStreamFactory({ db: trx }),
        getUserAclRole: getUserAclRoleFactory({ db: trx })
      }),
      getWorkspaceBySlug: getWorkspaceBySlugFactory({ db: trx }),
      createOidcProvider: createOidcProviderFactory({
        getOIDCProviderValidationRequest: getOIDCProviderValidationRequestFactory({
          redis: getGenericRedis(),
          decrypt: decryptorFactory()
        }),
        saveSsoProviderRegistration: saveSsoProviderRegistrationFactory({
          getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
            db: trx,
            decrypt: decryptorFactory()
          }),
          storeProviderRecord: storeProviderRecordFactory({
            db: trx,
            encrypt: encryptorFactory()
          }),
          associateSsoProviderWithWorkspace: associateSsoProviderWithWorkspaceFactory({
            db: trx
          })
        })
      }),
      getOidcProvider: getOidcProviderFactory({
        getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
          db: trx,
          decrypt: decryptorFactory()
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

export default router
