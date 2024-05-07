import {
  AutomationRecord,
  AutomationRevisionRecord,
  AutomationTriggerDefinitionRecord,
  AutomationRunRecord,
  AutomationTokenRecord,
  AutomationTriggerRecordBase,
  AutomationWithRevision,
  AutomateRevisionFunctionRecord,
  AutomationRunWithTriggersFunctionRuns,
  AutomationRunTriggerRecord,
  AutomationFunctionRunRecord,
  AutomationRevisionWithTriggersFunctions,
  AutomationTriggerType,
  AutomationRunStatus,
  VersionCreationTriggerType
} from '@/modules/automate/helpers/types'
import {
  AutomationFunctionRuns,
  AutomationRevisionFunctions,
  AutomationRevisions,
  AutomationRunTriggers,
  AutomationRuns,
  AutomationTokens,
  AutomationTriggers,
  Automations,
  BranchCommits,
  knex
} from '@/modules/core/dbSchema'
import {
  AutomationRunsArgs,
  ProjectAutomationsArgs
} from '@/modules/core/graph/generated/graphql'

import { LogicError } from '@/modules/shared/errors'
import { decodeCursor } from '@/modules/shared/helpers/graphqlHelper'
import { Nullable, isNullOrUndefined } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import _, { clamp, groupBy, keyBy, pick, reduce } from 'lodash'
import { SetOptional, SetRequired } from 'type-fest'

export const generateRevisionId = () => cryptoRandomString({ length: 10 })

export async function getActiveTriggerDefinitions<
  T extends AutomationTriggerType = AutomationTriggerType
>(params: AutomationTriggerRecordBase<T>) {
  const { triggeringId, triggerType } = params

  const q = AutomationTriggers.knex<AutomationTriggerDefinitionRecord<T>[]>()
    .where(AutomationTriggers.col.triggeringId, triggeringId)
    .andWhere(AutomationTriggers.col.triggerType, triggerType)

  return await q
}

export async function getFullAutomationRevisionMetadata(
  revisionId: string
): Promise<AutomationWithRevision<AutomationRevisionWithTriggersFunctions> | null> {
  const query = AutomationRevisions.knex<AutomationRevisionRecord>()
    .where(AutomationRevisions.col.id, revisionId)
    .first()

  const automationRevision = await query
  if (!automationRevision) return null

  const [functions, triggers, automation] = await Promise.all([
    AutomationRevisionFunctions.knex<AutomateRevisionFunctionRecord[]>()
      .select(AutomationRevisionFunctions.cols)
      .where(AutomationRevisionFunctions.col.automationRevisionId, revisionId),
    AutomationTriggers.knex<AutomationTriggerDefinitionRecord[]>()
      .select()
      .where(AutomationTriggers.col.automationRevisionId, revisionId),
    Automations.knex<AutomationRecord>()
      .where(Automations.col.id, automationRevision.automationId)
      .first()
  ])
  if (!automation) return null

  return {
    ...automation,
    revision: {
      ...automationRevision,
      functions,
      triggers
    }
  }
}

export type InsertableAutomationRun = AutomationRunRecord & {
  triggers: Omit<AutomationRunTriggerRecord, 'automationRunId'>[]
  functionRuns: Omit<AutomationFunctionRunRecord, 'runId'>[]
}

export async function upsertAutomationRun(automationRun: InsertableAutomationRun) {
  await AutomationRuns.knex()
    .insert(_.pick(automationRun, AutomationRuns.withoutTablePrefix.cols))
    .onConflict(AutomationRuns.withoutTablePrefix.col.id)
    .merge([
      AutomationRuns.withoutTablePrefix.col.status,
      AutomationRuns.withoutTablePrefix.col.updatedAt,
      AutomationRuns.withoutTablePrefix.col.executionEngineRunId
    ])
  await Promise.all([
    AutomationRunTriggers.knex()
      .insert(
        automationRun.triggers.map((t) => ({
          automationRunId: automationRun.id,
          ..._.pick(t, AutomationRunTriggers.withoutTablePrefix.cols)
        }))
      )
      .onConflict()
      .ignore(),
    AutomationFunctionRuns.knex()
      .insert(
        automationRun.functionRuns.map((f) => ({
          ..._.pick(f, AutomationFunctionRuns.withoutTablePrefix.cols),
          runId: automationRun.id
        }))
      )
      .onConflict(AutomationFunctionRuns.withoutTablePrefix.col.id)
      .merge(AutomationFunctionRuns.withoutTablePrefix.cols)
  ])
  return
}

