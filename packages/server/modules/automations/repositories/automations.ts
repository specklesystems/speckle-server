import knex from '@/db/knex'
import { ModelAutomation, AutomationRun } from '@/modules/automations/helpers/types'

const Automations = () => knex('automations')
const AutomationRuns = () => knex('automation_runs')

export const storeModelAutomation = async (automation: ModelAutomation) => {
  await Automations().insert(automation)
}

export const getModelAutomation = async (
  automationId: string
): Promise<ModelAutomation> => {
  return await Automations().where({ automationId }).first()
}

export const upsertAutomationRunData = async (automationRun: AutomationRun) => {
  const insertModel = {
    automationId: automationRun.automationId,
    automationRevisionId: automationRun.automationRevisionId,
    automationRunId: automationRun.automationRunId,
    versionId: automationRun.versionId,
    createdAt: automationRun.createdAt,
    updatedAt: automationRun.updatedAt,
    data: automationRun
  }
  await AutomationRuns().insert(insertModel).onConflict('automationRunId').merge()
}

export const getAutomationRun = async (
  automationRunId: string
): Promise<AutomationRun | null> => {
  const item = await AutomationRuns().where({ automationRunId }).first()
  if (!item) return null
  return item.data
}

export const getLatestAutomationRunsFor = async ({
  projectId,
  modelId,
  versionId
}: {
  projectId: string
  modelId: string
  versionId: string
}): Promise<AutomationRun[]> => {
  const runs = await AutomationRuns()
    .innerJoin(
      'automations',
      'automation_runs.automationId',
      'automations.automationId'
    )
    .where({ projectId })
    .andWhere({ modelId })
    .andWhere({ versionId })
    .distinctOn('automation_runs.automationId')
    .orderBy([
      { column: 'automation_runs.automationId' },
      { column: 'automation_runs.createdAt', order: 'desc' }
    ])

  return runs.map((r) => r.data)
}
