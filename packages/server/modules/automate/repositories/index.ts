import {
  AutomationRevisionTrigger,
  AutomationRun,
  AutomationTrigger,
  AutomationWithRevision
} from '@/modules/automate/types'

export async function queryActiveTriggersByTriggeringId({
  triggerType,
  triggeringId
}: AutomationTrigger): Promise<AutomationRevisionTrigger[]> {
  console.log(triggeringId, triggerType)
  return []
}

export async function getAutomationRevision(
  revisionId: string
): Promise<AutomationWithRevision | null> {
  console.log(revisionId)
  return null
}

export async function upsertAutomationRun(automationRun: AutomationRun) {
  console.log(automationRun)
  return
}

export async function storeAutomation() {}
