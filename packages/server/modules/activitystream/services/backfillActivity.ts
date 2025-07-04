import { Activity as ActivityModel, StreamAcl } from '@/modules/core/dbSchema'
import { StreamAclRecord } from '@/modules/core/helpers/types'
import { SubscriptionData } from '@/modules/gatekeeper/domain/billing'
import { WorkspaceSeat } from '@/modules/workspacesCore/domain/types'
import { WorkspaceSeats } from '@/modules/workspacesCore/helpers/db'
import { StreamRoles, WorkspacePlan } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'
import { MaxBackfillIterations } from '@/modules/activitystream/errors/activityStream'
import { Logger } from '@/observability/logging'
import {
  Activity,
  ResourceEventsToPayloadMap
} from '@/modules/activitystream/domain/types'
import {
  BillingInterval,
  WorkspacePlans
} from '@/modules/cross-server-sync/graph/generated/graphql'
import { WorkspacePlanStatuses } from '@/modules/core/graph/generated/graphql'

const getUntrackedWorkspaceSeatsFactory =
  ({ db }: { db: Knex }) =>
  async (limit: number): Promise<WorkspaceSeat[]> => {
    return await db<WorkspaceSeat>(WorkspaceSeats.name)
      .select('*')
      .whereRaw(
        `NOT EXISTS (
          SELECT * FROM activity
          WHERE activity."contextResourceId" = workspace_seats."workspaceId"
            AND activity."contextResourceType" = 'workspace'
            AND activity."eventType" = 'workspace_seat_updated'
            AND activity."payload"#>>'{new,userId}' = workspace_seats."userId"
            AND activity."payload"#>>'{new,type}' = workspace_seats."type"
        )`
      )
      .limit(limit)
  }

const getUntrackedWorkspacePlansFactory =
  ({ db }: { db: Knex }) =>
  async (limit: number): Promise<WorkspacePlan[]> => {
    return await db<WorkspacePlan>('workspace_plans')
      .select('*')
      .whereRaw(
        `NOT EXISTS (
          SELECT * FROM activity
          WHERE activity."contextResourceId" = workspace_plans."workspaceId"
            AND activity."contextResourceType" = 'workspace'
            AND activity."eventType" IN ('workspace_plan_updated', 'workspace_plan_created')
            AND activity."payload"#>>'{new,status}' = workspace_plans."status"
            AND activity."payload"#>>'{new,name}' = workspace_plans."name"
        )`
      )
      .orderBy('workspace_plans.createdAt', 'desc')
      .limit(limit)
  }

type PlanSubscriptionPair = {
  workspaceId: string
  name: WorkspacePlans
  status: WorkspacePlanStatuses
  billingInterval: BillingInterval
  subscriptionData: SubscriptionData
  createdAt: Date
}

const getUntrackedSubscriptionsFactory =
  ({ db }: { db: Knex }) =>
  async (limit: number): Promise<PlanSubscriptionPair[]> => {
    return (await db<PlanSubscriptionPair>('workspace_subscriptions')
      .select([
        'workspace_subscriptions.workspaceId',
        'workspace_plans.name',
        'workspace_plans.status',
        'workspace_subscriptions.billingInterval',
        'workspace_subscriptions.subscriptionData',
        'workspace_subscriptions.createdAt'
      ])
      .join(
        'workspace_plans',
        'workspace_subscriptions.workspaceId',
        'workspace_plans.workspaceId'
      )
      .whereRaw(
        `NOT EXISTS (
          SELECT * FROM activity
          WHERE activity."contextResourceId" = workspace_plans."workspaceId"
            AND activity."contextResourceType" = 'workspace'
            AND activity."eventType" = 'workspace_subscription_updated'
            AND activity."payload"#>>'{new,status}' = workspace_plans."status"
            AND activity."payload"#>>'{new,name}' = workspace_plans."name"
            AND activity."payload"#>>'{new,billingInterval}' = workspace_subscriptions."billingInterval"
            AND activity."payload"#>>'{new,totalEditorSeats}' = workspace_subscriptions."subscriptionData"#>>'{products,0,quantity}'
        )`
      )
      .orderBy('workspace_subscriptions.createdAt', 'desc')
      .limit(limit)) as PlanSubscriptionPair[]
  }

type StreamAclWithCreatedAt = StreamAclRecord & { createdAt: Date }

const getUntrackedProjectRolesFactory =
  ({ db }: { db: Knex }) =>
  (limit: number): Promise<StreamAclWithCreatedAt[]> => {
    return db<StreamAclWithCreatedAt>(StreamAcl.name)
      .select([
        'stream_acl.resourceId',
        'stream_acl.userId',
        'stream_acl.role',
        'streams.createdAt'
      ])
      .join('streams', 'streams.id', 'stream_acl.resourceId')
      .whereRaw(
        `NOT EXISTS (
        SELECT * FROM activity
        WHERE activity."contextResourceId" = stream_acl."resourceId"
          AND activity."contextResourceType" = 'project'
          AND activity."eventType" = 'project_role_updated'
          AND activity."payload"#>>'{userId}' = stream_acl."userId"
          AND activity."payload"#>>'{new}' = stream_acl."role"
      )`
      )
      .orderBy('stream_acl.resourceId', 'desc')
      .orderBy('stream_acl.userId', 'desc')
      .limit(limit)
  }

