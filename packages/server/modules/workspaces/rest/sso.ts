/* eslint-disable camelcase */

import { db } from '@/db/knex'
import { validateRequest } from 'zod-express'
import { Request, Router } from 'express'
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

const router = Router()

const moveAuthParamsToSessionMiddleware = moveAuthParamsToSessionMiddlewareFactory()
const sessionMiddleware = sessionMiddlewareFactory()
const finalizeAuthMiddleware = finalizeAuthMiddlewareFactory({
  createAuthorizationCode: createAuthorizationCodeFactory({ db }),
  getUser: legacyGetUserFactory({ db })
})

/**
 * Generate redirect url used for final step of OIDC flow
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
 * Generate default final redirect url if request is successful
 */
const buildFinalizeUrl = (workspaceSlug: string): URL => {
  const urlFragments = [`workspaces/${workspaceSlug}/authn`]

  return new URL(urlFragments.join(''), getFrontendOrigin())
}

const ssoVerificationStatusKey = 'ssoVerificationStatus'

const buildErrorUrl = ({
  err,
  url,
  searchParams,
  isValidationFlow
}: {
  err: unknown
  url: URL
  searchParams?: Record<string, string>
  isValidationFlow: boolean
}): URL => {
  // TODO: Redirect to workspace-specific sign in page
  if (!isValidationFlow) {
    url.pathname = '/authn/login'
    return url
  }

  const settingsSearch = url.searchParams.get('settings')
  url.searchParams.forEach((key) => {
    url.searchParams.delete(key)
  })
  if (settingsSearch) url.searchParams.set('settings', settingsSearch)
  url.searchParams.set(ssoVerificationStatusKey, 'failed')
  const errorMessage = err instanceof Error ? err.message : `Unknown error ${err}`
  url.searchParams.set('ssoVerificationError', errorMessage)
  if (searchParams) {
    for (const [name, value] of Object.values(searchParams)) {
      url.searchParams.set(name, value)
    }
  }
  return url
}

type AuthAction = {
  action: 'validate' | 'sign-in'
  user: UserWithOptionalRole
  workspace: WorkspaceWithOptionalRole
} | {
  action: 'sign-up'
  user: Pick<UserWithOptionalRole, 'name' | 'email'>
  workspace: WorkspaceWithOptionalRole
}

type AuthRequest = Request<{ workspaceSlug: string }, never, never, { validate?: string }>

const parseAuthAction = async (req: AuthRequest): Promise<AuthAction> => {
  const isValidationFlow = req.query.validate === 'true'

  const workspace = await getWorkspaceBySlugFactory({
    db
  })({
    workspaceSlug: req.params.workspaceSlug
  })
  if (!workspace) throw new WorkspaceNotFoundError()

  // Initialize OIDC client
  // TODO: Initialize SSO client by type when multiple types are supported
  const encryptionKeyPair = await getEncryptionKeyPair()

  const decryptor = await buildDecryptor(encryptionKeyPair)
  const encryptedCodeVerifier = req.session.codeVerifier

  if (!encryptedCodeVerifier) {
    throw new Error('Cannot find verification token. Restart SSO flow.')
  }

  const codeVerifier = await decryptor.decrypt(encryptedCodeVerifier)

  // Fetch OIDC provider information
  const decryptedProvider: (Partial<WorkspaceSsoProvider> & Pick<WorkspaceSsoProvider, 'id'>) | null = isValidationFlow
    // If validating a new configuration, this is stored temporarily in redis
    ? {
      id: '',
      provider: await getOIDCProviderValidationRequestFactory({
        redis: getGenericRedis(),
        decrypt: (await buildDecryptor(encryptionKeyPair)).decrypt
      })({
        validationToken: codeVerifier
      }) ?? undefined
    }
    // Otherwise, use the provider information stored in the db
    : await getWorkspaceSsoProviderFactory({
      db,
      decrypt: (await buildDecryptor(encryptionKeyPair)).decrypt
    })({
      workspaceId: workspace.id
    })

  if (!decryptedProvider || !decryptedProvider?.provider) {
    throw new Error('Failed to find SSO provider. Restart flow.')
  }

  // Get user profile from SSO provider
  const { client } = await initializeIssuerAndClient({ provider: decryptedProvider.provider })
  const callbackParams = client.callbackParams(req)
  const tokenSet = await client.callback(
    buildAuthRedirectUrl(workspace.slug, isValidationFlow).toString(),
    callbackParams,
    { code_verifier: codeVerifier }
  )
  const ssoUserProfile = await client.userinfo(tokenSet)

  if (!ssoUserProfile || !ssoUserProfile.name || !ssoUserProfile.email) {
    throw new Error('SSO user profile does not conform to Speckle requirements.')
  }

  // Find Speckle user profile with email that matches SSO user profile
  const existingSpeckleUserEmail = await findEmailFactory({
    db
  })({
    email: ssoUserProfile.email
  })
  const existingSpeckleUser = await getUserFactory({
    db
  })(
    existingSpeckleUserEmail?.userId ?? ''
  )

  // Find Speckle user profile for signed in user that initiated this SSO flow
  const currentSessionUser = await getUserFactory({
    db
  })(
    req.context.userId ?? ''
  )

  // Determine auth action and validate conditions for each action type
}

