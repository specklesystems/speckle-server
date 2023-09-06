import knex from '@/db/knex'
import { ModelAutomation, AutomationRun } from '@/modules/automations/helpers/types'

const Automations = () => knex('automations')
const AutomationRuns = () => knex('automation_runs')

export const storeModelAutomation = async (automation: ModelAutomation) => {
  await Automations().insert(automation)
}

export const upsertAutomationRunData = async (automationRun: AutomationRun) => {
  const insertModel = {
    automationId: automationRun.automationId,
    automationRevisionId: automationRun.automationRevisionId,
    automationRunId: automationRun.automationRunId,
    createdAt: automationRun.createdAt,
    updatedAt: automationRun.updatedAt,
    data: automationRun
  }
  await AutomationRuns().insert(insertModel)
}

export const getAutomationRun = async (
  automationRunId: string
): Promise<AutomationRun> => {
  const item = await AutomationRuns().where({ automationRunId }).first()
  return item.data
}
