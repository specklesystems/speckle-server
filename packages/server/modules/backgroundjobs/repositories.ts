import type { Knex } from 'knex'
import type {
  GetStaleBackgroundJobs,
  UpdateBackgroundJobStatus
} from '@/modules/backgroundjobs/domain'
import {
  BackgroundJobStatus,
  type BackgroundJob,
  type BackgroundJobPayload,
  type GetBackgroundJob,
  type GetBackgroundJobCount,
  type StoreBackgroundJob
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

export const getStaleBackgroundJobsFactory =
  ({ db }: { db: Knex }): GetStaleBackgroundJobs =>
  async () => {
    const jobs = await tables
      .backgroundJobs(db)
      .select('*')
      .where(BackgroundJobs.col.status, BackgroundJobStatus.Processing)
      .andWhereRaw(`"updatedAt" < NOW() - ("timeoutMs" * interval '1 millisecond')`)
      .forUpdate()
      .skipLocked()

    return jobs
  }

export const updateBackgroundJobStatusFactory =
  ({ db }: { db: Knex }): UpdateBackgroundJobStatus =>
  async ({ jobId, status }) => {
    await tables.backgroundJobs(db).where({ id: jobId }).update({ status })
  }
