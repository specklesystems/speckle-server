import {
  ExecutionEngineBadResponseBodyError,
  type ExecutionEngineErrorResponse,
  ExecutionEngineFailedResponseError,
  ExecutionEngineNetworkError
} from '@/modules/automate/errors/executionEngine'
import { AutomateInvalidTriggerError } from '@/modules/automate/errors/management'
import type {
  FunctionReleaseSchemaType,
  FunctionSchemaType,
  FunctionWithVersionsSchemaType
} from '@/modules/automate/helpers/executionEngine'
import type { VersionCreationTriggerType } from '@/modules/automate/helpers/types'
import {
  type AutomationFunctionRunRecord,
  type BaseTriggerManifest,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import type { AuthCodePayload } from '@/modules/automate/services/authCode'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { getServerOrigin, speckleAutomateUrl } from '@/modules/shared/helpers/envHelper'
import {
  type Nullable,
  type SourceAppName,
  TIME_MS,
  isNonNullable,
  isNullOrUndefined,
  retry,
  timeoutAt
} from '@speckle/shared'
import { randomUUID } from 'crypto'
import { automateLogger, type Logger } from '@/observability/logging'
import { has, isObjectLike, isEmpty } from 'lodash-es'
import { getRequestLogger } from '@/observability/utils/requestContext'

export type AuthCodePayloadWithOrigin = AuthCodePayload & { origin: string }

const addOrigin = (P: AuthCodePayload): AuthCodePayloadWithOrigin => {
  const origin = getServerOrigin()
  return { ...P, origin }
}

const isErrorResponse = (e: unknown): e is ExecutionEngineErrorResponse =>
  isObjectLike(e) && has(e, 'statusCode') && has(e, 'statusMessage')

export type AutomationCreateResponse = {
  automationId: string
  token: string
}

const getApiUrl = (
  path?: string,
  options?: Partial<{
    query: Record<string, string[] | string | number | boolean | undefined>
  }> & { logger?: Logger }
) => {
  const logger = options?.logger || getRequestLogger() || automateLogger

  const automateUrl = speckleAutomateUrl()
  if (!automateUrl)
    throw new MisconfiguredEnvironmentError(
      'Cannot create automation, Automate URL is not configured'
    )

  if (!path?.length) return automateUrl

  const url = new URL(path, automateUrl)
  if (options?.query) {
    Object.entries(options.query).forEach(([key, val]) => {
      if (isNullOrUndefined(val)) return
      if (typeof val === 'object' && isEmpty(val)) return
      try {
        const urlValue = typeof val === 'object' ? val.join(',') : val.toString()
        url.searchParams.append(key, urlValue)
      } catch {
        logger.warn({ automateUrl: val }, 'Failed to parse query param')
        //ignore
      }
    })
  }

  return url.toString()
}

const invokeSafeJsonRequestFactory =
  <Response extends Record<string, unknown> = Record<string, unknown>>(deps: {
    logger: Logger
  }) =>
  async (...args: Parameters<typeof invokeRequest>): Promise<Response | null> => {
    const { logger } = deps
    const [{ url, method }] = args
    try {
      return await invokeJsonRequest<Response>({
        ...args[0],
        requestId: logger.bindings?.()?.req?.id
      })
    } catch (e) {
      logger.error({ url, method, err: e }, 'Automate API request error suppressed.')
      return null
    }
  }

const invokeJsonRequest = async <R = Record<string, unknown>>(
  ...args: Parameters<typeof invokeRequest>
) => {
  const [{ url, method = 'get', body }] = args
  const response = await invokeRequest(...args)

  const result = (await response.json()) as R
  if (isErrorResponse(result)) {
    throw new ExecutionEngineFailedResponseError(result, { method, url, body })
  }

  return result
}

const invokeRequest = async (params: {
  url: string
  method?: RequestInit['method']
  body?: Record<string, unknown>
  requestId?: string
  token?: string
  retry?: boolean
}) => {
  const { url, method = 'get', body, token, requestId } = params
  const logger = getRequestLogger() || automateLogger

  const response = await retry(
    async () =>
      await Promise.race([
        fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': requestId ?? randomUUID(),
            ...(token?.length ? { Authorization: `Bearer ${token}` } : {})
          },
          body: body && isObjectLike(body) ? JSON.stringify(body) : undefined
        }).catch((e) => {
          throw new ExecutionEngineNetworkError({ method, url, body }, e)
        }),
        timeoutAt(
          20 * TIME_MS.second,
          'Automate Execution Engine API request timed out'
        )
      ]),
    params.retry !== false ? 3 : 1,
    (i, error) => {
      logger.warn(
        { url, method, err: error },
        'Automate Execution Engine API call failed, retrying...'
      )
      return i * TIME_MS.second
    }
  )

  if (response.status >= 400) {
    const errorReq = {
      method,
      url,
      body
    }

    let errorResponse: unknown
    try {
      errorResponse = await response.json()
    } catch {
      throw new ExecutionEngineBadResponseBodyError(errorReq)
    }

    if (!isErrorResponse(errorResponse)) {
      throw new ExecutionEngineBadResponseBodyError(errorReq)
    }

    throw new ExecutionEngineFailedResponseError(errorResponse, errorReq)
  }

  return response
}

