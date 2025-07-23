import type { Knex } from 'knex'

/**
 * The full stripe+db migration should've already executed, this is a fallback for dev/test envs to migrate broken plans
 */

const TABLE_NAME = 'workspace_plans'

const planMapping = {
  starter: 'team',
  starterInvoiced: 'teamUnlimitedInvoiced',
  plus: 'pro',
  plusInvoiced: 'proUnlimitedInvoiced',
  business: 'pro',
  businessInvoiced: 'proUnlimitedInvoiced'
}

const statusMapping = {
  trial: 'canceled',
  expired: 'canceled'
}

export async function up(knex: Knex): Promise<void> {
  // Migrate plans names
  for (const [oldPlan, newPlan] of Object.entries(planMapping)) {
    await knex(TABLE_NAME).where('name', oldPlan).update({ name: newPlan })
  }

  // Migrate plans statuses
  for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
    await knex(TABLE_NAME).where('status', oldStatus).update({ status: newStatus })
  }
}

export async function down(): Promise<void> {
  // sorry, no going back
}
