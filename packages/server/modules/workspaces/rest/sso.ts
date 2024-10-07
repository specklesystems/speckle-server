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
import { createUserEmailFactory } from '@/modules/core/repositories/userEmails'
import {
  finalizeAuthMiddlewareFactory,
  sessionMiddlewareFactory
} from '@/modules/auth/middleware'
import { createAuthorizationCodeFactory } from '@/modules/auth/repositories/apps'
import { getUserById } from '@/modules/core/services/users'

const router = Router()

const sessionMiddleware = sessionMiddlewareFactory()
const finalizeAuthMiddleware = finalizeAuthMiddlewareFactory({
  createAuthorizationCode: createAuthorizationCodeFactory({ db }),
  getUserById
})

const buildAuthRedirectUrl = (workspaceSlug: string): URL =>
  new URL(
    `/api/v1/workspaces/${workspaceSlug}/sso/oidc/callback?validate=true`,
    getServerOrigin()
  )

const buildFinalizeUrl = (workspaceSlug: string): URL =>
  new URL(`workspaces/${workspaceSlug}/?settings=server/general`, getFrontendOrigin())

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
      const redirectUrl = buildAuthRedirectUrl(params.workspaceSlug)
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
        url: buildFinalizeUrl(params.workspaceSlug),
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
  async (req) => {
    // this is the verify flow, login will be different
    // req.context.userId can be authorized for the workspaceSlug if needed
    const logger = req.log.child({ workspaceSlug: req.params.workspaceSlug })

    let provider: OIDCProvider | null = null
    if (req.query.validate === 'true') {
      const workspace = await getWorkspaceBySlugFactory({ db })({
        workspaceSlug: req.params.workspaceSlug
      })
      if (!workspace) throw new WorkspaceNotFoundError()
      await authorizeResolver(
        req.context.userId,
        workspace.id,
        Roles.Workspace.Admin,
        req.context.resourceAccessRules
      )
      // once we're authorized for the ws, we must have a userId
      const userId = req.context.userId!

      // point to the finalize page if there is one
      let redirectUrl = buildFinalizeUrl(req.params.workspaceSlug)
      try {
        const encryptionKeyPair = await getEncryptionKeyPair()
        const decryptor = await buildDecryptor(encryptionKeyPair)

        // ===================
        const encryptedValidationToken = req.session.codeVerifier
        if (!encryptedValidationToken)
          throw new Error('cannot find verification token, restart the flow')

        const codeVerifier = await decryptor.decrypt(encryptedValidationToken)

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
          buildAuthRedirectUrl(req.params.workspaceSlug).toString(),
          callbackParams,
          // eslint-disable-next-line camelcase
          { code_verifier: codeVerifier }
        )

        // now that we have the user's email, we should compare it to the active user's email.
        // Ask if they want to add the email to the oidc as a secondary email, if it doesn't match any of the user's emails
        const ssoProviderUserInfo = await client.userinfo(tokenSet)
        if (!ssoProviderUserInfo.email)
          throw new Error('This should never happen, we are asking for an email claim')

        const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
        const trx = await db.transaction()

        await saveSsoProviderRegistrationFactory({
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
          createUserEmail: createUserEmailFactory({ db: trx })
        })({
          provider,
          userId,
          workspaceId: workspace.id
          // ssoProviderUserInfo
        })
        await trx.commit()
        redirectUrl.searchParams.set(ssoVerificationStatusKey, 'success')
      } catch (err) {
        logger.warn(
          { error: err },
          'Failed to verify OIDC sso provider for workspace {workspaceSlug}'
        )
        redirectUrl = buildErrorUrl({
          err,
          url: redirectUrl,
          searchParams: provider || undefined
        })
      } finally {
        req.session.destroy(noop)
        // redirectUrl.
        req.res?.redirect(redirectUrl.toString())
      }
    } else {
      // this must be using the generic OIDC login flow somehow
    }
  },
  finalizeAuthMiddleware
)

export default router
