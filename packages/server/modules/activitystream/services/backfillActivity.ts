import { Activity as ActivityModel, StreamAcl } from '@/modules/core/dbSchema'
import { StreamAclRecord } from '@/modules/core/helpers/types'
import { SubscriptionData } from '@/modules/gatekeeper/domain/billing'
import { WorkspaceSeat } from '@/modules/workspacesCore/domain/types'
import { WorkspaceSeats } from '@/modules/workspacesCore/helpers/db'
import {
  StreamRoles,
  WorkspacePlan,
  WorkspacePlanBillingIntervals,
  WorkspacePlans,
  WorkspacePlanStatuses
} from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'
import { MaxBackfillIterationsReached } from '@/modules/activitystream/errors/activityStream'
import { Logger } from '@/observability/logging'
import { Activity } from '@/modules/activitystream/domain/types'

export const getUntrackedWorkspaceSeatsFactory =
  ({ db }: { db: Knex }) =>
  async (limit: number) => {
    const workspaceSeats = await db<WorkspaceSeat>(WorkspaceSeats.name)
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

    return workspaceSeats.map(mapUntrackedSeatToActivity)
  }

const mapUntrackedSeatToActivity = (
  seat: WorkspaceSeat
): Activity<'workspace', 'workspace_seat_updated'> => ({
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
})

export const getUntrackedWorkspacePlansFactory =
  ({ db }: { db: Knex }) =>
  async (limit: number) => {
    const workspacePlans = await db<WorkspacePlan>('workspace_plans')
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

    return workspacePlans.map(mapUntrackedWorkspacePlanToActivity)
  }

const mapUntrackedWorkspacePlanToActivity = (
  plan: WorkspacePlan
): Activity<'workspace', 'workspace_plan_created'> => ({
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
})

type PlanSubscriptionPair = {
  workspaceId: string
  name: WorkspacePlans
  status: WorkspacePlanStatuses
  billingInterval: WorkspacePlanBillingIntervals
  subscriptionData: SubscriptionData
  createdAt: Date
}

export const getUntrackedSubscriptionsFactory =
  ({ db }: { db: Knex }) =>
  async (limit: number) => {
    const results = (await db<PlanSubscriptionPair>('workspace_subscriptions')
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

    return results.map(mapUntrackedPlanSubscriptionPairToActivity)
  }

const mapUntrackedPlanSubscriptionPairToActivity = (
  subscription: PlanSubscriptionPair
): Activity<'workspace', 'workspace_subscription_updated'> => ({
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
})

type StreamAclWithCreatedAt = StreamAclRecord & { createdAt: Date }

export const getUntrackedProjectRolesFactory =
  ({ db }: { db: Knex }) =>
  async (limit: number) => {
    const results: StreamAclWithCreatedAt[] = await db<StreamAclWithCreatedAt>(
      StreamAcl.name
    )
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

    return results.map(mapUntrackedProjectRoleToActivity)
  }

const mapUntrackedProjectRoleToActivity = (
  projectRole: StreamAclWithCreatedAt
): Activity<'project', 'project_role_updated'> => ({
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
  createdAt: projectRole.createdAt
})

export const backfillMissingActivityFactory =
  ({ db }: { db: Knex }) =>
  async ({ logger }: { logger: Logger }) => {
    logger.info('Activity backfill started')

    const BATCH_SIZE = 3000
    const MAX_ITERATIONS = 100
    const TASKS = [
      getUntrackedWorkspaceSeatsFactory({ db }),
      getUntrackedWorkspacePlansFactory({ db }),
      getUntrackedSubscriptionsFactory({ db }),
      getUntrackedProjectRolesFactory({ db })
    ]

    const activityIds: string[] = []

    for (const task of TASKS) {
      let iterations = 0
      let activities = []

      do {
        if (iterations >= MAX_ITERATIONS) {
          logger.error(
            {
              total: activityIds.length,
              activityIds
            },
            'Fatal: Activity max iterations reached'
          )
          throw new MaxBackfillIterationsReached()
        }

        activities = await task(BATCH_SIZE)

        if (activities.length) {
          await db(ActivityModel.name).insert(activities)
          activities.forEach((activity) => activityIds.push(activity.id))
        }

        iterations++
      } while (activities.length)
    }

    if (activityIds.length) {
      logger.error(
        {
          total: activityIds.length,
          activityIds
        },
        'Fatal: Activity was backfilled'
      )
    }

    logger.info('Activity backfill ended')
  }
