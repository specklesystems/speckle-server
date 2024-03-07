import { Results } from '@/modules/betaAutomations/helpers/inputTypes'
import { AutomationRunStatus } from '@/modules/core/graph/generated/graphql'
import { Nullable } from '@speckle/shared'

export type AutomationRecord = {
  automationId: string
  projectId: string
  modelId: string
  createdAt: Date
  updatedAt: Date
  automationRevisionId: string
  automationName: string
}

export type AutomationRunRecord = {
  automationId: string
  automationRevisionId: string
  automationRunId: string
  versionId: string
  createdAt: Date
  updatedAt: Date
  automationName: string
}

export type AutomationFunctionRunRecord = {
  automationRunId: string
  functionId: string
  functionName: string
  functionLogo: string | null
  elapsed: number
  status: AutomationRunStatus
  contextView: Nullable<string>
  statusMessage: Nullable<string>
  results: Nullable<Results>
}

export type AutomationFunctionRunsResultVersionRecord = {
  automationRunId: string
  functionId: string
  resultVersionId: string
}
