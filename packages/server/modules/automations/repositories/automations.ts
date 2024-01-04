import { Logger } from '@/logging/logging'
import {
  AutomationFunctionRunRecord,
  AutomationFunctionRunsResultVersionRecord,
  AutomationRecord,
  AutomationRunRecord
} from '@/modules/automations/helpers/types'
import {
  Automations as AutomationsSchema,
  AutomationRuns as AutomationRunsSchema,
  AutomationFunctionRuns as AutomationFunctionRunsSchema,
  AutomationFunctionRunsResultVersions as AutomationFunctionRunsResultVersionsSchema,
  Commits as CommitsSchema
} from '@/modules/core/dbSchema'
import { CommitRecord } from '@/modules/core/helpers/types'
import { isArray, pick } from 'lodash'
import { SetOptional } from 'type-fest'

const Automations = () => AutomationsSchema.knex<AutomationRecord[]>()
const AutomationRuns = () => AutomationRunsSchema.knex<AutomationRunRecord[]>()
const AutomationFunctionRuns = () =>
  AutomationFunctionRunsSchema.knex<AutomationFunctionRunRecord[]>()
const AutomationFunctionRunsResultVersions = () =>
  AutomationFunctionRunsResultVersionsSchema.knex<
    AutomationFunctionRunsResultVersionRecord[]
  >()
const Commits = () => CommitsSchema.knex<CommitRecord[]>()

export const upsertAutomation = async (
  automation: SetOptional<AutomationRecord, 'createdAt' | 'updatedAt'>
) =>
  await Automations()
    .insert(automation)
    .onConflict([
      AutomationsSchema.withoutTablePrefix.col.automationId,
      AutomationsSchema.withoutTablePrefix.col.automationRevisionId
    ])
    .merge(
      AutomationsSchema.withoutTablePrefix.cols.filter(
        (c) => c !== AutomationsSchema.withoutTablePrefix.col.createdAt
      )
    )

export const getAutomation = async (automationId: string) => {
  return await Automations()
    .where({ [AutomationsSchema.col.automationId]: automationId })
    .first()
}

export const upsertAutomationRunData = async (automationRun: AutomationRunRecord) => {
  const insertModel = pick(
    automationRun,
    AutomationRunsSchema.withoutTablePrefix.cols
  ) as AutomationRunRecord

  return await AutomationRuns()
    .insert(insertModel)
    .onConflict(AutomationRunsSchema.withoutTablePrefix.col.automationRunId)
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
      AutomationFunctionRunsSchema.withoutTablePrefix.cols
    ) as AutomationFunctionRunRecord
  })

  logger.info({ normalizedModels }, 'Normalized runs.')
  return await AutomationFunctionRuns()
    .insert(normalizedModels)
    .onConflict([
      AutomationFunctionRunsSchema.withoutTablePrefix.col.automationRunId,
      AutomationFunctionRunsSchema.withoutTablePrefix.col.functionId
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
      AutomationFunctionRunsResultVersionsSchema.withoutTablePrefix.cols
    ) as AutomationFunctionRunsResultVersionRecord
  })

  return await AutomationFunctionRunsResultVersions().insert(normalizedModels)
}

export const deleteResultVersionsForRuns = async (
  keyPairs: [functionId: string, automationRunId: string][]
) => {
  return await AutomationFunctionRunsResultVersions()
    .whereIn(
      [
        AutomationFunctionRunsResultVersionsSchema.col.functionId,
        AutomationFunctionRunsResultVersionsSchema.col.automationRunId
      ],
      keyPairs
    )
    .del()
}

export const getAutomationRun = async (automationRunId: string) => {
  return await AutomationRuns()
    .where({ [AutomationRunsSchema.col.automationRunId]: automationRunId })
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

  const runs = await AutomationRuns()
    .select([...AutomationRunsSchema.cols, 'automations.automationName'])
    .join(
      Automations.name,
      AutomationRunsSchema.col.automationId,
      AutomationsSchema.col.automationId
    )
    .where({ [AutomationsSchema.col.projectId]: projectId })
    .andWhere({ [AutomationsSchema.col.modelId]: modelId })
    .andWhere({ [AutomationRunsSchema.col.versionId]: versionId })
    .distinctOn(AutomationRunsSchema.col.automationId)
    .orderBy([
      { column: AutomationRunsSchema.col.automationId },
      { column: AutomationRunsSchema.col.createdAt, order: 'desc' }
    ])
    .limit(limit)

  return runs
}

/**
 * Get function runs for automation runs. The result is an object keyed by automationRunId,
 * with each value being a map between functionId and function run.
 */
export const getFunctionRunsForAutomationRuns = async (automationRunids: string[]) => {
  const runs = await AutomationFunctionRuns()
    .select<AutomationFunctionRunRecord[]>(AutomationFunctionRunsSchema.cols)
    .whereIn(AutomationFunctionRunsSchema.col.automationRunId, automationRunids)

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
) => {
  const q = AutomationFunctionRunsResultVersions()
    .select<Array<CommitRecord & AutomationFunctionRunsResultVersionRecord>>(
      ...CommitsSchema.cols,
      ...AutomationFunctionRunsResultVersionsSchema.cols
    )
    .innerJoin(
      Commits.name,
      AutomationFunctionRunsResultVersionsSchema.col.resultVersionId,
      CommitsSchema.col.id
    )
    .whereIn(
      [
        AutomationFunctionRunsResultVersionsSchema.col.automationRunId,
        AutomationFunctionRunsResultVersionsSchema.col.functionId
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
