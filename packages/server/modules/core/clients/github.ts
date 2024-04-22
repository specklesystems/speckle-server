/* eslint-disable camelcase */
import {
  BadVerificationCodeError,
  DuplicateRepoNameError,
  InvalidOwnerError,
  InvalidRepoUrlError,
  InvalidTokenError,
  NotFoundOrPrivateRepoError,
  OrgAuthAccessRestrictionsError,
  SecretEncryptionFailedError,
  UnsupportedProviderError
} from '@/modules/core/errors/github'
import { OAuthAppAuthentication } from '@octokit/auth-oauth-user'
import { RequestError } from '@octokit/request-error'
import { ensureError } from '@speckle/shared'
import sodium from 'libsodium-wrappers'
import { OAuthApp, Octokit } from 'octokit'

type GithubRepositorySchema = {
  full_name: string
  message: string
}

export const getRepoDetails =
  (opts: { token?: string }) =>
  async (url: string): Promise<string> => {
    let repoName: string
    try {
      const parsedUrl = new URL(url)
      if (parsedUrl.host !== 'github.com') throw new UnsupportedProviderError()
      repoName = parsedUrl.pathname
    } catch (e) {
      throw new InvalidRepoUrlError(undefined, { cause: ensureError(e) })
    }

    if (repoName.endsWith('/')) repoName = repoName.slice(0, -1)

    const headers: Record<string, string> = {
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json'
    }
    if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`

    const response = await fetch(`https://api.github.com/repos${repoName}`, {
      headers
    })

    const data = (await response.json()) as GithubRepositorySchema
    if (data.message === 'Not Found') throw new NotFoundOrPrivateRepoError()
    if (!response.ok)
      throw Error(
        `Failed to get github repository: ${response.status} -> ${data.message}`
      )
    return data.full_name
  }

export type GithubUserOrganization = Awaited<
  ReturnType<InstanceType<typeof Octokit>['rest']['orgs']['listForAuthenticatedUser']>
>['data'][0]

export type GithubCreateRepoFromTemplateData = Awaited<
  ReturnType<InstanceType<typeof Octokit>['rest']['repos']['createUsingTemplate']>
>['data']

/**
 * Get access token for a user
 */
export const getAccessToken = async (params: {
  code: string
  clientId: string
  clientSecret: string
}): Promise<OAuthAppAuthentication> => {
  let tokens: OAuthAppAuthentication
  const { clientId, clientSecret, code } = params
  const app = new OAuthApp({ clientId, clientSecret })

  try {
    const { authentication } = await app.createToken({
      code
    })

    tokens = authentication
  } catch (e) {
    if (e instanceof RequestError) {
      if (e.message.includes('bad_verification_code')) {
        throw new BadVerificationCodeError(undefined, { cause: e })
      }
    }

    throw e
  }

  return tokens
}

/**
 * Test an accessToken
 */
export const testAccessToken = async (params: {
  accessToken: string
  clientId: string
  clientSecret: string
}) => {
  const { clientId, clientSecret, accessToken } = params
  const app = new OAuthApp({ clientId, clientSecret })

  try {
    const { authentication } = await app.checkToken({
      token: accessToken
    })

    return !!authentication.token
  } catch (e) {
    if (e instanceof RequestError && [404, 400].includes(e.status)) {
      return false
    }

    throw e
  }
}

/**
 * Get user's authorized organizations
 */
export const getAvailableOrgs = async (
  accessToken: string
): Promise<GithubUserOrganization[]> => {
  try {
    const octokit = new Octokit({ auth: accessToken })
    const orgs = await octokit.rest.orgs.listForAuthenticatedUser()
    return orgs.data
  } catch (e) {
    if (e instanceof RequestError && [401].includes(e.status)) {
      throw new InvalidTokenError(undefined, { cause: e })
    }

    throw e
  }
}

/**
 * Create repository from template
 */
