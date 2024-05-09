import {
  ExecutionEngineErrorResponse,
  ExecutionEngineFailedResponseError
} from '@/modules/automate/errors/executionEngine'
import { AutomateInvalidTriggerError } from '@/modules/automate/errors/management'
import {
  FunctionReleaseSchemaType,
  FunctionSchemaType,
  FunctionWithVersionsSchemaType
} from '@/modules/automate/helpers/executionEngine'
import {
  AutomationFunctionRunRecord,
  BaseTriggerManifest,
  VersionCreationTriggerType,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { speckleAutomateUrl } from '@/modules/shared/helpers/envHelper'
import { Nullable, SourceAppName, isNullOrUndefined } from '@speckle/shared'
import { has, isObjectLike } from 'lodash'

// TODO: Handle error/404 scenarios properly

const isErrorResponse = (e: unknown): e is ExecutionEngineErrorResponse =>
  isObjectLike(e) && has(e, 'statusCode') && has(e, 'statusMessage')

export type AutomationCreateResponse = {
  automationId: string
  token: string
}

const getApiUrl = (
  path?: string,
  options?: Partial<{
    query: Record<string, string | number | boolean | undefined>
  }>
) => {
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
      url.searchParams.append(key, val.toString())
    })
  }

  return url.toString()
}

const invokeRequest = async <R = Record<string, unknown>>(params: {
  url: string
  method?: RequestInit['method']
  body?: Record<string, unknown>
  token?: string
}) => {
  const { url, method = 'get', body, token } = params

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token?.length ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body && isObjectLike(body) ? JSON.stringify(body) : undefined
  })

  const result = (await response.json()) as R
  if (isErrorResponse(result)) {
    throw new ExecutionEngineFailedResponseError(result, { method, url, body })
  }

  return result
}

export const createAutomation = async (params: {
  speckleServerUrl: string
  authCode: string
}) => {
  const { speckleServerUrl, authCode } = params

  const url = getApiUrl(`/api/v2/automations`)
  const speckleServerDomain = new URL(speckleServerUrl).hostname

  const result = await invokeRequest<AutomationCreateResponse>({
    url,
    method: 'post',
    body: {
      speckleServerDomain,
      speckleServerAuthenticationCode: authCode
    }
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
    functionInputs: Record<string, unknown> | null
    functionId: string
    functionReleaseId: string
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
  const { projectId, automationId, functionRuns, manifests, speckleToken } = params

  const url = getApiUrl(`/api/v2/automations/${automationId}/runs`)
  const functionDefinitions = functionRuns.map((functionRun) => {
    return {
      functionId: functionRun.functionId,
      functionReleaseId: functionRun.functionReleaseId,
      functionInputs: functionRun.functionInputs,
      functionRunId: functionRun.runId
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

  const result = await invokeRequest<AutomationRunResponseBody>({
    url,
    method: 'post',
    body: payload
  })

  // TODO: handle 401
  return result
}

export enum ExecutionEngineFunctionTemplateId {
  Python = 'python',
  DotNet = '.net',
  TypeScript = 'typescript'
}

export type CreateFunctionBody = {
  template: ExecutionEngineFunctionTemplateId
  functionname: string
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

export const createFunction = async (params: {
  body: CreateFunctionBody
}): Promise<CreateFunctionResponse> => {
  throw new Error('Not implemented! Needs re-thinking by Gergo & Iain')
  console.log(params.body)
}

export type UpdateFunctionBody = {
  functionName?: string
  description?: string
  supportedSourceApps?: SourceAppName[]
  tags?: string[]
  logo?: string
}

export type UpdateFunctionResponse = FunctionSchemaType

export const updateFunction = async (params: {
  functionId: string
  body: UpdateFunctionBody
}): Promise<UpdateFunctionResponse> => {
  throw new Error('Not implemented! Needs re-thinking by Gergo & Iain')
  console.log(params)
}

export type GetFunctionResponse = FunctionWithVersionsSchemaType & {
  versionCount: number
  versionCursor: Nullable<string>
}

export const getFunction = async (params: {
  functionId: string
  token?: string
  releases?: { cursor?: string; limit?: number; search?: string }
}) => {
  const { functionId, token } = params
  const url = getApiUrl(`/api/v1/functions/${functionId}`, {
    query: params.releases?.cursor || params.releases?.limit ? params.releases : {}
  })

  const result = await invokeRequest<GetFunctionResponse>({
    url,
    method: 'get',
    token
  })

  return result
}

export type GetFunctionReleaseResponse = FunctionReleaseSchemaType

/**
 * TODO: Build optimized exec engine endpoint for this
 */
export const getFunctionReleases = async (params: {
  ids: Array<{ functionId: string; functionReleaseId: string }>
}) => {
  const { ids } = params
  return await Promise.all(
    ids.map(async ({ functionId, functionReleaseId }) =>
      getFunctionRelease({ functionId, functionReleaseId })
    )
  )
}

export const getFunctionRelease = async (params: {
  functionId: string
  functionReleaseId: string
}) => {
  const { functionId, functionReleaseId } = params
  const url = getApiUrl(`/api/v1/functions/${functionId}/versions/${functionReleaseId}`)

  const result = await invokeRequest<GetFunctionReleaseResponse>({
    url,
    method: 'get'
  })

  return {
    ...result,
    functionId
  }
}

export type GetFunctionsResponse = {
  totalCount: number
  cursor: Nullable<string>
  items: FunctionWithVersionsSchemaType[]
}

export const getFunctions = async (params: {
  query?: {
    query?: string
    cursor?: string
    limit?: number
    functionsWithoutVersions?: boolean
    featuredFunctionsOnly?: boolean
  }
}) => {
  const { query } = params
  const url = getApiUrl(`/api/v1/functions`, { query })

  const result = await invokeRequest<GetFunctionsResponse>({
    url,
    method: 'get'
  })

  return result
}
