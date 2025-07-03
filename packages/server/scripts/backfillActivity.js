require('../bootstrap')

const { knex } = require('@/db/knex')

const cryptoRandomString = require('crypto-random-string')
const Activity = () => knex('activity')
const WorkspaceSeats = () => knex('workspace_seats')
const WorkspacePlans = () => knex('workspace_plans')
const WorkspaceSubscriptions = () => knex('workspace_subscriptions')

const getUntrackedWorkspaceSeats = (limit, offset) => {
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
          AND activity."payload"#>>'{new,userId}' = workspace_seats."userId"
          AND activity."eventType" = 'workspace_seat_updated'
          AND activity."contextResourceType" = 'workspace'
      )`
    )
    .offset(offset)
    .limit(limit)
}

const getUntrackedWorkspacePlans = (limit, offset) => {
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
          AND activity."payload"#>>'{new,status}' = workspace_plans."status"
          AND activity."payload"#>>'{new,name}' = workspace_plans."name"
          AND activity."eventType" IN ('workspace_plan_updated', 'workspace_plan_created')
          AND activity."contextResourceType" = 'workspace'
      )`
    )
    .offset(offset)
    .limit(limit)
}

const getUntrackedSubscriptions = (limit, offset) => {
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
          AND activity."payload"#>>'{new,status}' = workspace_plans."status"
          AND activity."payload"#>>'{new,name}' = workspace_plans."name"
          AND activity."payload"#>>'{new,billingInterval}' = workspace_subscriptions."billingInterval"
          AND activity."payload"#>>'{new,totalEditorSeats}' = workspace_subscriptions."subscriptionData"#>>'{products,0,quantity}'
          AND activity."eventType" = 'workspace_subscription_updated'
          AND activity."contextResourceType" = 'workspace'
      )`
    )
    .offset(offset)
    .limit(limit)
}

const main = async () => {
  const BATCH_SIZE = 10_000 // there is something wrong with this batching

  let seats = []
  let offset = 0

  do {
    seats = await getUntrackedWorkspaceSeats(BATCH_SIZE, offset)
    offset += seats.length

    const activities = seats.map((seat) => ({
      id: cryptoRandomString({ length: 10 }),
      contextResourceId: seat.workspaceId,
      contextResourceType: 'workspace',
      eventType: 'workspace_seat_updated',
      payload: {
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

  console.log(`Total seats processed: ${offset}`)

  let plans = []
  offset = 0

  do {
    plans = await getUntrackedWorkspacePlans(BATCH_SIZE, offset)
    offset += plans.length

    const activities = plans.map((plan) => ({
      id: cryptoRandomString({ length: 10 }),
      contextResourceId: plan.workspaceId,
      contextResourceType: 'workspace',
      eventType: 'workspace_plan_created',
      payload: {
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

  console.log(`Total plans processed: ${offset}`)

  let subscriptions = []
  offset = 0

  do {
    subscriptions = await getUntrackedSubscriptions(BATCH_SIZE, offset)
    offset += subscriptions.length

    const activities = subscriptions.map((subscription) => ({
      id: cryptoRandomString({ length: 10 }),
      contextResourceId: subscription.workspaceId,
      contextResourceType: 'workspace',
      eventType: 'workspace_subscription_updated',
      payload: {
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

  console.log(`Total subscriptions processed: ${offset}`)
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))
  .finally(() => process.exit())
