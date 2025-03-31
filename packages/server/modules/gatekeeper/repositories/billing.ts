import { buildTableHelper, Streams } from '@/modules/core/dbSchema'
import {
  CheckoutSession,
  GetCheckoutSession,
  GetWorkspacePlan,
  SaveCheckoutSession,
  UpdateCheckoutSessionStatus,
  UpsertWorkspacePlan,
  UpsertWorkspaceSubscription,
  WorkspaceSubscription,
  UpsertPaidWorkspacePlan,
  DeleteCheckoutSession,
  GetWorkspaceCheckoutSession,
  GetWorkspaceSubscription,
  GetWorkspaceSubscriptionBySubscriptionId,
  GetWorkspaceSubscriptions,
  UpsertTrialWorkspacePlan,
  UpsertUnpaidWorkspacePlan,
  GetWorkspaceWithPlan
} from '@/modules/gatekeeper/domain/billing'
import {
  ChangeExpiredTrialWorkspacePlanStatuses,
  GetWorkspacesByPlanDaysTillExpiry,
  GetWorkspacePlanByProjectId
} from '@/modules/gatekeeper/domain/operations'
import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'
import {
  PaidWorkspacePlansNew,
  PaidWorkspacePlansOld,
  WorkspacePlan
} from '@speckle/shared'
import { Knex } from 'knex'
import { omit } from 'lodash'

const WorkspacePlans = buildTableHelper('workspace_plans', [
  'workspaceId',
  'name',
  'status',
  'createdAt',
  'updatedAt'
])
const WorkspaceSubscriptions = buildTableHelper('workspace_subscriptions', [
  'workspaceId',
  'createdAt',
  'updatedAt',
  'currentBillingCycleEnd',
  'billingInterval',
  'subscriptionData'
])

const tables = {
  workspaces: (db: Knex) => db<Workspace>('workspaces'),
  workspacePlans: (db: Knex) => db<WorkspacePlan>(WorkspacePlans.name),
  workspaceCheckoutSessions: (db: Knex) =>
    db<CheckoutSession>('workspace_checkout_sessions'),
  workspaceSubscriptions: (db: Knex) =>
    db<WorkspaceSubscription>('workspace_subscriptions')
}

export const getWorkspaceWithPlanFactory =
  (deps: { db: Knex }): GetWorkspaceWithPlan =>
  async ({ workspaceId }) => {
    const q = tables
      .workspaces(deps.db)
      .select<Workspace & { plans: WorkspacePlan[] }>([
        ...Workspaces.cols,
        WorkspacePlans.groupArray('plans')
      ])
      .leftJoin(WorkspacePlans.name, WorkspacePlans.col.workspaceId, Workspaces.col.id)
      .where(Workspaces.col.id, workspaceId)
      .groupBy(Workspaces.col.id)
      .first()

    const workspace = await q
    if (!workspace) return undefined

    return {
      ...omit(workspace, 'plans'),
      plan: formatJsonArrayRecords(workspace.plans || [])[0] || null
    }
  }

export const getWorkspacePlanFactory =
  ({ db }: { db: Knex }): GetWorkspacePlan =>
  async ({ workspaceId }) => {
    const workspacePlan = await tables
      .workspacePlans(db)
      .select()
      .where({ workspaceId })
      .first()
    return workspacePlan ?? null
  }

export const upsertWorkspacePlanFactory =
  ({ db }: { db: Knex }): UpsertWorkspacePlan =>
  async ({ workspacePlan }) => {
    await tables
      .workspacePlans(db)
      .insert(workspacePlan)
      .onConflict('workspaceId')
      .merge(['name', 'status'])
  }

// this is a typed rebrand of the generic workspace plan upsert
// this way TS guards the payment plan type validity
export const upsertPaidWorkspacePlanFactory = ({
  db
}: {
  db: Knex
}): UpsertPaidWorkspacePlan => upsertWorkspacePlanFactory({ db })

export const upsertTrialWorkspacePlanFactory = ({
  db
}: {
  db: Knex
}): UpsertTrialWorkspacePlan => upsertWorkspacePlanFactory({ db })

export const upsertUnpaidWorkspacePlanFactory = ({
  db
}: {
  db: Knex
}): UpsertUnpaidWorkspacePlan => upsertWorkspacePlanFactory({ db })

export const changeExpiredTrialWorkspacePlanStatusesFactory =
  ({ db }: { db: Knex }): ChangeExpiredTrialWorkspacePlanStatuses =>
  async ({ numberOfDays }) => {
    return await tables
      .workspacePlans(db)
      .where({ status: 'trial' })
      .andWhereRaw(`"createdAt" + make_interval(days => ${numberOfDays}) < now()`)
      .update({ status: 'expired' })
      .returning('*')
  }

export const getWorkspacesByPlanAgeFactory =
  ({ db }: { db: Knex }): GetWorkspacesByPlanDaysTillExpiry =>
  async ({ daysTillExpiry, planValidFor, plan, status }) => {
    return await tables
      .workspaces(db)
      .select('workspaces.*')
      .join('workspace_plans', 'workspaces.id', 'workspace_plans.workspaceId')
      .where('workspace_plans.status', status)
      .andWhere('workspace_plans.name', plan)
      .andWhereRaw('? - extract(day from now () - workspace_plans."createdAt") = ?', [
        planValidFor,
        daysTillExpiry
      ])
  }