export async function getFunctionRuns(params: { functionRunIds: string[] }) {
  const { functionRunIds } = params
  if (!functionRunIds.length) return []

  const q = AutomationFunctionRuns.knex()
    .select<
      Array<
        AutomationFunctionRunRecord & {
          automationId: string
          automationRevisionId: string
        }
      >
    >([
      ...AutomationFunctionRuns.cols,
      AutomationRuns.col.automationRevisionId,
      AutomationRevisions.col.automationId
    ])
    .whereIn(AutomationFunctionRuns.col.id, functionRunIds)
    .innerJoin(
      AutomationRuns.name,
      AutomationRuns.col.id,
      AutomationFunctionRuns.col.runId
    )
    .innerJoin(
      AutomationRevisions.name,
      AutomationRevisions.col.id,
      AutomationRuns.col.automationRevisionId
    )

  return await q
}

export async function getFunctionRun(functionRunId: string) {
  const runs = await getFunctionRuns({ functionRunIds: [functionRunId] })
  return (runs[0] || null) as (typeof runs)[0] | null
}

export async function getFunctionRunsForAutomationRunIds(params: {
  automationRunIds?: string[]
  functionRunIds?: string[]
}) {
  const { automationRunIds, functionRunIds } = params
  if (!automationRunIds && !functionRunIds) {
    throw new LogicError('Either automationRunIds or functionRunIds must be set')
  }

  if (!automationRunIds?.length && !functionRunIds?.length) return {}

  const q = AutomationFunctionRuns.knex()
    .select<
      Array<
        AutomationFunctionRunRecord & {
          automationRunStatus: AutomationRunStatus
          automationRunExecutionEngineId: string | null
        }
      >
    >([
      ...AutomationFunctionRuns.cols,
      AutomationRuns.colAs('status', 'automationRunStatus'),
      AutomationRuns.colAs('executionEngineRunId', 'automationRunExecutionEngineId')
    ])
    .innerJoin(
      AutomationRuns.name,
      AutomationRuns.col.id,
      AutomationFunctionRuns.col.runId
    )

  if (automationRunIds?.length) {
    q.whereIn(AutomationFunctionRuns.col.runId, automationRunIds)
  }

  if (functionRunIds?.length) {
    q.whereIn(AutomationFunctionRuns.col.id, functionRunIds)
  }

  return keyBy(await q, (r) => r.runId)
}

