require('../bootstrap')

const { knex } = require('@/db/knex')

const cryptoRandomString = require('crypto-random-string')
const Activity = () => knex('activity')
const WorkspaceSeats = () => knex('workspace_seats')
const WorkspacePlans = () => knex('workspace_plans')
const WorkspaceSubscriptions = () => knex('workspace_subscriptions')
const ProjectRoles = () => knex('stream_acl')

// maybe I can name it backfill

const getUntrackedWorkspaceSeats = (limit) => {
  return WorkspaceSeats()
    .select([
      'workspace_seats.workspaceId',
      'workspace_seats.userId',
      'workspace_seats.type',
      'workspace_seats.createdAt'
    ])
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

const getUntrackedWorkspacePlans = (limit) => {
  return WorkspacePlans()
    .select([
      'workspace_plans.workspaceId',
      'workspace_plans.name',
      'workspace_plans.status',
      'workspace_plans.createdAt'
    ])
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

const getUntrackedSubscriptions = (limit) => {
  return WorkspaceSubscriptions()
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
    .limit(limit)
}

const getUntrackedProjectRoles = (limit) => {
  return ProjectRoles()
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

const main = async () => {
  const BATCH_SIZE = 2
  const MAX_ITERATIONS = 100

  let seats = []
  let count = 0
  let iterations = 0

  do {
    if (iterations > MAX_ITERATIONS) throw new Error('Max iterations reached')
    seats = await getUntrackedWorkspaceSeats(BATCH_SIZE, count)
    count += seats.length
    iterations++

    const activities = seats.map((seat) => ({
      id: cryptoRandomString({ length: 10 }),
      contextResourceId: seat.workspaceId,
      contextResourceType: 'workspace',
      eventType: 'workspace_seat_updated',
      payload: {
        version: '1',
        new: {
          userId: seat.userId,
          type: seat.type
        }
      },
      createdAt: seat.createdAt
    }))

    if (activities.length) {
      await Activity().insert(activities)
    }
  } while (seats.length)

  console.log(`Total seats processed: ${count}`)

  let plans = []
  count = 0
  iterations = 0

  do {
    if (iterations > MAX_ITERATIONS) throw new Error('Max iterations reached')
    plans = await getUntrackedWorkspacePlans(BATCH_SIZE)
    count += plans.length
    iterations++

    const activities = plans.map((plan) => ({
      id: cryptoRandomString({ length: 10 }),
      contextResourceId: plan.workspaceId,
      contextResourceType: 'workspace',
      eventType: 'workspace_plan_created',
      payload: {
        version: '1',
        new: {
          name: plan.name,
          status: plan.status
        }
      },
      createdAt: plan.createdAt
    }))

    if (activities.length) {
      await Activity().insert(activities)
    }
  } while (plans.length)

  console.log(`Total plans processed: ${count}`)

  let subscriptions = []
  count = 0
  iterations++

  do {
    if (iterations > MAX_ITERATIONS) throw new Error('Max iterations reached')
    subscriptions = await getUntrackedSubscriptions(BATCH_SIZE)
    count += subscriptions.length
    iterations++

    const activities = subscriptions.map((subscription) => ({
      id: cryptoRandomString({ length: 10 }),
      contextResourceId: subscription.workspaceId,
      contextResourceType: 'workspace',
      eventType: 'workspace_subscription_updated',
      payload: {
        version: '1',
        new: {
          name: subscription.name,
          status: subscription.status,
          billingInterval: subscription.billingInterval,
          totalEditorSeats: subscription.subscriptionData.products[0].quantity
        },
        old: {
          name: 'free',
          status: 'valid'
        }
      },
      createdAt: subscription.createdAt
    }))

    if (activities.length) {
      await Activity().insert(activities)
    }
  } while (subscriptions.length)

  console.log(`Total subscriptions processed: ${count}`)

  let projectRoles = []

  do {
    if (iterations > MAX_ITERATIONS) throw new Error('Max iterations reached')
    projectRoles = await getUntrackedProjectRoles(BATCH_SIZE)
    count += projectRoles.length
    iterations++

    const activities = projectRoles.map((projectRole) => ({
      id: cryptoRandomString({ length: 10 }),
      contextResourceId: projectRole.resourceId,
      contextResourceType: 'project',
      eventType: 'project_role_updated',
      payload: {
        version: '1',
        userId: projectRole.userId,
        new: projectRole.role,
        old: null
      },
      createdAt: projectRole.createdAt // this is stream created at
    }))

    if (projectRoles.length) {
      await Activity().insert(activities)
    }
  } while (projectRoles.length)

  console.log(`Total projects processed: ${count}`)
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))
  .finally(() => process.exit())
