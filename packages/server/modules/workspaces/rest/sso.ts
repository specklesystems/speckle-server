/* eslint-disable camelcase */

import { db } from '@/db/knex'
import { validateRequest } from 'zod-express'
import { Router } from 'express'
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
  getOIDCProviderFactory,
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
import { getDefaultSsoSessionExpirationDate, OIDCProvider, oidcProvider } from '@/modules/workspaces/domain/sso'
import {
  getWorkspaceBySlugFactory,
  getWorkspaceCollaboratorsFactory
} from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { authorizeResolver } from '@/modules/shared'
import { Roles } from '@speckle/shared'
import {
  createUserEmailFactory,
  findEmailFactory,
  findEmailsByUserIdFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import { createUser, getUser, getUserById } from '@/modules/core/services/users'
import { UserRecord } from '@/modules/core/helpers/userHelper'
import {
  finalizeAuthMiddlewareFactory,
  sessionMiddlewareFactory
} from '@/modules/auth/middleware'
import { createAuthorizationCodeFactory } from '@/modules/auth/repositories/apps'

const router = Router()

const sessionMiddleware = sessionMiddlewareFactory()
const finalizeAuthMiddleware = finalizeAuthMiddlewareFactory({
  createAuthorizationCode: createAuthorizationCodeFactory({ db }),
  getUserById
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
const buildFinalizeUrl = (workspaceSlug: string, isValidationFlow: boolean): URL => {
  const urlFragments = [`workspaces/${workspaceSlug}/`]

  if (isValidationFlow) {
    urlFragments.push('?settings=server/general')
  }

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
  searchParams?: Record<string, string>,
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

router.get(
  '/api/v1/workspaces/:workspaceSlug/sso/auth',
  sessionMiddleware,
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    }),
    query: oidcProvider
  }),
  async ({ params, session, res }) => {
    const { workspaceSlug } = params
    const encryptionKeyPair = await getEncryptionKeyPair()
    const decryptor = await buildDecryptor(encryptionKeyPair)
    try {
      const workspace = await getWorkspaceBySlugFactory({ db })({
        workspaceSlug
      })
      if (!workspace) throw new Error('No workspace found')

      const providerMetadata = await getWorkspaceSsoProviderFactory({
        db,
        decrypt: decryptor.decrypt
      })({ workspaceId: params.workspaceSlug })
      if (!providerMetadata)
        throw new Error('No SSO provider registered for the workspace')

      // Redirect to OIDC provider to continue auth flow
      const { provider } = providerMetadata
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
      const redirectUrl = buildAuthRedirectUrl(params.workspaceSlug, false)
      const authorizationUrl = await getProviderAuthorizationUrl({
        provider,
        redirectUrl,
        codeVerifier
      })
      session.codeVerifier = await encryptor.encrypt(codeVerifier)
      res?.redirect(authorizationUrl.toString())
    } catch (err) {
      // if things fail, before sending you to the provider, we need to tell it to the user in a nice way
    }
  }
)

router.get(
  '/api/v1/workspaces/:workspaceSlug/sso/oidc/validate',
  sessionMiddleware,
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
        url: buildFinalizeUrl(params.workspaceSlug, true),
        searchParams: query,
        isValidationFlow: true
      })
      res?.redirect(url.toString())
    }
  }
)

