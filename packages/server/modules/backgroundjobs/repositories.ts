import { Knex } from 'knex'
import {
  BackgroundJob,
  BackgroundJobPayload,
  BackgroundJobStatus,
  GetBackgroundJob,
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
  ({ db }: { db: Knex }) =>
  async ({
    status,
    jobType
  }: {
    status: BackgroundJobStatus | 'processing'
    jobType: string
  }) => {
    const q = tables.backgroundJobs(db).select(BackgroundJobs.col.id)

    if (status === 'processing') {
      q.whereNotExists(function () {
        this.from(BackgroundJobs.name)
          .select(BackgroundJobs.col.id)
          .whereRaw('id = background_jobs.id')
          .where({ jobType })
          .forUpdate()
          .skipLocked()
      })
    } else {
      q.where({ status }).forUpdate().skipLocked()
    }

    const res = (await q.andWhere({ jobType })) as { id: string }[]

    return res.length
  }
