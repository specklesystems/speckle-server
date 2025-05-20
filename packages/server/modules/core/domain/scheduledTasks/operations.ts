import type { ScheduledTask } from '@/modules/core/domain/scheduledTasks/types'
import type { Logger } from '@/observability/logging'
import type { ScheduledTask as CronScheduledTask } from 'node-cron'

export type AcquireTaskLock = (
  scheduledTask: ScheduledTask
) => Promise<ScheduledTask | null>

export type ReleaseTaskLock = (args: { taskName: string }) => Promise<void>

export type ScheduleExecution = (
  cronExpression: string,
  taskName: string,
  callback: (scheduledTime: Date, context: { logger: Logger }) => Promise<void>,
  lockTimeout?: number
) => CronScheduledTask
