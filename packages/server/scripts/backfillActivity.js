require('../bootstrap')

const { knex } = require('@/db/knex')

const cryptoRandomString = require('crypto-random-string')
const Activity = () => knex('activity')
const WorkspaceSeats = () => knex('workspace_seats')
const WorkspacePlans = () => knex('workspace_plans')
// const WorkspaceSubcriptions = () => knex('workspace_subscriptions')

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

// eslint-disable-next-line no-unused-vars
const getUntrackedSubscriptions = (limit, offset) => {
  return WorkspacePlans()
    .select([
      'workspace_subscriptions.workspaceId',
      'workspace_subscriptions.billingInterval',
      'workspace_subscriptions.subscriptionData',
      'workspace_subscriptions.createdAt'
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
} // ??

const main = async () => {
  const BATCH_SIZE = 10_000 // there is something wrong with this batching

  let seats = []
  let offset = 0
  let count = 0

  do {
    seats = await getUntrackedWorkspaceSeats(BATCH_SIZE, offset)
    offset += seats.length
    count += seats.length

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

  console.log(`Total seats processed: ${count}`)

  let plans = []
  offset = 0
  count = 0

  do {
    plans = await getUntrackedWorkspacePlans(BATCH_SIZE, offset)
    offset += plans.length
    count += plans.length

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

  console.log(`Total plans processed: ${count}`)
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))
  .finally(() => process.exit())