/** GET Public information about the workspace, including SSO provider metadata */
router.get(
  '/api/v1/workspaces/:workspaceSlug/sso',
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    })
  }),
  async ({ params, res }) => {
    const { workspaceSlug } = params

    const workspace = await getWorkspaceBySlugFactory({ db })({
      workspaceSlug
    })

    if (!workspace) {
      throw new Error()
    }

    const encryptionKeyPair = await getEncryptionKeyPair()
    const { decrypt } = await buildDecryptor(encryptionKeyPair)

    const providerData = await getWorkspaceSsoProviderFactory({ db, decrypt })({
      workspaceId: workspace.id
    })

    const limitedWorkspace = {
      name: workspace.name,
      logo: workspace.logo,
      defaultLogoIndex: workspace.defaultLogoIndex,
      ssoProviderName: providerData?.provider?.providerName
    }

    res?.json(limitedWorkspace)
  }
)

/** Begin SSO sign-in or sign-up flow */
router.get(
  '/api/v1/workspaces/:workspaceSlug/sso/auth',
  sessionMiddleware,
  moveAuthParamsToSessionMiddleware,
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    })
  }),
  async ({ params, session, res }) => {
    const { workspaceSlug } = params
    const encryptionKeyPair = await getEncryptionKeyPair()
    const { decrypt } = await buildDecryptor(encryptionKeyPair)
    try {
      const workspace = await getWorkspaceBySlugFactory({ db })({
        workspaceSlug
      })
      if (!workspace) throw new Error('No workspace found')

      const providerMetadata = await getWorkspaceSsoProviderFactory({
        db,
        decrypt
      })({ workspaceId: workspace.id })
      if (!providerMetadata)
        throw new Error('No SSO provider registered for the workspace')

      // Redirect to OIDC provider to continue auth flow
      const { provider } = providerMetadata
      const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
      const codeVerifier = await startOIDCSsoProviderValidationFactory({
        getOIDCProviderAttributes,
        storeOIDCProviderValidationRequest: storeOIDCProviderValidationRequestFactory({
          redis: getGenericRedis(),
          encrypt: encryptor.encrypt
        }),
        generateCodeVerifier: generators.codeVerifier
      })({
        provider
      })
      const redirectUrl = buildAuthRedirectUrl(params.workspaceSlug, false)
      const authorizationUrl = await getProviderAuthorizationUrl({
        provider,
        redirectUrl,
        codeVerifier
      })

      // await new Promise<void>((resolve) => {
      //   sessionStore.get(sessionID, (_err, session) => {
      //     sessionStore.set(sessionID, {
      //       ...session,
      //       challenge: query.challenge!.toString()
      //     } as any)
      //     resolve()
      //   })
      // })

      session.codeVerifier = await encryptor.encrypt(codeVerifier)
      res?.redirect(authorizationUrl.toString())
    } catch (err) {
      console.error(err)
      // if things fail, before sending you to the provider, we need to tell it to the user in a nice way
    }
  }
)

