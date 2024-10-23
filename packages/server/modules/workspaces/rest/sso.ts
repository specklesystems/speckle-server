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
import { getFrontendOrigin, getServerOrigin } from '@/modules/shared/helpers/envHelper'
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
import { generators } from 'openid-client'
import { noop } from 'lodash'
import { oidcProvider } from '@/modules/workspaces/domain/sso/models'
import { OIDCProvider, WorkspaceSsoProvider } from '@/modules/workspaces/domain/sso/types'
import {
  getWorkspaceBySlugFactory,
  getWorkspaceCollaboratorsFactory,
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
import { GetWorkspaceBySlug } from '@/modules/workspaces/domain/operations'
import { GetWorkspaceSsoProvider } from '@/modules/workspaces/domain/sso/operations'

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

const ssoVerificationStatusKey = 'ssoVerificationStatus'

// const buildErrorUrl = ({
//   err,
//   url,
//   searchParams,
//   isValidationFlow
// }: {
//   err: unknown
//   url: URL
//   searchParams?: Record<string, string>
//   isValidationFlow: boolean
// }): URL => {
//   // TODO: Redirect to workspace-specific sign in page
//   if (!isValidationFlow) {
//     url.pathname = '/authn/login'
//     return url
//   }

//   const settingsSearch = url.searchParams.get('settings')
//   url.searchParams.forEach((key) => {
//     url.searchParams.delete(key)
//   })
//   if (settingsSearch) url.searchParams.set('settings', settingsSearch)
//   url.searchParams.set(ssoVerificationStatusKey, 'failed')
//   const errorMessage = err instanceof Error ? err.message : `Unknown error ${err}`
//   url.searchParams.set('ssoVerificationError', errorMessage)
//   if (searchParams) {
//     for (const [name, value] of Object.values(searchParams)) {
//       url.searchParams.set(name, value)
//     }
//   }
//   return url
// }

const buildErrorUrl = (err: unknown, workspaceSlug: string) => {
  const errorRedirectUrl = buildFinalizeUrl(workspaceSlug)
  const errorMessage = err instanceof Error ? err.message : `Unknown error: ${err}`
  errorRedirectUrl.searchParams.set('error', errorMessage)
  return errorRedirectUrl.toString()
}

const encryptorFactory = () =>
  async (data: string) => {
    const encryptionKeyPair = await getEncryptionKeyPair()
    const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
    const encryptedData = await encryptor.encrypt(data)

    encryptor.dispose()

    return encryptedData
  }

const decryptorFactory = () =>
  async (data: string) => {
    const encryptionKeyPair = await getEncryptionKeyPair()
    const decryptor = await buildDecryptor(encryptionKeyPair)
    const decryptedData = await decryptor.decrypt(data)

    decryptor.dispose()

    return decryptedData
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
    getWorkspaceBySlug: GetWorkspaceBySlug,
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
    getWorkspaceBySlug: GetWorkspaceBySlug,
    getWorkspaceSsoProvider: GetWorkspaceSsoProvider,

  }): RequestHandler<WorkspaceSsoAuthRequestParams> =>
    async ({ params, session, res }) => {
      try {
        const workspace = await getWorkspaceBySlug({ workspaceSlug: params.workspaceSlug })
        if (!workspace) throw new WorkspaceNotFoundError()

        const { provider } = await getWorkspaceSsoProvider({ workspaceId: workspace.id }) ?? {}
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

/** Begin SSO configuration flow */
type WorkspaceSsoValidationRequestQuery = z.infer<typeof oidcProvider>

const handleSsoValidationRequestFactory =
  ({
    getWorkspaceBySlug,
    startOIDCSsoProviderValidation
  }: {
    getWorkspaceBySlug: GetWorkspaceBySlug,
    startOIDCSsoProviderValidation: ReturnType<typeof startOIDCSsoProviderValidationFactory>
  }): RequestHandler<WorkspaceSsoAuthRequestParams, never, never, WorkspaceSsoValidationRequestQuery> =>
    async ({ session, params, query: provider, res, context }) => {
      try {
        const workspace = await getWorkspaceBySlug({ workspaceSlug: params.workspaceSlug })
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

/** Finalize SSO flow for all paths */
router.get(
  '/api/v1/workspaces/:workspaceSlug/sso/oidc/callback',
  sessionMiddleware,
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    }),
    query: z.object({ validate: z.string().optional() })
  }),
  async (req, res, next) => {
    // NOTE: If req.context.userId is defined, there is a user signed in

    // const decryptedOidcProvider = req.query.validate === 'true'
    // ? await createOidcProvider(req) // assert signed in
    // : await getOidcProvider(req)

    // const oidcProviderUserData = await getOidcProviderUserData(req, decryptedOidcProvider)
    // const speckleUserData = await tryGetSpeckleUserData(req, oidcProviderUserData) // assert existing email match is verified, assert ids match if both present

    // if (!speckleUserData) {
    //   const newSpeckleUser = await createWorkspaceUserFromSsoProfile({
    //     ssoProfile: oidcProviderUserData,
    //     workspaceId: decryptedOidcProvider.workspaceId
    //   })
    //   req.user = newSpeckleUser ({ isNewUser: true, email: newSpeckleUser.email })
    // }

    // req.user ??= { id: speckleUserData.id }

    // if (!req.user || !req.user.id) throw new Error('Failed to sign in.')

    // TODO:
    // Chuck's soapbox -
    // Assert link between req.user.id & { providerId: decryptedOidcProvider.id, email: oidcProviderUserData.email }
    // Create link if req.context.userId exists (user performed SSO flow while signed in)

    // Add oidcProviderUserData.email to req.user.id verified emails, if not already present

    // Assert req.user.id is member of workspace

    // await upsertUserSsoSessionFactory({ db })({
    //   userSsoSession: {
    //     userId: req.user.id,
    //     providerId: decryptedOidcProvider.id,
    //     createdAt: new Date(),
    //     validUntil: getDefaultSsoSessionExpirationDate()
    //   }
    // })

    // Finalize auth
    // req.authRedirectPath = /workspaces/:workspaceSlug/authn
    // return next()

    const logger = req.log.child({ workspaceSlug: req.params.workspaceSlug })

    const workspaceSlug = req.params.workspaceSlug
    const isValidationFlow = req.query.validate === 'true'

    let provider: OIDCProvider | null = null
    let providerId: string | null = null
    let redirectUrl = buildFinalizeUrl(req.params.workspaceSlug)

    // TODO: Billing check - verify workspace has SSO enabled
    const workspace = await getWorkspaceBySlugFactory({ db })({
      workspaceSlug: req.params.workspaceSlug
    })
    if (!workspace) throw new WorkspaceNotFoundError()

    try {
      // Initialize OIDC client based on provider for current request flow
      const encryptionKeyPair = await getEncryptionKeyPair()
      const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
      const { decrypt: decryptCodeVerifier } = await buildDecryptor(encryptionKeyPair)
      const encryptedCodeVerifier = req.session.codeVerifier

      if (!encryptedCodeVerifier)
        throw new Error('cannot find verification token, restart the flow')

      const codeVerifier = await decryptCodeVerifier(encryptedCodeVerifier)

      if (isValidationFlow) {
        // Get provider configuration from redis
        const { decrypt: decryptOIDCProvider } = await buildDecryptor(encryptionKeyPair)

        provider = await getOIDCProviderValidationRequestFactory({
          redis: getGenericRedis(),
          decrypt: decryptOIDCProvider
        })({
          validationToken: codeVerifier
        })

        if (!provider) throw new Error('validation request not found, please retry')
      } else {
        // Get stored provider configuration
        const { decrypt: decryptSsoProvider } = await buildDecryptor(encryptionKeyPair)

        const providerMetadata = await getWorkspaceSsoProviderFactory({
          db,
          decrypt: decryptSsoProvider
        })({ workspaceId: workspace.id })

        if (!providerMetadata?.provider) throw new Error('Could not find SSO provider')

        provider = providerMetadata.provider
        providerId = providerMetadata.providerId
      }

      const { client } = await initializeIssuerAndClient({ provider })
      const callbackParams = client.callbackParams(req)
      const tokenSet = await client.callback(
        buildAuthRedirectUrl(workspaceSlug, isValidationFlow).toString(),
        callbackParams,
        { code_verifier: codeVerifier }
      )

      // Get user associated with current session
      const currentSessionUser = await getUserFactory({ db })(req.context.userId ?? '')

      // Get user profile from SSO provider
      const ssoProviderUserInfo = await client.userinfo<{ email: string }>(tokenSet)
      if (!ssoProviderUserInfo || !ssoProviderUserInfo.email)
        throw new Error('This should never happen, we are asking for an email claim')

      if (isValidationFlow) {
        // OIDC configuration verification flow: the user is attempting to configure SSO for their workspace

        // Only workspace admins may configure SSO
        if (!currentSessionUser) {
          throw new Error('Must be signed in to configure SSO')
        }

        await authorizeResolver(
          req.context.userId,
          workspace.id,
          Roles.Workspace.Admin,
          req.context.resourceAccessRules
        )
        const userId = currentSessionUser.id

        // Write SSO configuration
        const trx = await db.transaction()
        const { decrypt: decryptExistingSsoProvider } = await buildDecryptor(
          encryptionKeyPair
        )
        const saveSsoProviderRegistration = saveSsoProviderRegistrationFactory({
          getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
            db: trx,
            decrypt: decryptExistingSsoProvider
          }),
          associateSsoProviderWithWorkspace: associateSsoProviderWithWorkspaceFactory({
            db: trx
          }),
          storeProviderRecord: storeProviderRecordFactory({
            db,
            encrypt: encryptor.encrypt
          }),
          upsertUserSsoSession: upsertUserSsoSessionFactory({ db: trx }),
          createUserEmail: createUserEmailFactory({ db: trx }),
          updateUserEmail: updateUserEmailFactory({ db: trx }),
          findEmailsByUserId: findEmailsByUserIdFactory({ db: trx })
        })
        providerId = await withTransaction(
          saveSsoProviderRegistration({
            provider,
            userId,
            workspaceId: workspace.id,
            ssoProviderUserInfo
          }),
          trx
        )

        // Build final redirect url
        redirectUrl = buildFinalizeUrl(req.params.workspaceSlug)
        redirectUrl.searchParams.set(ssoVerificationStatusKey, 'success')

        req.authRedirectPath = redirectUrl.toString()
        req.user = { id: currentSessionUser.id, email: currentSessionUser.email }

        return next()
      } else {
        // OIDC auth flow: SSO is already configured and we are attempting to log in or sign up

        // Get Speckle user by email from SSO provider
        const userEmail = await findEmailFactory({ db })({
          email: ssoProviderUserInfo.email
        })
        const existingSpeckleUser = await getUserFactory({ db })(
          userEmail?.userId ?? ''
        )

        // TODO: Validate link between SSO user email and Speckle user
        // Link occurs when an already signed-in user signs in with SSO
        // Create link here implicitly if conditions are met and no link exists already

        if (!currentSessionUser) {
          if (!existingSpeckleUser) {
            // Sign up flow with SSO:
            // User is not signed in, and no Speckle user is associated with SSO user

            // Check if user has email-based invite to given workspace
            const invite = await findInviteFactory({ db })({
              token: req.context.token, // TODO: Is this the invite token?
              target: ssoProviderUserInfo.email,
              resourceFilter: {
                resourceId: workspace.id, // TODO: Are invites still id-based?
                resourceType: 'workspace'
              }
            })

            if (!invite) {
              throw new Error(
                'Cannot sign up with SSO without a valid workspace invite.'
              )
            }

            // Create Speckle user
            const { name, email, email_verified } = ssoProviderUserInfo

            if (!name) {
              throw new Error('SSO provider user requires a name')
            }

            if (!email_verified) {
              throw new Error('Cannot sign in with unverified email')
            }

            const newSpeckleUser = {
              name,
              email,
              verified: true
            }
            const newSpeckleUserId = await createUserFactory({
              getServerInfo: getServerInfoFactory({ db }),
              findEmail: findEmailFactory({ db }),
              storeUser: storeUserFactory({ db }),
              countAdminUsers: countAdminUsersFactory({ db }),
              storeUserAcl: storeUserAclFactory({ db }),
              validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
                createUserEmail: createUserEmailFactory({ db }),
                ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
                findEmail: findEmailFactory({ db }),
                updateEmailInvites: finalizeInvitedServerRegistrationFactory({
                  deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
                  updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
                }),
                requestNewEmailVerification: requestNewEmailVerificationFactory({
                  findEmail: findEmailFactory({ db }),
                  getUser: getUserFactory({ db }),
                  getServerInfo: getServerInfoFactory({ db }),
                  deleteOldAndInsertNewVerification:
                    deleteOldAndInsertNewVerificationFactory({ db }),
                  sendEmail,
                  renderEmail
                })
              }),
              usersEventsEmitter: UsersEmitter.emit
            })(newSpeckleUser)

            // Add user to workspace with role specified in invite
            const { role: workspaceRole } = invite.resource

            if (!isWorkspaceRole(workspaceRole)) throw new Error('Invalid role')

            await upsertWorkspaceRoleFactory({ db })({
              userId: newSpeckleUserId,
              workspaceId: workspace.id,
              role: workspaceRole,
              createdAt: new Date()
            })

            // Delete invite (implicitly used during sign up flow)
            await deleteInviteFactory({ db })(invite.id)

            // Assert sign in
            req.user = {
              id: newSpeckleUserId,
              email: newSpeckleUser.email,
              isNewUser: true
            }
          } else {
            // Sign in flow with SSO:
            // User is not signed in, but there is a Speckle user associated with the SSO user

            // Assert sign in
            req.user = { id: existingSpeckleUser.id, email: existingSpeckleUser.email }
          }
        } else {
          if (!existingSpeckleUser) {
            // Sign in flow with SSO:
            // User is already signed in, but no Speckle user is associated with the SSO user
            // Add SSO email to user

            // Continue to sign in
            req.user = { id: currentSessionUser.id, email: currentSessionUser.email }
          } else {
            // Sign in flow with SSO:
            // User is already signed in, and there is already a Speckle user associated with the SSO user, with the email verified
            // Verify session user id matches existing user id
            if (currentSessionUser.id !== existingSpeckleUser.id) {
              throw new Error(
                'SSO user already associated with another Speckle account'
              )
            }

            // Continue to sign in
            req.user = { id: existingSpeckleUser.id, email: existingSpeckleUser.email }
          }
        }

        // Confirm that req.user is a member of the given workspace
        const workspaceRoles = await getWorkspaceCollaboratorsFactory({ db })({
          workspaceId: workspace.id,
          limit: 100
        })

        if (!req.user || !req.user?.id) {
          // This should not happen
          throw new Error('Unhandled failure to sign in')
        }

        if (!workspaceRoles.some((role) => role.id === req.user?.id)) {
          throw new Error(
            'User is not a member of the given workspace and cannot sign in with SSO'
          )
        }

        // Update validUntil for SSO session
        if (!providerId) {
          throw new Error('Unhandled failure to find SSO provider')
        }

        await upsertUserSsoSessionFactory({ db })({
          userSsoSession: {
            userId: req.user.id,
            providerId,
            createdAt: new Date(),
            validUntil: getDefaultSsoSessionExpirationDate()
          }
        })

        // Construct final redirect
        const redirectUrlFragments: string[] = [
          `workspaces/${req.params.workspaceSlug}`
        ]
        if (isValidationFlow) {
          redirectUrlFragments.push(
            `?settings=workspace/security&workspace=${workspaceSlug}`
          )
        }

        req.authRedirectPath = buildFinalizeUrl(workspaceSlug).toString()
        return next()
      }
    } catch (err) {
      const warnMessage = isValidationFlow
        ? `Failed to verify OIDC sso provider for workspace ${workspaceSlug}`
        : `Failed to sign in to ${workspaceSlug}`
      logger.warn({ error: err }, warnMessage)
      // redirectUrl = buildErrorUrl({
      //   err,
      //   url: redirectUrl,
      //   searchParams: provider || undefined,
      //   isValidationFlow
      // })
      res.redirect(buildErrorUrl(err, req.params.workspaceSlug))
    }
  },
  finalizeAuthMiddleware
)

export default router
