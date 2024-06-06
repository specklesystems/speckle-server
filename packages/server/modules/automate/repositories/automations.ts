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
  VersionCreationTriggerType,
  isVersionCreatedTrigger
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
  Branches,
  Commits,
  StreamAcl,
  Streams,
  knex
} from '@/modules/core/dbSchema'
import {
  AutomationRunsArgs,
  ProjectAutomationsArgs
} from '@/modules/core/graph/generated/graphql'
import { BranchRecord, CommitRecord, StreamRecord } from '@/modules/core/helpers/types'

import { LogicError } from '@/modules/shared/errors'
import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'
import { decodeCursor } from '@/modules/shared/helpers/graphqlHelper'
import { Nullable, StreamRoles, isNullOrUndefined } from '@speckle/shared'
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

export type InsertableAutomationFunctionRun = Pick<
  AutomationFunctionRunRecord,
  'id' | 'runId' | 'status' | 'statusMessage' | 'contextView' | 'results'
>

export async function upsertAutomationFunctionRun(
  automationFunctionRun: InsertableAutomationFunctionRun
) {
  await AutomationFunctionRuns.knex()
    .insert(
      _.pick(automationFunctionRun, AutomationFunctionRuns.withoutTablePrefix.cols)
    )
    .onConflict(AutomationFunctionRuns.withoutTablePrefix.col.id)
    .merge([
      AutomationFunctionRuns.withoutTablePrefix.col.contextView,
      AutomationFunctionRuns.withoutTablePrefix.col.elapsed,
      AutomationFunctionRuns.withoutTablePrefix.col.results,
      AutomationFunctionRuns.withoutTablePrefix.col.status,
      AutomationFunctionRuns.withoutTablePrefix.col.statusMessage
    ])
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

export async function getFunctionRun(functionRunId: string) {
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
    .where(AutomationFunctionRuns.col.id, functionRunId)
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

  const runs = await q

  return (runs[0] ?? null) as (typeof runs)[0] | null
}

export type GetFunctionRunsForAutomationRunIdsItem = AutomationFunctionRunRecord & {
  automationRunStatus: AutomationRunStatus
  automationRunExecutionEngineId: string | null
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
    .select<Array<GetFunctionRunsForAutomationRunIdsItem>>([
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

  const res = await q

  return keyBy(res, (r) => r.runId)
}

export async function getFullAutomationRunById(
  automationRunId: string
): Promise<AutomationRunWithTriggersFunctionRuns | null> {
  const run = await AutomationRuns.knex()
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
      knex.raw(`(array_agg(??))[1] as "automationId"`, [
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

export async function storeAutomation(automation: AutomationRecord) {
  const [newAutomation] = await Automations.knex()
    .insert(pick(automation, Automations.withoutTablePrefix.cols))
    .returning<AutomationRecord[]>('*')

  return newAutomation
}

export async function storeAutomationToken(automationToken: AutomationTokenRecord) {
  const [newToken] = await AutomationTokens.knex()
    .insert(pick(automationToken, AutomationTokens.withoutTablePrefix.cols))
    .returning<AutomationTokenRecord[]>('*')

  return newToken
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

export type StoredInsertableAutomationRevision = Awaited<
  ReturnType<typeof storeAutomationRevision>
>

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

export async function getAutomationRevision(params: { automationRevisionId: string }) {
  const { automationRevisionId } = params
  const revisions = await getAutomationRevisions({
    automationRevisionIds: [automationRevisionId]
  })

  return (revisions[0] || null) as Nullable<(typeof revisions)[0]>
}

export async function getLatestAutomationRevisions(params: {
  automationIds: string[]
}) {
  const { automationIds } = params
  if (!automationIds.length) return {}

  const innerQ = AutomationRevisions.knex()
    .select([
      AutomationRevisions.col.automationId,
      knex.raw('max(??) as ??', [AutomationRevisions.col.createdAt, 'maxCreatedAt'])
    ])
    .whereIn(AutomationRevisions.col.automationId, automationIds)
    .andWhere(AutomationRevisions.col.active, true)
    .groupBy(AutomationRevisions.col.automationId)

  const outerQ = AutomationRevisions.knex<AutomationRevisionRecord[]>().innerJoin(
    innerQ.as('q1'),
    function () {
      this.on(AutomationRevisions.col.automationId, '=', 'q1.automationId')
      this.andOn(AutomationRevisions.col.createdAt, '=', 'q1.maxCreatedAt')
    }
  )

  const res = await outerQ
  return keyBy(res, (r) => r.automationId)
}

export async function getLatestAutomationRevision(params: { automationId: string }) {
  const { automationId } = params

  const revisions = await getLatestAutomationRevisions({
    automationIds: [automationId]
  })

  return (revisions[automationId] ?? null) as Nullable<(typeof revisions)[0]>
}

export async function getRevisionsTriggerDefinitions(params: {
  automationRevisionIds: string[]
}) {
  const { automationRevisionIds } = params
  if (!automationRevisionIds.length) return {}

  const q = AutomationTriggers.knex<AutomationTriggerDefinitionRecord[]>().whereIn(
    AutomationTriggers.col.automationRevisionId,
    automationRevisionIds
  )

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
      knex.raw('count(distinct ??) as "count"', [AutomationRevisions.col.automationId])
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

  const q = getAutomationRunsTotalCountBaseQuery<
    Array<{
      runs: AutomationRunRecord[]
      triggers: AutomationRunTriggerRecord[]
      functionRuns: AutomationFunctionRunRecord[]
      automationId: string
    }>
  >(params)

  const limit = clamp(isNullOrUndefined(args.limit) ? 10 : args.limit, 0, 25)

  // Attach trigger & function runs
  q.select([
    AutomationRuns.groupArray('runs'),
    AutomationRunTriggers.groupArray('triggers'),
    AutomationFunctionRuns.groupArray('functionRuns'),
    knex.raw(`(array_agg(??))[1] as "automationId"`, [
      AutomationRevisions.col.automationId
    ])
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
  const items = res.map(
    (r): AutomationRunWithTriggersFunctionRuns => ({
      ...formatJsonArrayRecords(r.runs)[0],
      triggers: formatJsonArrayRecords(r.triggers),
      functionRuns: formatJsonArrayRecords(r.functionRuns),
      automationId: r.automationId
    })
  )

  return {
    items,
    cursor: items.length ? items[items.length - 1].updatedAt.toISOString() : null
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
    .select<
      Array<{
        runs: Array<AutomationRunRecord & { automationId: string }>
        functionRuns: AutomationFunctionRunRecord[]
        triggers: AutomationRunTriggerRecord[]
      }>
    >([
      // We will only have 1 run here, but we have to use an aggregation because of the grouping,
      // so we just take the 1st array item later on
      AutomationRuns.with({ withCustomTablePrefix: 'rq' }).groupArray('runs'),
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
    .orderBy([{ column: 'rq.updatedAt', order: 'desc' }])
    .groupBy('rq.id', 'rq.updatedAt')

  const res = await mainQ
  const formattedItems: AutomationRunWithTriggersFunctionRuns[] = res.map(
    (r): AutomationRunWithTriggersFunctionRuns => ({
      ...formatJsonArrayRecords(r.runs)[0],
      triggers: formatJsonArrayRecords(r.triggers),
      functionRuns: formatJsonArrayRecords(r.functionRuns)
    })
  )
  return formattedItems
}

export const getAutomationProjects = async (params: {
  automationIds: string[]
  userId?: string
}) => {
  const { automationIds, userId } = params
  if (!automationIds.length) return {}

  const q = Automations.knex()
    .select<Array<StreamRecord & { automationId: string; role?: StreamRoles }>>([
      ...Streams.cols,
      Automations.colAs('id', 'automationId'),
      ...(userId
        ? [
            // Getting first role from grouped results
            knex.raw(`(array_agg("stream_acl"."role"))[1] as role`)
          ]
        : [])
    ])
    .whereIn(Automations.col.id, automationIds)
    .innerJoin(Streams.name, Streams.col.id, Automations.col.projectId)

  if (userId) {
    q.leftJoin(StreamAcl.name, function () {
      this.on(StreamAcl.col.resourceId, Streams.col.id).andOnVal(
        StreamAcl.col.userId,
        userId
      )
    }).groupBy(Automations.col.id, Streams.col.id)
  }

  const res = await q

  return keyBy(res, (r) => r.automationId)
}

export const getAutomationProject = async (params: {
  automationId: string
  userId?: string
}) => {
  const { automationId, userId } = params
  const projects = await getAutomationProjects({
    automationIds: [automationId],
    userId
  })

  return (projects[automationId] || null) as Nullable<(typeof projects)[0]>
}

export const getAutomationRunWithToken = async (params: {
  automationRunId: string
  automationId: string
}) => {
  const { automationRunId, automationId } = params
  const q = AutomationRuns.knex()
    .select<
      Array<
        AutomationRunRecord & {
          automationId: string
          token: string
          executionEngineAutomationId: string
        }
      >
    >([
      ...AutomationRuns.cols,
      Automations.colAs('id', 'automationId'),
      Automations.col.executionEngineAutomationId,
      AutomationTokens.colAs('automateToken', 'token')
    ])
    .where(AutomationRuns.col.id, automationRunId)
    .andWhere(Automations.col.id, automationId)
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
      AutomationTokens.name,
      AutomationTokens.col.automationId,
      Automations.col.id
    )
    .first()

  return await q
}

type AutomationRunFullTrigger<T extends AutomationTriggerType = AutomationTriggerType> =
  AutomationRunTriggerRecord<T> & {
    versions: CommitRecord[]
    models: BranchRecord[]
  }

export async function getAutomationRunsTriggers(params: {
  automationRunIds: string[]
}) {
  const { automationRunIds } = params
  if (!automationRunIds.length) return {}

  const q = AutomationRunTriggers.knex<AutomationRunTriggerRecord[]>().whereIn(
    AutomationRunTriggers.col.automationRunId,
    automationRunIds
  )
  const items = await q
  return groupBy(items, (i) => i.automationRunId)
}

export async function getAutomationRunFullTriggers(params: {
  automationRunId: string
}) {
  const { automationRunId } = params

  const q = AutomationRunTriggers.knex()
    .where(AutomationRunTriggers.col.automationRunId, automationRunId)

    // Join on relevant entities
    .leftJoin(Commits.name, function () {
      this.on(Commits.col.id, AutomationRunTriggers.col.triggeringId).andOnVal(
        AutomationRunTriggers.col.triggerType,
        VersionCreationTriggerType
      )
    })
    .innerJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
    .innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)

    .groupBy(
      AutomationRunTriggers.col.automationRunId,
      AutomationRunTriggers.col.triggerType,
      AutomationRunTriggers.col.triggeringId
    )

    .select<AutomationRunFullTrigger[]>([
      ...AutomationRunTriggers.cols,
      Commits.groupArray('versions'),
      Branches.groupArray('models')
    ])

  const res = await q
  const formattedRes = res.map((r) => ({
    ...r,
    versions: formatJsonArrayRecords(r.versions),
    models: formatJsonArrayRecords(r.models)
  }))

  return {
    [VersionCreationTriggerType]: formattedRes
      .filter((r): r is AutomationRunFullTrigger<typeof VersionCreationTriggerType> =>
        isVersionCreatedTrigger(r)
      )
      .map((r) => ({
        triggerType: r.triggerType,
        triggeringId: r.triggeringId,
        version: r.versions[0],
        model: r.models[0]
      }))
  }
}