export const createAutomation = async (params: {
  speckleServerUrl?: string
  authCode: AuthCodePayload
}) => {
  const { speckleServerUrl = getServerOrigin(), authCode } = params

  const url = getApiUrl(`/api/v2/automations`)

  const speckleServerOrigin = new URL(speckleServerUrl).origin

  const result = await invokeJsonRequest<AutomationCreateResponse>({
    url,
    method: 'post',
    body: {
      speckleServerAuthenticationPayload: {
        ...authCode,
        origin: speckleServerOrigin
      }
    },
    retry: false
  })

  return result
}

type AutomationRunPostBody = {
  projectId: string
  speckleToken: string
  triggers: Array<{
    payload: { modelId: string; versionId: string }
    triggerType: typeof VersionCreationTriggerType
  }>
  functionDefinitions: {
    functionId: string
    functionReleaseId: string
    functionInputs: Record<string, unknown> | null
    functionRunId: string
  }[]
}

export type AutomationRunResponseBody = {
  automationRunId: string
}

export type TriggeredAutomationFunctionRun = AutomationFunctionRunRecord & {
  resultVersions: string[]
  functionInputs: Record<string, unknown> | null
}

export const triggerAutomationRun = async (params: {
  projectId: string
  automationId: string
  functionRuns: TriggeredAutomationFunctionRun[]
  manifests: BaseTriggerManifest[]
  speckleToken: string
  automationToken: string
}) => {
  const {
    projectId,
    automationId,
    functionRuns,
    manifests,
    speckleToken,
    automationToken
  } = params

  const url = getApiUrl(`/api/v2/automations/${automationId}/runs`)
  const functionDefinitions = functionRuns.map((functionRun) => {
    return {
      functionId: functionRun.functionId,
      functionReleaseId: functionRun.functionReleaseId,
      functionInputs: functionRun.functionInputs,
      functionRunId: functionRun.id
    }
  })

  const versionCreationManifests = manifests.filter(isVersionCreatedTriggerManifest)
  if (!versionCreationManifests.length) {
    throw new AutomateInvalidTriggerError(
      'Only version creation triggers currently supported'
    )
  }

  const payload: AutomationRunPostBody = {
    projectId,
    functionDefinitions,
    triggers: versionCreationManifests.map((t) => ({
      triggerType: t.triggerType,
      payload: { modelId: t.modelId, versionId: t.versionId }
    })),
    speckleToken
  }

  const result = await invokeJsonRequest<AutomationRunResponseBody>({
    url,
    method: 'post',
    body: payload,
    token: automationToken,
    retry: false
  })

  return result
}

export enum ExecutionEngineFunctionTemplateId {
  Python = 'python',
  DotNet = '.net',
  TypeScript = 'typescript',
  Demonstration = 'demonstration',
  DemonstrationPython = 'demonstrationpython'
}

export type CreateFunctionBody<AP extends AuthCodePayload = AuthCodePayloadWithOrigin> =
  {
    speckleServerAuthenticationPayload: AP
    template: ExecutionEngineFunctionTemplateId
    functionName: string
    description: string
    supportedSourceApps: SourceAppName[]
    tags: string[]
    logo: Nullable<string>
    org: Nullable<string>
  }

export type CreateFunctionResponse = {
  functionId: string
  functionToken: string
  repo: {
    htmlUrl: string
    gitUrl: string
    sshUrl: string
    owner: string
    name: string
    defaultBranch: string
  }
}

