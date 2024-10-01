import {
  GetActiveTriggerDefinitions,
  GetAutomation,
  GetAutomationProject,
  GetAutomationProjects,
  GetAutomationRevision,
  GetAutomationRevisions,
  GetAutomationRunFullTriggers,
  GetAutomationRunWithToken,
  GetAutomations,
  GetAutomationToken,
  GetAutomationTriggerDefinitions,
  GetFullAutomationRevisionMetadata,
  GetFullAutomationRunById,
  GetFunctionAutomationCounts,
  GetFunctionRun,
  GetLatestAutomationRevision,
  GetLatestAutomationRevisions,
  GetLatestVersionAutomationRuns,
  GetRevisionsFunctions,
  GetRevisionsTriggerDefinitions,
  StoreAutomation,
  StoreAutomationRevision,
  StoreAutomationToken,
  UpdateAutomation,
  UpdateAutomationRun,
  UpsertAutomationFunctionRun,
  UpsertAutomationRun
} from '@/modules/automate/domain/operations'
import {
  AutomationRunFullTrigger,
  InsertableAutomationFunctionRun
} from '@/modules/automate/domain/types'
import {
  AutomationRecord,
  AutomationRevisionRecord,
  AutomationTriggerDefinitionRecord,
  AutomationRunRecord,
  AutomationTokenRecord,
  AutomationTriggerRecordBase,
  AutomateRevisionFunctionRecord,
  AutomationRunWithTriggersFunctionRuns,
  AutomationRunTriggerRecord,
  AutomationFunctionRunRecord,
  AutomationRevisionWithTriggersFunctions,
  AutomationTriggerType,
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
import { StreamRecord } from '@/modules/core/helpers/types'

import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'
import {
  decodeCursor,
  decodeIsoDateCursor,
  encodeIsoDateCursor
} from '@/modules/shared/helpers/graphqlHelper'
import { Nullable, StreamRoles, isNullOrUndefined } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'
import _, { clamp, groupBy, keyBy, pick, reduce } from 'lodash'
import { SetOptional, SetRequired } from 'type-fest'

const tables = {
  automations: (db: Knex) => db<AutomationRecord>(Automations.name),
  automationTokens: (db: Knex) => db<AutomationTokenRecord>(AutomationTokens.name),
  automationRevisions: (db: Knex) =>
    db<AutomationRevisionRecord>(AutomationRevisions.name),
  automationRevisionFunctions: (db: Knex) =>
    db<AutomateRevisionFunctionRecord>(AutomationRevisionFunctions.name),
  automationTriggers: (db: Knex) =>
    db<AutomationTriggerDefinitionRecord>(AutomationTriggers.name),
  automationRuns: (db: Knex) => db<AutomationRunRecord>(AutomationRuns.name),
  automationRunTriggers: (db: Knex) =>
    db<AutomationRunTriggerRecord>(AutomationRunTriggers.name),
  automationFunctionRuns: (db: Knex) =>
    db<AutomationFunctionRunRecord>(AutomationFunctionRuns.name)
}

export const generateRevisionId = () => cryptoRandomString({ length: 10 })

export const getActiveTriggerDefinitionsFactory =
  (deps: { db: Knex }): GetActiveTriggerDefinitions =>
  async <T extends AutomationTriggerType = AutomationTriggerType>(
    params: AutomationTriggerRecordBase<T>
  ) => {
    const { triggeringId, triggerType } = params

    const q = tables
      .automationTriggers(deps.db)
      .select<AutomationTriggerDefinitionRecord<T>[]>('*')
      .where(AutomationTriggers.col.triggeringId, triggeringId)
      .andWhere(AutomationTriggers.col.triggerType, triggerType)

    return await q
  }

export const getFullAutomationRevisionMetadataFactory =
  (deps: { db: Knex }): GetFullAutomationRevisionMetadata =>
  async (revisionId: string) => {
    const query = tables
      .automationRevisions(deps.db)
      .where(AutomationRevisions.col.id, revisionId)
      .first()

    const automationRevision = await query
    if (!automationRevision) return null

    const [functions, triggers, automation] = await Promise.all([
      tables
        .automationRevisionFunctions(deps.db)
        .select('*')
        .where(AutomationRevisionFunctions.col.automationRevisionId, revisionId),
      tables
        .automationTriggers(deps.db)
        .select('*')
        .where(AutomationTriggers.col.automationRevisionId, revisionId),
      tables
        .automations(deps.db)
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

export const upsertAutomationFunctionRunFactory =
  (deps: { db: Knex }): UpsertAutomationFunctionRun =>
  async (automationFunctionRun: InsertableAutomationFunctionRun) => {
    await tables
      .automationFunctionRuns(deps.db)
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
      ] as Array<keyof AutomationFunctionRunRecord>)
  }

export type InsertableAutomationRun = AutomationRunRecord & {
  triggers: Omit<AutomationRunTriggerRecord, 'automationRunId'>[]
  functionRuns: Omit<AutomationFunctionRunRecord, 'runId'>[]
}

export const upsertAutomationRunFactory =
  (deps: { db: Knex }): UpsertAutomationRun =>
  async (automationRun: InsertableAutomationRun) => {
    await tables
      .automationRuns(deps.db)
      .insert(_.pick(automationRun, AutomationRuns.withoutTablePrefix.cols))
      .onConflict(AutomationRuns.withoutTablePrefix.col.id)
      .merge([
        AutomationRuns.withoutTablePrefix.col.status,
        AutomationRuns.withoutTablePrefix.col.updatedAt,
        AutomationRuns.withoutTablePrefix.col.executionEngineRunId
      ] as Array<keyof AutomationRunRecord>)
    await Promise.all([
      tables
        .automationRunTriggers(deps.db)
        .insert(
          automationRun.triggers.map((t) => ({
            automationRunId: automationRun.id,
            ..._.pick(t, AutomationRunTriggers.withoutTablePrefix.cols)
          }))
        )
        .onConflict()
        .ignore(),
      tables
        .automationFunctionRuns(deps.db)
        .insert(
          automationRun.functionRuns.map((f) => ({
            ..._.pick(f, AutomationFunctionRuns.withoutTablePrefix.cols),
            runId: automationRun.id
          }))
        )
        .onConflict(AutomationFunctionRuns.withoutTablePrefix.col.id)
        .merge(
          AutomationFunctionRuns.withoutTablePrefix.cols as Array<
            keyof AutomationFunctionRunRecord
          >
        )
    ])
    return
  }

export const getFunctionRunFactory =
  (deps: { db: Knex }): GetFunctionRun =>
  async (functionRunId: string) => {
    const q = tables
      .automationFunctionRuns(deps.db)
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

export const getFullAutomationRunByIdFactory =
  (deps: { db: Knex }): GetFullAutomationRunById =>
  async (automationRunId: string) => {
    const run = await tables
      .automationRuns(deps.db)
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

export const storeAutomationFactory =
  (deps: { db: Knex }): StoreAutomation =>
  async (automation: AutomationRecord) => {
    const [newAutomation] = await tables
      .automations(deps.db)
      .insert(pick(automation, Automations.withoutTablePrefix.cols))
      .returning('*')

    return newAutomation
  }

export const storeAutomationTokenFactory =
  (deps: { db: Knex }): StoreAutomationToken =>
  async (automationToken: AutomationTokenRecord) => {
    const [newToken] = await tables
      .automationTokens(deps.db)
      .insert(pick(automationToken, AutomationTokens.withoutTablePrefix.cols))
      .returning('*')

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

export const updateAutomationRevisionFactory =
  (deps: { db: Knex }) =>
  async (revision: SetRequired<Partial<AutomationRevisionRecord>, 'id'>) => {
    const [ret] = await tables
      .automationRevisions(deps.db)
      .where(AutomationRevisions.col.id, revision.id)
      .update(pick(revision, AutomationRevisions.withoutTablePrefix.cols))
      .returning<AutomationRevisionRecord[]>('*')

    return ret
  }

export type StoredInsertableAutomationRevision = AutomationRevisionWithTriggersFunctions

export const storeAutomationRevisionFactory =
  (deps: { db: Knex }): StoreAutomationRevision =>
  async (revision: InsertableAutomationRevision) => {
    const id = revision.id || generateRevisionId()
    const rev = _.pick(revision, AutomationRevisions.withoutTablePrefix.cols)
    const [newRev] = await tables
      .automationRevisions(deps.db)
      .insert({
        ...rev,
        id
      })
      .returning('*')
    const [functions, triggers] = await Promise.all([
      tables
        .automationRevisionFunctions(deps.db)
        .insert(
          revision.functions.map(
            (f): AutomateRevisionFunctionRecord => ({
              ...f,
              automationRevisionId: id
            })
          )
        )
        .returning('*'),
      tables
        .automationTriggers(deps.db)
        .insert(
          revision.triggers.map(
            (t): AutomationTriggerDefinitionRecord => ({
              ...t,
              automationRevisionId: id
            })
          )
        )
        .returning('*'),
      // Unset 'active in revision' for all other revisions
      ...(revision.active
        ? [
            tables
              .automationRevisions(deps.db)
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

export const getAutomationTokenFactory =
  (deps: { db: Knex }): GetAutomationToken =>
  async (automationId: string): Promise<AutomationTokenRecord | null> => {
    const token = await tables
      .automationTokens(deps.db)
      .where(AutomationTokens.col.automationId, automationId)
      .first()
    return token || null
  }

export const getAutomationsFactory =
  (deps: { db: Knex }): GetAutomations =>
  async (params: { automationIds: string[]; projectId?: string }) => {
    const { automationIds, projectId } = params
    if (!automationIds.length) return []

    const q = tables
      .automations(deps.db)
      .select()
      .whereIn(Automations.col.id, automationIds)

    if (projectId?.length) {
      q.andWhere(Automations.col.projectId, projectId)
    }

    return await q
  }

export const getAutomationFactory =
  (deps: { db: Knex }): GetAutomation =>
  async (params: { automationId: string; projectId?: string }) => {
    const { automationId, projectId } = params
    return (
      (
        await getAutomationsFactory(deps)({ automationIds: [automationId], projectId })
      )?.[0] || null
    )
  }

export const updateAutomationFactory =
  (deps: { db: Knex }): UpdateAutomation =>
  async (automation: SetRequired<Partial<AutomationRecord>, 'id'>) => {
    const [ret] = await tables
      .automations(deps.db)
      .where(Automations.col.id, automation.id)
      .update({
        ...pick(automation, Automations.withoutTablePrefix.cols),
        [Automations.withoutTablePrefix.col.updatedAt]: new Date()
      })
      .returning('*')

    return ret
  }

export const getAutomationTriggerDefinitionsFactory =
  (deps: { db: Knex }): GetAutomationTriggerDefinitions =>
  async <T extends AutomationTriggerType = AutomationTriggerType>(params: {
    automationId: string
    projectId?: string
    triggerType?: T
  }) => {
    const { automationId, projectId, triggerType } = params

    const revisionQuery = tables
      .automationRevisions(deps.db)
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

    const mainQ = tables
      .automationTriggers(deps.db)
      .select<AutomationTriggerDefinitionRecord<T>[]>('*')
      .where(AutomationTriggers.col.automationRevisionId, revisionQuery)

    if (triggerType) {
      mainQ.andWhere(AutomationTriggers.col.triggerType, triggerType)
    }

    return (await mainQ).map((r) => ({
      ...r,
      automationId
    }))
  }

export const updateAutomationRunFactory =
  (deps: { db: Knex }): UpdateAutomationRun =>
  async (run: SetRequired<Partial<AutomationRunRecord>, 'id'>) => {
    const [ret] = await tables
      .automationRuns(deps.db)
      .where(AutomationRuns.col.id, run.id)
      .update({
        ...pick(run, AutomationRuns.withoutTablePrefix.cols),
        [AutomationRuns.withoutTablePrefix.col.updatedAt]: new Date()
      })
      .returning<AutomationRunRecord[]>('*')

    return ret
  }

export const getAutomationRevisionsFactory =
  (deps: { db: Knex }): GetAutomationRevisions =>
  async (params: { automationRevisionIds: string[] }) => {
    const { automationRevisionIds } = params
    if (!automationRevisionIds.length) return []

    const q = tables
      .automationRevisions(deps.db)
      .whereIn(AutomationRevisions.col.id, automationRevisionIds)
      .andWhere(AutomationRevisions.col.active, true)

    return await q
  }

export const getAutomationRevisionFactory =
  (deps: { db: Knex }): GetAutomationRevision =>
  async (params: { automationRevisionId: string }) => {
    const { automationRevisionId } = params
    const revisions = await getAutomationRevisionsFactory(deps)({
      automationRevisionIds: [automationRevisionId]
    })

    return (revisions[0] || null) as Nullable<(typeof revisions)[0]>
  }

export const getLatestAutomationRevisionsFactory =
  (deps: { db: Knex }): GetLatestAutomationRevisions =>
  async (params: { automationIds: string[] }) => {
    const { automationIds } = params
    if (!automationIds.length) return {}

    const innerQ = tables
      .automationRevisions(deps.db)
      .select([
        AutomationRevisions.col.automationId,
        knex.raw('max(??) as ??', [AutomationRevisions.col.createdAt, 'maxCreatedAt'])
      ])
      .whereIn(AutomationRevisions.col.automationId, automationIds)
      .andWhere(AutomationRevisions.col.active, true)
      .groupBy(AutomationRevisions.col.automationId)

    const outerQ = tables
      .automationRevisions(deps.db)
      .select<AutomationRevisionRecord[]>('*')
      .innerJoin(innerQ.as('q1'), function () {
        this.on(AutomationRevisions.col.automationId, '=', 'q1.automationId')
        this.andOn(AutomationRevisions.col.createdAt, '=', 'q1.maxCreatedAt')
      })

    const res = await outerQ
    return keyBy(res, (r) => r.automationId)
  }

export const getLatestAutomationRevisionFactory =
  (deps: { db: Knex }): GetLatestAutomationRevision =>
  async (params: { automationId: string }) => {
    const { automationId } = params

    const revisions = await getLatestAutomationRevisionsFactory(deps)({
      automationIds: [automationId]
    })

    return (revisions[automationId] ?? null) as Nullable<(typeof revisions)[0]>
  }

export const getRevisionsTriggerDefinitionsFactory =
  (deps: { db: Knex }): GetRevisionsTriggerDefinitions =>
  async (params: { automationRevisionIds: string[] }) => {
    const { automationRevisionIds } = params
    if (!automationRevisionIds.length) return {}

    const q = tables
      .automationTriggers(deps.db)
      .whereIn(AutomationTriggers.col.automationRevisionId, automationRevisionIds)

    return groupBy(await q, (r) => r.automationRevisionId)
  }

export const getRevisionsFunctionsFactory =
  (deps: { db: Knex }): GetRevisionsFunctions =>
  async (params: { automationRevisionIds: string[] }) => {
    const { automationRevisionIds } = params
    if (!automationRevisionIds.length) return {}

    const q = tables
      .automationRevisionFunctions(deps.db)
      .whereIn(
        AutomationRevisionFunctions.col.automationRevisionId,
        automationRevisionIds
      )

    return groupBy(await q, (r) => r.automationRevisionId)
  }

export const getFunctionAutomationCountsFactory =
  (deps: { db: Knex }): GetFunctionAutomationCounts =>
  async (params: { functionIds: string[] }) => {
    const { functionIds } = params
    if (!functionIds.length) return {}

    const q = tables
      .automationRevisionFunctions(deps.db)
      .select<Array<{ functionId: string; count: string }>>([
        AutomationRevisionFunctions.col.functionId,
        knex.raw('count(distinct ??) as "count"', [
          AutomationRevisions.col.automationId
        ])
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

const getAutomationRunsTotalCountBaseQueryFactory =
  (deps: { db: Knex }) =>
  (params: { args: Pick<GetAutomationRunsArgs, 'automationId' | 'revisionId'> }) => {
    const { args } = params
    const q = tables
      .automationRuns(deps.db)
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

export const getAutomationRunsTotalCountFactory =
  (deps: { db: Knex }) => async (params: { args: GetAutomationRunsArgs }) => {
    const q = getAutomationRunsTotalCountBaseQueryFactory(deps)(params).count<
      [{ count: string }]
    >(AutomationRuns.col.id)

    const [ret] = await q

    return parseInt(ret.count)
  }

export const getAutomationRunsItemsFactory =
  (deps: { db: Knex }) => async (params: { args: GetAutomationRunsArgs }) => {
    const { args } = params
    if (args.limit === 0) return { items: [], cursor: null }

    const q = getAutomationRunsTotalCountBaseQueryFactory(deps)(params)

    const limit = clamp(isNullOrUndefined(args.limit) ? 10 : args.limit, 0, 25)
    const cursor = args.cursor ? decodeIsoDateCursor(args.cursor) : null

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

    if (cursor?.length) {
      q.andWhere(AutomationRuns.col.updatedAt, '<', cursor)
    }

    const res = (await q) as Array<{
      runs: AutomationRunRecord[]
      triggers: AutomationRunTriggerRecord[]
      functionRuns: AutomationFunctionRunRecord[]
      automationId: string
    }>

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
      cursor: items.length
        ? encodeIsoDateCursor(items[items.length - 1].updatedAt)
        : null
    }
  }

export type GetProjectAutomationsParams = {
  projectId: string
  args: ProjectAutomationsArgs
}

const getProjectAutomationsBaseQueryFactory =
  (deps: { db: Knex }) => (params: GetProjectAutomationsParams) => {
    const { projectId, args } = params

    const q = tables.automations(deps.db).where(Automations.col.projectId, projectId)

    if (args.filter?.length) {
      q.andWhere(Automations.col.name, 'ilike', `%${args.filter}%`)
    }

    return q
  }

export const getProjectAutomationsTotalCountFactory =
  (deps: { db: Knex }) => async (params: GetProjectAutomationsParams) => {
    const q = getProjectAutomationsBaseQueryFactory(deps)(params).count<
      [{ count: string }]
    >(Automations.col.id)

    const [ret] = await q

    return parseInt(ret.count)
  }

export const getProjectAutomationsItemsFactory =
  (deps: { db: Knex }) => async (params: GetProjectAutomationsParams) => {
    const { args } = params
    if (args.limit === 0) return { items: [], cursor: null }

    const cursor = args.cursor ? decodeCursor(args.cursor) : null

    const q = getProjectAutomationsBaseQueryFactory(deps)(params)
      .limit(clamp(isNullOrUndefined(args.limit) ? 10 : args.limit, 0, 25))
      .orderBy(Automations.col.updatedAt, 'desc')

    if (cursor?.length) {
      q.andWhere(Automations.col.updatedAt, '<', cursor)
    }

    const res = await q

    return {
      items: res,
      cursor: res.length ? encodeIsoDateCursor(res[res.length - 1].updatedAt) : null
    }
  }

export const getLatestVersionAutomationRunsFactory =
  (deps: { db: Knex }): GetLatestVersionAutomationRuns =>
  async (params, options) => {
    const { projectId, modelId, versionId } = params
    const { limit = 20 } = options || {}

    const runsQ = tables
      .automationRuns(deps.db)
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

    const mainQ = deps.db
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

export const getAutomationProjectsFactory =
  (deps: { db: Knex }): GetAutomationProjects =>
  async (params: { automationIds: string[]; userId?: string }) => {
    const { automationIds, userId } = params
    if (!automationIds.length) return {}

    const q = tables
      .automations(deps.db)
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

export const getAutomationProjectFactory =
  (deps: { db: Knex }): GetAutomationProject =>
  async (params: { automationId: string; userId?: string }) => {
    const { automationId, userId } = params
    const projects = await getAutomationProjectsFactory(deps)({
      automationIds: [automationId],
      userId
    })

    return (projects[automationId] || null) as Nullable<(typeof projects)[0]>
  }

export const getAutomationRunWithTokenFactory =
  (deps: { db: Knex }): GetAutomationRunWithToken =>
  async (params: { automationRunId: string; automationId: string }) => {
    const { automationRunId, automationId } = params
    const q = tables
      .automationRuns(deps.db)
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

export const getAutomationRunsTriggersFactory =
  (deps: { db: Knex }) => async (params: { automationRunIds: string[] }) => {
    const { automationRunIds } = params
    if (!automationRunIds.length) return {}

    const q = tables
      .automationRunTriggers(deps.db)
      .whereIn(AutomationRunTriggers.col.automationRunId, automationRunIds)
    const items = await q
    return groupBy(items, (i) => i.automationRunId)
  }

export const getAutomationRunFullTriggersFactory =
  (deps: { db: Knex }): GetAutomationRunFullTriggers =>
  async (params: { automationRunId: string }) => {
    const { automationRunId } = params

    const q = tables
      .automationRunTriggers(deps.db)
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
