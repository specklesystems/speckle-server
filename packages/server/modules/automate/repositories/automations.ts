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
  AutomateRevisionFunctionWithFunctionMetadata
} from '@/modules/automate/helpers/types'
import {
  AutomateFunctionReleases,
  AutomationFunctionRuns,
  AutomationRevisionFunctions,
  AutomationRevisions,
  AutomationRunTriggers,
  AutomationRuns,
  AutomationTokens,
  AutomationTriggers,
  Automations,
  Users
} from '@/modules/core/dbSchema'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { UsersMetaRecord } from '@/modules/core/helpers/types'
import { OAuthAppAuthentication } from '@octokit/auth-oauth-user'
import { Nullable } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import _, { pick } from 'lodash'
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

export async function getAutomationRevision(
  revisionId: string
): Promise<AutomationWithRevision<AutomationRevisionWithTriggersFunctions> | null> {
  const query = AutomationRevisions.knex<AutomationRevisionRecord>()
    .where(AutomationRevisions.col.id, revisionId)
    .first()

  const automationRevision = await query
  if (!automationRevision) return null

  const [functions, triggers, automation] = await Promise.all([
    AutomationRevisionFunctions.knex<AutomateRevisionFunctionWithFunctionMetadata[]>()
      .select([
        ...AutomationRevisionFunctions.cols,
        AutomateFunctionReleases.col.functionId
      ])
      .where(AutomationRevisionFunctions.col.automationRevisionId, revisionId)
      .innerJoin(
        AutomateFunctionReleases.name,
        AutomateFunctionReleases.col.functionReleaseId,
        AutomationRevisionFunctions.col.functionReleaseId
      ),
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
  functionRuns: AutomationFunctionRunRecord[]
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

export async function getAutomationRun(
  automationRunId: string
): Promise<AutomationRunWithTriggersFunctionRuns | null> {
  const run = await AutomationRuns.knex<AutomationRunRecord>()
    .select()
    .where({ id: automationRunId })
    .first()
  if (!run) return null

  const [triggers, functionRuns] = await Promise.all([
    AutomationRunTriggers.knex()
      .select<AutomationRunTriggerRecord[]>()
      .where(AutomationRunTriggers.col.automationRunId, automationRunId),
    AutomationFunctionRuns.knex()
      .select<AutomationFunctionRunRecord[]>()
      .where(AutomationFunctionRuns.col.runId, automationRunId)
  ])

  return { ...run, triggers, functionRuns }
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

export async function setUserGithubAuthData(params: {
  userId: string
  authData: Nullable<OAuthAppAuthentication>
}) {
  const { userId, authData } = params
  const meta = metaHelpers<UsersMetaRecord, typeof Users>(Users)
  if (authData) {
    await meta.delete(userId, Users.meta.metaKey.automateGithubAuthData)
  } else {
    await meta.set(userId, Users.meta.metaKey.automateGithubAuthData, authData)
  }
}

export async function getUserGithubAuthData(
  userId: string
): Promise<Nullable<OAuthAppAuthentication>> {
  const meta = metaHelpers<UsersMetaRecord, typeof Users>(Users)
  const record = await meta.get(userId, Users.meta.metaKey.automateGithubAuthData)
  return record ? (record.value as OAuthAppAuthentication) : null
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
    .update(pick(automation, Automations.withoutTablePrefix.cols))
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
