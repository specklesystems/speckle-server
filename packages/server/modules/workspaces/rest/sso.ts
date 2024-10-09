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
  storeUserSsoSessionFactory,
  getWorkspaceSsoProviderFactory
} from '@/modules/workspaces/repositories/sso'
import { buildDecryptor, buildEncryptor } from '@/modules/shared/utils/libsodium'
import { getEncryptionKeyPair } from '@/modules/automate/services/encryption'
import { getGenericRedis } from '@/modules/core'
import { generators } from 'openid-client'
import { noop } from 'lodash'
import { OIDCProvider, oidcProvider } from '@/modules/workspaces/domain/sso'
import { getWorkspaceBySlugFactory } from '@/modules/workspaces/repositories/workspaces'
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
  searchParams
}: {
  err: unknown
  url: URL
  searchParams?: Record<string, string>
}): URL => {
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
  async ({ params }) => {
    const { workspaceSlug } = params
    const encryptionKeyPair = await getEncryptionKeyPair()
    const decryptor = await buildDecryptor(encryptionKeyPair)
    try {
      const workspace = await getWorkspaceBySlugFactory({ db })({
        workspaceSlug
      })
      if (!workspace) throw new Error('No workspace found')

      const provider = await getWorkspaceSsoProviderFactory({
        db,
        decrypt: decryptor.decrypt
      })({ workspaceId: params.workspaceSlug })

      if (!provider) throw new Error('No SSO provider registered for the workspace')
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
  async ({ session, params, query, res }) => {
    // do we need to authorize this?, redirect will stop ppl from doing bad shit
    // Verify workspace has SSO enabled
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

      // maybe not needed
      encryptor.dispose()
      res?.redirect(authorizationUrl.toString())
    } catch (err) {
      session.destroy(noop)
      const url = buildErrorUrl({
        err,
        url: buildFinalizeUrl(params.workspaceSlug, true),
        searchParams: query
      })
      res?.redirect(url.toString())
    }
  }
)

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
    let redirectUrl = buildFinalizeUrl(req.params.workspaceSlug, isValidationFlow)

    // Verify workspace has SSO enabled
    try {
      // Initialize OIDC client based on provider for current request flow
      const encryptionKeyPair = await getEncryptionKeyPair()
      const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
      const decryptor = await buildDecryptor(encryptionKeyPair)
      const encryptedCodeVerifier = req.session.codeVerifier

      if (!encryptedCodeVerifier)
        throw new Error('cannot find verification token, restart the flow')

      const codeVerifier = await decryptor.decrypt(encryptedCodeVerifier)

      // this is only the case for the validation route,
      // if we're logging in, the provider must come from the pgDB with a cache infront
      provider = await getOIDCProviderFactory({
        redis: getGenericRedis(),
        decrypt: (await buildDecryptor(encryptionKeyPair)).decrypt
      })({
        validationToken: codeVerifier
      })

      if (!provider) throw new Error('validation request not found, please retry')

      const { client } = await initializeIssuerAndClient({ provider })
      const callbackParams = client.callbackParams(req)
      const tokenSet = await client.callback(
        buildAuthRedirectUrl(workspaceSlug, isValidationFlow).toString(),
        callbackParams,
        /* eslint-disable-next-line camelcase */
        { code_verifier: codeVerifier }
      )

      // Get user profile from SSO provider
      const ssoProviderUserInfo = await client.userinfo<{ email: string }>(tokenSet)
      if (!ssoProviderUserInfo || !ssoProviderUserInfo.email)
        throw new Error('This should never happen, we are asking for an email claim')

      if (isValidationFlow) {
        // OIDC configuration verification flow: the user is attempting to configure SSO for their workspace
        const workspace = await getWorkspaceBySlugFactory({ db })({
          workspaceSlug: req.params.workspaceSlug
        })
        if (!workspace) throw new WorkspaceNotFoundError()

        // TODO: Assert billing status

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
          storeUserSsoSession: storeUserSsoSessionFactory({ db: trx }),
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

        // Get Speckle user by email in SSO provider
        const userEmail = await findEmailFactory({ db })({
          email: ssoProviderUserInfo.email
        })
        let user: Pick<UserRecord, 'id' | 'email'> | null = await getUser(
          userEmail?.userId
        )
        // if someone already uses this email in an sso flow, GO AWAY!!!!!
        // req.context.userId

        const isNewUser = !user

        if (!user) {
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

          // Create user
          // if the ssoProvderUserInfo comes back with an unverified email, GO AWAY!!!!
          const { name, email } = ssoProviderUserInfo
          const newUser = {
            name,
            email,
            // TODO: Do we set email as verified only if provider says it's verified
            verified: true
          }
          const userId = await createUser(newUser)

          user = {
            ...newUser,
            id: userId
          }

          // what happens if there is already a req.user ?!
          // this is only needed if you are creating a new user
          req.user = { id: user.id, email: user.email, isNewUser }

          // Set workspace role
          // TODO: Based on invite!
        } else {
          // Verify user is a member of the workspace
        }

        // Update timeout for SSO session

        // this is not valid in the case of validate, that needs to go to /workspace settings, make sure, that is true
        req.authRedirectPath = `workspaces/${req.params.workspaceSlug}/`

        return next()
      }
    } catch (err) {
      logger.warn(
        { error: err },
        // this is only valid for the validate errors, not really for login !!!!
        `Failed to verify OIDC sso provider for workspace ${workspaceSlug}`
      )
      // in case of this is a login error, we need to redirect to the login page with the error
      redirectUrl = buildErrorUrl({
        err,
        url: redirectUrl,
        searchParams: provider || undefined
      })
      res.redirect(redirectUrl.toString())
    } finally {
      req.session.destroy(noop)
    }
  },
  finalizeAuthMiddleware
)

export default router
