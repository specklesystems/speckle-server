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
  VersionCreationTriggerType,
  isVersionCreatedTrigger,
  InsertableAutomationRevision,
  InsertableAutomationRun
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
import { Knex } from 'knex'
import { AutomationRunsArgs } from '@/modules/core/graph/generated/graphql'
import { BranchRecord, CommitRecord, StreamRecord } from '@/modules/core/helpers/types'

import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'
import { decodeCursor } from '@/modules/shared/helpers/graphqlHelper'
import { Nullable, StreamRoles, isNullOrUndefined } from '@speckle/shared'
import _, { clamp, groupBy, keyBy, omit, pick, reduce, zip } from 'lodash'
import { SetRequired } from 'type-fest'
import {
  GetAutomationRunsForVersionParams,
  QueryProjectAutomationsParams
} from '@/modules/automate/domain'

const queryActiveTriggerDefinitions = ({ db }: { db: Knex }) =>
  async function <T extends AutomationTriggerType = AutomationTriggerType>(
    params: AutomationTriggerRecordBase<T>
  ): Promise<AutomationTriggerDefinitionRecord<T>[]> {
    const { triggeringId, triggerType } = params

    return db<AutomationTriggerDefinitionRecord<T>>(AutomationTriggers.name)
      .where(AutomationTriggers.col.triggeringId, triggeringId)
      .andWhere(AutomationTriggers.col.triggerType, triggerType)
  }

const upsertAutomationFunctionRun = ({ db }: { db: Knex }) =>
  async function (
    automationFunctionRun: Pick<
      AutomationFunctionRunRecord,
      'id' | 'runId' | 'status' | 'statusMessage' | 'contextView' | 'results'
    >
  ): Promise<void> {
    await db<AutomationFunctionRunRecord>(AutomationFunctionRuns.name)
      .insert(
        _.pick(automationFunctionRun, AutomationFunctionRuns.withoutTablePrefix.cols)
      )
      .onConflict(AutomationFunctionRuns.withoutTablePrefix.col.id)
      .merge(['contextView', 'elapsed', 'results', 'status', 'statusMessage'])
  }

