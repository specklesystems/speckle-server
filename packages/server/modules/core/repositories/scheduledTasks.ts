import { ScheduledTasks } from '@/modules/core/dbSchema'
import {
  AcquireTaskLock,
  ReleaseTaskLock
} from '@/modules/core/domain/scheduledTasks/operations'
import { ScheduledTask } from '@/modules/core/domain/scheduledTasks/types'
import { Knex } from 'knex'

const tables = {
  scheduledTasks: (db: Knex) => db<ScheduledTask>(ScheduledTasks.name)
}

export const acquireTaskLockFactory =
  ({ db }: { db: Knex }): AcquireTaskLock =>
  async (scheduledTask) => {
    const now = new Date()
    const [lock] = await tables
      .scheduledTasks(db)
      .insert(scheduledTask)
      .onConflict(ScheduledTasks.withoutTablePrefix.col.taskName)
      .merge()
      .where(ScheduledTasks.col.lockExpiresAt, '<', now)
      .returning('*')
    return lock ?? null
  }

export const releaseTaskLockFactory =
  ({ db }: { db: Knex }): ReleaseTaskLock =>
  async ({ taskName }) => {
    await tables.scheduledTasks(db).where({ taskName }).delete()
  }
