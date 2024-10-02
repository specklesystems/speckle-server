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
import {
  getFrontendOrigin,
  getRedisUrl,
  getServerOrigin,
  getSessionSecret,
  isSSLServer
} from '@/modules/shared/helpers/envHelper'
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
import { createRedisClient } from '@/modules/shared/redis/redis'
// temp imports
import ConnectRedis from 'connect-redis'
import ExpressSession from 'express-session'
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
import { createUser, getUser } from '@/modules/core/services/users'
import { UserRecord } from '@/modules/core/helpers/userHelper'

const router = Router()

// todo, this should be using the app wide session middleware
const RedisStore = ConnectRedis(ExpressSession)
const redisClient = createRedisClient(getRedisUrl(), {})
const sessionMiddleware = ExpressSession({
  store: new RedisStore({ client: redisClient }),
  secret: getSessionSecret(),
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 1000 * 60 * 3, // 3 minutes
    secure: isSSLServer()
  }
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
  '/api/v1/workspaces/:workspaceSlug/sso/oidc/validate',
  sessionMiddleware,
  validateRequest({
    params: z.object({
      workspaceSlug: z.string().min(1)
    }),
    query: oidcProvider
  }),
  async ({ session, params, query, res }) => {
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
  async (req, _res, next) => {
    const logger = req.log.child({ workspaceSlug: req.params.workspaceSlug })

    const workspaceSlug = req.params.workspaceSlug
    const isValidationFlow = req.query.validate === 'true'

    let provider: OIDCProvider | null = null
    let redirectUrl = buildFinalizeUrl(req.params.workspaceSlug, isValidationFlow)

    try {
      // Initialize OIDC client based on provider for current request flow
      const encryptionKeyPair = await getEncryptionKeyPair()
      const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
      const decryptor = await buildDecryptor(encryptionKeyPair)
      const encryptedCodeVerifier = req.session.codeVerifier

      if (!encryptedCodeVerifier)
        throw new Error('cannot find verification token, restart the flow')

      const codeVerifier = await decryptor.decrypt(encryptedCodeVerifier)

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
        const userEmail = await findEmailFactory({ db })({ email: ssoProviderUserInfo.email })
        let user: Pick<UserRecord, 'id' | 'email'> | null = await getUser(userEmail?.userId)
        const isNewUser = !user

        if (!user) {
          // Create user
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

          // Set workspace role
          // TODO: Based on invite!
        }

        // Verify user is a member of the workspace

        // Verify workspace has SSO enabled

        // Update timeout for SSO session

        req.user = { id: user.id, email: user.email, isNewUser }
        req.authRedirectPath = `workspaces/${req.params.workspaceSlug}/`

        return next()
      }
    } catch (err) {
      logger.warn(
        { error: err },
        `Failed to verify OIDC sso provider for workspace ${workspaceSlug}`
      )
      redirectUrl = buildErrorUrl({
        err,
        url: redirectUrl,
        searchParams: provider || undefined
      })
      req.res?.redirect(redirectUrl.toString())
    } finally {
      req.session.destroy(noop)
    }
  }
)

export default router
