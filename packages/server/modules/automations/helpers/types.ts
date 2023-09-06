export type ModelAutomation = {
  projectId: string
  modelId: string
  automationId: string
  createdAt: Date
  automationRevisionId: string
  automationName: string
}

export type AutomationRun = {
  automationId: string
  automationRevisionId: string
  automationRunId: string
  createdAt: Date
  updatedAt: Date
  functionRunResults: FunctionRunResult[]
}

export type RunStatus = 'INITIALIZING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'

export type FunctionRunResult = {
  functionId: string
  elapsed: number
  runStatus: RunStatus
  contextView: string | null
  blobs: string[]
  statusMessage: string | null
  objectResults: ObjectResults
}

export type SupportedObjectResultsVersions = '23.09'

export type ObjectResultLevel = 'INFO' | 'WARNING' | 'ERROR'
export type ObjectResults = {
  version: SupportedObjectResultsVersions
  objectResults: Record<string, { level: ObjectResultLevel; statusMessage: string }[]>
}
