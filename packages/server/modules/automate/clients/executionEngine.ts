import { AutomateInvalidTriggerError } from '@/modules/automate/errors/management'
import {
  AutomationFunctionRunRecord,
  BaseTriggerManifest,
  VersionCreationTriggerType,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { speckleAutomateUrl } from '@/modules/shared/helpers/envHelper'

export type AutomationCreateResponse = {
  automationId: string
  automationToken: string
}

const getApiUrl = (path?: string) => {
  const automateUrl = speckleAutomateUrl()
  if (!automateUrl)
    throw new MisconfiguredEnvironmentError(
      'Cannot create automation, Automate URL is not configured'
    )

  if (!path?.length) return automateUrl

  const url = new URL(automateUrl, path)
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

type CreateFunctionRequestBody = {
  speckleServerDomain: string
  speckleServerAuthenticationCode: string
}

export type CreateFunctionResponseBody = {
  functionId: string
  token: string
}

export const createFunction = async (params: CreateFunctionRequestBody) => {
  const url = getApiUrl(`/api/v2/functions`)

  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })

  const result = (await response.json()) as CreateFunctionResponseBody
  return result
}