export const createFunction = async ({
  body
}: {
  body: CreateFunctionBody<AuthCodePayload>
}): Promise<CreateFunctionResponse> => {
  const url = getApiUrl('/api/v2/functions/from-template')

  const formattedBody: CreateFunctionBody = {
    ...body,
    speckleServerAuthenticationPayload: addOrigin(
      body.speckleServerAuthenticationPayload
    )
  }
  return invokeJsonRequest<CreateFunctionResponse>({
    url,
    method: 'post',
    body: formattedBody,
    retry: false
  })
}

type CreateFunctionWithoutVersionBody = {
  speckleServerAuthenticationPayload: AuthCodePayloadWithOrigin
  functionName: string
  description: string
  repositoryUrl: string
  supportedSourceApps: string[]
  tags: string[]
}

type CreateFunctionWithoutVersionResponse = {
  functionId: string
  functionToken: string
}

export const createFunctionWithoutVersion = async ({
  body
}: {
  body: CreateFunctionWithoutVersionBody
}): Promise<CreateFunctionWithoutVersionResponse> => {
  const url = getApiUrl('/api/v2/functions')
  return await invokeJsonRequest<CreateFunctionWithoutVersionResponse>({
    url,
    method: 'post',
    body,
    retry: false
  })
}

export type UpdateFunctionBody<AP extends AuthCodePayload = AuthCodePayloadWithOrigin> =
  {
    speckleServerAuthenticationPayload: AP
    functionName?: string
    description?: string
    supportedSourceApps?: SourceAppName[]
    tags?: string[]
    logo?: string
  }

export type UpdateFunctionResponse = FunctionSchemaType

export const updateFunction = async (params: {
  functionId: string
  body: UpdateFunctionBody<AuthCodePayload>
}): Promise<UpdateFunctionResponse> => {
  const { functionId, body } = params
  const url = getApiUrl(`/api/v2/functions/${functionId}`)

  const formattedBody: UpdateFunctionBody = {
    ...body,
    speckleServerAuthenticationPayload: addOrigin(
      body.speckleServerAuthenticationPayload
    )
  }
  return await invokeJsonRequest<UpdateFunctionResponse>({
    url,
    method: 'PATCH',
    body: formattedBody,
    retry: false
  })
}

export const regenerateFunctionToken = async (params: {
  functionId: string
  authCode: AuthCodePayload
}): Promise<{ token: string }> => {
  const { functionId, authCode } = params
  const url = getApiUrl(`/api/v2/functions/${functionId}/tokens/regenerate`)
  return await invokeJsonRequest<{ token: string }>({
    url,
    method: 'POST',
    body: {
      speckleServerAuthenticationPayload: addOrigin(authCode)
    }
  })
}

export type GetFunctionResponse = FunctionWithVersionsSchemaType & {
  versionCount: number
  versionCursor: Nullable<string>
}

export const getFunctionFactory =
  (deps: { logger: Logger }) =>
  async (params: {
    functionId: string
    token?: string
    releases?: { cursor?: string; limit?: number; versionsFilter?: string }
  }) => {
    const { logger } = deps
    const { functionId, token } = params
    const query = Object.values(params.releases || {}).filter(isNonNullable).length
      ? params.releases
      : undefined

    const url = getApiUrl(`/api/v1/functions/${functionId}`, {
      query,
      logger
    })

    return await invokeSafeJsonRequestFactory<GetFunctionResponse>({
      logger
    })({
      url,
      method: 'get',
      token
    })
  }

export type GetFunctionReleaseResponse = FunctionReleaseSchemaType

/**
 * TODO: Build optimized exec engine endpoint for this
 */
export const getFunctionReleasesFactory =
  (deps: { logger: Logger }) =>
  async (params: { ids: Array<{ functionId: string; functionReleaseId: string }> }) => {
    const { logger } = deps
    const { ids } = params
    const results = await Promise.all(
      ids.map(async ({ functionId, functionReleaseId }) => {
        try {
          return await getFunctionReleaseFactory({ logger })({
            functionId,
            functionReleaseId
          })
        } catch (e) {
          if (e instanceof ExecutionEngineNetworkError) {
            return null
          }
          if (
            e instanceof ExecutionEngineFailedResponseError &&
            e.response.statusMessage === 'FunctionNotFound'
          ) {
            return null
          }

          throw e
        }
      })
    )

    return results.filter(isNonNullable)
  }

