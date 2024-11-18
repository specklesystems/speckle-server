import {
  CreateFunctionBody,
  ExecutionEngineFunctionTemplateId,
  createFunction,
  getFunction,
  updateFunction as updateExecEngineFunction
} from '@/modules/automate/clients/executionEngine'
import {
  AutomateFunctionCreationError,
  AutomateFunctionUpdateError
} from '@/modules/automate/errors/management'

import {
  BasicGitRepositoryMetadata,
  UpdateAutomateFunctionInput,
  CreateAutomateFunctionInput,
  AutomateFunctionTemplateLanguage
} from '@/modules/core/graph/generated/graphql'
import {
  MaybeNullOrUndefined,
  Nullable,
  Optional,
  SourceAppName,
  removeNullOrUndefinedKeys
} from '@speckle/shared'
import {
  AutomateFunctionGraphQLReturn,
  AutomateFunctionReleaseGraphQLReturn
} from '@/modules/automate/helpers/graphTypes'
import {
  FunctionReleaseSchemaType,
  FunctionSchemaType
} from '@/modules/automate/helpers/executionEngine'
import { Request, Response } from 'express'
import { UnauthorizedError } from '@/modules/shared/errors'
import {
  AuthCodePayload,
  AuthCodePayloadAction
} from '@/modules/automate/services/authCode'
import {
  getServerOrigin,
  isDevEnv,
  speckleAutomateUrl
} from '@/modules/shared/helpers/envHelper'
import { getFunctionsMarketplaceUrl } from '@/modules/core/helpers/routeHelper'
import { automateLogger } from '@/logging/logging'
import { CreateStoredAuthCode } from '@/modules/automate/domain/operations'
import { GetUser } from '@/modules/core/domain/users/operations'

const mapGqlTemplateIdToExecEngineTemplateId = (
  id: AutomateFunctionTemplateLanguage
): ExecutionEngineFunctionTemplateId => {
  switch (id) {
    case AutomateFunctionTemplateLanguage.Python:
      return ExecutionEngineFunctionTemplateId.Python
    case AutomateFunctionTemplateLanguage.DotNet:
      return ExecutionEngineFunctionTemplateId.DotNet
    case AutomateFunctionTemplateLanguage.Typescript:
      return ExecutionEngineFunctionTemplateId.TypeScript
    case AutomateFunctionTemplateLanguage.Demonstration:
      return ExecutionEngineFunctionTemplateId.Demonstration
    case AutomateFunctionTemplateLanguage.Demonstrationpython:
      return ExecutionEngineFunctionTemplateId.DemonstrationPython
    default:
      throw new Error('Unknown template id')
  }
}

const repoUrlToBasicGitRepositoryMetadata = (
  url: string
): BasicGitRepositoryMetadata => {
  const repoUrl = new URL(url)
  const pathParts = repoUrl.pathname.split('/').filter(Boolean)
  if (pathParts.length < 2) {
    throw new Error('Invalid GitHub repository URL')
  }

  const [owner, name] = pathParts
  return { owner, name, id: repoUrl.toString(), url: repoUrl.toString() }
}

const cleanFunctionLogo = (logo: MaybeNullOrUndefined<string>): Nullable<string> => {
  if (!logo?.length) return null
  if (logo.startsWith('data:')) return logo
  if (logo.startsWith('http:')) return logo
  if (logo.startsWith('https:')) return logo
  return null
}

export const convertFunctionToGraphQLReturn = (
  fn: FunctionSchemaType
): AutomateFunctionGraphQLReturn => {
  const ret: AutomateFunctionGraphQLReturn = {
    id: fn.functionId,
    name: fn.functionName,
    repo: repoUrlToBasicGitRepositoryMetadata(fn.repoUrl),
    isFeatured: fn.isFeatured,
    description: fn.description,
    logo: cleanFunctionLogo(fn.logo),
    tags: fn.tags,
    supportedSourceApps: fn.supportedSourceApps,
    functionCreator: fn.functionCreator
  }

  return ret
}

export const convertFunctionReleaseToGraphQLReturn = (
  fnRelease: FunctionReleaseSchemaType & { functionId: string }
): AutomateFunctionReleaseGraphQLReturn => {
  const ret: AutomateFunctionReleaseGraphQLReturn = {
    id: fnRelease.functionVersionId,
    versionTag: fnRelease.versionTag,
    createdAt: new Date(fnRelease.createdAt),
    inputSchema: fnRelease.inputSchema,
    commitId: fnRelease.commitId,
    functionId: fnRelease.functionId
  }

  return ret
}

