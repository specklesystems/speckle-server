import { Knex } from 'knex'
import {
  BackgroundJob,
  BackgroundJobPayload,
  BackgroundJobStatus,
  GetBackgroundJob,
  GetBackgroundJobCount,
  StoreBackgroundJob
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

    // using less restrictive lock to check locked jobs
    if (status === BackgroundJobStatus.Processing) {
      q.whereNotExists(function () {
        const subquery = this.from(BackgroundJobs.name)
          .select(BackgroundJobs.col.id)
          .whereRaw('id = background_jobs.id')
          .where({ jobType })

        if (minAttempts) {
          q.andWhere(BackgroundJobs.col.attempt, '>=', minAttempts)
        }

        subquery.forKeyShare().skipLocked()
      })
    } else {
      q.where({ status }).forKeyShare().skipLocked()
    }

    if (minAttempts) {
      q.andWhere(BackgroundJobs.col.attempt, '>=', minAttempts)
    }

    const res = await q.andWhere({ jobType })

    return res.length
  }
