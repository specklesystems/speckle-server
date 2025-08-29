import type { Knex } from 'knex'
import type {
  FailQueueAndProcessingBackgroundJobWithNoRemainingComputeBudget,
  FailQueuedBackgroundJobsWhichExceedMaximumAttempts,
  UpdateBackgroundJob
} from '@/modules/backgroundjobs/domain'
import {
  type BackgroundJob,
  type BackgroundJobPayload,
  type GetBackgroundJob,
  type GetBackgroundJobCount,
  type StoreBackgroundJob,
  BackgroundJobStatus
} from '@/modules/backgroundjobs/domain'
import { buildTableHelper } from '@/modules/core/dbSchema'

export const BackgroundJobs = buildTableHelper('background_jobs', [
  'id',
  'jobType',
  'payload',
  'status',
  'originServerUrl',
  'timeoutMs',
  'attempt',
  'maxAttempt',
  'createdAt',
  'updatedAt'
])

type StoredBackgroundJob = BackgroundJob<BackgroundJobPayload> & {
  originServerUrl: string
}

const tables = {
  backgroundJobs: (db: Knex) => db<StoredBackgroundJob>(BackgroundJobs.name)
}

export const storeBackgroundJobFactory =
  ({
    db,
    originServerUrl
  }: {
    db: Knex
    originServerUrl: string
  }): StoreBackgroundJob =>
  async ({ job }) => {
    await tables.backgroundJobs(db).insert({ ...job, originServerUrl })
  }

export const getBackgroundJobFactory =
  ({ db }: { db: Knex }): GetBackgroundJob =>
  async ({ jobId }) => {
    const job = await tables.backgroundJobs(db).select('*').where({ id: jobId }).first()
    return job ?? null
  }

export const failQueuedBackgroundJobsWhichExceedMaximumAttemptsFactory =
  <T extends BackgroundJobPayload = BackgroundJobPayload>({
    db
  }: {
    db: Knex
  }): FailQueuedBackgroundJobsWhichExceedMaximumAttempts<T> =>
  async ({ jobType, originServerUrl }) => {
    const query = tables
      .backgroundJobs(db)
      .where(BackgroundJobs.withoutTablePrefix.col.originServerUrl, originServerUrl)
      .andWhere(
        BackgroundJobs.withoutTablePrefix.col.status,
        BackgroundJobStatus.Queued
      )
      .andWhere(BackgroundJobs.withoutTablePrefix.col.jobType, jobType)
      .andWhere(
        BackgroundJobs.withoutTablePrefix.col.attempt,
        '>=',
        db.raw('"maxAttempt"') // camel-case requires the column name to be wrapped in double quotes
      )
      .orderBy(BackgroundJobs.withoutTablePrefix.col.createdAt, 'desc')
      .update({
        [BackgroundJobs.withoutTablePrefix.col.status]: BackgroundJobStatus.Failed
      })
      .returning<BackgroundJob<T>[]>('*')

    return await query
  }

export const failQueueAndProcessingBackgroundJobWithNoRemainingComputeBudgetFactory = <
  T extends BackgroundJobPayload = BackgroundJobPayload
>({
  db
}: {
  db: Knex
}): FailQueueAndProcessingBackgroundJobWithNoRemainingComputeBudget<T> => {
  return async ({ originServerUrl, jobType }) => {
    const query = tables
      .backgroundJobs(db)
      .where(BackgroundJobs.withoutTablePrefix.col.originServerUrl, originServerUrl)
      .whereIn(BackgroundJobs.withoutTablePrefix.col.status, [
        BackgroundJobStatus.Queued,
        BackgroundJobStatus.Processing
      ])
      .andWhere(BackgroundJobs.withoutTablePrefix.col.jobType, jobType)
      .whereJsonPath('payload', '$.payloadVersion', '>=', 2)
      .whereJsonPath('payload', '$.remainingComputeBudgetSeconds', '<=', 0)
      .orderBy(BackgroundJobs.withoutTablePrefix.col.createdAt, 'desc')
      .update({
        [BackgroundJobs.withoutTablePrefix.col.status]: BackgroundJobStatus.Failed
      })
      .returning<BackgroundJob<T>[]>('*')

    return await query
  }
}

export const updateBackgroundJobFactory =
  ({ db }: { db: Knex }): UpdateBackgroundJob =>
  async ({ jobId, status }) => {
    const query = tables
      .backgroundJobs(db)
      .update({ status })
      .where({ id: jobId })
      .returning('*')
    const rows = await query
    if (rows.length === 0) return null
    return rows[0]
  }

export const getBackgroundJobCountFactory =
  ({ db }: { db: Knex }): GetBackgroundJobCount =>
  async ({ status, jobType, minAttempts }) => {
    const q = tables.backgroundJobs(db).select(BackgroundJobs.col.id)

    if (status) {
      q.where({ status })
    }

    if (minAttempts) {
      q.andWhere(BackgroundJobs.col.attempt, '>=', minAttempts)
    }

    const res = await q.andWhere({ jobType })

    return res.length
  }
