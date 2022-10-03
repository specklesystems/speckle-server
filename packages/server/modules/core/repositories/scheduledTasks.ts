import { ScheduledTasks } from '@/modules/core/dbSchema'
import { ScheduledTaskRecord } from '@/modules/core/helpers/types'

export async function getLastScheduledTask(
  taskName: string | null = null
): Promise<ScheduledTaskRecord | null> {
  let query = ScheduledTasks.knex<ScheduledTaskRecord>().orderBy(
    ScheduledTasks.col.updatedAt,
    'desc'
  )
  if (taskName) query = query.where({ taskName })
  const task = await query.first()
  return task ?? null
}

export async function saveScheduledTask(
  scheduledTask: ScheduledTaskRecord
): Promise<ScheduledTaskRecord> {
  const [record] = await ScheduledTasks.knex<ScheduledTaskRecord>()
    .insert(scheduledTask)
    .onConflict(['createdAt', 'taskName'])
    // this puts the full table name + col name into string, which doesn't work here
    // .onConflict([ScheduledTasks.col.createdAt, ScheduledTasks.col.taskName])
    // .ignore()
    .merge()
    .returning('*')
  return record
}