// TODO:
// - tryGetWorkspaceInvite
// - add new user to workspace with role
// - return new provider id on create
router.get(
  '/api/v1/workspaces/:workspaceSlug/sso/oidc/callback',
  sessionMiddleware,
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    }),
    query: z.object({ validate: z.string() })
  }),
  async (req, res, next) => {
    const logger = req.log.child({ workspaceSlug: req.params.workspaceSlug })

    const workspaceSlug = req.params.workspaceSlug
    const isValidationFlow = req.query.validate === 'true'

    let provider: OIDCProvider | null = null
    let providerId: string | null = null
    let redirectUrl = buildFinalizeUrl(req.params.workspaceSlug, isValidationFlow)

    // TODO: Billing check - verify workspace has SSO enabled

    try {
      // Initialize OIDC client based on provider for current request flow
      const encryptionKeyPair = await getEncryptionKeyPair()
      const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
      const decryptor = await buildDecryptor(encryptionKeyPair)
      const encryptedCodeVerifier = req.session.codeVerifier

      if (!encryptedCodeVerifier)
        throw new Error('cannot find verification token, restart the flow')

      const codeVerifier = await decryptor.decrypt(encryptedCodeVerifier)

      if (isValidationFlow) {
        // Get provider configuration from redis
        provider = await getOIDCProviderFactory({
          redis: getGenericRedis(),
          decrypt: (await buildDecryptor(encryptionKeyPair)).decrypt
        })({
          validationToken: codeVerifier
        })

        if (!provider) throw new Error('validation request not found, please retry')
      } else {
        // Get stored provider configuration
        const providerMetadata = await getWorkspaceSsoProviderFactory({
          db,
          decrypt: decryptor.decrypt
        })({ workspaceId: workspaceSlug })

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

      // Get user profile from SSO provider
      const ssoProviderUserInfo = await client.userinfo<{ email: string }>(tokenSet)
      if (!ssoProviderUserInfo || !ssoProviderUserInfo.email)
        throw new Error('This should never happen, we are asking for an email claim')

      // Get information about the workspace we are signing in to
      const workspace = await getWorkspaceBySlugFactory({ db })({
        workspaceSlug: req.params.workspaceSlug
      })
      if (!workspace) throw new WorkspaceNotFoundError()

      if (isValidationFlow) {
        // OIDC configuration verification flow: the user is attempting to configure SSO for their workspace

        // Only workspace admins may configure SSO
        await authorizeResolver(
          req.context.userId,
          workspace.id,
          Roles.Workspace.Admin,
          req.context.resourceAccessRules
        )
        const userId = req.context.userId!

        // Write SSO configuration
        const trx = await db.transaction()
        // TODO: Return new provider record and store id
        const saveSsoProviderRegistration = saveSsoProviderRegistrationFactory({
          getWorkspaceSsoProvider: getWorkspaceSsoProviderFactory({
            db: trx,
            decrypt: decryptor.decrypt
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
        await withTransaction(
          saveSsoProviderRegistration({
            provider,
            userId,
            workspaceId: workspace.id,
            ssoProviderUserInfo
          }),
          trx
        )

        // Build final redirect url
        redirectUrl = buildFinalizeUrl(req.params.workspaceSlug, isValidationFlow)
        redirectUrl.searchParams.set(ssoVerificationStatusKey, 'success')
      } else {
        // OIDC auth flow: SSO is already configured and we are attempting to log in or sign up
        const currentSessionUser = req.user

        // Get Speckle user by email from SSO provider
        const userEmail = await findEmailFactory({ db })({
          email: ssoProviderUserInfo.email
        })
        const existingSpeckleUser: Pick<UserRecord, 'id' | 'email'> | null =
          await getUser(userEmail?.userId)

        // TODO: Validate link between SSO user email and Speckle user
        // Link occurs when an already signed-in user signs in with SSO
        // Create link here implicitly if conditions are met and no link exists already

        if (!currentSessionUser) {
          if (!existingSpeckleUser) {
            // Sign up flow with SSO:
            // User is not signed in, and no Speckle user is associated with SSO user

            // Check if user has email-based invite to given workspace

            // let invite
            // if (!req.inviteToken) {
            // try to get an invite from the db, based on the oidc user info email
            // -> invite
            // } else {
            // get the invite from the db based on the invite token
            // -> invite
            //}
            // if (invite) {
            // make sure, the invite is an invite to the current workspace and it doesn't target a user,
            // the target must be, the same email,
            // that comes back from the oidc provider
            // use invite if its not part of the finalize flow?!
            //} else {
            // GO AWAY!!!!
            //}

            // Create Speckle user
            const { name, email, email_verified } = ssoProviderUserInfo

            if (!email_verified) {
              throw new Error('Cannot sign in with unverified email')
            }

            const newSpeckleUser = {
              name,
              email,
              verified: true
            }
            const newSpeckleUserId = await createUser(newSpeckleUser)

            // Add user to workspace with role specified in invite

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
            // Continue to sign in
          } else {
            // Sign in flow with SSO:
            // User is already signed in, and there is already a Speckle user associated with the SSO user
            // Verify session user id matches existing user id
            if (currentSessionUser.id !== existingSpeckleUser.id) {
              throw new Error('SSO user already associated with another Speckle account')
            }
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
          throw new Error('User is not a member of the given workspace and cannot sign in with SSO')
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
        req.authRedirectPath = redirectUrlFragments.join()

        return next()
      }
    } catch (err) {
      const warnMessage = isValidationFlow ?
        `Failed to verify OIDC sso provider for workspace ${workspaceSlug}`
        : `Failed to sign in to ${workspaceSlug}`
      logger.warn(
        { error: err },
        warnMessage
      )
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
