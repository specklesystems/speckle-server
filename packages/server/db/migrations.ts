import { Knex } from 'knex'
import { DatabaseError } from '@/modules/shared/errors'
import { ensureError } from '@speckle/shared'
import { startupLogger } from '@/observability/logging'

export const migrateDbToLatest = async (params: { db: Knex; region: string }) => {
  const { db, region } = params
  try {
    const endStopWatch = stopWatch()

    await db.migrate.latest()

    const durationMs = endStopWatch().milliseconds
    startupLogger.info(
      { region, durationMs },
      'Migrated db to latest for region "{region}" in {durationMs}ms.'
    )
  } catch (err: unknown) {
    throw new DatabaseError('Error migrating db to latest for region "{region}".', db, {
      cause: ensureError(err, 'Unknown postgres error'),
      info: { region }
    })
  }
}

const stopWatch = () => {
  const start = process.hrtime.bigint()
  return () => {
    const end = process.hrtime.bigint()
    const elapsedNanoseconds = Number(end - start)
    const elapsedMs = elapsedNanoseconds / 1e6
    const elapsedS = elapsedNanoseconds / 1e9
    return {
      nanoSeconds: elapsedNanoseconds,
      milliseconds: elapsedMs,
      seconds: elapsedS
    }
  }
}
