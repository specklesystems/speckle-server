import { AutomateInvalidTriggerError } from '@/modules/automate/errors/management'
import {
  AutomationFunctionRunRecord,
  BaseTriggerManifest,
  VersionCreationTriggerType,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import { AutomateFunctionTemplateLanguage } from '@/modules/core/graph/generated/graphql'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { speckleAutomateUrl } from '@/modules/shared/helpers/envHelper'
import { Nullable, SourceAppName, isNullOrUndefined } from '@speckle/shared'

// TODO: Handle error/404 scenarios properly

// TODO: These should be managed in a shared package maybe?
export type FunctionSchemaType = {
  functionId: string
  repoUrl: string
  functionName: string
  description: string
  tags: string[]
  supportedSourceApps: SourceAppName[]
  createdAt: string
  isFeatured: boolean
  logo: Nullable<string>
}

export type FunctionReleaseSchemaType = {
  functionVersionId: string
  versionTag: string
  inputSchema: Nullable<Record<string, unknown>>
  createdAt: string
  commitId: string
}

export type FunctionWithVersionsSchemaType = FunctionSchemaType & {
  functionVersions: FunctionReleaseSchemaType[]
}

// TODO: Retrieve from API
export const functionTemplateRepos = <const>[
  {
    id: AutomateFunctionTemplateLanguage.Python,
    title: 'Python',
    url: 'https://github.com/specklesystems/speckle_automate_python_example',
    logo: '/images/functions/python.svg'
  },
  {
    id: AutomateFunctionTemplateLanguage.DotNet,
    title: '.NET / C#',
    url: 'https://github.com/specklesystems/SpeckleAutomateDotnetExample',
    logo: '/images/functions/dotnet.svg'
  }
]

export type AutomationCreateResponse = {
  automationId: string
  automationToken: string
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

  const url = new URL(automateUrl, path)
  if (options?.query) {
    Object.entries(options.query).forEach(([key, val]) => {
      if (isNullOrUndefined(val)) return
      url.searchParams.append(key, val.toString())
    })
  }

  return url.toString()
}

export const createAutomation = async (params: {
  speckleServerUrl: string
  authCode: string
}) => {
  const { speckleServerUrl, authCode } = params

  const url = getApiUrl(`/api/v2/automations`)
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ speckleServerUrl, authCode })
  })

  const result = (await response.json()) as AutomationCreateResponse
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
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${automationToken}`
    },
    body: JSON.stringify(payload)
  })
  const result = (await response.json()) as AutomationRunResponseBody

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

  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      ...(token?.length ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  return (await response.json()) as GetFunctionResponse
}

export type GetFunctionReleaseResponse = FunctionReleaseSchemaType

export const getFunctionRelease = async (params: {
  functionId: string
  functionReleaseId: string
  token?: string
}) => {
  const { functionId, functionReleaseId, token } = params
  const url = getApiUrl(`/api/v1/functions/${functionId}/releases/${functionReleaseId}`)

  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      ...(token?.length ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  return (await response.json()) as GetFunctionReleaseResponse
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
  token?: string
}) => {
  const { query, token } = params
  const url = getApiUrl(`/api/v1/functions`, { query })

  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      ...(token?.length ? { Authorization: `Bearer ${token}` } : {})
    }
  })

  return (await response.json()) as GetFunctionsResponse
}
