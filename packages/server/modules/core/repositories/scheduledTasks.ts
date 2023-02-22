import { ScheduledTasks } from '@/modules/core/dbSchema'
import { ScheduledTaskRecord } from '@/modules/core/helpers/types'

export async function acquireTaskLock(
  scheduledTask: ScheduledTaskRecord
): Promise<ScheduledTaskRecord | null> {
  const now = new Date()
  const [lock] = await ScheduledTasks.knex<ScheduledTaskRecord>()
    .insert(scheduledTask)
    .onConflict(ScheduledTasks.withoutTablePrefix.col.taskName)
    .merge()
    .where(ScheduledTasks.col.lockExpiresAt, '<', now)
    .returning('*')
  return (lock as ScheduledTaskRecord) ?? null
}
