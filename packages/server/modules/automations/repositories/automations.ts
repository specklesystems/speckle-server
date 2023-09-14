import {
  AutomationFunctionRunRecord,
  AutomationFunctionRunsResultVersionRecord,
  AutomationRecord,
  AutomationRunRecord
} from '@/modules/automations/helpers/types'
import {
  Automations,
  AutomationRuns,
  AutomationFunctionRuns,
  AutomationFunctionRunsResultVersions,
  Commits
} from '@/modules/core/dbSchema'
import { CommitRecord } from '@/modules/core/helpers/types'
import { Nullable } from '@speckle/shared'
import { isArray, pick } from 'lodash'
import { SetOptional } from 'type-fest'

export const upsertAutomation = async (
  automation: SetOptional<AutomationRecord, 'createdAt' | 'updatedAt'>
) =>
  await Automations.knex()
    .insert(automation)
    .onConflict([
      Automations.withoutTablePrefix.col.automationId,
      Automations.withoutTablePrefix.col.automationRevisionId
    ])
    .merge(
      Automations.withoutTablePrefix.cols.filter(
        (c) => c !== Automations.withoutTablePrefix.col.createdAt
      )
    )

export const getAutomation = async (
  automationId: string
): Promise<AutomationRecord> => {
  return await Automations.knex()
    .where({ [Automations.col.automationId]: automationId })
    .first()
}

export const upsertAutomationRunData = async (automationRun: AutomationRunRecord) => {
  const insertModel = pick(
    automationRun,
    AutomationRuns.withoutTablePrefix.cols
  ) as AutomationRunRecord

  return await AutomationRuns.knex()
    .insert(insertModel)
    .onConflict(AutomationRuns.withoutTablePrefix.col.automationRunId)
    .merge()
}

export const upsertAutomationFunctionRunData = async (
  automationFunctionRuns: AutomationFunctionRunRecord | AutomationFunctionRunRecord[]
) => {
  const runs = isArray(automationFunctionRuns)
    ? automationFunctionRuns
    : [automationFunctionRuns]

  const normalizedModels = runs.map((run) => {
    return pick(
      run,
      AutomationFunctionRuns.withoutTablePrefix.cols
    ) as AutomationFunctionRunRecord
  })

  return await AutomationFunctionRuns.knex()
    .insert(normalizedModels)
    .onConflict([
      AutomationFunctionRuns.withoutTablePrefix.col.automationRunId,
      AutomationFunctionRuns.withoutTablePrefix.col.functionId
    ])
    .merge()
}

export const insertAutomationFunctionRunResultVersion = async (
  functionRunVersions:
    | AutomationFunctionRunsResultVersionRecord
    | AutomationFunctionRunsResultVersionRecord[]
) => {
  const versions = isArray(functionRunVersions)
    ? functionRunVersions
    : [functionRunVersions]
  if (!versions.length) return

  const normalizedModels = versions.map((run) => {
    return pick(
      run,
      AutomationFunctionRunsResultVersions.withoutTablePrefix.cols
    ) as AutomationFunctionRunsResultVersionRecord
  })

  return await AutomationFunctionRunsResultVersions.knex().insert(normalizedModels)
}

export const deleteResultVersionsForRuns = async (
  keyPairs: [functionId: string, automationRunId: string][]
) => {
  return await AutomationFunctionRunsResultVersions.knex()
    .whereIn(
      [
        AutomationFunctionRunsResultVersions.col.functionId,
        AutomationFunctionRunsResultVersions.col.automationRunId
      ],
      keyPairs
    )
    .del()
}

export const getAutomationRun = async (
  automationRunId: string
): Promise<Nullable<AutomationRunRecord>> => {
  return await AutomationRuns.knex()
    .where({ [AutomationRuns.col.automationRunId]: automationRunId })
    .first()
}

export const getLatestAutomationRunsFor = async (
  params: {
    projectId: string
    modelId: string
    versionId: string
  },
  options?: Partial<{
    limit: number
  }>
): Promise<AutomationRunRecord[]> => {
  const { projectId, modelId, versionId } = params
  const { limit = 20 } = options || {}

  const runs = await AutomationRuns.knex()
    .select(AutomationRuns.cols)
    .innerJoin(
      Automations.name,
      AutomationRuns.col.automationId,
      Automations.col.automationId
    )
    .where({ [Automations.col.projectId]: projectId })
    .andWhere({ [Automations.col.modelId]: modelId })
    .andWhere({ [AutomationRuns.col.versionId]: versionId })
    .distinctOn(AutomationRuns.col.automationId)
    .orderBy([
      { column: AutomationRuns.col.automationId },
      { column: AutomationRuns.col.createdAt, order: 'desc' }
    ])
    .limit(limit)

  return runs
}

/**
 * Get function runs for automation runs. The result is an object keyed by automationRunId,
 * with each value being a map between functionId and function run.
 */
export const getFunctionRunsForAutomationRuns = async (
  automationRunids: string[]
): Promise<Record<string, Record<string, AutomationFunctionRunRecord>>> => {
  const runs = await AutomationFunctionRuns.knex()
    .select<AutomationFunctionRunRecord[]>(AutomationFunctionRuns.cols)
    .whereIn(AutomationFunctionRuns.col.automationRunId, automationRunids)

  const grouped = runs.reduce((acc, run) => {
    if (!acc[run.automationRunId]) acc[run.automationRunId] = {}
    acc[run.automationRunId][run.functionId] = run
    return acc
  }, {} as Record<string, Record<string, AutomationFunctionRunRecord>>)

  return grouped
}

/**
 * Get versions/commits for specified function runs. The result is an object keyed by automationRunId,
 * with each value being a map between functionId and a commit.
 */
export const getAutomationFunctionRunResultVersions = async (
  idPairs: Array<[automationRunId: string, functionId: string]>
): Promise<Record<string, Record<string, CommitRecord[]>>> => {
  const q = AutomationFunctionRunsResultVersions.knex()
    .select<Array<CommitRecord & AutomationFunctionRunsResultVersionRecord>>(
      ...Commits.cols,
      ...AutomationFunctionRunsResultVersions.cols
    )
    .innerJoin(
      Commits.name,
      AutomationFunctionRunsResultVersions.col.resultVersionId,
      Commits.col.id
    )
    .whereIn(
      [
        AutomationFunctionRunsResultVersions.col.automationRunId,
        AutomationFunctionRunsResultVersions.col.functionId
      ],
      idPairs
    )

  const versions = await q

  const grouped = versions.reduce((acc, version) => {
    if (!acc[version.automationRunId]) acc[version.automationRunId] = {}
    if (!acc[version.automationRunId][version.functionId])
      acc[version.automationRunId][version.functionId] = []

    acc[version.automationRunId][version.functionId].push(version)
    return acc
  }, {} as Record<string, Record<string, CommitRecord[]>>)

  return grouped
}