export const getFunctionReleaseFactory =
  (deps: { logger: Logger }) =>
  async (params: { functionId: string; functionReleaseId: string }) => {
    const { logger } = deps
    const { functionId, functionReleaseId } = params
    const url = getApiUrl(
      `/api/v1/functions/${functionId}/versions/${functionReleaseId}`,
      {
        logger
      }
    )

    const result = await invokeSafeJsonRequestFactory<GetFunctionReleaseResponse>({
      logger
    })({
      url,
      method: 'get'
    })

    return result
      ? {
          ...result,
          functionId
        }
      : null
  }

export type GetFunctionsParams = {
  auth?: AuthCodePayload
  filters: {
    query?: string
    cursor?: string
    limit?: number
    requireRelease?: boolean
    includeFeatured?: boolean
    includeWorkspaces?: string[]
    includeUsers?: string[]
  }
}

export type GetFunctionsResponse = {
  items: FunctionSchemaType[]
  cursor: Nullable<string>
  totalCount: number
}

export const getFunctionsFactory =
  (deps: { logger: Logger }) => async (params: GetFunctionsParams) => {
    const { logger } = deps

    const url = getApiUrl(`/api/v2/functions`, {
      query: {
        requireRelease: true,
        ...params.filters
      },
      logger
    })

    const authToken = params.auth
      ? Buffer.from(
          JSON.stringify({
            ...params.auth,
            origin: getServerOrigin()
          })
        ).toString('base64')
      : undefined

    return await invokeSafeJsonRequestFactory<GetFunctionsResponse>({ logger })({
      url,
      method: 'get',
      token: authToken
    })
  }

type GetUserFunctionsResponse = {
  functions: FunctionWithVersionsSchemaType[]
}

export const getUserFunctionsFactory =
  (deps: { logger: Logger }) =>
  async (params: {
    userId: string
    query?: {
      query?: string
      cursor?: string
      limit?: number
    }
    body: {
      speckleServerAuthenticationPayload: AuthCodePayloadWithOrigin
    }
  }) => {
    const { logger } = deps
    const { userId, query, body } = params
    const url = getApiUrl(`/api/v2/users/${userId}/functions`, { query, logger })

    return await invokeSafeJsonRequestFactory<GetUserFunctionsResponse>({
      logger
    })({
      url,
      method: 'POST',
      body,
      retry: false
    })
  }

type UserGithubAuthStateResponse = {
  userHasAuthorizedGitHubApp: boolean
}

export const getUserGithubAuthState = async (params: {
  speckleServerUrl?: string
  userId: string
}) => {
  const { speckleServerUrl = getServerOrigin(), userId: speckleUserId } = params
  const speckleServerOrigin = new URL(speckleServerUrl).origin

  const url = getApiUrl(`/api/v2/functions/auth/githubapp`, {
    query: {
      speckleServerOrigin,
      speckleUserId
    }
  })

  return await invokeJsonRequest<UserGithubAuthStateResponse>({
    url,
    method: 'get'
  })
}

export const getUserGithubOrganizations = async (params: {
  speckleServerUrl?: string
  authCode: AuthCodePayload
}) => {
  const {
    speckleServerUrl = getServerOrigin(),
    authCode: speckleServerAuthenticationPayload
  } = params
  const speckleServerOrigin = new URL(speckleServerUrl).origin

  const url = getApiUrl(`/api/v2/functions/auth/githubapp/organizations`, {
    query: {
      speckleServerAuthenticationPayload: JSON.stringify({
        ...speckleServerAuthenticationPayload,
        origin: speckleServerOrigin
      })
    }
  })

  return await invokeJsonRequest<{ availableGitHubOrganisations: string[] }>({
    url,
    method: 'get'
  })
}

export async function* getAutomationRunLogs(params: {
  automationId: string
  automationRunId: string
  automationToken: string
}) {
  const { automationId, automationRunId, automationToken } = params
  const url = getApiUrl(
    `/api/v2/automations/${automationId}/runs/${automationRunId}/logs`
  )

  const response = await invokeRequest({ url, token: automationToken })

  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      yield line
    }
  }

  if (buffer) yield buffer
}
