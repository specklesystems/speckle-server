import type { Knex } from 'knex'
import type {
  FailQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget,
  UpdateBackgroundJob
} from '@/modules/backgroundjobs/domain/types'
import {
  type BackgroundJob,
  type BackgroundJobPayload,
  type GetBackgroundJob,
  type GetBackgroundJobCount,
  type StoreBackgroundJob,
  BackgroundJobStatus
} from '@/modules/backgroundjobs/domain/types'
import { buildTableHelper } from '@/modules/core/dbSchema'

export const BackgroundJobs = buildTableHelper('background_jobs', [
  'id',
  'jobType',
  'payload',
  'status',
  'originServerUrl',
  'attempt',
  'maxAttempt',
  'createdAt',
  'updatedAt',
  'remainingComputeBudgetSeconds'
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

export const failBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory =

    <T extends BackgroundJobPayload = BackgroundJobPayload>({
      db
    }: {
      db: Knex
    }): FailQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget<T> =>
    async ({ jobType, originServerUrl }) => {
      const query = tables
        .backgroundJobs(db)
        .where(BackgroundJobs.withoutTablePrefix.col.originServerUrl, originServerUrl)
        .andWhere(BackgroundJobs.withoutTablePrefix.col.jobType, jobType)
        .andWhere(function () {
          this.where(function () {
            this.where(
              BackgroundJobs.withoutTablePrefix.col.status,
              BackgroundJobStatus.Processing
            ).andWhere(
              BackgroundJobs.withoutTablePrefix.col.attempt,
              '>', // greater than because processing jobs may currently equal maxAttempt and still be running
              db.raw('"maxAttempt"') // camelCase requires the column name to be wrapped in double quotes
            )
          })
            .orWhere(function () {
              this.where(
                BackgroundJobs.withoutTablePrefix.col.status,
                BackgroundJobStatus.Queued
              ).andWhere(
                BackgroundJobs.withoutTablePrefix.col.attempt,
                '>=', // greater or equal than because queued jobs cannot be picked up by a worker when they reach maxAttempt
                db.raw('"maxAttempt"') // camelCase requires the column name to be wrapped in double quotes
              )
            })
            .orWhere(function () {
              this.whereIn(BackgroundJobs.withoutTablePrefix.col.status, [
                BackgroundJobStatus.Queued,
                BackgroundJobStatus.Processing
              ]).where(
                BackgroundJobs.withoutTablePrefix.col.remainingComputeBudgetSeconds,
                '<=',
                0
              )
            })
        })
        .update({
          [BackgroundJobs.withoutTablePrefix.col.status]: BackgroundJobStatus.Failed
        })
        .orderBy(BackgroundJobs.withoutTablePrefix.col.createdAt, 'desc')
        .returning<BackgroundJob<T>[]>('*')

      return await query
    }

export const updateBackgroundJobFactory =
  <T extends BackgroundJobPayload = BackgroundJobPayload>({
    db
  }: {
    db: Knex
  }): UpdateBackgroundJob<T> =>
  async ({ payloadFilter, status }) => {
    const query = tables
      .backgroundJobs(db)
      .update({ status })
      .whereJsonSupersetOf('payload', payloadFilter)
      .returning<BackgroundJob<T>[]>('*')
    return await query
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
