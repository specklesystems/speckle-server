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
import { OidcProvider } from '@/modules/workspaces/domain/sso/types'
import { Request } from 'express'
import { omit } from 'lodash'

declare module 'express-session' {
  interface SessionData {
    workspaceId?: string
    ssoNonce?: string
    ssoState?: SsoSessionState
    oidcProvider?: OidcProvider
  }
}

/**
 * Generate Speckle URL to redirect users to after they complete authorization
 * with the given SSO provider.
 */
export const buildAuthRedirectUrl = (workspaceSlug: string): URL => {
  const url = new URL(
    `/api/v1/workspaces/${workspaceSlug}/sso/oidc/callback`,
    getServerOrigin()
  )

  return url
}

export const buildAuthFinalizeRedirectUrl = (
  workspaceSlug: string,
  searchParams: Record<string, string> = {}
) => {
  const url = new URL(`/workspaces/${workspaceSlug}/sso`, getFrontendOrigin())
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value)
  }
  return url
}

export const buildAuthErrorRedirectUrl = (workspaceSlug: string, error: string) => {
  return buildAuthFinalizeRedirectUrl(workspaceSlug, {
    ssoError: error
  })
}

export const buildValidationErrorRedirectUrl = (
  workspaceSlug: string,
  error: string,
  oidcProvider?: OidcProvider
) => {
  const url = new URL(`/workspaces/${workspaceSlug}`, getFrontendOrigin())

  url.searchParams.set('ssoValidationSuccess', 'false')
  url.searchParams.set('ssoError', error)

  for (const [key, value] of Object.entries<string>(
    omit(oidcProvider ?? {}, 'clientSecret')
  )) {
    url.searchParams.set(key, value)
  }

  return url
}

export const getErrorMessage = (e: unknown): string => {
  return e instanceof Error ? `${e.message}` : `Unknown error: ${JSON.stringify(e)}`
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

  const state = req.session.ssoState

  if (!state) {
    throw new OidcStateMissingError()
  }

  return state
}
