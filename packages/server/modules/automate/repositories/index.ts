import {
  Automation,
  AutomationRevision,
  AutomationRevisionTrigger,
  AutomationRun,
  AutomationToken,
  AutomationTrigger,
  AutomationWithRevision
} from '@/modules/automate/types'
import {
  AutomationFunctionRuns,
  AutomationRevisionFunctions,
  AutomationRevisions,
  AutomationRunTriggers,
  AutomationRuns,
  AutomationTokens,
  AutomationTriggers,
  Automations
} from '@/modules/core/dbSchema'
import _ from 'lodash'

export async function queryActiveTriggersByTriggeringId({
  triggerType,
  triggeringId
}: AutomationTrigger): Promise<AutomationRevisionTrigger[]> {
  console.log(triggeringId, triggerType)
  return []
}

// TODO: Fix up any return + magic string column names
export async function getAutomationRevision(
  revisionId: string
): Promise<AutomationWithRevision | null> {
  const query = AutomationRevisions.knex()
    .select(
      'automation_revisions.*',
      'automations.name',
      'automations.projectId',
      'automations.enabled',
      'automations.executionEngineAutomationId'
    )
    .join('automations', 'automation_revisions.automationId', '=', 'automations.id')
    .where({ 'automation_revisions.id': revisionId })
    .first()
  const automationRevision = await query
  if (!automationRevision) return null
  const [functions, triggers] = await Promise.all([
    AutomationRevisionFunctions.knex()
      .select()
      .where({ automationRevisionId: revisionId }),
    AutomationTriggers.knex().select().where({ automationRevisionId: revisionId })
  ])

  return { ...automationRevision, triggers, functions }
}

export async function upsertAutomationRun(automationRun: AutomationRun) {
  await AutomationRuns.knex()
    .insert(_.pick(automationRun, AutomationRuns.withoutTablePrefix.cols))
    .onConflict('id')
    .merge([
      AutomationRuns.withoutTablePrefix.col.status,
      AutomationRuns.withoutTablePrefix.col.updatedAt,
      AutomationRuns.withoutTablePrefix.col.executionEngineRunId
    ])
  await Promise.all([
    AutomationRunTriggers.knex()
      .insert(
        automationRun.triggers.map((t) => ({ automationRunId: automationRun.id, ...t }))
      )
      .onConflict()
      .ignore(),
    AutomationFunctionRuns.knex()
      .insert(
        automationRun.functionRuns.map((f) =>
          _.pick(f, AutomationFunctionRuns.withoutTablePrefix.cols)
        )
      )
      .onConflict('id')
      .merge(AutomationFunctionRuns.withoutTablePrefix.cols)
  ])
  return
}

export async function getAutomationRun(
  automationRunId: string
): Promise<AutomationRun | null> {
  const run = await AutomationRuns.knex()
    .select()
    .where({ id: automationRunId })
    .first()
  if (!run) return null

  const [triggers, functionRuns] = await Promise.all([
    AutomationRunTriggers.knex().select().where({ automationRunId }),
    AutomationFunctionRuns.knex().select().where({ runId: automationRunId })
  ])

  return { ...run, triggers, functionRuns }
}

export async function storeAutomation(
  automation: Automation,
  automationToken: AutomationToken
) {
  await Automations.knex().insert(automation)
  await AutomationTokens.knex().insert(automationToken)
}

export async function storeAutomationRevision(revision: AutomationRevision) {
  const rev = _.pick(revision, AutomationRevisions.withoutTablePrefix.cols)
  await AutomationRevisions.knex().insert(rev)
  await Promise.all([
    AutomationRevisionFunctions.knex().insert(
      revision.functions.map((f) => ({ ...f, automationRevisionId: revision.id }))
    ),
    AutomationTriggers.knex().insert(
      revision.triggers.map((t) => ({ ...t, automationRevisionId: revision.id }))
    )
  ])
}

export async function getAutomationToken(
  automationId: string
): Promise<AutomationToken | null> {
  const token = await AutomationTokens.knex().where({ automationId }).first()
  return token ?? null
}