const findFullAutomationRevisionMetadata = ({ db }: { db: Knex }) =>
  async function (
    revisionId: string
  ): Promise<AutomationWithRevision<AutomationRevisionWithTriggersFunctions> | null> {
    const automationRevision = await db<AutomationRevisionRecord>(
      AutomationRevisions.name
    )
      .where(AutomationRevisions.col.id, revisionId)
      .first()

    if (!automationRevision) return null

    const [functions, triggers, automation] = await Promise.all([
      db<AutomateRevisionFunctionRecord>(AutomationRevisionFunctions.name)
        .select()
        .where(AutomationRevisionFunctions.col.automationRevisionId, revisionId),
      db<AutomationTriggerDefinitionRecord<AutomationTriggerType>>(
        AutomationTriggers.name
      )
        .select()
        .where(AutomationTriggers.col.automationRevisionId, revisionId),
      db<AutomationRecord>(Automations.name)
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

const upsertAutomationRun = ({ db }: { db: Knex }) =>
  async function (automationRun: InsertableAutomationRun) {
    await db<AutomationRunRecord>(AutomationRuns.name)
      .insert(_.pick(automationRun, AutomationRuns.withoutTablePrefix.cols))
      .onConflict(AutomationRuns.withoutTablePrefix.col.id)
      .merge(['status', 'updatedAt', 'executionEngineRunId'])

    return Promise.all([
      db<AutomationRunTriggerRecord>(AutomationRunTriggers.name)
        .insert(
          automationRun.triggers.map((t) => ({
            automationRunId: automationRun.id,
            ..._.pick(t, AutomationRunTriggers.withoutTablePrefix.cols)
          }))
        )
        .onConflict()
        .ignore(),
      db<AutomationFunctionRunRecord>(AutomationFunctionRuns.name)
        .insert(
          automationRun.functionRuns.map((f) => ({
            ..._.pick(f, AutomationFunctionRuns.withoutTablePrefix.cols),
            runId: automationRun.id
          }))
        )
        .onConflict(AutomationFunctionRuns.withoutTablePrefix.col.id)
        .merge()
    ])
  }

const findFunctionRun = ({ db }: { db: Knex }) =>
  async function (functionRunId: string): Promise<
    | (AutomationFunctionRunRecord & {
        automationId: string
        automationRevisionId: string
      })
    | null
  > {
    const q = db<AutomationFunctionRunRecord>(AutomationFunctionRuns.name)
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

const insertAutomation = ({ db }: { db: Knex }) =>
  async function (
    automation: AutomationRecord,
    automationToken: AutomationTokenRecord
  ): Promise<{ automation: AutomationRecord; token: AutomationTokenRecord }> {
    const [newAutomation] = await db(Automations.name)
      .insert(pick(automation, Automations.withoutTablePrefix.cols))
      .returning<AutomationRecord[]>('*')
    const [newToken] = await db(AutomationTokens.name)
      .insert(pick(automationToken, AutomationTokens.withoutTablePrefix.cols))
      .returning<AutomationTokenRecord[]>('*')

    return { automation: newAutomation, token: newToken }
  }

const updateAutomationRevision = ({ db }: { db: Knex }) =>
  async function (revision: SetRequired<Partial<AutomationRevisionRecord>, 'id'>) {
    const [ret] = await db<AutomationRevisionRecord>(AutomationRevisions.name)
      .where(AutomationRevisions.col.id, revision.id)
      .update(pick(revision, AutomationRevisions.withoutTablePrefix.cols))
      .returning('*')

    return ret
  }

const insertAutomationRevision =
  ({ db }: { db: Knex }) =>
  async (
    revision: InsertableAutomationRevision
  ): Promise<AutomationRevisionWithTriggersFunctions> => {
    const rev = _.pick(revision, AutomationRevisions.withoutTablePrefix.cols)
    const [newRev] = await db<AutomationRevisionRecord>(AutomationRevisions.name)
      .insert(rev)
      .returning<AutomationRevisionRecord[]>('*')
    const [functions, triggers] = await Promise.all([
      db<AutomationRevisionWithTriggersFunctions['functions'][number]>(
        AutomationRevisionFunctions.name
      )
        .insert(
          revision.functions.map(
            (f): AutomateRevisionFunctionRecord => ({
              ...f,
              automationRevisionId: revision.id
            })
          )
        )
        .returning<AutomateRevisionFunctionRecord[]>('*'),
      db<AutomationRevisionWithTriggersFunctions['triggers'][number]>(
        AutomationTriggers.name
      )
        .insert(
          revision.triggers.map(
            (t): AutomationTriggerDefinitionRecord => ({
              ...t,
              automationRevisionId: revision.id
            })
          )
        )
        .returning<AutomationTriggerDefinitionRecord[]>('*'),
      // Unset 'active in revision' for all other revisions
      ...(revision.active
        ? [
            db<AutomationRevisionRecord>(AutomationRevisions.name)
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

const findAutomationToken = ({ db }: { db: Knex }) =>
  async function (automationId: string): Promise<AutomationTokenRecord | null> {
    const token = await db<AutomationTokenRecord>(AutomationTokens.name)
      .where(AutomationTokens.col.automationId, automationId)
      .first()
    return token || null
  }

const queryAutomations = ({ db }: { db: Knex }) =>
  async function (params: {
    automationIds: string[]
    projectId?: string
  }): Promise<AutomationRecord[]> {
    const { automationIds, projectId } = params
    if (!automationIds.length) return []

    const q = db<AutomationRecord>(Automations.name)
      .select()
      .whereIn(Automations.col.id, automationIds)

    if (projectId?.length) {
      q.andWhere(Automations.col.projectId, projectId)
    }

    return q
  }

const findAutomation = ({ db }: { db: Knex }) =>
  async function (params: {
    automationId: string
    projectId?: string
  }): Promise<Nullable<AutomationRecord>> {
    const { automationId, projectId } = params
    return (
      (
        await queryAutomations({ db })({ automationIds: [automationId], projectId })
      )?.[0] || null
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

const getProjectAutomationsBaseQuery =
  ({ db }: { db: Knex }) =>
  (params: QueryProjectAutomationsParams) => {
    const { projectId, args } = params

    const q = db<AutomationRecord>(Automations.name).where(
      Automations.col.projectId,
      projectId
    )

    if (args.filter?.length) {
      q.andWhere(Automations.col.name, 'ilike', `%${args.filter}%`)
    }

    return q
  }

const countProjectAutomations =
  ({ db }: { db: Knex }) =>
  async (params: QueryProjectAutomationsParams): Promise<number> => {
    const q = getProjectAutomationsBaseQuery({ db })(params).count<[{ count: string }]>(
      Automations.col.id
    )

    const [ret] = await q

    return parseInt(ret.count)
  }

const queryProjectAutomations =
  ({ db }: { db: Knex }) =>
  async (
    params: QueryProjectAutomationsParams
  ): Promise<{ items: AutomationRecord[]; cursor: string | null }> => {
    const { args } = params
    if (args.limit === 0) return { items: [], cursor: null }

    const q = getProjectAutomationsBaseQuery({ db })(params)
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

const getAutomationRunsForVersion =
  ({ db }: { db: Knex }) =>
  async (
    params: GetAutomationRunsForVersionParams,
    options?: Partial<{ limit: number }>
  ) => {
    const { projectId, modelId, versionId } = params
    const { limit = 20 } = options || {}

    // yes, this is a long raw sql query, but its more expressive
    // the massive builder object becomes hard to read at this size,
    // and debugging the query is a PITA
    const rawSql = `
select distinct on (rev."automationId") rev."automationId", 
  run_triggers.items as triggers, 
  "functionRuns".items as "functionRuns",
  a.name, 
  run.id, 
  run."automationRevisionId", 
  run."createdAt", 
  run."updatedAt", 
  run."status", 
  run."executionEngineRunId", 
  rev."automationId" from automation_runs run
inner join automation_revisions rev on run."automationRevisionId" = rev.id
inner join automations a on rev."automationId" = a.id
inner join automation_run_triggers run_tr on run.id = run_tr."automationRunId"
left join lateral(
	select coalesce(
		json_agg(
			json_build_array(
        ${AutomationRunTriggers.withoutTablePrefix.cols
          .map((col) => `${AutomationRunTriggers.name}."${col}"`)
          .join(',\n')}
      )
		), '[]'::json
	)
	as items from automation_run_triggers
	where automation_run_triggers."automationRunId" = run.id
) run_triggers on true
left join lateral (
	select coalesce(json_agg(
		json_build_array(
      afr.id, 
      afr."runId", 
      afr."functionId", 
      afr."functionReleaseId", 
      afr.elapsed, 
      afr.status, 
      afr."contextView", 
      afr."statusMessage", 
      afr.results, 
      afr."createdAt", 
      afr."updatedAt"
    )
	), '[]'::json)
	as items from automation_function_runs afr
	where afr."runId" = run.id
) "functionRuns" on true
where run_tr."triggeringId"= ?
and run_tr."triggerType"= ?
order by rev."automationId", run."createdAt" desc
    `
    const items: {
      rows: Array<
        AutomationRunRecord & {
          automationId: string
          triggers: Array<Array<string | number>>
          functionRuns: Array<Array<string | number>>
        }
      >
    } = await db.raw(rawSql, [versionId, 'versionCreation'])

    const parsed = items.rows.map((i) => {
      const triggers = i.triggers.map((t) => {
        const trigger: AutomationRunTriggerRecord = Object.fromEntries(
          zip(AutomationRunTriggers.withoutTablePrefix.cols, t)
        )
        return trigger
      })
      const functionRuns = i.functionRuns.map((fr) => {
        const functionRun: AutomationFunctionRunRecord = Object.fromEntries(
          zip(AutomationFunctionRuns.withoutTablePrefix.cols, fr).map(
            ([key, value]) => {
              if (key === undefined || value === undefined)
                throw new Error(
                  `Object zip mismatch, key/value ${key}/${value} undefined`
                )

              if (key?.endsWith('atedAt')) return [key, new Date(value)]
              // might need to parse objectResults
              return [key, value]
            }
          )
        )
        return functionRun
      })
      const record = omit(i, 'triggers', 'functionRuns')
      return {
        ...record,
        triggers,
        functionRuns
      }
    })
    return parsed

    const runsQ = db(AutomationRuns.name)
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
        AutomationRunTriggers.groupArray(
          '                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  '
        )
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

const queryAutomationProjects =
  ({ db }: { db: Knex }) =>
  async (params: {
    automationIds: string[]
    userId?: string
  }): Promise<
    | Record<string, StreamRecord & { automationId: string; role?: StreamRoles }>
    | Record<string, never>
  > => {
    const { automationIds, userId } = params
    if (!automationIds.length) return {}

    const q = db(Automations.name)
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

const findAutomationProject =
  ({ db }: { db: Knex }) =>
  async (params: {
    automationId: string
    userId?: string
  }): Promise<(StreamRecord & { automationId: string; role?: StreamRoles }) | null> => {
    const { automationId, userId } = params
    const projects = await queryAutomationProjects({ db })({
      automationIds: [automationId],
      userId
    })

    return projects[automationId] || null
  }

const findAutomationRunWithToken =
  ({ db }: { db: Knex }) =>
  async (params: { automationRunId: string; automationId: string }) => {
    const { automationRunId, automationId } = params
    return db(AutomationRuns.name)
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
  }

type AutomationRunFullTrigger<T extends AutomationTriggerType = AutomationTriggerType> =
  AutomationRunTriggerRecord<T> & {
    versions: CommitRecord[]
    models: BranchRecord[]
  }

const queryAutomationRunsTriggers = ({ db }: { db: Knex }) =>
  async function (params: {
    automationRunIds: string[]
  }): Promise<Record<string, AutomationRunTriggerRecord[]>> {
    const { automationRunIds } = params
    if (!automationRunIds.length) return {}

    const items = await db<AutomationRunTriggerRecord>(
      AutomationRunTriggers.name
    ).whereIn(AutomationRunTriggers.col.automationRunId, automationRunIds)

    return groupBy(items, (i) => i.automationRunId)
  }

const queryAutomationRunFullTriggers = ({ db }: { db: Knex }) =>
  async function (params: { automationRunId: string }): Promise<{
    [VersionCreationTriggerType]: {
      triggerType: typeof VersionCreationTriggerType
      triggeringId: string
      model: BranchRecord
      version: CommitRecord
    }[]
  }> {
    const { automationRunId } = params

    const res = await db<AutomationRunTriggerRecord>(AutomationRunTriggers.name)
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

export const createAutomationRepository = ({ db }: { db: Knex }) => ({
  findFullAutomationRevisionMetadata: findFullAutomationRevisionMetadata({ db }),
  upsertAutomationFunctionRun: upsertAutomationFunctionRun({ db }),
  queryActiveTriggerDefinitions: queryActiveTriggerDefinitions({ db }),
  upsertAutomationRun: upsertAutomationRun({ db }),
  findFunctionRun: findFunctionRun({ db }),
  insertAutomation: insertAutomation({ db }),
  updateAutomationRevision: updateAutomationRevision({ db }),
  insertAutomationRevision: insertAutomationRevision({ db }),
  countProjectAutomations: countProjectAutomations({ db }),
  queryProjectAutomations: queryProjectAutomations({ db }),
  getAutomationRunsForVersion: getAutomationRunsForVersion({ db }),
  findAutomationProject: findAutomationProject({ db }),
  queryAutomationProjects: queryAutomationProjects({ db }),
  findAutomationRunWithToken: findAutomationRunWithToken({ db }),
  queryAutomationRunsTriggers: queryAutomationRunsTriggers({ db }),
  queryAutomationRunFullTriggers: queryAutomationRunFullTriggers({ db }),
  findAutomationToken: findAutomationToken({ db }),
  queryAutomations: queryAutomations({ db }),
  findAutomation: findAutomation({ db })
})
