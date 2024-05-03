import {
  Automation,
  AutomationRun,
  AutomationRunStatus
} from '@/modules/automate/types'

export const getLatestAutomationRunsForVersion = async (
  versionId: string
): Promise<AutomationRun[]> => {
  console.log(versionId)
  return []
}

const statusOrder: AutomationRunStatus[] = [
  'pending',
  'initializing',
  'running',
  'failure',
  'error'
]

export const mergeRunStatus = (
  runStatuses: AutomationRunStatus[]
): AutomationRunStatus => {
  if (!runStatuses.length) throw new Error('At-least one status is needed')

  let currentStatus = 0
  for (const status of runStatuses) {
    const statusIndex = statusOrder.indexOf(status)
    if (statusIndex > currentStatus) currentStatus = statusIndex
  }
  return statusOrder[currentStatus]
}

export const getAutomationByRunId = async (
  automationRunId: string
): Promise<Automation | null> => {
  console.log(automationRunId)
  return null
}