export async function getFullAutomationRunById(
  automationRunId: string
): Promise<AutomationRunWithTriggersFunctionRuns | null> {
  const run = await AutomationRuns.knex()
    .select<AutomationRunWithTriggersFunctionRuns[]>([
      ...AutomationRuns.cols,
      AutomationRunTriggers.groupArray('triggers'),
      AutomationFunctionRuns.groupArray('functionRuns'),
      knex.raw(`(array_agg(??))[0] as automationId`, [
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

  return run || null
}

export async function storeAutomation(
  automation: AutomationRecord,
  automationToken: AutomationTokenRecord
) {
  const [newAutomation] = await Automations.knex()
    .insert(pick(automation, Automations.withoutTablePrefix.cols))
    .returning<AutomationRecord[]>('*')
  const [newToken] = await AutomationTokens.knex()
    .insert(pick(automationToken, AutomationTokens.withoutTablePrefix.cols))
    .returning<AutomationTokenRecord[]>('*')

  return { automation: newAutomation, token: newToken }
}

export type InsertableAutomationRevisionFunction = Omit<
  AutomateRevisionFunctionRecord,
  'automationRevisionId'
>

export type InsertableAutomationRevisionTrigger = Omit<
  AutomationTriggerDefinitionRecord,
  'automationRevisionId'
>

export type InsertableAutomationRevision = SetOptional<
  AutomationRevisionRecord,
  'createdAt' | 'id'
> & {
  functions: InsertableAutomationRevisionFunction[]
  triggers: InsertableAutomationRevisionTrigger[]
}

export async function updateAutomationRevision(
  revision: SetRequired<Partial<AutomationRevisionRecord>, 'id'>
) {
  const [ret] = await AutomationRevisions.knex()
    .where(AutomationRevisions.col.id, revision.id)
    .update(pick(revision, AutomationRevisions.withoutTablePrefix.cols))
    .returning<AutomationRevisionRecord[]>('*')

  return ret
}

export async function storeAutomationRevision(revision: InsertableAutomationRevision) {
  const id = revision.id || generateRevisionId()
  const rev = _.pick(revision, AutomationRevisions.withoutTablePrefix.cols)
  const [newRev] = await AutomationRevisions.knex()
    .insert({
      ...rev,
      id
    })
    .returning<AutomationRevisionRecord[]>('*')
  const [functions, triggers] = await Promise.all([
    AutomationRevisionFunctions.knex()
      .insert(
        revision.functions.map(
          (f): AutomateRevisionFunctionRecord => ({
            ...f,
            automationRevisionId: id
          })
        )
      )
      .returning<AutomateRevisionFunctionRecord[]>('*'),
    AutomationTriggers.knex()
      .insert(
        revision.triggers.map(
          (t): AutomationTriggerDefinitionRecord => ({
            ...t,
            automationRevisionId: id
          })
        )
      )
      .returning<AutomationTriggerDefinitionRecord[]>('*'),
    // Unset 'active in revision' for all other revisions
    ...(revision.active
      ? [
          AutomationRevisions.knex()
            .where(AutomationRevisions.col.automationId, newRev.automationId)
            .andWhereNot(AutomationRevisions.col.id, newRev.id)
            .update(AutomationRevisions.withoutTablePrefix.col.active, false)
        ]
      : [])
  ])

  return {
    ...newRev,
    functions,
    triggers
  }
}

export async function getAutomationToken(
  automationId: string
): Promise<AutomationTokenRecord | null> {
  const token = await AutomationTokens.knex<AutomationTokenRecord>()
    .where(AutomationTokens.col.automationId, automationId)
    .first()
  return token || null
}

export async function getAutomations(params: {
  automationIds: string[]
  projectId?: string
}) {
  const { automationIds, projectId } = params
  if (!automationIds.length) return []

  const q = Automations.knex<AutomationRecord[]>()
    .select()
    .whereIn(Automations.col.id, automationIds)

  if (projectId?.length) {
    q.andWhere(Automations.col.projectId, projectId)
  }

  return await q
}

export async function getAutomation(params: {
  automationId: string
  projectId?: string
}): Promise<Nullable<AutomationRecord>> {
  const { automationId, projectId } = params
  return (
    (await getAutomations({ automationIds: [automationId], projectId }))?.[0] || null
  )
}

export async function updateAutomation(
  automation: SetRequired<Partial<AutomationRecord>, 'id'>
) {
  const [ret] = await Automations.knex()
    .where(Automations.col.id, automation.id)
    .update({
      ...pick(automation, Automations.withoutTablePrefix.cols),
      [Automations.withoutTablePrefix.col.updatedAt]: new Date()
    })
    .returning<AutomationRecord[]>('*')

  return ret
}

export async function getAutomationTriggerDefinitions<
  T extends AutomationTriggerType = AutomationTriggerType
>(params: { automationId: string; projectId?: string; triggerType?: T }) {
  const { automationId, projectId, triggerType } = params

  const revisionQuery = AutomationRevisions.knex()
    .select([AutomationRevisions.col.id])
    .where(AutomationRevisions.col.automationId, automationId)
    .andWhere(AutomationRevisions.col.active, true)
    .innerJoin(
      AutomationTriggers.name,
      AutomationTriggers.col.automationRevisionId,
      AutomationRevisions.col.id
    )
    .limit(1)

  if (projectId) {
    revisionQuery
      .innerJoin(
        Automations.name,
        Automations.col.id,
        AutomationRevisions.col.automationId
      )
      .andWhere(Automations.col.projectId, projectId)
  }

  const mainQ = AutomationTriggers.knex<AutomationTriggerDefinitionRecord<T>[]>().where(
    AutomationTriggers.col.automationRevisionId,
    revisionQuery
  )

  if (triggerType) {
    mainQ.andWhere(AutomationTriggers.col.triggerType, triggerType)
  }

  return (await mainQ).map((r) => ({
    ...r,
    automationId
  }))
}

export async function updateFunctionRun(
  run: SetRequired<Partial<AutomationFunctionRunRecord>, 'id'>
) {
  const [ret] = await AutomationFunctionRuns.knex()
    .where(AutomationFunctionRuns.col.id, run.id)
    .update({
      ...pick(run, AutomationFunctionRuns.withoutTablePrefix.cols),
      [AutomationFunctionRuns.withoutTablePrefix.col.updatedAt]: new Date()
    })
    .returning<AutomationFunctionRunRecord[]>('*')

  return ret
}

export async function updateAutomationRun(
  run: SetRequired<Partial<AutomationRunRecord>, 'id'>
) {
  const [ret] = await AutomationRuns.knex()
    .where(AutomationRuns.col.id, run.id)
    .update({
      ...pick(run, AutomationRuns.withoutTablePrefix.cols),
      [AutomationRuns.withoutTablePrefix.col.updatedAt]: new Date()
    })
    .returning<AutomationRunRecord[]>('*')

  return ret
}

export async function getAutomationRevisions(params: {
  automationRevisionIds: string[]
}) {
  const { automationRevisionIds } = params
  if (!automationRevisionIds.length) return []

  const q = AutomationRevisions.knex<AutomationRevisionRecord[]>()
    .whereIn(AutomationRevisions.col.id, automationRevisionIds)
    .andWhere(AutomationRevisions.col.active, true)

  return await q
}

export async function getLatestAutomationRevisions(params: {
  automationIds: string[]
}) {
  const { automationIds } = params
  if (!automationIds.length) return []

  const q = AutomationRevisions.knex<AutomationRevisionRecord[]>()
    .whereIn(AutomationRevisions.col.automationId, automationIds)
    .andWhere(AutomationRevisions.col.active, true)
    .orderBy(AutomationRevisions.col.createdAt, 'desc')
    .groupBy(AutomationRevisions.col.automationId)

  return await q
}

export async function getRevisionsTriggerDefinitions(params: {
  automationRevisionIds: string[]
}) {
  const { automationRevisionIds } = params
  if (!automationRevisionIds.length) return {}

  const q = AutomationTriggers.knex<AutomationTriggerDefinitionRecord[]>()
    .whereIn(AutomationTriggers.col.automationRevisionId, automationRevisionIds)
    .groupBy(AutomationTriggers.col.automationRevisionId)

  return groupBy(await q, (r) => r.automationRevisionId)
}

export async function getRevisionsFunctions(params: {
  automationRevisionIds: string[]
}) {
  const { automationRevisionIds } = params
  if (!automationRevisionIds.length) return {}

  const q = AutomationRevisionFunctions.knex<
    AutomateRevisionFunctionRecord[]
  >().whereIn(
    AutomationRevisionFunctions.col.automationRevisionId,
    automationRevisionIds
  )

  return groupBy(await q, (r) => r.automationRevisionId)
}

export async function getFunctionAutomationCounts(params: { functionIds: string[] }) {
  const { functionIds } = params
  if (!functionIds.length) return {}

  const q = AutomationRevisionFunctions.knex()
    .select<Array<{ functionId: string; count: string }>>([
      AutomationRevisionFunctions.col.functionId,
      knex.raw('count(distinct ' + AutomationRevisions.col.automationId + ') as count')
    ])
    .innerJoin(
      AutomationRevisions.name,
      AutomationRevisions.col.id,
      AutomationRevisionFunctions.col.automationRevisionId
    )
    .whereIn(AutomationRevisionFunctions.col.functionId, functionIds)
    .groupBy(AutomationRevisionFunctions.col.functionId)

  return reduce(
    await q,
    (acc, r) => {
      acc[r.functionId] = parseInt(r.count)
      return acc
    },
    {} as Record<string, number>
  )
}

type GetAutomationRunsArgs = AutomationRunsArgs & {
  automationId: string
  revisionId?: string
}

const getAutomationRunsTotalCountBaseQuery = <Q>(params: {
  args: Pick<GetAutomationRunsArgs, 'automationId' | 'revisionId'>
}) => {
  const { args } = params
  const q = AutomationRuns.knex<Q>()
    .innerJoin(
      AutomationRevisions.name,
      AutomationRevisions.col.id,
      AutomationRuns.col.automationRevisionId
    )
    .where(AutomationRevisions.col.automationId, args.automationId)

  if (args.revisionId?.length) {
    q.andWhere(AutomationRuns.col.automationRevisionId, args.revisionId)
  }

  return q
}

export async function getAutomationRunsTotalCount(params: {
  args: GetAutomationRunsArgs
}) {
  const q = getAutomationRunsTotalCountBaseQuery(params).count<[{ count: string }]>(
    AutomationRuns.col.id
  )

  const [ret] = await q

  return parseInt(ret.count)
}

export async function getAutomationRunsItems(params: { args: GetAutomationRunsArgs }) {
  const { args } = params
  if (args.limit === 0) return { items: [], cursor: null }

  const q =
    getAutomationRunsTotalCountBaseQuery<AutomationRunWithTriggersFunctionRuns[]>(
      params
    )

  const limit = clamp(isNullOrUndefined(args.limit) ? 10 : args.limit, 0, 25)

  // Attach trigger & function runs
  q.select([
    ...AutomationRuns.cols,
    knex.raw(`(array_agg(??))[0] as automationId`, [
      AutomationRevisions.col.automationId
    ]),
    AutomationRunTriggers.groupArray('triggers'),
    AutomationFunctionRuns.groupArray('functionRuns')
  ])
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
    .orderBy([
      { column: AutomationRuns.col.updatedAt, order: 'desc' },
      { column: AutomationRuns.col.updatedAt, order: 'desc' }
    ])
    .limit(limit)

  if (args.cursor?.length) {
    q.andWhere(AutomationRuns.col.updatedAt, '<', decodeCursor(args.cursor))
  }

  const res = await q
  return {
    items: res,
    cursor: res.length ? res[res.length - 1].updatedAt.toISOString() : null
  }
}

export type GetProjectAutomationsParams = {
  projectId: string
  args: ProjectAutomationsArgs
}

export const getProjectAutomationsBaseQuery = <Q = AutomationRecord[]>(
  params: GetProjectAutomationsParams
) => {
  const { projectId, args } = params

  const q = Automations.knex<Q>().where(Automations.col.projectId, projectId)

  if (args.filter?.length) {
    q.andWhere(Automations.col.name, 'ilike', `%${args.filter}%`)
  }

  return q
}

export const getProjectAutomationsTotalCount = async (
  params: GetProjectAutomationsParams
) => {
  const q = getProjectAutomationsBaseQuery(params).count<[{ count: string }]>(
    Automations.col.id
  )

  const [ret] = await q

  return parseInt(ret.count)
}

export const getProjectAutomationsItems = async (
  params: GetProjectAutomationsParams
) => {
  const { args } = params
  if (args.limit === 0) return { items: [], cursor: null }

  const q = getProjectAutomationsBaseQuery(params)
    .limit(clamp(isNullOrUndefined(args.limit) ? 10 : args.limit, 0, 25))
    .orderBy(Automations.col.updatedAt, 'desc')

  if (args.cursor?.length) {
    q.andWhere(Automations.col.updatedAt, '<', decodeCursor(args.cursor))
  }

  return {
    items: await q,
    cursor: null
  }
}

export const getLatestVersionAutomationRuns = async (
  params: {
    projectId: string
    modelId: string
    versionId: string
  },
  options?: Partial<{ limit: number }>
) => {
  const { projectId, modelId, versionId } = params
  const { limit = 20 } = options || {}

  const runsQ = AutomationRuns.knex()
    .select<Array<AutomationRunRecord & { automationId: string }>>([
      ...AutomationRuns.cols,
      AutomationRevisions.col.automationId
    ])
    .innerJoin(
      AutomationRevisions.name,
      AutomationRevisions.col.id,
      AutomationRuns.col.automationRevisionId
    )
    .innerJoin(
      Automations.name,
      Automations.col.id,
      AutomationRevisions.col.automationId
    )
    .innerJoin(
      AutomationRunTriggers.name,
      AutomationRunTriggers.col.automationRunId,
      AutomationRuns.col.id
    )
    .innerJoin(
      BranchCommits.name,
      BranchCommits.col.commitId,
      AutomationRunTriggers.col.triggeringId
    )
    .where(AutomationRunTriggers.col.triggerType, VersionCreationTriggerType)
    .andWhere(AutomationRunTriggers.col.triggeringId, versionId)
    .andWhere(Automations.col.projectId, projectId)
    .andWhere(BranchCommits.col.branchId, modelId)
    .distinctOn(AutomationRevisions.col.automationId)
    .orderBy([
      { column: AutomationRevisions.col.automationId },
      { column: AutomationRuns.col.createdAt, order: 'desc' }
    ])
    .limit(limit)

  const mainQ = knex()
    .select<Array<AutomationRunWithTriggersFunctionRuns>>([
      knex.raw('rq.*'),
      AutomationFunctionRuns.groupArray('functionRuns'),
      AutomationRunTriggers.groupArray('triggers')
    ])
    .from(runsQ.as('rq'))
    .innerJoin(AutomationFunctionRuns.name, AutomationFunctionRuns.col.runId, 'rq.id')
    .innerJoin(
      AutomationRunTriggers.name,
      AutomationRunTriggers.col.automationRunId,
      'rq.id'
    )
    .orderBy([
      { column: 'rq.updatedAt', order: 'desc' },
      { column: AutomationFunctionRuns.col.updatedAt, order: 'desc' }
    ])
    .groupBy('rq.id')

  return await mainQ
}
