import {
  AutomationFunctionRuns,
  AutomationRevisions,
  AutomationRunTriggers,
  AutomationRuns
} from '@/modules/core/dbSchema'
import {
  AutomationFunctionRunRecord,
  AutomationRunRecord,
  AutomationRunTriggerRecord,
  AutomationRunWithTriggersFunctionRuns
} from './types'
import { Knex } from 'knex'
import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'

export const findFullAutomationRunById = ({ db }: { db: Knex }) =>
  async function (
    automationRunId: string
  ): Promise<AutomationRunWithTriggersFunctionRuns | null> {
    const run = await db(AutomationRuns.name)
      .select<
        Array<{
          runs: AutomationRunRecord[]
          triggers: AutomationRunTriggerRecord[]
          functionRuns: AutomationFunctionRunRecord[]
          automationId: string
        }>
      >([
        AutomationRuns.groupArray('runs'),
        AutomationRunTriggers.groupArray('triggers'),
        AutomationFunctionRuns.groupArray('functionRuns'),
        db.raw(`(array_agg(??))[1] as "automationId"`, [
          AutomationRevisions.col.automationId
        ])
      ])
      .where(AutomationRuns.col.id, automationRunId)
      .innerJoin(
        AutomationRevisions.name,
        AutomationRevisions.col.id,
        AutomationRuns.col.automationRevisionId
      )
      .innerJoin(
        AutomationRunTriggers.name,
        AutomationRunTriggers.col.automationRunId,
        AutomationRuns.col.id
      )
      .innerJoin(
        AutomationFunctionRuns.name,
        AutomationFunctionRuns.col.runId,
        AutomationRuns.col.id
      )
      .groupBy(AutomationRuns.col.id)
      .first()

    return run
      ? {
          ...formatJsonArrayRecords(run.runs)[0],
          triggers: formatJsonArrayRecords(run.triggers),
          functionRuns: formatJsonArrayRecords(run.functionRuns),
          automationId: run.automationId
        }
      : null
  }
