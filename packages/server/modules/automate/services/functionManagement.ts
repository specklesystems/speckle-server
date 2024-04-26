import { createFunction } from '@/modules/automate/clients/executionEngine'
import {
  MisconfiguredTemplateOrgError,
  MissingAutomateGithubAuthError,
  RepoSecretsCouldNotBeUpdatedError
} from '@/modules/automate/errors/github'
import {
  AutomateFunctionCreationError,
  AutomateFunctionUpdateError
} from '@/modules/automate/errors/management'
import {
  generateFunctionId,
  getFunction,
  upsertFunction,
  updateFunction as updateDbFunction
} from '@/modules/automate/repositories/functions'
import { createStoredAuthCode } from '@/modules/automate/services/executionEngine'
import {
  createAutomateRepoFromTemplate,
  getGithubRepoMetadataFromUrl
} from '@/modules/automate/services/github'
import {
  encryptSecret,
  getRepoPublicKey,
  insertEnvVar,
  upsertSecret
} from '@/modules/core/clients/github'
import { OrgAuthAccessRestrictionsError } from '@/modules/core/errors/github'
import { UpdateAutomateFunctionInput } from '@/modules/core/graph/generated/graphql'
import { getUser } from '@/modules/core/repositories/users'
import { getValidatedUserAuthMetadata } from '@/modules/core/services/githubApp'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { CreateAutomateFunctionInput } from '@/test/graphql/generated/graphql'
import {
  MaybeNullOrUndefined,
  Nullable,
  ensureError,
  removeNullOrUndefinedKeys
} from '@speckle/shared'

const cleanFunctionLogo = (logo: MaybeNullOrUndefined<string>): Nullable<string> => {
  if (!logo?.length) return null
  if (logo.startsWith('data:')) return logo
  if (logo.startsWith('http:')) return logo
  if (logo.startsWith('https:')) return logo
  return null
}

type SetupFunctionRepoSecretsDeps = {
  getValidatedGithubAuthMetadata: ReturnType<typeof getValidatedUserAuthMetadata>
  getGithubRepoPublicKey: typeof getRepoPublicKey
  encryptGithubSecret: typeof encryptSecret
  upsertGithubSecret: typeof upsertSecret
  insertGithubEnvVar: typeof insertEnvVar
}

const setupFunctionRepoSecrets =
  (deps: SetupFunctionRepoSecretsDeps) =>
  async (params: {
    userId: string
    repoUrl: string
    secrets: Record<string, string>
  }) => {
    const { userId, repoUrl, secrets } = params
    const {
      getValidatedGithubAuthMetadata,
      getGithubRepoPublicKey,
      encryptGithubSecret,
      upsertGithubSecret,
      insertGithubEnvVar
    } = deps

    const ghAuth = await getValidatedGithubAuthMetadata({ userId })
    if (!ghAuth) {
      throw new MissingAutomateGithubAuthError()
    }

    const repoMetadata = getGithubRepoMetadataFromUrl(repoUrl)
    const accessToken = ghAuth.token
    const publicKey = await getGithubRepoPublicKey({
      accessToken,
      repoOwner: repoMetadata.org,
      repoName: repoMetadata.repo
    })

    const upsertSecret = async (secretKey: string, secretVal: string) => {
      const encryptedSecret = await encryptGithubSecret({
        secret: secretVal,
        publicKey: publicKey.key
      })

      return await upsertGithubSecret({
        accessToken,
        repoOwner: repoMetadata.org,
        repoName: repoMetadata.repo,
        secretKey,
        publicKeyId: publicKey.key_id,
        encryptedSecretVal: encryptedSecret
      })
    }

    try {
      await Promise.all([
        ...Object.entries(secrets).map(([key, val]) => upsertSecret(key, val)),
        insertGithubEnvVar({
          accessToken,
          repoOwner: repoMetadata.org,
          repoName: repoMetadata.repo,
          key: 'SPECKLE_AUTOMATE_URL',
          value: getServerOrigin()
        })
      ])
    } catch (e) {
      throw new RepoSecretsCouldNotBeUpdatedError(
        `One or more repo secrets could not be updated`,
        {
          cause: ensureError(e)
        }
      )
    }

    return true
  }

export type CreateFunctionDeps = {
  createGithubRepo: ReturnType<typeof createAutomateRepoFromTemplate>
  upsertFn: typeof upsertFunction
  createExecutionEngineFn: typeof createFunction
  generateAuthCode: ReturnType<typeof createStoredAuthCode>
  getUser: typeof getUser
  generateFunctionId: typeof generateFunctionId
} & SetupFunctionRepoSecretsDeps

export const createFunctionFromTemplate =
  (deps: CreateFunctionDeps) =>
  async (params: { input: CreateAutomateFunctionInput; userId: string }) => {
    const {
      input: { template, name, org, description, logo, supportedSourceApps, tags },
      userId
    } = params
    const {
      createGithubRepo,
      upsertFn,
      createExecutionEngineFn,
      generateAuthCode,
      getUser,
      generateFunctionId
    } = deps
    const invokeSetupFunctionRepoSecrets = setupFunctionRepoSecrets(deps)

    // Validate user
    const user = await getUser(userId)
    if (!user) {
      throw new AutomateFunctionCreationError('Speckle user not found')
    }

    // Attempt to create repo
    let newRepo: Awaited<ReturnType<typeof createGithubRepo>>
    try {
      newRepo = await createGithubRepo({
        templateId: template,
        userId,
        name,
        org
      })
    } catch (e) {
      if (e instanceof OrgAuthAccessRestrictionsError) {
        throw new MisconfiguredTemplateOrgError(
          'The Speckle Automate GitHub app is not authorized to use specklesystems templates',
          { cause: e }
        )
      }

      throw e
    }

    const repoUrl = newRepo.html_url

    // Create fn on exec engine side
    const authCode = await generateAuthCode()
    const execEngineFn = await createExecutionEngineFn({
      speckleServerDomain: getServerOrigin(),
      speckleServerAuthenticationCode: authCode
    })

    // Set up secrets
    await invokeSetupFunctionRepoSecrets({
      userId,
      repoUrl,
      secrets: {
        SPECKLE_FUNCTION_TOKEN: execEngineFn.token,
        SPECKLE_FUNCTION_ID: execEngineFn.functionId
      }
    })

    // Save fn in DB
    const createdFunction = await upsertFn({
      userId,
      repoUrl,
      name,
      description,
      tags,
      supportedSourceApps,
      executionEngineFunctionId: execEngineFn.functionId,
      logo: cleanFunctionLogo(logo),
      functionId: generateFunctionId()
    })

    return {
      fn: createdFunction,
      repo: newRepo
    }
  }

export type UpdateFunctionDeps = {
  updateFunction: typeof updateDbFunction
  getFunction: typeof getFunction
}

export const updateFunction =
  (deps: UpdateFunctionDeps) =>
  async (params: { input: UpdateAutomateFunctionInput; userId: string }) => {
    const { updateFunction, getFunction } = deps
    const { input, userId } = params

    const existingFn = await getFunction(input.id)
    if (!existingFn) {
      throw new AutomateFunctionUpdateError('Function not found')
    }

    if (existingFn.userId !== userId) {
      throw new AutomateFunctionUpdateError(
        'User does not have the rights to update this function'
      )
    }

    // Fix up logo, if any
    if (input.logo) {
      input.logo = cleanFunctionLogo(input.logo)
    }

    // Filter out empty (null) values from input
    const updates = removeNullOrUndefinedKeys(input)
    return await updateFunction(updates.id, updates)
  }