export type SaveActivities = <
  T extends keyof ResourceEventsToPayloadMap,
  R extends keyof ResourceEventsToPayloadMap[T]
>(
  args: Activity<T, R>[]
) => Promise<void>

const saveActivitiesFactory =
  ({ db }: { db: Knex }): SaveActivities =>
  async (items) => {
    await db(ActivityModel.name).insert(items)
  }

export const backfillMissingActivityFactory =
  ({ db }: { db: Knex }) =>
  async ({ logger }: { logger: Logger }) => {
    // TODO: adjust this numbers
    const BATCH_SIZE = 3000
    const MAX_ITERATIONS = 100

    const getUntrackedWorkspaceSeats = getUntrackedWorkspaceSeatsFactory({ db })
    const getUntrackedWorkspacePlans = getUntrackedWorkspacePlansFactory({ db })
    const getUntrackedSubscriptions = getUntrackedSubscriptionsFactory({ db })
    const getUntrackedProjectRoles = getUntrackedProjectRolesFactory({ db })
    const saveActivities = saveActivitiesFactory({ db })

    const activityIds: string[] = []
    let seats = []
    let iterations = 0

    do {
      if (iterations > MAX_ITERATIONS) throw new MaxBackfillIterations()
      seats = await getUntrackedWorkspaceSeats(BATCH_SIZE)
      iterations++

      const activities = seats.map((seat) => ({
        id: cryptoRandomString({ length: 10 }),
        contextResourceId: seat.workspaceId,
        contextResourceType: 'workspace' as const,
        eventType: 'workspace_seat_updated' as const,
        userId: null,
        payload: {
          version: '1' as const,
          new: {
            userId: seat.userId,
            type: seat.type
          },
          old: null
        },
        createdAt: seat.createdAt
      }))

      if (activities.length) {
        await saveActivities(activities)
        activities.forEach((activity) => activityIds.push(activity.id))
      }
    } while (seats.length)

    let plans = []
    iterations = 0

    do {
      if (iterations > MAX_ITERATIONS) throw new MaxBackfillIterations()
      plans = await getUntrackedWorkspacePlans(BATCH_SIZE)
      iterations++

      const activities = plans.map((plan) => ({
        id: cryptoRandomString({ length: 10 }),
        contextResourceId: plan.workspaceId,
        contextResourceType: 'workspace' as const,
        eventType: 'workspace_plan_created' as const,
        userId: null,
        payload: {
          version: '1' as const,
          new: {
            name: plan.name,
            status: plan.status
          }
        },
        createdAt: plan.createdAt
      }))

      if (activities.length) {
        await saveActivities(activities)
        activities.forEach((activity) => activityIds.push(activity.id))
      }
    } while (plans.length)

    let subscriptions = []
    iterations++

    do {
      if (iterations > MAX_ITERATIONS) throw new MaxBackfillIterations()
      subscriptions = await getUntrackedSubscriptions(BATCH_SIZE)
      iterations++

      const activities = subscriptions.map((subscription) => ({
        id: cryptoRandomString({ length: 10 }),
        contextResourceId: subscription.workspaceId,
        contextResourceType: 'workspace' as const,
        eventType: 'workspace_subscription_updated' as const,
        userId: null,
        payload: {
          version: '1' as const,
          new: {
            name: subscription.name,
            status: subscription.status,
            billingInterval: subscription.billingInterval,
            totalEditorSeats: subscription.subscriptionData.products[0].quantity
          },
          old: {
            name: 'free' as const,
            status: 'valid' as const
          }
        },
        createdAt: subscription.createdAt
      }))

      if (activities.length) {
        await saveActivities(activities)
        activities.forEach((activity) => activityIds.push(activity.id))
      }
    } while (subscriptions.length)

    let projectRoles = []

    do {
      if (iterations > MAX_ITERATIONS) throw new MaxBackfillIterations()
      projectRoles = await getUntrackedProjectRoles(BATCH_SIZE)
      iterations++

      const activities = projectRoles.map((projectRole) => ({
        id: cryptoRandomString({ length: 10 }),
        contextResourceId: projectRole.resourceId,
        contextResourceType: 'project' as const,
        eventType: 'project_role_updated' as const,
        userId: null,
        payload: {
          version: '1' as const,
          userId: projectRole.userId,
          new: projectRole.role as StreamRoles,
          old: null
        },
        createdAt: projectRole.createdAt // this is stream created at
      }))

      if (projectRoles.length) {
        await saveActivities(activities)
        activities.forEach((activity) => activityIds.push(activity.id))
      }
    } while (projectRoles.length)

    if (activityIds.length) {
      logger.error(
        {
          total: activityIds.length,
          activityIds
        },
        'Fatal: Activity was backfilled'
      )
    }
  }
