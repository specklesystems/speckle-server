import {
  CheckoutSession,
  GetCheckoutSession,
  GetWorkspacePlan,
  SaveCheckoutSession,
  UpdateCheckoutSessionStatus,
  UpsertWorkspacePlan,
  UpsertWorkspaceSubscription,
  WorkspaceSubscription,
  WorkspacePlan,
  UpsertPaidWorkspacePlan,
  DeleteCheckoutSession,
  GetWorkspaceCheckoutSession,
  GetWorkspaceSubscription,
  GetWorkspaceSubscriptionBySubscriptionId,
  GetWorkspaceSubscriptions
} from '@/modules/gatekeeper/domain/billing'
import { Knex } from 'knex'

const tables = {
  workspacePlans: (db: Knex) => db<WorkspacePlan>('workspace_plans'),
  workspaceCheckoutSessions: (db: Knex) =>
    db<CheckoutSession>('workspace_checkout_sessions'),
  workspaceSubscriptions: (db: Knex) =>
    db<WorkspaceSubscription>('workspace_subscriptions')
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

const upsertWorkspacePlanFactory =
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

export const getWorkspaceSubscriptionsPastBillingCycleEndFactory =
  ({ db }: { db: Knex }): GetWorkspaceSubscriptions =>
  async () => {
    const cycleEnd = new Date()
    cycleEnd.setMinutes(cycleEnd.getMinutes() + 5)
    return await tables
      .workspaceSubscriptions(db)
      .select()
      .where('currentBillingCycleEnd', '<', cycleEnd)
  }