export const saveCheckoutSessionFactory =
  ({ db }: { db: Knex }): SaveCheckoutSession =>
  async ({ checkoutSession }) => {
    await tables.workspaceCheckoutSessions(db).insert(checkoutSession)
  }

export const deleteCheckoutSessionFactory =
  ({ db }: { db: Knex }): DeleteCheckoutSession =>
  async ({ checkoutSessionId }) => {
    await tables.workspaceCheckoutSessions(db).delete().where({ id: checkoutSessionId })
  }

export const getCheckoutSessionFactory =
  ({ db }: { db: Knex }): GetCheckoutSession =>
  async ({ sessionId }) => {
    const checkoutSession = await tables
      .workspaceCheckoutSessions(db)
      .select()
      .where({ id: sessionId })
      .first()
    return checkoutSession || null
  }

export const getWorkspaceCheckoutSessionFactory =
  ({ db }: { db: Knex }): GetWorkspaceCheckoutSession =>
  async ({ workspaceId }) => {
    const checkoutSession = await tables
      .workspaceCheckoutSessions(db)
      .select()
      .where({ workspaceId })
      .first()
    return checkoutSession || null
  }

export const updateCheckoutSessionStatusFactory =
  ({ db }: { db: Knex }): UpdateCheckoutSessionStatus =>
  async ({ sessionId, paymentStatus }) => {
    await tables
      .workspaceCheckoutSessions(db)
      .where({ id: sessionId })
      .update({ paymentStatus, updatedAt: new Date() })
  }

export const upsertWorkspaceSubscriptionFactory =
  ({ db }: { db: Knex }): UpsertWorkspaceSubscription =>
  async ({ workspaceSubscription }) => {
    await tables
      .workspaceSubscriptions(db)
      .insert(workspaceSubscription)
      .onConflict('workspaceId')
      .merge()
  }

export const getWorkspaceSubscriptionFactory =
  ({ db }: { db: Knex }): GetWorkspaceSubscription =>
  async ({ workspaceId }) => {
    const subscription = await tables
      .workspaceSubscriptions(db)
      .select()
      .where({ workspaceId })
      .first()
    return subscription || null
  }

export const getWorkspaceSubscriptionBySubscriptionIdFactory =
  ({ db }: { db: Knex }): GetWorkspaceSubscriptionBySubscriptionId =>
  async ({ subscriptionId }) => {
    const subscription = await tables
      .workspaceSubscriptions(db)
      .select()
      .whereRaw(`"subscriptionData" ->> 'subscriptionId' = ?`, [subscriptionId])
      .first()
    return subscription ?? null
  }

const newPlans = Object.values(PaidWorkspacePlansNew)
const oldPlans = Object.values(PaidWorkspacePlansOld)

export const getWorkspaceSubscriptionsPastBillingCycleEndFactoryOldPlans =
  ({ db }: { db: Knex }): GetWorkspaceSubscriptions =>
  async () => {
    const cycleEnd = new Date()
    cycleEnd.setMinutes(cycleEnd.getMinutes() + 5)
    return await tables
      .workspaceSubscriptions(db)
      .join(
        WorkspacePlans.name,
        WorkspacePlans.col.workspaceId,
        'workspace_subscriptions.workspaceId'
      )
      .whereIn(WorkspacePlans.col.name, oldPlans)
      .where('currentBillingCycleEnd', '<', cycleEnd)
      .select(WorkspaceSubscriptions.cols)
  }

export const getWorkspaceSubscriptionsPastBillingCycleEndFactoryNewPlans =
  ({ db }: { db: Knex }): GetWorkspaceSubscriptions =>
  async () => {
    const cycleEnd = new Date()
    cycleEnd.setMinutes(cycleEnd.getMinutes() + 5)
    return await tables
      .workspaceSubscriptions(db)
      .join(
        WorkspacePlans.name,
        WorkspacePlans.col.workspaceId,
        'workspace_subscriptions.workspaceId'
      )
      .whereIn(WorkspacePlans.col.name, newPlans)
      .where('currentBillingCycleEnd', '<', cycleEnd)
      .select(WorkspaceSubscriptions.cols)
  }

export const getWorkspacePlanByProjectIdFactory =
  ({ db }: { db: Knex }): GetWorkspacePlanByProjectId =>
  async ({ projectId }) => {
    return await tables
      .workspacePlans(db)
      .select([
        'workspace_plans.workspaceId',
        'workspace_plans.status',
        'workspace_plans.name',
        'workspace_plans.createdAt'
      ])
      .innerJoin(Workspaces.name, Workspaces.col.id, 'workspace_plans.workspaceId')
      .innerJoin(Streams.name, Streams.col.workspaceId, Workspaces.col.id)
      .where({ [Streams.col.id]: projectId })
      .first<WorkspacePlan | null>()
  }
