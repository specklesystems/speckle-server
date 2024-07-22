import { logger } from '@/logging/logging'
import { Nullable, Roles } from '@speckle/shared'
import { Knex } from 'knex'

const TABLE_NAME = 'server_invites'

const OLD_UNIQUE_IDX_COLS = ['target', 'resourceTarget', 'resourceId']
const OLD_IDX_2 = ['resourceTarget', 'resourceId']

const NEW_IDX = ['resource']
const NEW_UNIQUE_IDX = ['target', 'resource']

type InviteResourceTarget = {
  resourceId: string
  resourceType: 'project' | 'server'
  role: string
  primary: boolean
}

type ServerInviteRecord = {
  id: string
  target: string
  inviterId: string
  createdAt: Date
  message: Nullable<string>
  resource: InviteResourceTarget
  resourceTarget: string | null
  resourceId: Nullable<string>
  role: Nullable<string>
  token: string
  serverRole: Nullable<string>
}

export async function up(knex: Knex): Promise<void> {
  // Iterate over all rows and update the resources field w/ empty resource
  const qStream = knex
    .select<ServerInviteRecord[]>('*')
    .where((w1) => {
      // Where resource JSONB is empty
      w1.where('resource', '{}').orWhereNull('resource')
    })
    .from(TABLE_NAME)
    .stream()

  let counter = 1
  for await (const row of qStream) {
    let resource: InviteResourceTarget

    // Add stream/project resource
    if (row.resourceTarget === 'streams' && row.resourceId) {
      resource = {
        resourceId: row.resourceId,
        resourceType: 'project',
        role: row.role || Roles.Stream.Contributor,
        primary: true
      }
    } else {
      // Add server resource
      resource = {
        resourceId: '',
        resourceType: 'server',
        role: row.serverRole || Roles.Server.User,
        primary: true
      }
    }

    const updateQ = knex(TABLE_NAME)
      .where({ id: row.id })
      .update({
        resource: JSON.stringify(resource),
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

    table.index(NEW_IDX)
    table.unique(NEW_UNIQUE_IDX)
  })
}

export async function down(knex: Knex): Promise<void> {
  // Add back columns
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('resourceTarget', 256)
    table.string('resourceId', 256)
    table.string('role', 256)
    table.string('serverRole')

    table.index(OLD_IDX_2)
    table.unique(OLD_UNIQUE_IDX_COLS)
  })

  // Iterate over all rows and update the resources field
  let counter = 1
  const qStream = knex
    .select<ServerInviteRecord[]>('*')
    .where((w1) => {
      // Where resources JSONB array isn't empty
      w1.whereNot('resource', '{}').orWhereNotNull('resource')
    })
    .from(TABLE_NAME)
    .stream()

  for await (const row of qStream) {
    let resourceTarget = null as string | null
    let resourceId = null as string | null
    let role = null as string | null
    let serverRole: string = Roles.Server.User

    const serverResource = row.resource.resourceType === 'server' ? row.resource : null
    if (serverResource && serverResource.role) {
      serverRole = serverResource.role
    }

    const streamResource = row.resource.resourceType === 'project' ? row.resource : null
    if (streamResource && streamResource.resourceId) {
      resourceTarget = 'streams'
      resourceId = streamResource.resourceId
      role = streamResource.role || Roles.Stream.Contributor
    }

    await knex(TABLE_NAME)
      .where({ id: row.id })
      .update({
        resource: JSON.stringify({}),
        resourceTarget,
        resourceId,
        role,
        serverRole
      })
    logger.debug(`Updated #${counter++} row...`)
  }
}
