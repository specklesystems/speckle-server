import { validateRequest } from 'zod-express'
import { Router } from 'express'
import { z } from 'zod'
import {
  finishOIDCSsoProviderValidationFactory,
  startOIDCSsoProviderValidationFactory
} from '@/modules/workspaces/services/sso'
import {
  getOIDCProviderAttributes,
  getOIDCUserData,
  getProviderAuthorizationUrl,
  initializeIssuerAndClient
} from '@/modules/workspaces/clients/oidcProvider'
import { getFrontendOrigin, getServerOrigin } from '@/modules/shared/helpers/envHelper'
import {
  storeOIDCProviderValidationRequestFactory,
  getOIDCProviderFactory
} from '@/modules/workspaces/repositories/sso'
import { buildDecryptor, buildEncryptor } from '@/modules/shared/utils/libsodium'
import { getEncryptionKeyPair } from '@/modules/automate/services/encryption'
import { getGenericRedis } from '@/modules/core'
import { generators } from 'openid-client'

const router = Router()

const cookieName = 'validationToken'

router.get(
  '/api/v1/sso/oidc/validate',
  validateRequest({
    query: z.object({
      clientId: z.string().min(5),
      clientSecret: z.string().min(1),
      issuerUrl: z.string().min(1).url(),
      finalizePage: z.string().url()
    })
  }),
  async ({ query, res }) => {
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
    const redirectUrl = new URL('/api/v1/sso/oidc/validate/callback', getServerOrigin())
    const authorizationUrl = await getProviderAuthorizationUrl({
      provider,
      redirectUrl,
      codeVerifier
    })
    res?.cookie(cookieName, await encryptor.encrypt(codeVerifier))
    // maybe not needed
    // encryptor.dispose()
    res?.redirect(authorizationUrl.toString())
  }
)

router.get(
  '/api/v1/workspaces/{workspaceSlug}/sso/oidc/validate/callback',
  async (req) => {
    const frontendOrigin = getFrontendOrigin()
    const redirectUrl = new URL(frontendOrigin)
    const successKey = 'success'
    redirectUrl.searchParams.set(successKey, 'false')
    try {
      const encryptionKeyPair = await getEncryptionKeyPair()
      let decryptor = await buildDecryptor(encryptionKeyPair)
      const encryptedValidationToken = req.cookies[cookieName] as string | undefined
      if (!encryptedValidationToken) throw new Error('cannot find token')

      const codeVerifier = await decryptor.decrypt(encryptedValidationToken)
      decryptor = await buildDecryptor(encryptionKeyPair)

      const provider = await getOIDCProviderFactory({
        redis: getGenericRedis(),
        decrypt: decryptor.decrypt
      })({
        validationToken: codeVerifier
      })
      if (!provider) throw new Error('validation request not found, please retry')

      const { client } = await initializeIssuerAndClient({ provider })
      const callbackParams = client.callbackParams(req)
      const tokenset = await client.callback(
        `http://speckle.internal:3000/api/v1/sso/oidc/validate/callback`,
        callbackParams,
        // eslint-disable-next-line camelcase
        { code_verifier: codeVerifier }
      )
      const userInfo = await client.userinfo(tokenset)

      console.log(req.query)
    } catch (err) {
    } finally {
      req.res?.clearCookie(cookieName)
      // redirectUrl.
      req.res?.redirect(redirectUrl.toString())
    }
  }
)

export default router
