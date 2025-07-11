import { Knex } from 'knex'
import { chunk } from 'lodash-es'

const INVITES_TABLE = 'server_invites'

export async function up(knex: Knex): Promise<void> {
  const invalidInviteIdsResult = await knex
    .from(INVITES_TABLE)
    .select(['server_invites.id'])
    .leftJoin('streams', 'streams.id', 'server_invites.resourceId')
    .where({
      resourceTarget: 'streams'
    })
    .andWhereNot('resourceId', null)
    .andWhere('streams.id', null)
  const invalidInviteIds = invalidInviteIdsResult.map((r) => r.id as string)

  const delIdBatches = chunk(invalidInviteIds, 100)
  for (const batch of delIdBatches) {
    await knex.from(INVITES_TABLE).whereIn('id', batch).del()
  }
}

export async function down(): Promise<void> {
  //
}