export type CreateFunctionDeps = {
  createStoredAuthCode: CreateStoredAuthCode
  createExecutionEngineFn: typeof createFunction
  getUser: GetUser
}

export const createFunctionFromTemplateFactory =
  (deps: CreateFunctionDeps) =>
  async (params: { input: CreateAutomateFunctionInput; userId: string }) => {
    const { input, userId } = params
    const { createExecutionEngineFn, getUser, createStoredAuthCode } = deps

    // Validate user
    const user = await getUser(userId)
    if (!user) {
      throw new AutomateFunctionCreationError('Speckle user not found')
    }

    const authCode = await createStoredAuthCode({
      userId: user.id,
      action: AuthCodePayloadAction.CreateFunction
    })
    const body: CreateFunctionBody<AuthCodePayload> = {
      ...input,
      speckleServerAuthenticationPayload: authCode,
      functionName: input.name,
      template: mapGqlTemplateIdToExecEngineTemplateId(input.template),
      supportedSourceApps: input.supportedSourceApps as SourceAppName[],
      logo: cleanFunctionLogo(input.logo),
      org: input.org || null
    }

    const created = await createExecutionEngineFn({ body })

    if (isDevEnv() && created) {
      automateLogger.info({ created }, `[dev] Created function #${created.functionId}`)
    }

    // Don't want to pull the function w/ another req, so we'll just return the input
    const gqlReturn: AutomateFunctionGraphQLReturn = {
      id: created.functionId,
      name: body.functionName,
      repo: {
        id: created.repo.htmlUrl,
        url: created.repo.htmlUrl,
        name: created.repo.name,
        owner: created.repo.owner
      },
      isFeatured: false,
      description: body.description,
      logo: body.logo,
      tags: body.tags,
      supportedSourceApps: body.supportedSourceApps,
      functionCreator: {
        speckleServerOrigin: getServerOrigin(),
        speckleUserId: user.id
      }
    }

    return {
      createResponse: created,
      graphqlReturn: gqlReturn
    }
  }

export type UpdateFunctionDeps = {
  updateFunction: typeof updateExecEngineFunction
  getFunction: typeof getFunction
  createStoredAuthCode: CreateStoredAuthCode
}

export const updateFunctionFactory =
  (deps: UpdateFunctionDeps) =>
  async (params: { input: UpdateAutomateFunctionInput; userId: string }) => {
    const { updateFunction, createStoredAuthCode } = deps
    const { input, userId } = params

    const existingFn = await getFunction({ functionId: input.id })
    if (!existingFn) {
      throw new AutomateFunctionUpdateError('Function not found')
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

    const authCode = await createStoredAuthCode({
      userId,
      action: AuthCodePayloadAction.UpdateFunction
    })

    const apiResult = await updateFunction({
      functionId: updates.id,
      body: {
        ...updates,
        functionName: updates.name,
        supportedSourceApps: updates.supportedSourceApps as Optional<SourceAppName[]>,
        speckleServerAuthenticationPayload: authCode
      }
    })

    return convertFunctionToGraphQLReturn(apiResult)
  }

export type StartAutomateFunctionCreatorAuthDeps = {
  createStoredAuthCode: CreateStoredAuthCode
}

export const startAutomateFunctionCreatorAuthFactory =
  (deps: StartAutomateFunctionCreatorAuthDeps) =>
  async (params: { req: Request; res: Response }) => {
    const { createStoredAuthCode } = deps
    const { req, res } = params

    const userId = req.context.userId
    if (!userId) {
      throw new UnauthorizedError()
    }

    const authCode = await createStoredAuthCode({
      userId,
      action: AuthCodePayloadAction.BecomeFunctionAuthor
    })
    const redirectUrl = new URL(
      '/api/v2/functions/auth/githubapp/authorize',
      speckleAutomateUrl()
    )
    redirectUrl.searchParams.set(
      'speckleServerAuthenticationPayload',
      JSON.stringify({ ...authCode, origin: getServerOrigin() })
    )

    return res.redirect(redirectUrl.toString())
  }

export const handleAutomateFunctionCreatorAuthCallbackFactory =
  () => async (params: { req: Request; res: Response }) => {
    const { req, res } = params
    const {
      ghAuth = 'unknown',
      ghAuthDesc = 'GitHub Authentication unexpectedly failed'
    } = req.query as Record<string, string>

    const isSuccess = ghAuth === 'success'
    const redirectUrl = getFunctionsMarketplaceUrl()
    redirectUrl.searchParams.set('ghAuth', isSuccess ? 'success' : ghAuth)
    redirectUrl.searchParams.set('ghAuthDesc', isSuccess ? '' : ghAuthDesc)

    return res.redirect(redirectUrl.toString())
  }
