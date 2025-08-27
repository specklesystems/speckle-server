import type { Knex } from 'knex'
import {
  type GetFilteredBackgroundJobs,
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

export const getBackgroundJobsFromThisOrigin =
  ({ db }: { db: Knex }): GetFilteredBackgroundJobs =>
  async ({ jobType, originServerUrl, limit, updatedAfter, status }) => {
    const query = tables
      .backgroundJobs(db)
      .where(BackgroundJobs.withoutTablePrefix.col.originServerUrl, originServerUrl)

    if (status) query.andWhere(BackgroundJobs.withoutTablePrefix.col.status, status)

    if (jobType) query.andWhere(BackgroundJobs.withoutTablePrefix.col.jobType, jobType)

    if (updatedAfter)
      query.andWhere(BackgroundJobs.withoutTablePrefix.col.updatedAt, '>', updatedAfter)

    if (limit && limit > 0) query.limit(limit)

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
