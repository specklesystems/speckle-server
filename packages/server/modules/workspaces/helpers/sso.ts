import { getEncryptionKeyPair } from '@/modules/automate/services/encryption'
import { base64Decode } from '@/modules/shared/helpers/cryptoHelper'
import { getFrontendOrigin, getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { buildDecryptor, buildEncryptor } from '@/modules/shared/utils/libsodium'
import { SsoSessionState } from '@/modules/workspaces/domain/sso/types'
import {
  OidcStateInvalidError,
  OidcStateMissingError,
  SsoVerificationCodeMissingError
} from '@/modules/workspaces/errors/sso'
import { Request } from 'express'

declare module 'express-session' {
  interface SessionData {
    workspaceId?: string
    ssoNonce?: string
    ssoState?: Record<string, SsoSessionState>
  }
}

/**
 * Generate Speckle URL to redirect users to after they complete authorization
 * with the given SSO provider.
 */
export const buildAuthRedirectUrl = (workspaceSlug: string): URL => {
  const urlFragments = [`/api/v1/workspaces/${workspaceSlug}/sso/oidc/callback`]

  return new URL(urlFragments.join(''), getServerOrigin())
}

/**
 * Generate Speckle URL to redirect users to after successfully completing the
 * SSO authorization flow.
 * @remarks Append params to this URL to preserve information about errors
 */
export const buildFinalizeUrl = (workspaceSlug: string): URL => {
  return new URL(`workspaces/${workspaceSlug}/sso`, getFrontendOrigin())
}

/**
 * Generate Speckle URL to redirect users to after an error occurs during SSO.
 */
export const buildErrorUrl = (err: unknown, workspaceSlug: string) => {
  const errorRedirectUrl = buildFinalizeUrl(workspaceSlug)
  let errorMessage: string

  if (err instanceof Error) {
    errorMessage = `${err.message}`
  } else {
    errorMessage = `Unknown error: ${JSON.stringify(err)}`
  }

  errorRedirectUrl.searchParams.set('error', errorMessage)
  return errorRedirectUrl.toString()
}

export const getEncryptor = () => async (data: string) => {
  const encryptionKeyPair = await getEncryptionKeyPair()
  const encryptor = await buildEncryptor(encryptionKeyPair.publicKey)
  const encryptedData = await encryptor.encrypt(data)

  encryptor.dispose()

  return encryptedData
}

export const getDecryptor = () => async (data: string) => {
  const encryptionKeyPair = await getEncryptionKeyPair()
  const decryptor = await buildDecryptor(encryptionKeyPair)
  const decryptedData = await decryptor.decrypt(data)

  decryptor.dispose()

  return decryptedData
}

export const parseCodeVerifier = async (req: Request<unknown>): Promise<string> => {
  const encryptedCodeVerifier = req.session.codeVerifier
  if (!encryptedCodeVerifier) throw new SsoVerificationCodeMissingError()
  const codeVerifier = await getDecryptor()(encryptedCodeVerifier)
  return codeVerifier
}

export const getSsoSessionState = (
  req: Request<unknown, unknown, unknown, { state: string }>
): SsoSessionState => {
  const sessionNonce = req.session.ssoNonce
  const requestNonce = base64Decode(req.query.state)

  if (!sessionNonce || !requestNonce || sessionNonce !== requestNonce) {
    throw new OidcStateInvalidError()
  }

  const state = req.session.ssoState?.[requestNonce]

  if (!state) {
    throw new OidcStateMissingError()
  }

  return state
}
