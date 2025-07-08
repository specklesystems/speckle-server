import { Knex } from 'knex'
import {
  BackgroundJob,
  BackgroundJobPayload,
  GetBackgroundJob,
  StoreBackgroundJob
} from '@/modules/backgroundjobs/domain'
import { buildTableHelper } from '@/modules/core/dbSchema'

export const BackgroundJobs = buildTableHelper('background_jobs', [
  'id',
  'jobType',
  'payload',
  'status',
  'timeoutMs',
  'attempt',
  'maxAttempt',
  'createdAt',
  'updatedAt'
])

const tables = {
  backgroundJobs: (db: Knex) =>
    db<BackgroundJob<BackgroundJobPayload>>(BackgroundJobs.name)
}

export const storeBackgroundJobFactory =
  ({ db }: { db: Knex }): StoreBackgroundJob =>
  async ({ job }) => {
    await tables.backgroundJobs(db).insert(job)
  }

export const getBackgroundJobFactory =
  ({ db }: { db: Knex }): GetBackgroundJob =>
  async ({ jobId }) => {
    const job = await tables.backgroundJobs(db).select('*').where({ id: jobId }).first()
    return job ?? null
  }
