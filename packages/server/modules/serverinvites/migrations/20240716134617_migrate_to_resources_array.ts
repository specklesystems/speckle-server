import { logger } from '@/logging/logging'
import { Nullable, Roles } from '@speckle/shared'
import { Knex } from 'knex'

const TABLE_NAME = 'server_invites'

type InviteResourceTarget = {
  resourceId: string
  resourceType: 'project' | 'server'
  role: string
}

type ServerInviteRecord = {
  id: string
  target: string
  inviterId: string
  createdAt: Date
  message: Nullable<string>
  resources: Array<InviteResourceTarget>
  resourceTarget: string | null
  resourceId: Nullable<string>
  role: Nullable<string>
  token: string
  serverRole: Nullable<string>
}

export async function up(knex: Knex): Promise<void> {
  // Iterate over all rows and update the resources field
  const qStream = knex
    .select<ServerInviteRecord[]>('*')
    .where((w1) => {
      // Where resources JSONB array is empty
      w1.where('resources', '[]').orWhereNull('resources')
    })
    .from(TABLE_NAME)
    .stream()

  let counter = 1
  for await (const row of qStream) {
    const resources: InviteResourceTarget[] = []

    // Add server resource
    resources.push({
      resourceId: '',
      resourceType: 'server',
      role: row.serverRole || Roles.Server.User
    })

    // Add stream/project resource
    if (row.resourceTarget === 'streams' && row.resourceId) {
      resources.push({
        resourceId: row.resourceId,
        resourceType: 'project',
        role: row.role || Roles.Stream.Contributor
      })
    }

    const updateQ = knex(TABLE_NAME)
      .where({ id: row.id })
      .update({
        resources: JSON.stringify(resources),
        resourceTarget: null,
        resourceId: null,
        role: null,
        serverRole: null
      })
    await updateQ
    logger.debug(`Updated #${counter++} row...`)
  }

  // Drop resourceTarget, resourceId, role, serverRole
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('resourceTarget')
    table.dropColumn('resourceId')
    table.dropColumn('role')
    table.dropColumn('serverRole')
  })
}

export async function down(knex: Knex): Promise<void> {
  // Add back columns
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('resourceTarget', 256)
    table.string('resourceId', 256)
    table.string('role', 256)
    table.string('serverRole')
  })

  // Iterate over all rows and update the resources field
  let counter = 1
  const qStream = knex
    .select<ServerInviteRecord[]>('*')
    .where((w1) => {
      // Where resources JSONB array isn't empty
      w1.whereNot('resources', '[]').orWhereNotNull('resources')
    })
    .from(TABLE_NAME)
    .stream()

  for await (const row of qStream) {
    let resourceTarget = null as string | null
    let resourceId = null as string | null
    let role = null as string | null
    let serverRole: string = Roles.Server.User

    const serverResource = row.resources.find((r) => r.resourceType === 'server')
    if (serverResource && serverResource.role) {
      serverRole = serverResource.role
    }

    const streamResource = row.resources.find((r) => r.resourceType === 'project')
    if (streamResource && streamResource.resourceId) {
      resourceTarget = 'streams'
      resourceId = streamResource.resourceId
      role = streamResource.role || Roles.Stream.Contributor
    }

    await knex(TABLE_NAME)
      .where({ id: row.id })
      .update({
        resources: JSON.stringify([]),
        resourceTarget,
        resourceId,
        role,
        serverRole
      })
    logger.debug(`Updated #${counter++} row...`)
  }
}