export const createRepoFromTemplate = async (params: {
  templateOwner: string
  templateRepo: string
  name: string
  accessToken: string
  owner?: string
}): Promise<GithubCreateRepoFromTemplateData> => {
  const { templateOwner, templateRepo, accessToken, name, owner } = params

  try {
    const octokit = new Octokit({ auth: accessToken })
    const repo = await octokit.rest.repos.createUsingTemplate({
      template_owner: templateOwner,
      template_repo: templateRepo,
      name,
      owner
    })
    return repo.data
  } catch (e) {
    if (e instanceof RequestError) {
      if ([401].includes(e.status)) {
        throw new InvalidTokenError(undefined, { cause: e })
      }

      if (
        e.status === 403 &&
        e.message.includes('organization has enabled OAuth App access restrictions')
      ) {
        throw new OrgAuthAccessRestrictionsError(undefined, { cause: e })
      }

      if (e.status === 404 && e.message.includes('Invalid owner')) {
        throw new InvalidOwnerError(undefined, { cause: e })
      }

      if (e.message.toLowerCase().includes('name already exists on this account')) {
        throw new DuplicateRepoNameError(undefined, { cause: e })
      }
    }
    throw e
  }
}

/**
 * Get a repository's public key (for encrypting secrets)
 */
export const getRepoPublicKey = async (params: {
  accessToken: string
  repoOwner: string
  repoName: string
}): Promise<{ key: string; key_id: string }> => {
  const { repoName, repoOwner, accessToken } = params

  try {
    const octokit = new Octokit({ auth: accessToken })
    const publicKey = await octokit.rest.actions.getRepoPublicKey({
      owner: repoOwner,
      repo: repoName
    })
    return publicKey.data
  } catch (e) {
    if (e instanceof RequestError && [401].includes(e.status)) {
      throw new InvalidTokenError(undefined, { cause: e })
    }
    throw e
  }
}

/**
 * Encrypt a github repo secret
 */
export async function encryptSecret(params: {
  secret: string
  publicKey: string
}): Promise<string> {
  try {
    const { secret, publicKey } = params
    await sodium.ready

    // Convert the secret and key to a Uint8Array.
    const binKey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL)
    const binSec = sodium.from_string(secret)

    // Encrypt the secret
    const encBytes = sodium.crypto_box_seal(binSec, binKey)

    // Convert to base64
    const result = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
    return result
  } catch (e) {
    throw new SecretEncryptionFailedError(undefined, { cause: ensureError(e) })
  }
}

/**
 * Add/update secret to repo
 */
export const upsertSecret = async (params: {
  accessToken: string
  repoOwner: string
  repoName: string
  secretKey: string
  publicKeyId: string
  encryptedSecretVal: string
}): Promise<true> => {
  const {
    repoName,
    repoOwner,
    secretKey,
    accessToken,
    publicKeyId,
    encryptedSecretVal
  } = params

  try {
    const octokit = new Octokit({ auth: accessToken })
    await octokit.rest.actions.createOrUpdateRepoSecret({
      owner: repoOwner,
      repo: repoName,
      secret_name: secretKey,
      key_id: publicKeyId,
      encrypted_value: encryptedSecretVal
    })
    return true
  } catch (e) {
    if (e instanceof RequestError && [401].includes(e.status)) {
      throw new InvalidTokenError(undefined, { cause: e })
    }
    throw e
  }
}

/**
 * Add an environment variable
 */
export const insertEnvVar = async (params: {
  accessToken: string
  repoOwner: string
  repoName: string
  key: string
  value: string
}): Promise<true> => {
  const { repoName, repoOwner, key, value, accessToken } = params

  try {
    const octokit = new Octokit({ auth: accessToken })
    await octokit.rest.actions.createRepoVariable({
      owner: repoOwner,
      repo: repoName,
      name: key,
      value
    })
    return true
  } catch (e) {
    if (e instanceof RequestError && [401].includes(e.status)) {
      throw new InvalidTokenError(undefined, { cause: e })
    }
    throw e
  }
}

export type { OAuthAppAuthentication }
