import { Logger } from '@/logging/logging'
import {
  AutomationFunctionRunRecord,
  AutomationFunctionRunsResultVersionRecord,
  AutomationRecord,
  AutomationRunRecord
} from '@/modules/betaAutomations/helpers/types'
import {
  BetaAutomations,
  BetaAutomationRuns,
  BetaAutomationFunctionRuns,
  BetaAutomationFunctionRunsResultVersions,
  Commits
} from '@/modules/core/dbSchema'
import { CommitRecord } from '@/modules/core/helpers/types'
import { Nullable } from '@speckle/shared'
import { isArray, pick } from 'lodash'
import { SetOptional } from 'type-fest'

export const upsertAutomation = async (
  automation: SetOptional<AutomationRecord, 'createdAt' | 'updatedAt'>
) =>
  await BetaAutomations.knex()
    .insert(automation)
    .onConflict([
      BetaAutomations.withoutTablePrefix.col.automationId,
      BetaAutomations.withoutTablePrefix.col.automationRevisionId
    ])
    .merge(
      BetaAutomations.withoutTablePrefix.cols.filter(
        (c) => c !== BetaAutomations.withoutTablePrefix.col.createdAt
      )
    )

export const getAutomation = async (
  automationId: string
): Promise<AutomationRecord> => {
  return await BetaAutomations.knex()
    .where({ [BetaAutomations.col.automationId]: automationId })
    .first()
}

export const upsertAutomationRunData = async (automationRun: AutomationRunRecord) => {
  const insertModel = pick(
    automationRun,
    BetaAutomationRuns.withoutTablePrefix.cols
  ) as AutomationRunRecord

  return await BetaAutomationRuns.knex()
    .insert(insertModel)
    .onConflict(BetaAutomationRuns.withoutTablePrefix.col.automationRunId)
    .merge()
}

export const upsertAutomationFunctionRunData = async (
  automationFunctionRuns: AutomationFunctionRunRecord | AutomationFunctionRunRecord[],
  logger: Logger
) => {
  const runs = isArray(automationFunctionRuns)
    ? automationFunctionRuns
    : [automationFunctionRuns]

  logger.info({ runs }, 'Upserting runs.')
  const normalizedModels = runs.map((run) => {
    return pick(
      run,
      BetaAutomationFunctionRuns.withoutTablePrefix.cols
    ) as AutomationFunctionRunRecord
  })

  logger.info({ normalizedModels }, 'Normalized runs.')
  return await BetaAutomationFunctionRuns.knex()
    .insert(normalizedModels)
    .onConflict([
      BetaAutomationFunctionRuns.withoutTablePrefix.col.automationRunId,
      BetaAutomationFunctionRuns.withoutTablePrefix.col.functionId
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
      BetaAutomationFunctionRunsResultVersions.withoutTablePrefix.cols
    ) as AutomationFunctionRunsResultVersionRecord
  })

  return await BetaAutomationFunctionRunsResultVersions.knex().insert(normalizedModels)
}

export const deleteResultVersionsForRuns = async (
  keyPairs: [functionId: string, automationRunId: string][]
) => {
  return await BetaAutomationFunctionRunsResultVersions.knex()
    .whereIn(
      [
        BetaAutomationFunctionRunsResultVersions.col.functionId,
        BetaAutomationFunctionRunsResultVersions.col.automationRunId
      ],
      keyPairs
    )
    .del()
}

export const getAutomationRun = async (
  automationRunId: string
): Promise<Nullable<AutomationRunRecord>> => {
  return await BetaAutomationRuns.knex()
    .where({ [BetaAutomationRuns.col.automationRunId]: automationRunId })
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

  const runs = await BetaAutomationRuns.knex()
    .select([
      ...BetaAutomationRuns.cols,
      `${BetaAutomations.name}.${BetaAutomations.withoutTablePrefix.col.automationName}`
    ])
    .join(
      BetaAutomations.name,
      BetaAutomationRuns.col.automationId,
      BetaAutomations.col.automationId
    )
    .where({ [BetaAutomations.col.projectId]: projectId })
    .andWhere({ [BetaAutomations.col.modelId]: modelId })
    .andWhere({ [BetaAutomationRuns.col.versionId]: versionId })
    .distinctOn(BetaAutomationRuns.col.automationId)
    .orderBy([
      { column: BetaAutomationRuns.col.automationId },
      { column: BetaAutomationRuns.col.createdAt, order: 'desc' }
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
  const runs = await BetaAutomationFunctionRuns.knex()
    .select<AutomationFunctionRunRecord[]>(BetaAutomationFunctionRuns.cols)
    .whereIn(BetaAutomationFunctionRuns.col.automationRunId, automationRunids)

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
  const q = BetaAutomationFunctionRunsResultVersions.knex()
    .select<Array<CommitRecord & AutomationFunctionRunsResultVersionRecord>>(
      ...Commits.cols,
      ...BetaAutomationFunctionRunsResultVersions.cols
    )
    .innerJoin(
      Commits.name,
      BetaAutomationFunctionRunsResultVersions.col.resultVersionId,
      Commits.col.id
    )
    .whereIn(
      [
        BetaAutomationFunctionRunsResultVersions.col.automationRunId,
        BetaAutomationFunctionRunsResultVersions.col.functionId
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
