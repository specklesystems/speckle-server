import { ScheduledTasks } from '@/modules/core/dbSchema'
import { AcquireTaskLock } from '@/modules/core/domain/scheduledTasks/operations'
import { ScheduledTaskRecord } from '@/modules/core/helpers/types'
import { Knex } from 'knex'

const tables = {
  scheduledTasks: (db: Knex) => db<ScheduledTaskRecord>(ScheduledTasks.name)
}

export const acquireTaskLockFactory =
  (deps: { db: Knex }): AcquireTaskLock =>
  async (scheduledTask: ScheduledTaskRecord): Promise<ScheduledTaskRecord | null> => {
    const now = new Date()
    const [lock] = await tables
      .scheduledTasks(deps.db)
      .insert(scheduledTask)
      .onConflict(ScheduledTasks.withoutTablePrefix.col.taskName)
      .merge()
      .where(ScheduledTasks.col.lockExpiresAt, '<', now)
      .returning('*')
    return (lock as ScheduledTaskRecord) ?? null
  }
