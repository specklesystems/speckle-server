import type { Knex } from 'knex'
import { chunk } from 'lodash-es'

type WorkspaceAcl = {
  userId: string
  workspaceId: string
  role: string
}

type WorkspaceSeat = {
  workspaceId: string
  userId: string
  type: 'viewer'
  createdAt: Date
  updatedAt: Date
}

export async function up(knex: Knex): Promise<void> {
  // Find all acl rows without associated seat rows
  const res = (await knex('workspace_acl')
    .select('workspace_acl.*')
    .leftJoin('workspace_seats', (j1) => {
      j1.on('workspace_acl.workspaceId', '=', 'workspace_seats.workspaceId').andOn(
        'workspace_acl.userId',
        '=',
        'workspace_seats.userId'
      )
    })
    .where('workspace_seats.userId', null)) as Array<WorkspaceAcl>

  // Create seats and batch insert them
  const seats = res.map(
    (row): WorkspaceSeat => ({
      workspaceId: row.workspaceId,
      userId: row.userId,
      type: 'viewer',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  )
  const batchedSeats = chunk(seats, 100)
  for (const batch of batchedSeats) {
    await knex('workspace_seats').insert(batch)
  }
}

export async function down(): Promise<void> {}
