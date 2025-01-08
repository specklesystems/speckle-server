import { ScheduledTask } from '@/modules/core/domain/scheduledTasks/types'
import cron from 'node-cron'

export type AcquireTaskLock = (
  scheduledTask: ScheduledTask
) => Promise<ScheduledTask | null>

export type ReleaseTaskLock = (args: { taskName: string }) => Promise<void>

export type ScheduleExecution = (
  cronExpression: string,
  taskName: string,
  callback: (scheduledTime: Date) => Promise<void>,
  lockTimeout?: number
) => cron.ScheduledTask
