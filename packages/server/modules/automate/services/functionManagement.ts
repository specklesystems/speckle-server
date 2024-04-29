import { createFunction } from '@/modules/automate/clients/executionEngine'
import {
  MisconfiguredTemplateOrgError,
  MissingAutomateGithubAuthError,
  RepoSecretsCouldNotBeUpdatedError
} from '@/modules/automate/errors/github'
import {
  AutomateFunctionCreationError,
  AutomateFunctionReleaseCreateError,
  AutomateFunctionUpdateError
} from '@/modules/automate/errors/management'
import {
  generateFunctionId,
  getFunction,
  upsertFunction,
  updateFunction as updateDbFunction,
  upsertFunctionToken,
  getFunctionByExecEngineId,
  getFunctionToken,
  insertFunctionRelease
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
import { ForbiddenError, UnauthorizedError } from '@/modules/shared/errors'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { CreateAutomateFunctionInput } from '@/test/graphql/generated/graphql'
import {
  MaybeNullOrUndefined,
  Nullable,
  ensureError,
  isArrayOf,
  isNullOrUndefined,
  removeNullOrUndefinedKeys
} from '@speckle/shared'
import { Request } from 'express'
import { clamp, isInteger, isObjectLike, isString, trim } from 'lodash'
import Ajv2020 from 'ajv/dist/2020.js'

const versionTagRegexp = new RegExp('^[a-zA-Z0-9_][a-zA-Z0-9._-]{0,127}$')

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
  upsertFunctionToken: typeof upsertFunctionToken
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
      generateFunctionId,
      upsertFunctionToken
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

    // Save token in DB
    const createdToken = await upsertFunctionToken({
      functionId: createdFunction.functionId,
      token: execEngineFn.token
    })

    return {
      fn: createdFunction,
      repo: newRepo,
      token: createdToken
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

    // Skip if there's nothing left
    if (Object.keys(updates).length === 0) {
      return existingFn
    }

    return await updateFunction(updates.id, updates)
  }

export type FunctionReleaseCreateBody = {
  commitId: string
  versionTag: string
  inputSchema: Nullable<Record<string, unknown>>
  command: string[]
  recommendedCPUm: number
  recommendedMemoryMi: number
}

const getFunctionReleaseInputFromBody = (req: Request): FunctionReleaseCreateBody => {
  if (!isObjectLike(req.body)) {
    throw new AutomateFunctionReleaseCreateError('Request body is not a JSON object')
  }

  const throwValidationError = (msg: string): never => {
    throw new AutomateFunctionReleaseCreateError(msg)
  }

  const body = req.body
  const commitId =
    isString(body.commitId) && trim(body.commitId).length >= 6
      ? (body.commitId as string).substring(0, 10)
      : throwValidationError('commitId must be a string of at least 6 characters')
  const versionTag =
    isString(body.versionTag) && versionTagRegexp.test(body.versionTag)
      ? (body.versionTag as string)
      : throwValidationError(
          'versionTag must be a string with a max length of 128 characters. The first character must be alphanumeric (of lower or upper case) or an underscore, the subsequent characters may be alphanumeric (or lower or upper case), underscore, hyphen, or period.'
        )

  let inputSchema: Nullable<Record<string, unknown>>
  try {
    if (!body.inputSchema) {
      inputSchema = null
    } else {
      if (!isObjectLike(body.inputSchema))
        throw new AutomateFunctionReleaseCreateError('inputSchema must be an object')

      const validator = new Ajv2020({ validateFormats: false })
      validator.compile(body.inputSchema)

      inputSchema = body.inputSchema as Record<string, unknown>
    }
  } catch (e) {
    if (e instanceof AutomateFunctionReleaseCreateError) {
      throw e
    }

    const error = e instanceof Error ? e : null
    throw new AutomateFunctionReleaseCreateError(
      `inputSchema must be a valid JSON schema${error ? `: ${error.message}` : ''}`,
      {
        cause: error || undefined
      }
    )
  }

  const command =
    isArrayOf(body.command, isString) && (body.command as string[]).length > 0
      ? (body.command as string[])
      : throwValidationError('command must be a non-empty array of strings')

  let recommendedCPUm = 1000
  if (!isNullOrUndefined(body.recommendedCPUm)) {
    recommendedCPUm =
      isInteger(body.recommendedCPUm) &&
      clamp(body.recommendedCPUm, 100, 16000) === body.recommendedCPUm
        ? (body.recommendedCPUm as number)
        : throwValidationError(
            'recommendedCPUm must be an integer between 100 and 16000'
          )
  }

  let recommendedMemoryMi = 1000
  if (!isNullOrUndefined(body.recommendedMemoryMi)) {
    recommendedMemoryMi =
      isInteger(body.recommendedMemoryMi) &&
      clamp(body.recommendedMemoryMi, 1, 8000) === body.recommendedMemoryMi
        ? (body.recommendedMemoryMi as number)
        : throwValidationError(
            'recommendedMemoryMi must be an integer between 1 and 8000'
          )
  }

  return {
    commitId,
    versionTag,
    inputSchema,
    command,
    recommendedCPUm,
    recommendedMemoryMi
  }
}

export type CreateFunctionReleaseDeps = {
  resolveFunctionParams: (req: Request) => {
    functionId?: MaybeNullOrUndefined<string>
    token?: MaybeNullOrUndefined<string>
  }
  getFunctionByExecEngineId: typeof getFunctionByExecEngineId
  getFunctionToken: typeof getFunctionToken
  insertFunctionRelease: typeof insertFunctionRelease
}

export const createFunctionRelease =
  (deps: CreateFunctionReleaseDeps) => async (params: { req: Request }) => {
    const {
      resolveFunctionParams,
      getFunctionByExecEngineId,
      getFunctionToken,
      insertFunctionRelease
    } = deps
    const { req } = params

    const { functionId, token } = resolveFunctionParams(req)
    if (!functionId?.length) {
      throw new AutomateFunctionReleaseCreateError(
        'Could not resolve function ID from request'
      )
    }
    if (!token?.length) {
      throw new UnauthorizedError('Missing function token')
    }

    const fn = await getFunctionByExecEngineId(functionId)
    if (!fn) {
      throw new AutomateFunctionReleaseCreateError('Function not found')
    }
    const tokenRecord = await getFunctionToken({ fnId: fn.functionId, token })
    if (!tokenRecord) {
      throw new ForbiddenError('You do not have access to this function')
    }

    const input = getFunctionReleaseInputFromBody(req)
    return await insertFunctionRelease({
      ...input,
      functionId: fn.functionId,
      gitCommitId: input.commitId
    })
  }