/** Begin SSO configuration flow */
router.get(
  '/api/v1/workspaces/:workspaceSlug/sso',
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    })
  }),
  async ({ params, res }) => {
    const { workspaceSlug } = params

    const workspace = await getWorkspaceBySlugFactory({ db })({
      workspaceSlug
    })

    if (!workspace) {
      throw new Error()
    }

    const encryptionKeyPair = await getEncryptionKeyPair()
    const { decrypt, dispose } = await buildDecryptor(encryptionKeyPair)

    const providerData = await getWorkspaceSsoProviderFactory({ db, decrypt })({
      workspaceId: workspace.id
    })

    const limitedWorkspace = {
      name: workspace.name,
      logo: workspace.logo,
      defaultLogoIndex: workspace.defaultLogoIndex,
      ssoProviderName: providerData?.provider?.providerName
    }

    dispose()
    res?.json(limitedWorkspace)
  }
)

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
  async ({ session, params, query, res, context }) => {
    const workspaceSlug = params.workspaceSlug

    const workspace = await getWorkspaceBySlugFactory({ db })({ workspaceSlug })
    if (!workspace) throw new WorkspaceNotFoundError()

    // TODO: Billing check for workspace plan - is SSO allowed

    await authorizeResolver(
      context.userId,
      workspace.id,
      Roles.Workspace.Admin,
      context.resourceAccessRules
    )

    try {
      const provider = query
      const encryptionKeyPair = await getEncryptionKeyPair()
      const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
      const codeVerifier = await startOIDCSsoProviderValidationFactory({
        getOIDCProviderAttributes,
        storeOIDCProviderValidationRequest: storeOIDCProviderValidationRequestFactory({
          redis: getGenericRedis(),
          encrypt: encryptor.encrypt
        }),
        generateCodeVerifier: generators.codeVerifier
      })({
        provider
      })
      const redirectUrl = buildAuthRedirectUrl(params.workspaceSlug, true)
      const authorizationUrl = await getProviderAuthorizationUrl({
        provider,
        redirectUrl,
        codeVerifier
      })
      session.codeVerifier = await encryptor.encrypt(codeVerifier)

      encryptor.dispose()
      res?.redirect(authorizationUrl.toString())
    } catch (err) {
      session.destroy(noop)
      const url = buildErrorUrl({
        err,
        url: buildFinalizeUrl(params.workspaceSlug),
        searchParams: query,
        isValidationFlow: true
      })
      res?.redirect(url.toString())
    }
  }
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
    // ? await createOidcProvider(req)
    // : await getOidcProvider(req)

    // const oidcProviderUserData = await getOidcProviderUserData(req, decryptedOidcProvider)
    // const speckleUserData = await tryGetSpeckleUserData(req, oidcProviderUserData)

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

    //-----

    // const { action, user } = await parseAuthAction(req, decryptedOidcProvider)

    // switch (action) {
    //   case 'sign-up': {

    //   }
    //   case 'sign-in': {

    //   }
    // }

    //-----

    // const workspace = await getWorkspaceBySlug({ workspaceSlug })
    // const decryptedProvider = await getOrCreateOidcProvider({ req, workspace })

    // const { action, user } = await parseAuthAction({ req, })
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
      redirectUrl = buildErrorUrl({
        err,
        url: redirectUrl,
        searchParams: provider || undefined,
        isValidationFlow
      })
      res.redirect(redirectUrl.toString())
    }
  },
  finalizeAuthMiddleware
)

export default router
